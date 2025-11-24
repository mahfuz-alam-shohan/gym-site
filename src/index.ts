import { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
}

/* ========================================================================
   1. UTILITIES
   ======================================================================== */
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

async function hashPassword(pass: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(pass));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ========================================================================
   2. DATABASE SCHEMA
   ======================================================================== */
async function initDB(env: Env) {
  // We use a try-catch here to prevent 1101 loops if schema is mismatched
  try {
    const q = [
      `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`,
      `CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY, 
        name TEXT, 
        phone TEXT, 
        gender TEXT, 
        plan TEXT, 
        joined_at TEXT, 
        due_date TEXT, 
        status TEXT DEFAULT 'active',
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY, 
        member_id INTEGER, 
        check_in_time TEXT, 
        status TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY, 
        member_id INTEGER, 
        amount INTEGER, 
        date TEXT, 
        months_paid INTEGER,
        recorded_by TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, role TEXT, expires_at TEXT)`
    ];
    for (const sql of q) await env.DB.prepare(sql).run();
  } catch (e) {
    console.error("Init DB Error (Ignorable if Nuke pending):", e);
  }
}

async function nukeDB(env: Env) {
  const tables = ["config", "users", "members", "attendance", "payments", "sessions"];
  for (const t of tables) await env.DB.prepare(`DROP TABLE IF EXISTS ${t}`).run();
  await initDB(env);
}

