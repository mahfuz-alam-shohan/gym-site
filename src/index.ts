import { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
}

/* ========================================================================
   1. UTILITIES & SECURITY
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
   2. DATABASE SCHEMA (STRICT GYM MANAGEMENT)
   ======================================================================== */
async function initDB(env: Env) {
  const q = [
    `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`,
    
    // Core Member Data
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY, 
      name TEXT, 
      phone TEXT, 
      gender TEXT, 
      plan TEXT, 
      joined_at TEXT, 
      due_date TEXT, -- The critical field for expiry
      status TEXT DEFAULT 'active',
      photo_key TEXT, -- Reference to R2 image
      notes TEXT
    )`,

    // Attendance History (Investigative Log)
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY, 
      member_id INTEGER, 
      check_in_time TEXT, 
      status TEXT, -- 'success', 'denied_due', 'warning'
      notes TEXT
    )`,

    // Financial Records
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
}

async function nukeDB(env: Env) {
  const tables = ["config", "users", "members", "attendance", "payments", "sessions"];
  for (const t of tables) await env.DB.prepare(`DROP TABLE IF EXISTS ${t}`).run();
  await initDB(env);
}

/* ========================================================================
   3. BACKEND API
   ======================================================================== */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      await initDB(env);

      // --- PUBLIC ---
      if (url.pathname === "/") {
        const conf = await env.DB.prepare("SELECT value FROM config WHERE key='gym_name'").first();
        const user = await getSession(req, env);
        if (!conf) return renderSetup();
        if (user) return Response.redirect(url.origin + "/dashboard", 302);
        return renderLogin(conf.value as string);
      }

      // Setup & Auth
      if (url.pathname === "/api/setup" && req.method === "POST") {
        const b = await req.json() as any;
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(b.gymName).run();
        // Default gym type
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

      if (url.pathname === "/api/nuke") { await nukeDB(env); return json({ success: true }); }
      if (url.pathname === "/api/logout") return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" }});

      // Photo Proxy (R2)
      if (url.pathname.startsWith("/media/")) {
        if (!env.BUCKET) return new Response("No R2 Storage Configured", { status: 404 });
        const key = url.pathname.replace("/media/", "");
        const obj = await env.BUCKET.get(key);
        if (!obj) return new Response("Image Not Found", { status: 404 });
        return new Response(obj.body);
      }

      // --- PROTECTED ---
      const user = await getSession(req, env);
      if (!user) return url.pathname.startsWith("/api") ? json({ error: "Unauthorized" }, 401) : Response.redirect(url.origin + "/", 302);

      if (url.pathname === "/dashboard") return renderDashboard(user);

      // 1. BOOTSTRAP (Load Data)
      if (url.pathname === "/api/bootstrap") {
        // Fetch Members with calculated 'Days Overdue'
        const members = await env.DB.prepare(`
          SELECT *, 
          (julianday('now') - julianday(due_date)) as days_overdue
          FROM members ORDER BY id DESC`).all();
        
        // Fetch Defaulters (Priority List)
        const defaulters = await env.DB.prepare(`
          SELECT id, name, phone, due_date,
          CAST(julianday('now') - julianday(due_date) AS INTEGER) as days_late
          FROM members WHERE days_late > 0 ORDER BY days_late DESC
        `).all();

        const config = await env.DB.prepare("SELECT * FROM config").all();

        return json({ 
          user, 
          members: members.results, 
          defaulters: defaulters.results,
          config: Object.fromEntries(config.results.map((c:any) => [c.key, c.value]))
        });
      }

      // 2. LIVE CHECK-IN (The Gatekeeper)
      if (url.pathname === "/api/checkin/lookup" && req.method === "POST") {
        const { query } = await req.json() as any;
        const members = await env.DB.prepare(`
          SELECT id, name, photo_key, status, due_date 
          FROM members 
          WHERE name LIKE ? OR id = ? OR phone LIKE ? LIMIT 5
        `).bind(`%${query}%`, query, `%${query}%`).all();
        return json({ results: members.results });
      }

      if (url.pathname === "/api/checkin/submit" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const m = await env.DB.prepare("SELECT * FROM members WHERE id=?").bind(memberId).first<any>();
        if(!m) return json({error: "Member Not Found"}, 404);

        const now = new Date();
        const due = new Date(m.due_date);
        
        // Logic: Is he skipping fees?
        const isDefaulter = now > due;
        const daysLate = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
        
        const status = isDefaulter ? 'denied_due' : 'success';
        
        // Log it
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)")
          .bind(memberId, now.toISOString(), status).run();

        return json({ 
          status, 
          member: m, 
          daysLate: daysLate > 0 ? daysLate : 0,
          msg: isDefaulter ? `PAYMENT DUE: ${daysLate} DAYS LATE!` : "Welcome Back!" 
        });
      }

      // 3. MEMBER MANAGEMENT
      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const fd = await req.json() as any; // simplified for json body
        // Calculate Due Date
        const start = new Date();
        const due = new Date(start);
        due.setMonth(due.getMonth() + parseInt(fd.duration)); // e.g. +1 month

        let photoKey = null;
        // NOTE: In a real form-data upload, we handle Blob. Here assuming Base64 or separate upload for simplicity in single-file
        // If user wants photo, we assume they might implement the upload separately or we use placeholders.
        
        await env.DB.prepare(`
          INSERT INTO members (name, phone, gender, plan, joined_at, due_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(fd.name, fd.phone, fd.gender, fd.plan, start.toISOString(), due.toISOString(), fd.notes).run();

        return json({ success: true });
      }

      // 4. PAYMENT & RENEWAL
      if (url.pathname === "/api/payment/add" && req.method === "POST") {
        const b = await req.json() as any;
        
        // 1. Record Money
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date, months_paid, recorded_by) VALUES (?, ?, ?, ?, ?)")
          .bind(b.memberId, b.amount, new Date().toISOString(), b.months, user.name).run();

        // 2. Extend Validity
        const m = await env.DB.prepare("SELECT due_date FROM members WHERE id=?").bind(b.memberId).first<any>();
        let currentDue = new Date(m.due_date);
        if(currentDue < new Date()) currentDue = new Date(); // If already expired, start fresh from today
        
        currentDue.setMonth(currentDue.getMonth() + parseInt(b.months));
        
        await env.DB.prepare("UPDATE members SET due_date = ?, status='active' WHERE id=?")
          .bind(currentDue.toISOString(), b.memberId).run();

        return json({ success: true, newDate: currentDue.toISOString() });
      }

      // 5. ATTENDANCE HISTORY (Investigation)
      if (url.pathname === "/api/attendance/history" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const logs = await env.DB.prepare("SELECT * FROM attendance WHERE member_id=? ORDER BY id DESC LIMIT 50").bind(memberId).all();
        return json({ logs: logs.results });
      }

    } catch (e: any) { return json({ error: e.message }, 500); }
    return new Response("Not Found", { status: 404 });
  }
};

async function getSession(req: Request, env: Env) {
  const c = req.headers.get("Cookie");
  const t = c?.match(/gym_auth=([^;]+)/)?.[1];
  if (!t) return null;
  return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?").bind(t).first();
}

/* ========================================================================
   4. UI (UNIVERSAL GYM MANAGER DASHBOARD)
   ======================================================================== */

function baseHead(title: string) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#0f172a; --panel:#1e293b; --text:#f1f5f9; --mut:#94a3b8; 
      --acc:#3b82f6; --acc-h:#2563eb; 
      --danger:#ef4444; --warn:#f59e0b; --success:#22c55e;
      --font:'Inter',sans-serif;
    }
    *{box-sizing:border-box}body{margin:0;font-family:var(--font);background:var(--bg);color:var(--text);height:100vh;overflow:hidden}
    
    /* Utility */
    .flex{display:flex;align-items:center;gap:10px}.hidden{display:none!important}.w-full{width:100%}
    .btn{padding:10px 16px;border-radius:6px;border:none;font-weight:700;cursor:pointer;font-family:var(--font);transition:0.2s}
    .btn-p{background:var(--acc);color:white}.btn-p:hover{background:var(--acc-h)}
    .btn-d{background:var(--danger);color:white}.btn-w{background:var(--panel);border:1px solid #334155;color:white}
    
    input,select,textarea{background:#334155;border:1px solid #475569;color:white;padding:12px;border-radius:6px;width:100%;outline:none;font-family:var(--font)}
    input:focus{border-color:var(--acc)} label{font-size:12px;color:var(--mut);margin-bottom:5px;display:block;text-transform:uppercase;letter-spacing:0.5px}

    /* Layout */
    .layout{display:flex;height:100%}
    .sidebar{width:250px;background:#020617;border-right:1px solid #1e293b;display:flex;flex-direction:column}
    .main{flex:1;display:flex;flex-direction:column;overflow:hidden}
    .content{flex:1;overflow-y:auto;padding:20px}
    
    /* Nav */
    .logo{padding:20px;font-weight:900;font-size:18px;letter-spacing:-0.5px;color:white;border-bottom:1px solid #1e293b}
    .nav-item{padding:15px 20px;color:var(--mut);cursor:pointer;font-weight:600;border-left:3px solid transparent}
    .nav-item:hover{background:#0f172a;color:white}
    .nav-item.active{background:#0f172a;color:var(--acc);border-left-color:var(--acc)}
    
    /* Cards & Tables */
    .card{background:var(--panel);border-radius:8px;padding:20px;border:1px solid #334155;margin-bottom:20px}
    table{width:100%;border-collapse:collapse} th{text-align:left;color:var(--mut);padding:10px;font-size:12px;text-transform:uppercase}
    td{padding:12px 10px;border-top:1px solid #334155}
    .badge{padding:4px 8px;border-radius:4px;font-size:11px;font-weight:800;text-transform:uppercase}
    .ok{background:#052e16;color:#4ade80;border:1px solid #14532d}
    .bad{background:#450a0a;color:#f87171;border:1px solid #7f1d1d}

    /* Live Terminal */
    .terminal{background:#000;color:#33ff00;font-family:'JetBrains Mono',monospace;padding:20px;border-radius:8px;border:1px solid #333}
    .big-status{font-size:40px;font-weight:900;text-align:center;margin:20px 0;text-transform:uppercase;letter-spacing:-1px}

    /* Modal */
    .modal-wrap{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:none;align-items:center;justify-content:center;z-index:99}
    .modal{background:var(--panel);width:500px;padding:30px;border-radius:12px;border:1px solid #475569;box-shadow:0 20px 50px rgba(0,0,0,0.5)}

    @media(max-width:768px){.layout{flex-direction:column}.sidebar{display:none}}
  </style></head>`;
}

