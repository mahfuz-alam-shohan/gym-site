import { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
}

/* ========================================================================
   1. SHARED UTILITIES
   ======================================================================== */

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    },
  });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

/* ========================================================================
   2. UI SYSTEM
   ======================================================================== */

function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1; --primary-dark: #4f46e5;
      --bg: #f3f4f6; --card: #ffffff; --text: #1f2937; --border: #e5e7eb;
      --success: #10b981; --danger: #ef4444; --warning: #f59e0b;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; }
    
    /* Utility */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 10px; }
    .w-full { width: 100%; }
    .text-sm { font-size: 12px; color: #6b7280; }
    
    /* Components */
    .card { background: var(--card); padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); }
    .btn { padding: 10px 16px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 14px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: white; border: 1px solid var(--border); color: var(--text); }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    
    input, select { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--border); border-radius: 6px; font-size: 14px; }
    label { display: block; margin-bottom: 5px; font-size: 13px; font-weight: 500; }
    
    /* Layouts */
    .center-screen { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .dashboard { display: flex; height: 100vh; }
    
    /* Sidebar */
    .sidebar { width: 260px; background: #111827; color: white; display: flex; flex-direction: column; flex-shrink: 0; }
    .logo { padding: 20px; font-weight: 700; font-size: 18px; border-bottom: 1px solid #374151; display: flex; align-items: center; gap: 8px; }
    .nav { padding: 20px; flex: 1; }
    .nav-item { padding: 12px; margin-bottom: 5px; border-radius: 6px; cursor: pointer; color: #9ca3af; display: flex; align-items: center; gap: 10px; }
    .nav-item:hover, .nav-item.active { background: #374151; color: white; }
    .user-panel { padding: 20px; border-top: 1px solid #374151; }

    /* Main Content */
    .main { flex: 1; overflow-y: auto; padding: 24px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    
    /* Stats Grid */
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; border: 1px solid var(--border); }
    .stat-val { font-size: 28px; font-weight: 700; color: #111827; }
    .stat-label { font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; font-size: 14px; }
    th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    
    /* Badges */
    .badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .bg-green { background: #d1fae5; color: #065f46; }
    .bg-red { background: #fee2e2; color: #991b1b; }
    
    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 50; }
    .modal { background: white; width: 400px; padding: 24px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }

    /* Mobile */
    @media(max-width: 768px) {
      .dashboard { flex-direction: column; }
      .sidebar { width: 100%; height: auto; flex-direction: row; align-items: center; padding: 0 20px; justify-content: space-between; }
      .nav, .user-panel { display: none; } /* Simplified mobile */
      .sidebar .logo { border: none; padding: 15px 0; }
      .mobile-menu-btn { display: block; }
    }
  </style>
</head>`;
}

/* ========================================================================
   3. DATABASE & ROUTER
   ======================================================================== */

async function setupDatabase(env: Env) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS gym (id INTEGER PRIMARY KEY, name TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY, 
      name TEXT, 
      phone TEXT, 
      plan TEXT, 
      status TEXT DEFAULT 'active', 
      joined_at TEXT, 
      expiry_date TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, check_in_time TEXT, status TEXT)`,
    `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, member_id INTEGER, amount INTEGER, date TEXT)`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
  ];
  for (const q of queries) await env.DB.prepare(q).run();
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      await setupDatabase(env);

      /* --- AUTH ROUTES --- */
      if (url.pathname === "/") {
        const gym = await env.DB.prepare("SELECT * FROM gym").first();
        const user = await getSession(req, env);
        if (!gym) return renderSetup();
        if (user) return Response.redirect(url.origin + "/dashboard", 302);
        return renderLogin(gym.name as string);
      }

      if (url.pathname === "/api/setup" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        await env.DB.prepare("INSERT INTO gym (name) VALUES (?)").bind(body.gymName).run();
        const hash = await hashPassword(body.password);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')")
          .bind(email, hash, body.adminName).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/login" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
        
        if (!user || !(await verifyPassword(body.password, user.password_hash))) {
          return json({ error: "Invalid email or password" }, 401);
        }

        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 604800000).toISOString();
        await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expires).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`, "Content-Type": "application/json" }
        });
      }

      if (url.pathname === "/api/logout") {
        return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" } });
      }

      /* --- APP ROUTES --- */
      const user = await getSession(req, env);
      if (!user) return url.pathname.startsWith("/api") ? json({ error: "Unauthorized" }, 401) : Response.redirect(url.origin + "/", 302);

      if (url.pathname === "/dashboard") return renderDashboard(user);

      // 1. DATA BOOTSTRAP
      if (url.pathname === "/api/bootstrap") {
        const members = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all();
        const attendance = await env.DB.prepare(`
          SELECT a.check_in_time, m.name 
          FROM attendance a JOIN members m ON a.member_id = m.id 
          ORDER BY a.id DESC LIMIT 10
        `).all();
        const stats = await env.DB.prepare(`
          SELECT 
            (SELECT count(*) FROM members WHERE status='active') as active,
            (SELECT count(*) FROM attendance WHERE date(check_in_time) = date('now')) as today,
            (SELECT sum(amount) FROM payments) as revenue
        `).first();
        return json({ user, members: members.results, attendance: attendance.results, stats });
      }

      // 2. ADD MEMBER
      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const { name, phone, plan, duration } = await req.json() as any;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + parseInt(duration));
        
        await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date, status) VALUES (?, ?, ?, ?, ?, 'active')")
          .bind(name, phone, plan, new Date().toISOString(), expiry.toISOString()).run();
        return json({ success: true });
      }

      // 3. CHECK IN
      if (url.pathname === "/api/checkin" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        
        if(!member) return json({ error: "Member not found" }, 404);
        
        const isExpired = new Date(member.expiry_date) < new Date();
        const status = isExpired ? "expired" : "ok";
        
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, new Date().toISOString(), status).run();
        
        return json({ success: true, status, name: member.name });
      }

      // 4. ADD PAYMENT
      if (url.pathname === "/api/payment" && req.method === "POST") {
        const { memberId, amount, months } = await req.json() as any;
        
        // Add Money
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, amount, new Date().toISOString()).run();
        
        // Extend Expiry
        const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
        let newExp = new Date(member.expiry_date);
        if(newExp < new Date()) newExp = new Date(); // If expired, start from today
        newExp.setMonth(newExp.getMonth() + parseInt(months));
        
        await env.DB.prepare("UPDATE members SET expiry_date = ?, status = 'active' WHERE id = ?").bind(newExp.toISOString(), memberId).run();
        
        return json({ success: true });
      }

      return new Response("Not Found", { status: 404 });
    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
  }
};

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  const token = cookie?.match(/gym_auth=([^;]+)/)?.[1];
  if (!token) return null;
  return await env.DB.prepare(`SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?`).bind(token).first();
}

/* ========================================================================
   4. VIEWS
   ======================================================================== */

function renderSetup() {
  const html = `${baseHead("Setup Gym")}
  <body>
    <div class="center-screen">
      <div class="card" style="width: 400px;">
        <h2 style="color:var(--primary); margin-bottom:20px;">🚀 Gym OS Setup</h2>
        <form id="form">
          <label>Gym Name</label><input name="gymName" required placeholder="My Gym">
          <label>Admin Name</label><input name="adminName" required>
          <label>Email</label><input name="email" required>
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full">Install System</button>
        </form>
        <div id="msg" style="margin-top:10px; color:red; text-align:center;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = "Installing...";
        try {
          const res = await fetch('/api/setup', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          if(res.ok) window.location.reload();
          else throw new Error("Setup failed");
        } catch(err) {
          document.getElementById('msg').textContent = err.message;
          btn.disabled = false; btn.textContent = "Install System";
        }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(name: string) {
  const html = `${baseHead("Login")}
  <body>
    <div class="center-screen">
      <div class="card" style="width: 350px;">
        <h2 style="margin-bottom:5px;">${name}</h2>
        <p style="text-align:center; color:#6b7280; margin-bottom:20px;">Staff Portal</p>
        <form id="form">
          <label>Email</label><input name="email" required>
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full">Login</button>
        </form>
        <div id="msg" style="margin-top:10px; color:red; text-align:center;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.textContent = "Verifying...";
        try {
          const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          if(res.ok) window.location.href = '/dashboard';
          else {
            const d = await res.json();
            throw new Error(d.error || "Login failed");
          }
        } catch(err) {
          document.getElementById('msg').textContent = err.message;
          btn.disabled = false; btn.textContent = "Login";
        }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any) {
  const html = `${baseHead("Dashboard")}
  <body>
    <div class="dashboard">
      <aside class="sidebar">
        <div class="logo">💪 Gym OS</div>
        <div class="nav">
          <div class="nav-item active" onclick="app.view('home')">📊 Overview</div>
          <div class="nav-item" onclick="app.view('members')">👥 Members</div>
          <div class="nav-item" onclick="app.view('attendance')">⏰ Attendance</div>
        </div>
        <div class="user-panel">
          <div>${user.name}</div>
          <a href="/api/logout" style="color:#ef4444; font-size:12px; text-decoration:none;">Sign Out</a>
        </div>
      </aside>

      <main class="main">
        <div class="header">
          <h2 id="page-title">Dashboard</h2>
          <button class="btn btn-primary" onclick="app.modals.checkin.open()">⚡ Quick Check-In</button>
        </div>

        <div id="view-home">
          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Active Members</div>
              <div class="stat-val" id="stat-active">--</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Today's Visits</div>
              <div class="stat-val" id="stat-today">--</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-val" style="color:var(--success)">$<span id="stat-rev">--</span></div>
            </div>
          </div>
          <h3>Recent Attendance</h3>
          <table>
            <thead><tr><th>Time</th><th>Name</th></tr></thead>
            <tbody id="tbl-attendance"></tbody>
          </table>
        </div>

        <div id="view-members" class="hidden">
          <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <input id="search" placeholder="Search..." style="width:250px; margin:0;" onkeyup="app.filter()">
            <button class="btn btn-primary" onclick="app.modals.add.open()">+ Add Member</button>
          </div>
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Plan</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead>
            <tbody id="tbl-members"></tbody>
          </table>
        </div>
        
        <div id="view-attendance" class="hidden">
           <h3>Full Attendance History</h3>
           <p>Showing last 10 entries (Use DB for full logs)</p>
           <table><thead><tr><th>Time</th><th>Name</th></tr></thead><tbody id="tbl-attendance-full"></tbody></table>
        </div>

      </main>
    </div>

    <div id="modal-add" class="modal-overlay">
      <div class="modal">
        <h3>New Member</h3>
        <form onsubmit="app.addMember(event)">
          <label>Name</label><input name="name" required>
          <label>Phone</label><input name="phone" required>
          <div class="flex">
            <div class="w-full">
              <label>Plan</label>
              <select name="plan"><option>Monthly</option><option>Yearly</option></select>
            </div>
            <div class="w-full">
               <label>Duration (Months)</label>
               <input name="duration" type="number" value="1" required>
            </div>
          </div>
          <div class="flex" style="justify-content:flex-end;">
            <button type="button" class="btn btn-outline" onclick="app.modals.add.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-checkin" class="modal-overlay">
      <div class="modal">
        <h3>⚡ Quick Check-In</h3>
        <input id="checkin-id" placeholder="Enter Member ID" type="number" autofocus>
        <button class="btn btn-primary w-full" onclick="app.doCheckIn()">Check In</button>
        <div id="checkin-res" style="margin-top:15px; text-align:center; font-weight:bold;"></div>
        <button class="btn btn-outline w-full" style="margin-top:10px;" onclick="app.modals.checkin.close()">Close</button>
      </div>
    </div>

    <div id="modal-pay" class="modal-overlay">
      <div class="modal">
        <h3>💰 Add Payment</h3>
        <p id="pay-name"></p>
        <form onsubmit="app.addPayment(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <label>Amount ($)</label><input name="amount" type="number" required>
          <label>Extend by (Months)</label><input name="months" type="number" value="1" required>
          <div class="flex" style="justify-content:flex-end;">
             <button type="button" class="btn btn-outline" onclick="app.modals.pay.close()">Cancel</button>
             <button type="submit" class="btn btn-primary">Confirm</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      const app = {
        data: null,
        
        async init() {
          const res = await fetch('/api/bootstrap');
          this.data = await res.json();
          this.render();
        },

        render() {
          // Stats
          document.getElementById('stat-active').textContent = this.data.stats.active;
          document.getElementById('stat-today').textContent = this.data.stats.today;
          document.getElementById('stat-rev').textContent = this.data.stats.revenue || 0;

          // Members Table
          const tbody = document.getElementById('tbl-members');
          tbody.innerHTML = this.data.members.map(m => {
            const isExpired = new Date(m.expiry_date) < new Date();
            const badge = isExpired ? '<span class="badge bg-red">Expired</span>' : '<span class="badge bg-green">Active</span>';
            return \`<tr>
              <td>\${m.name}<br><span class="text-sm">ID: \${m.id}</span></td>
              <td>\${m.phone}</td>
              <td>\${m.plan}</td>
              <td>\${m.expiry_date.split('T')[0]}</td>
              <td>\${badge}</td>
              <td><button class="btn btn-outline" style="padding:4px 8px; font-size:12px" onclick="app.modals.pay.open(\${m.id})">Pay</button></td>
            </tr>\`;
          }).join('');

          // Attendance Table
          const attRows = this.data.attendance.map(a => \`<tr><td>\${new Date(a.check_in_time).toLocaleTimeString()}</td><td>\${a.name}</td></tr>\`).join('');
          document.getElementById('tbl-attendance').innerHTML = attRows;
          document.getElementById('tbl-attendance-full').innerHTML = attRows;
        },

        view(v) {
          ['home', 'members', 'attendance'].forEach(id => document.getElementById('view-'+id).classList.add('hidden'));
          document.getElementById('view-'+v).classList.remove('hidden');
          document.getElementById('page-title').textContent = v.charAt(0).toUpperCase() + v.slice(1);
        },
        
        filter() {
           const q = document.getElementById('search').value.toLowerCase();
           const rows = document.querySelectorAll('#tbl-members tr');
           rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
        },

        async addMember(e) {
          e.preventDefault();
          await fetch('/api/members/add', { method:'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          location.reload();
        },
        
        async addPayment(e) {
          e.preventDefault();
          await fetch('/api/payment', { method:'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          location.reload();
        },

        async doCheckIn() {
          const id = document.getElementById('checkin-id').value;
          const res = await fetch('/api/checkin', { method:'POST', body: JSON.stringify({memberId: id}) });
          const json = await res.json();
          const div = document.getElementById('checkin-res');
          if(res.ok) {
            div.style.color = json.status === 'ok' ? 'green' : 'red';
            div.innerText = json.status === 'ok' ? '✅ Welcome ' + json.name : '⚠️ EXPIRED: ' + json.name;
            if(json.status === 'ok') setTimeout(() => location.reload(), 1500);
          } else {
            div.style.color = 'red'; div.innerText = json.error;
          }
        },

        modals: {
          add: { open:()=>document.getElementById('modal-add').style.display='flex', close:()=>document.getElementById('modal-add').style.display='none' },
          checkin: { open:()=>document.getElementById('modal-checkin').style.display='flex', close:()=>document.getElementById('modal-checkin').style.display='none' },
          pay: { 
            open:(id)=>{
              const m = app.data.members.find(x=>x.id==id);
              document.getElementById('pay-id').value = id;
              document.getElementById('pay-name').innerText = m.name;
              document.getElementById('modal-pay').style.display='flex';
            }, 
            close:()=>document.getElementById('modal-pay').style.display='none' 
          }
        }
      };
      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