/* ========================================================================
   3. WORKER LOGIC (WITH CRASH HANDLER)
   ======================================================================== */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // --- CRASH HANDLER WRAPPER ---
    try {
      
      // 1. Emergency Nuke API (Always accessible)
      if (url.pathname === "/api/nuke") {
        await nukeDB(env);
        return json({ success: true, msg: "System Reset Complete" });
      }

      await initDB(env);

      // 2. PUBLIC ROUTES
      if (url.pathname === "/") {
        const conf = await env.DB.prepare("SELECT value FROM config WHERE key='gym_name'").first();
        const user = await getSession(req, env);
        if (!conf) return renderSetup();
        if (user) return Response.redirect(url.origin + "/dashboard", 302);
        return renderLogin(conf.value as string);
      }

      if (url.pathname === "/api/setup" && req.method === "POST") {
        const b = await req.json() as any;
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(b.gymName).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_type', ?)").bind("universal").run();
        const hash = await hashPassword(b.password);
        await env.DB.prepare("DELETE FROM users").run(); 
        await env.DB.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')")
          .bind(b.adminName, b.email.toLowerCase(), hash).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/login" && req.method === "POST") {
        const b = await req.json() as any;
        const u = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(b.email.toLowerCase()).first<any>();
        if (!u || await hashPassword(b.password) !== u.password_hash) return json({ error: "Invalid credentials" }, 401);
        const token = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)").bind(token, u.id, u.role, new Date(Date.now() + 604800000).toISOString()).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` }});
      }

      if (url.pathname === "/api/logout") return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" }});

      // 3. PROTECTED ROUTES
      const user = await getSession(req, env);
      if (!user) return url.pathname.startsWith("/api") ? json({ error: "Unauthorized" }, 401) : Response.redirect(url.origin + "/", 302);

      if (url.pathname === "/dashboard") return renderDashboard(user);

      // APIs
      if (url.pathname === "/api/bootstrap") {
        const members = await env.DB.prepare(`
          SELECT *, (julianday('now') - julianday(due_date)) as days_overdue
          FROM members ORDER BY id DESC`).all();
        
        const defaulters = await env.DB.prepare(`
          SELECT id, name, phone, due_date, CAST(julianday('now') - julianday(due_date) AS INTEGER) as days_late
          FROM members WHERE days_late > 0 ORDER BY days_late DESC
        `).all();

        const config = await env.DB.prepare("SELECT * FROM config").all();
        return json({ 
          user, members: members.results, defaulters: defaulters.results,
          config: Object.fromEntries(config.results.map((c:any) => [c.key, c.value]))
        });
      }

      if (url.pathname === "/api/checkin/lookup" && req.method === "POST") {
        const { query } = await req.json() as any;
        const members = await env.DB.prepare("SELECT id, name, status, due_date FROM members WHERE name LIKE ? OR id = ? OR phone LIKE ? LIMIT 5").bind(`%${query}%`, query, `%${query}%`).all();
        return json({ results: members.results });
      }

      if (url.pathname === "/api/checkin/submit" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const m = await env.DB.prepare("SELECT * FROM members WHERE id=?").bind(memberId).first<any>();
        if(!m) return json({error: "Member Not Found"}, 404);
        const now = new Date();
        const due = new Date(m.due_date);
        const daysLate = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        const status = now > due ? 'denied_due' : 'success';
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, now.toISOString(), status).run();
        return json({ status, member: m, daysLate: daysLate > 0 ? daysLate : 0, msg: now > due ? `PAYMENT DUE: ${daysLate} DAYS LATE!` : "Welcome Back!" });
      }

      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const fd = await req.json() as any;
        const start = new Date();
        const due = new Date(start);
        due.setMonth(due.getMonth() + parseInt(fd.duration));
        await env.DB.prepare("INSERT INTO members (name, phone, gender, plan, joined_at, due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(fd.name, fd.phone, fd.gender, fd.plan, start.toISOString(), due.toISOString(), fd.notes).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/payment/add" && req.method === "POST") {
        const b = await req.json() as any;
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date, months_paid, recorded_by) VALUES (?, ?, ?, ?, ?)")
          .bind(b.memberId, b.amount, new Date().toISOString(), b.months, user.name).run();
        const m = await env.DB.prepare("SELECT due_date FROM members WHERE id=?").bind(b.memberId).first<any>();
        let currentDue = new Date(m.due_date);
        if(currentDue < new Date()) currentDue = new Date();
        currentDue.setMonth(currentDue.getMonth() + parseInt(b.months));
        await env.DB.prepare("UPDATE members SET due_date = ?, status='active' WHERE id=?").bind(currentDue.toISOString(), b.memberId).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/attendance/history" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const logs = await env.DB.prepare("SELECT * FROM attendance WHERE member_id=? ORDER BY id DESC LIMIT 50").bind(memberId).all();
        return json({ logs: logs.results });
      }

    } catch (e: any) { 
      // EMERGENCY CRASH RENDERER
      // If API request, return JSON error
      if (url.pathname.startsWith("/api")) return json({ error: e.message }, 500);
      
      // If Browser request, return EMERGENCY HTML
      return renderEmergency(e.message);
    }
    
    return new Response("Not Found", { status: 404 });
  }
};

async function getSession(req: Request, env: Env) {
  const c = req.headers.get("Cookie");
  const t = c?.match(/gym_auth=([^;]+)/)?.[1];
  if (!t) return null;
  // Wrap in try-catch in case table doesn't exist
  try {
    return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?").bind(t).first();
  } catch (e) { return null; }
}

/* ========================================================================
   4. UI TEMPLATES
   ======================================================================== */