function renderLogin(name: string) {
  return `${baseHead("Login")}<body><div style="height:100vh;display:flex;align-items:center;justify-content:center">
  <div class="card" style="width:350px"><h2>${name}</h2><p style="color:var(--mut)">Staff Access</p>
  <form onsubmit="app.login(event)"><label>Email</label><input name="email" required><label>Password</label><input name="password" type="password" required>
  <button class="btn btn-p w-full" style="margin-top:10px">LOGIN</button></form>
  <div style="text-align:center;margin-top:20px"><button onclick="app.nuke()" class="btn btn-d" style="font-size:10px">⚠ Factory Reset Database</button></div>
  </div></div><script>const app={
    async login(e){e.preventDefault();const r=await fetch('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
    if(r.ok)location.href='/dashboard';else alert('Access Denied')},
    async nuke(){if(confirm('RESET SYSTEM?'))await fetch('/api/nuke');location.reload()}
  }</script></body></html>`;
}

function renderSetup() {
  return `${baseHead("Setup")}<body><div style="height:100vh;display:flex;align-items:center;justify-content:center"><div class="card" style="width:400px">
  <h2>🚀 Gym System Setup</h2><form onsubmit="s(event)"><label>Gym Name</label><input name="gymName" required><label>Admin Name</label><input name="adminName" required>
  <label>Email</label><input name="email" required><label>Password</label><input name="password" type="password" required>
  <button class="btn btn-p w-full" style="margin-top:10px">INITIALIZE</button></form></div></div><script>
  async function s(e){e.preventDefault();const r=await fetch('/api/setup',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
  if(r.ok)location.reload();else alert('Error')} </script></body></html>`;
}