function baseHead(title: string) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root{ --bg:#0f172a; --panel:#1e293b; --text:#f1f5f9; --mut:#94a3b8; --acc:#3b82f6; --danger:#ef4444; --success:#22c55e; --font:'Inter',sans-serif; }
    *{box-sizing:border-box}body{margin:0;font-family:var(--font);background:var(--bg);color:var(--text);height:100vh;overflow:hidden}
    .btn{padding:10px 16px;border-radius:6px;border:none;font-weight:700;cursor:pointer;transition:0.2s}
    .btn-p{background:var(--acc);color:white}.btn-p:hover{background:#2563eb} .btn-d{background:var(--danger);color:white} .btn-w{background:var(--panel);border:1px solid #334155;color:white}
    input,select,textarea{background:#334155;border:1px solid #475569;color:white;padding:12px;border-radius:6px;width:100%;outline:none;margin-bottom:10px}
    label{font-size:12px;color:var(--mut);margin-bottom:5px;display:block;text-transform:uppercase}
    .card{background:var(--panel);border-radius:8px;padding:20px;border:1px solid #334155}
    table{width:100%;border-collapse:collapse} th{text-align:left;color:var(--mut);padding:10px;font-size:12px;text-transform:uppercase} td{padding:12px 10px;border-top:1px solid #334155}
    .badge{padding:4px 8px;border-radius:4px;font-size:11px;font-weight:800} .ok{background:#052e16;color:#4ade80} .bad{background:#450a0a;color:#f87171}
    .modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:none;align-items:center;justify-content:center;z-index:99}
    .modal{background:var(--panel);width:500px;padding:30px;border-radius:12px;border:1px solid #475569}
    .hidden{display:none!important} .flex{display:flex;gap:10px} .w-full{width:100%}
    @media(max-width:768px){.layout{flex-direction:column}.sidebar{display:none}}
  </style></head>`;
}

// --- EMERGENCY RECOVERY SCREEN ---
function renderEmergency(error: string) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>System Critical</title>
  <style>body{background:#000;color:#ff0000;font-family:monospace;display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:20px}</style></head>
  <body>
    <h1 style="font-size:48px;border:4px solid red;padding:20px">SYSTEM CRITICAL</h1>
    <p style="font-size:18px;color:#fff">The database schema does not match the new version.</p>
    <div style="background:#220000;padding:15px;border-radius:8px;margin:20px 0;max-width:600px;word-break:break-all">${error}</div>
    <button onclick="nuke()" style="background:red;color:white;border:none;padding:20px 40px;font-size:20px;font-weight:bold;cursor:pointer">⚠ EMERGENCY DATABASE RESET</button>
    <script>
      async function nuke(){
        if(!confirm("THIS WILL DELETE ALL GYM DATA AND RESET THE SYSTEM. PROCEED?")) return;
        const btn = document.querySelector('button');
        btn.innerText = "RESETTING...";
        await fetch('/api/nuke');
        alert("System Reset Complete. Redirecting...");
        window.location.href = "/";
      }
    </script>
  </body></html>`;
}

function renderLogin(name: string) {
  return `${baseHead("Login")}<body><div style="height:100vh;display:flex;align-items:center;justify-content:center">
  <div class="card" style="width:350px;text-align:center"><h2>${name}</h2><p style="color:var(--mut)">Staff Access</p>
  <form onsubmit="app.login(event)"><label style="text-align:left">Email</label><input name="email" required><label style="text-align:left">Password</label><input name="password" type="password" required>
  <button class="btn btn-p w-full" style="margin-top:10px">LOGIN</button></form>
  <button onclick="location.href='/api/nuke'" style="margin-top:20px;background:none;border:none;color:var(--danger);font-size:11px;cursor:pointer">⚠ Factory Reset Database</button>
  </div></div><script>const app={async login(e){e.preventDefault();const r=await fetch('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});if(r.ok)location.href='/dashboard';else alert('Access Denied')}}</script></body></html>`;
}

function renderSetup() {
  return `${baseHead("Setup")}<body><div style="height:100vh;display:flex;align-items:center;justify-content:center"><div class="card" style="width:400px">
  <h2>🚀 System Setup</h2><form onsubmit="s(event)"><label>Gym Name</label><input name="gymName" required><label>Admin Name</label><input name="adminName" required>
  <label>Email</label><input name="email" required><label>Password</label><input name="password" type="password" required>
  <button class="btn btn-p w-full" style="margin-top:10px">INITIALIZE</button></form></div></div><script>
  async function s(e){e.preventDefault();const r=await fetch('/api/setup',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});if(r.ok)location.reload();else alert('Error')}</script></body></html>`;
}

function renderDashboard(user: any) {
  return `${baseHead("Dashboard")}<body>
  <div style="display:flex;height:100%">
    <aside style="width:250px;background:#020617;border-right:1px solid #1e293b;display:flex;flex-direction:column" class="sidebar">
      <div style="padding:20px;font-weight:900;font-size:18px;border-bottom:1px solid #1e293b">GYM OS <span style="font-size:10px;color:var(--acc)">PRO</span></div>
      <div style="padding:20px;flex:1">
        <div class="nav-item" onclick="app.nav('live')">⚡ LIVE TERMINAL</div>
        <div class="nav-item" onclick="app.nav('members')">👥 MEMBERS</div>
        <div class="nav-item" onclick="app.nav('due')">⚠️ DEFAULTERS</div>
      </div>
      <div style="padding:20px;border-top:1px solid #1e293b">
        <div>${user.name}</div><a href="/api/logout" style="color:var(--danger);font-size:12px;text-decoration:none">Log Out</a>
      </div>
    </aside>
    <main style="flex:1;display:flex;flex-direction:column;overflow:hidden">
      <div style="flex:1;overflow-y:auto;padding:20px">
        <div id="v-live">
          <div style="background:black;color:#3f0;padding:30px;border-radius:8px;border:1px solid #333;margin-bottom:20px">
            <label style="color:#3f0">ACCESS CONTROL INPUT</label>
            <input id="live-in" placeholder="TYPE MEMBER ID..." style="background:none;border:none;border-bottom:2px solid #3f0;color:#3f0;font-size:30px;font-family:monospace" autofocus oninput="app.liveSearch()">
            <div id="live-sug" style="color:#666;margin-top:10px"></div>
          </div>
          <div id="live-res" class="card hidden" style="text-align:center;padding:40px">
             <h1 id="lr-name" style="font-size:40px;margin:0">NAME</h1>
             <h2 id="lr-stat" style="font-size:60px;margin:20px 0">STATUS</h2>
             <p id="lr-msg" style="font-size:20px;color:var(--mut)"></p>
             <button class="btn btn-p" id="lr-btn" onclick="" style="font-size:20px;padding:15px 30px;margin-top:20px">PAY NOW</button>
             <button class="btn btn-w" onclick="app.resetLive()" style="margin-top:20px">RESET</button>
          </div>
        </div>
        <div id="v-members" class="hidden">
           <div class="flex" style="margin-bottom:20px"><input id="ms" placeholder="Search..." onkeyup="app.search()"><button class="btn btn-p" onclick="app.mod('add')">+ ADD</button></div>
           <div class="card" style="padding:0"><table><thead><tr><th>Name</th><th>Phone</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead><tbody id="tb-mem"></tbody></table></div>
        </div>
        <div id="v-due" class="hidden">
           <div class="card" style="border-left:4px solid var(--danger);margin-bottom:20px"><h3>⚠️ ACTION REQUIRED</h3><p style="color:var(--mut)">Members with unpaid dues.</p></div>
           <div class="card" style="padding:0"><table><thead><tr><th>Name</th><th>Phone</th><th>Days Late</th><th>Action</th></tr></thead><tbody id="tb-due"></tbody></table></div>
        </div>
      </div>
    </main>
  </div>
  
  <div id="m-add" class="modal-wrap"><div class="modal"><h3>New Member</h3><form onsubmit="app.add(event)"><label>Name</label><input name="name" required>
  <div class="flex"><div class="w-full"><label>Phone</label><input name="phone" required></div><div class="w-full"><label>Gender</label><select name="gender"><option>Male</option><option>Female</option></select></div></div>
  <label>Plan</label><select name="plan"><option>Monthly</option><option>Yearly</option></select><label>Duration (Mo)</label><input name="duration" type="number" value="1">
  <div class="flex" style="justify-content:end"><button type="button" class="btn btn-w" onclick="app.close()">Cancel</button><button class="btn btn-p">Save</button></div></form></div></div>

  <div id="m-pay" class="modal-wrap"><div class="modal"><h3>Collect Dues</h3><p id="p-name"></p><form onsubmit="app.pay(event)">
  <input type="hidden" name="memberId" id="p-id"><label>Amount</label><input name="amount" type="number" required><label>Extend (Mo)</label><input name="months" type="number" value="1">
  <div class="flex" style="justify-content:end"><button type="button" class="btn btn-w" onclick="app.close()">Cancel</button><button class="btn btn-p">Confirm</button></div></form></div></div>

  <script>
  const app={
    data:null,
    async init(){const r=await fetch('/api/bootstrap');if(r.ok){this.data=await r.json();this.render()}},
    render(){
      const d=this.data;
      const mk=(m)=>\`<tr><td><b>\${m.name}</b></td><td>\${m.phone}</td><td>\${m.due_date.split('T')[0]}</td>
      <td>\${m.days_overdue>0?'<span class="badge bad">DUE</span>':'<span class="badge ok">OK</span>'}</td>
      <td><button class="btn btn-p" onclick="app.mod('pay',\${m.id})">PAY</button></td></tr>\`;
      document.getElementById('tb-mem').innerHTML=d.members.map(mk).join('');
      document.getElementById('tb-due').innerHTML=d.defaulters.map(m=>\`<tr><td style="color:var(--danger)"><b>\${m.name}</b></td><td>\${m.phone}</td><td>\${m.days_late} DAYS</td><td><button class="btn btn-p" onclick="app.mod('pay',\${m.id})">COLLECT</button></td></tr>\`).join('');
    },
    async liveSearch(){
       const q=document.getElementById('live-in').value; if(q.length<1)return;
       const r=await fetch('/api/checkin/lookup',{method:'POST',body:JSON.stringify({query:q})});
       const res=await r.json();
       if(res.results.length===1 && (res.results[0].id==q || res.results[0].name.toLowerCase()===q.toLowerCase())) this.checkIn(res.results[0].id);
       else document.getElementById('live-sug').innerHTML=res.results.map(m=>\`<div onclick="app.checkIn(\${m.id})" style="cursor:pointer">> \${m.name}</div>\`).join('');
    },
    async checkIn(id){
       const r=await fetch('/api/checkin/submit',{method:'POST',body:JSON.stringify({memberId:id})});
       const d=await r.json();
       const el=document.getElementById('live-res'); el.classList.remove('hidden');
       document.getElementById('lr-name').innerText=d.member.name;
       document.getElementById('lr-stat').innerText=d.status==='success'?'GRANTED':'DENIED';
       document.getElementById('lr-stat').style.color=d.status==='success'?'#4ade80':'#f87171';
       document.getElementById('lr-msg').innerText=d.msg;
       document.getElementById('lr-btn').style.display=d.status==='success'?'none':'inline-block';
       document.getElementById('lr-btn').onclick=()=>app.mod('pay',d.member.id);
       document.getElementById('live-in').value=''; document.getElementById('live-sug').innerHTML='';
    },
    resetLive(){document.getElementById('live-res').classList.add('hidden');document.getElementById('live-in').focus()},
    async add(e){e.preventDefault();await fetch('/api/members/add',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});location.reload()},
    async pay(e){e.preventDefault();await fetch('/api/payment/add',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});location.reload()},
    nav(v){['live','members','due'].forEach(x=>document.getElementById('v-'+x).classList.add('hidden'));document.getElementById('v-'+v).classList.remove('hidden')},
    mod(t,id){document.querySelectorAll('.modal-wrap').forEach(x=>x.style.display='none');if(t==='add')document.getElementById('m-add').style.display='flex';if(t==='pay'){const m=this.data.members.find(x=>x.id==id);document.getElementById('p-name').innerText=m.name;document.getElementById('p-id').value=id;document.getElementById('m-pay').style.display='flex'}},
    close(){document.querySelectorAll('.modal-wrap').forEach(x=>x.style.display='none')},
    search(){const q=document.getElementById('ms').value.toLowerCase();document.querySelectorAll('#tb-mem tr').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'':'none')}
  };app.init();</script></body></html>`;
}