function renderDashboard(user: any) {
  return `${baseHead("Dashboard")}<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">GYM OS <span style="font-size:10px;color:var(--acc)">PRO</span></div>
      <div class="nav-item active" onclick="app.nav('live')">⚡ LIVE CHECK-IN</div>
      <div class="nav-item" onclick="app.nav('members')">👥 MEMBERS</div>
      <div class="nav-item" onclick="app.nav('due')">🕵️ DEFAULTERS</div>
      <div class="nav-item" onclick="app.nav('config')">⚙️ SETTINGS</div>
      <div style="margin-top:auto;padding:20px;border-top:1px solid #1e293b">
        <div style="font-weight:bold">${user.name}</div>
        <a href="/api/logout" style="color:var(--danger);font-size:12px;text-decoration:none">Log Out</a>
      </div>
    </aside>
    <main class="main">
      <header style="padding:20px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between">
        <h2 id="pg-title" style="margin:0">LIVE TERMINAL</h2>
        <div><span class="badge ok">SYSTEM ONLINE</span></div>
      </header>
      <div class="content">
        
        <!-- LIVE TERMINAL -->
        <div id="v-live">
          <div class="card terminal">
            <label style="color:#33ff00">ACCESS CONTROL INPUT</label>
            <input id="live-in" placeholder="TYPE MEMBER ID OR NAME..." style="background:transparent;border:none;border-bottom:2px solid #33ff00;color:white;font-size:24px;font-family:monospace;text-transform:uppercase" autofocus oninput="app.liveSearch()">
            <div id="live-suggestions" style="margin-top:10px;color:#888"></div>
          </div>
          
          <div id="live-result" class="hidden" style="margin-top:20px">
             <div class="card" style="text-align:center;padding:40px">
                <div id="lr-avatar" style="width:100px;height:100px;background:#333;border-radius:50%;margin:0 auto 20px;display:grid;place-items:center;font-size:40px">👤</div>
                <h1 id="lr-name" style="margin:0;font-size:32px">NAME</h1>
                <div id="lr-msg" class="big-status">STATUS</div>
                <div id="lr-info" style="color:var(--mut)">DETAILS</div>
                <div style="margin-top:30px">
                  <button class="btn btn-w" onclick="app.resetLive()">RESET SCREEN</button>
                  <button class="btn btn-p" id="lr-pay-btn" onclick="">COLLECT DUES</button>
                </div>
             </div>
          </div>
        </div>

        <!-- MEMBERS LIST -->
        <div id="v-members" class="hidden">
          <div class="flex" style="margin-bottom:20px">
            <input id="mem-search" placeholder="Search Database..." onkeyup="app.filterTable()">
            <button class="btn btn-p" onclick="app.mod('add')">+ NEW MEMBER</button>
          </div>
          <div class="card" style="padding:0;overflow:hidden">
            <table><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Gender</th><th>Next Due</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody id="tb-mem"></tbody></table>
          </div>
        </div>

        <!-- DEFAULTERS / INVESTIGATION -->
        <div id="v-due" class="hidden">
           <div class="card" style="border-left:4px solid var(--danger)">
              <h3>⚠️ DEFICIT INVESTIGATION</h3>
              <p style="color:var(--mut)">These members have unpaid dues. Sorted by highest priority.</p>
           </div>
           <div class="card" style="padding:0;overflow:hidden">
            <table><thead><tr><th>Name</th><th>Phone</th><th>Due Date</th><th>Days Late</th><th>Action</th></tr></thead>
            <tbody id="tb-due"></tbody></table>
          </div>
        </div>

        <!-- SETTINGS -->
        <div id="v-config" class="hidden">
           <div class="card" style="max-width:500px">
              <h3>Gym Configuration</h3>
              <label>Gym Name</label><input id="conf-name" readonly>
              <label>Gym Type (Policy)</label><select id="conf-type" disabled><option value="universal">Universal (Co-ed)</option><option>Male Only</option><option>Female Only</option></select>
              <p style="font-size:12px;color:var(--mut)">Configuration is locked by admin policy.</p>
           </div>
        </div>

      </div>
    </main>
  </div>

  <!-- MODALS -->
  <div id="m-add" class="modal-wrap"><div class="modal"><h3>New Member Registration</h3><form onsubmit="app.addMem(event)">
  <label>Full Name</label><input name="name" required>
  <div class="flex"><div class="w-full"><label>Phone</label><input name="phone" required></div><div class="w-full"><label>Gender</label><select name="gender"><option>Male</option><option>Female</option></select></div></div>
  <label>Membership Plan</label><select name="plan"><option>Monthly</option><option>Yearly</option><option>Daily</option></select>
  <label>Initial Duration (Months)</label><input name="duration" type="number" value="1" required>
  <label>Notes</label><textarea name="notes" rows="2"></textarea>
  <div class="flex" style="justify-content:flex-end;margin-top:15px"><button type="button" class="btn btn-w" onclick="app.close()">Cancel</button><button class="btn btn-p">Register</button></div></form></div></div>

  <div id="m-pay" class="modal-wrap"><div class="modal"><h3>💰 Collect Payment</h3><p id="p-name"></p><form onsubmit="app.pay(event)">
  <input type="hidden" name="memberId" id="p-id">
  <label>Amount Received</label><input name="amount" type="number" required>
  <label>Extend Membership (Months)</label><input name="months" type="number" value="1" required>
  <div class="flex" style="justify-content:flex-end;margin-top:15px"><button type="button" class="btn btn-w" onclick="app.close()">Cancel</button><button class="btn btn-p">Confirm Payment</button></div></form></div></div>

  <div id="m-hist" class="modal-wrap"><div class="modal" style="width:600px"><h3>Attendance Record</h3><div style="max-height:300px;overflow-y:auto;border:1px solid #334155;border-radius:6px"><table id="tb-hist"></table></div><button class="btn btn-w w-full" style="margin-top:10px" onclick="app.close()">Close</button></div></div>

  <script>
  const app = {
    data: null,
    async init(){ const r=await fetch('/api/bootstrap'); if(r.ok){this.data=await r.json(); this.render()} },
    
    render(){
      const d = this.data;
      document.getElementById('conf-name').value = d.config.gym_name || 'Gym';
      
      // Members Table
      document.getElementById('tb-mem').innerHTML = d.members.map(m => {
        const late = m.days_overdue > 0;
        return \`<tr>
          <td>#\${m.id}</td><td><b>\${m.name}</b></td><td>\${m.phone}</td><td>\${m.gender}</td>
          <td style="color:\${late?'var(--danger)':'var(--success)'}">\${m.due_date.split('T')[0]}</td>
          <td>\${late ? '<span class="badge bad">DUE</span>':'<span class="badge ok">OK</span>'}</td>
          <td>
             <button class="btn btn-p" style="padding:4px 8px;font-size:10px" onclick="app.mod('pay',\${m.id})">PAY</button>
             <button class="btn btn-w" style="padding:4px 8px;font-size:10px" onclick="app.hist(\${m.id})">LOGS</button>
          </td>
        </tr>\`;
      }).join('');

      // Defaulters Table
      document.getElementById('tb-due').innerHTML = d.defaulters.map(m => \`<tr>
         <td style="font-weight:bold;color:var(--danger)">\${m.name}</td><td>\${m.phone}</td><td>\${m.due_date.split('T')[0]}</td>
         <td><span class="badge bad">\${m.days_late} DAYS LATE</span></td>
         <td><button class="btn btn-p" onclick="app.mod('pay',\${m.id})">COLLECT</button></td>
      </tr>\`).join('');
    },

    // --- LIVE TERMINAL LOGIC ---
    async liveSearch(){
      const q = document.getElementById('live-in').value;
      if(q.length < 1) { document.getElementById('live-suggestions').innerHTML=''; return; }
      
      const r = await fetch('/api/checkin/lookup', {method:'POST', body:JSON.stringify({query:q})});
      const res = await r.json();
      
      if(res.results.length === 1 && (res.results[0].id == q || res.results[0].name.toLowerCase() === q.toLowerCase())) {
         this.checkIn(res.results[0].id); // Auto submit if exact match
      } else {
         document.getElementById('live-suggestions').innerHTML = res.results.map(m => \`<div style="padding:5px;cursor:pointer" onclick="app.checkIn(\${m.id})">> \${m.name} (#\${m.id})</div>\`).join('');
      }
    },

    async checkIn(id){
      const r = await fetch('/api/checkin/submit', {method:'POST', body:JSON.stringify({memberId:id})});
      const d = await r.json();
      
      const elRes = document.getElementById('live-result');
      const elMsg = document.getElementById('lr-msg');
      const elName = document.getElementById('lr-name');
      const elInfo = document.getElementById('lr-info');
      const elBtn = document.getElementById('lr-pay-btn');

      elRes.classList.remove('hidden');
      elName.innerText = d.member.name;
      elMsg.innerText = d.msg;
      
      if(d.status === 'denied_due') {
         elMsg.style.color = 'var(--danger)';
         elRes.style.border = '4px solid var(--danger)';
         elInfo.innerText = \`OVERDUE BY \${d.daysLate} DAYS. ACCESS DENIED.\`;
         elBtn.classList.remove('hidden');
         elBtn.onclick = () => app.mod('pay', d.member.id);
         // Play Alert Sound (Optional browser quirk handling needed usually)
      } else {
         elMsg.style.color = 'var(--success)';
         elRes.style.border = '4px solid var(--success)';
         elInfo.innerText = "Membership Active. Enjoy your workout.";
         elBtn.classList.add('hidden');
      }
      
      document.getElementById('live-in').value = '';
      document.getElementById('live-suggestions').innerHTML = '';
    },

    resetLive(){ document.getElementById('live-result').classList.add('hidden'); document.getElementById('live-in').focus(); },

    // --- CRUD ---
    async addMem(e){ e.preventDefault(); await fetch('/api/members/add', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); location.reload() },
    async pay(e){ e.preventDefault(); await fetch('/api/payment/add', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target)))}); location.reload() },
    async hist(id){
       const r = await fetch('/api/attendance/history', {method:'POST', body:JSON.stringify({memberId:id})});
       const d = await r.json();
       document.getElementById('tb-hist').innerHTML = d.logs.map(l=>\`<tr><td>\${new Date(l.check_in_time).toLocaleString()}</td><td>\${l.status}</td></tr>\`).join('');
       this.mod('hist');
    },

    nav(v){ document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); event.currentTarget.classList.add('active'); 
      ['live','members','due','config'].forEach(x=>document.getElementById('v-'+x).classList.add('hidden'));
      document.getElementById('v-'+v).classList.remove('hidden'); document.getElementById('pg-title').innerText = v.toUpperCase();
    },

    mod(t, arg){
      document.querySelectorAll('.modal-wrap').forEach(x=>x.style.display='none');
      if(t==='add') document.getElementById('m-add').style.display='flex';
      if(t==='pay') { 
        const m = this.data.members.find(x=>x.id==arg);
        document.getElementById('m-pay').style.display='flex'; 
        document.getElementById('p-id').value=arg;
        document.getElementById('p-name').innerText = m.name + (m.days_overdue > 0 ? \` (OVERDUE: \${parseInt(m.days_overdue)} days)\` : '');
      }
      if(t==='hist') document.getElementById('m-hist').style.display='flex';
    },
    close(){ document.querySelectorAll('.modal-wrap').forEach(x=>x.style.display='none') },
    filterTable(){ const q=document.getElementById('mem-search').value.toLowerCase(); document.querySelectorAll('#tb-mem tr').forEach(r=>r.style.display=r.innerText.toLowerCase().includes(q)?'':'none') }
  };
  app.init();
  </script></body></html>`;
}
