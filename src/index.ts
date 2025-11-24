import { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

/* ========================================================================
   1. UTILITIES & SECURITY
   ======================================================================== */

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
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
   2. UI SYSTEM (Professional CSS & Layout)
   ======================================================================== */

function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1; --primary-dark: #4f46e5;
      --bg-body: #f3f4f6; --bg-nav: #111827; --bg-card: #ffffff;
      --text-main: #111827; --text-muted: #6b7280;
      --border: #e5e7eb;
      --success: #10b981; --danger: #ef4444; --warning: #f59e0b;
      --radius: 8px;
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg-body); color: var(--text-main); height: 100vh; display: flex; flex-direction: column; overflow: hidden; }

    /* Layout */
    .app-layout { display: flex; height: 100%; }
    .sidebar { width: 260px; background: var(--bg-nav); color: white; display: flex; flex-direction: column; flex-shrink: 0; z-index: 50; transition: transform 0.3s; }
    .main-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; position: relative; }
    
    /* Components */
    .card { background: var(--bg-card); padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); margin-bottom: 20px; }
    .btn { padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: white; border: 1px solid var(--border); color: var(--text-main); }
    .btn-danger { background: var(--danger); color: white; }
    .w-full { width: 100%; }
    
    input, select { width: 100%; padding: 11px; margin-bottom: 15px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; transition: border 0.2s; }
    input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
    label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: var(--text-main); }

    /* Tables */
    .table-responsive { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; background: white; white-space: nowrap; }
    th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
    td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    
    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; }
    .stat-val { font-size: 28px; font-weight: 700; color: var(--text-main); margin-top: 4px; }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }

    /* Utilities */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 12px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .center-screen { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 20px; }
    
    /* Badges */
    .badge { padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .bg-green { background: #dcfce7; color: #166534; }
    .bg-red { background: #fee2e2; color: #991b1b; }
    
    /* Sidebar Specifics */
    .logo { padding: 24px; font-size: 20px; font-weight: 700; border-bottom: 1px solid #1f2937; letter-spacing: -0.5px; }
    .nav { padding: 16px; flex: 1; }
    .nav-item { padding: 12px 16px; border-radius: 8px; color: #9ca3af; cursor: pointer; margin-bottom: 4px; transition: 0.2s; font-weight: 500; display: flex; align-items: center; gap: 10px; }
    .nav-item:hover, .nav-item.active { background: #1f2937; color: white; }
    .user-footer { padding: 20px; border-top: 1px solid #1f2937; }

    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-content { background: white; width: 100%; max-width: 440px; padding: 24px; border-radius: 16px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* Mobile */
    @media (max-width: 768px) {
      .app-layout { flex-direction: column; }
      .sidebar { position: fixed; inset: 0 auto 0 0; height: 100%; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .mobile-header { display: flex; justify-content: space-between; padding: 16px; background: white; border-bottom: 1px solid var(--border); }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; }
      .overlay.open { display: block; }
    }
  </style>
</head>`;
}

/* ========================================================================
   3. DATABASE SETUP (The "Fixer")
   ======================================================================== */

// This function defines the "Ultimate" Schema
async function initDB(env: Env) {
  const q = [
    `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY, 
      name TEXT, 
      phone TEXT, 
      plan TEXT, 
      joined_at TEXT, 
      expiry_date TEXT, 
      status TEXT DEFAULT 'active'
    )`,
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, check_in_time TEXT, status TEXT)`,
    `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, member_id INTEGER, amount INTEGER, date TEXT)`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
  ];
  for (const sql of q) await env.DB.prepare(sql).run();
}

// THE NUKE FUNCTION: This fixes your "no column user_id" error by resetting everything
async function factoryReset(env: Env) {
  const drops = ["config", "users", "members", "attendance", "payments", "sessions"];
  for (const table of drops) await env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  await initDB(env);
}

/* ========================================================================
   4. WORKER LOGIC
   ======================================================================== */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // OPTIONS handler for CORS
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      await initDB(env); // Ensure DB exists on every request

      /* --- PUBLIC ROUTES --- */
      
      // 1. Root: Decide where to go
      if (url.pathname === "/") {
        const config = await env.DB.prepare("SELECT value FROM config WHERE key = 'gym_name'").first();
        const user = await getSession(req, env);
        
        if (!config) return renderSetup(); // No gym? Setup.
        if (user) return Response.redirect(url.origin + "/dashboard", 302); // Logged in? Dashboard.
        return renderLogin(config.value as string); // Default: Login.
      }

      // 2. Setup API
      if (url.pathname === "/api/setup" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        
        // 1. Set Config
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(body.gymName).run();
        
        // 2. Create Admin
        const hash = await hashPassword(body.password);
        // Clear users first to be safe
        await env.DB.prepare("DELETE FROM users").run(); 
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')")
          .bind(email, hash, body.adminName).run();
          
        return json({ success: true });
      }

      // 3. Login API
      if (url.pathname === "/api/login" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
        if (!user || !(await verifyPassword(body.password, user.password_hash))) {
          return json({ error: "Invalid credentials" }, 401);
        }

        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expires).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` }
        });
      }

      // 4. Factory Reset API (The Fixer)
      if (url.pathname === "/api/nuke") {
        await factoryReset(env);
        return new Response("Database Reset Complete. Go to / to setup again.", { status: 200 });
      }

      if (url.pathname === "/api/logout") {
        return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" } });
      }

      /* --- PROTECTED ROUTES --- */
      const user = await getSession(req, env);
      if (!user) {
        if(url.pathname.startsWith('/api')) return json({error: "Unauthorized"}, 401);
        return Response.redirect(url.origin + "/", 302);
      }

      if (url.pathname === "/dashboard") return renderDashboard(user);

      // Data Bootstrap (Load everything at once)
      if (url.pathname === "/api/bootstrap") {
        const members = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all();
        const attendance = await env.DB.prepare(`
          SELECT a.check_in_time, a.status, m.name 
          FROM attendance a JOIN members m ON a.member_id = m.id 
          ORDER BY a.id DESC LIMIT 20`).all();
        
        // Complex Stats
        const totalMembers = await env.DB.prepare("SELECT count(*) as c FROM members WHERE status='active'").first();
        const todayVisits = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = date('now')").first();
        const revenue = await env.DB.prepare("SELECT sum(amount) as t FROM payments").first();
        
        return json({
          user,
          members: members.results,
          attendance: attendance.results,
          stats: {
            active: totalMembers?.c || 0,
            today: todayVisits?.c || 0,
            revenue: revenue?.t || 0
          }
        });
      }

      // Add Member
      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const body = await req.json() as any;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + parseInt(body.duration));
        
        await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date) VALUES (?, ?, ?, ?, ?)")
          .bind(body.name, body.phone, body.plan, new Date().toISOString(), expiry.toISOString()).run();
        return json({ success: true });
      }

      // Check In
      if (url.pathname === "/api/checkin" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        if(!member) return json({ error: "Member not found" }, 404);
        
        const isExpired = new Date(member.expiry_date) < new Date();
        const status = isExpired ? 'expired' : 'success';
        
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, new Date().toISOString(), status).run();
        return json({ success: true, status, name: member.name, isExpired });
      }

      // Add Payment
      if (url.pathname === "/api/payment" && req.method === "POST") {
        const { memberId, amount, months } = await req.json() as any;
        
        // 1. Log Payment
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, amount, new Date().toISOString()).run();
        
        // 2. Extend Expiry
        const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
        let newDate = new Date(member.expiry_date);
        if (newDate < new Date()) newDate = new Date(); // If expired, start from today
        newDate.setMonth(newDate.getMonth() + parseInt(months));
        
        // 3. Update Member
        await env.DB.prepare("UPDATE members SET expiry_date = ?, status = 'active' WHERE id = ?").bind(newDate.toISOString(), memberId).run();
        return json({ success: true });
      }

      // Delete Member
      if (url.pathname === "/api/members/delete" && req.method === "POST") {
        const { id } = await req.json() as any;
        await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM attendance WHERE member_id = ?").bind(id).run(); // Cleanup
        await env.DB.prepare("DELETE FROM payments WHERE member_id = ?").bind(id).run(); // Cleanup
        return json({ success: true });
      }

    } catch (e: any) {
      return json({ error: e.message }, 500);
    }
    return new Response("Not found", { status: 404 });
  }
};

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  const token = cookie?.match(/gym_auth=([^;]+)/)?.[1];
  if (!token) return null;
  return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?").bind(token).first();
}

/* ========================================================================
   5. FRONTEND (The "Ultimate" Single Page App)
   ======================================================================== */

function renderSetup() {
  const html = `${baseHead("Gym OS - Setup")}
  <body>
    <div class="center-screen">
      <div class="card" style="width: 100%; max-width: 420px;">
        <h2 style="color:var(--primary); margin-bottom:10px;">🚀 System Setup</h2>
        <p style="color:var(--text-muted); margin-bottom:24px;">Initialize your gym management system.</p>
        
        <form id="form">
          <label>Gym Name</label><input name="gymName" required placeholder="e.g. Iron Paradise">
          <label>Admin Name</label><input name="adminName" required placeholder="John Doe">
          <label>Admin Email</label><input name="email" type="email" required placeholder="admin@gym.com">
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:12px">Install System</button>
        </form>
        <div id="error" style="color:var(--danger); margin-top:10px; font-size:13px; text-align:center;"></div>
        
        <div style="margin-top:30px; padding-top:20px; border-top:1px solid var(--border); text-align:center;">
           <p style="font-size:12px; color:var(--text-muted);">Database issues? Click below to fix.</p>
           <button onclick="nukeDB()" class="btn btn-danger" style="font-size:11px; padding:6px 12px;">⚠ Factory Reset Database</button>
        </div>
      </div>
    </div>
    <script>
      async function nukeDB() {
        if(!confirm("Are you sure? This deletes ALL data.")) return;
        await fetch('/api/nuke');
        alert("Reset complete. Please refresh.");
        location.reload();
      }
      document.getElementById('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = "Installing..."; btn.disabled = true;
        try {
          const res = await fetch('/api/setup', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          if(res.ok) window.location.reload();
          else throw new Error("Setup failed");
        } catch(err) {
          document.getElementById('error').textContent = err.message;
          btn.textContent = "Install System"; btn.disabled = false;
        }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(gymName: string) {
  const html = `${baseHead("Login")}
  <body>
    <div class="center-screen">
      <div class="card" style="width: 100%; max-width: 380px;">
        <h2 style="margin-bottom:5px;">${gymName}</h2>
        <p style="color:var(--text-muted); margin-bottom:24px;">Staff Access Portal</p>
        
        <form id="form">
          <label>Email</label><input name="email" required>
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:12px;">Login</button>
        </form>
        <div id="error" style="color:var(--danger); margin-top:15px; font-size:13px; text-align:center;"></div>
        
        <div style="margin-top:30px; text-align:center;">
           <a href="#" onclick="nukeDB()" style="color:var(--text-muted); font-size:11px;">⚠ Reset Database</a>
        </div>
      </div>
    </div>
    <script>
      async function nukeDB() {
        if(!confirm("Database Error? This deletes ALL data to fix schema.")) return;
        await fetch('/api/nuke');
        alert("Reset complete. Refreshing.");
        location.reload();
      }
      document.getElementById('form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.textContent = "Verifying..."; btn.disabled = true;
        try {
          const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          if(res.ok) window.location.href = '/dashboard';
          else {
            const d = await res.json();
            throw new Error(d.error || "Login failed");
          }
        } catch(err) {
          document.getElementById('error').textContent = err.message;
          btn.textContent = "Login"; btn.disabled = false;
        }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any) {
  const html = `${baseHead("Dashboard")}
  <body>
    <div class="app-layout">
      <div class="mobile-header hidden">
         <div style="font-weight:bold;">Gym OS</div>
         <button class="btn btn-outline" onclick="toggleSidebar()">☰</button>
      </div>
      <div class="overlay" onclick="toggleSidebar()"></div>

      <aside class="sidebar">
        <div class="logo">💪 Gym OS <span style="font-size:10px; font-weight:normal; opacity:0.7; margin-left:5px;">v2.0</span></div>
        <div class="nav">
          <div class="nav-item active" onclick="app.nav('home')">📊 Overview</div>
          <div class="nav-item" onclick="app.nav('members')">👥 Members</div>
          <div class="nav-item" onclick="app.nav('attendance')">⏰ Attendance</div>
        </div>
        <div class="user-footer">
          <div style="font-weight:600;">${user.name}</div>
          <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">${user.role.toUpperCase()}</div>
          <a href="/api/logout" style="color:#fca5a5; font-size:12px; text-decoration:none;">Sign Out &rarr;</a>
        </div>
      </aside>

      <main class="main-content">
        <div class="flex-between" style="padding: 24px 24px 0 24px;">
           <h2 id="page-title" style="margin:0;">Dashboard</h2>
           <button class="btn btn-primary" onclick="app.modals.checkin.open()">⚡ Quick Check-In</button>
        </div>

        <div style="padding: 24px;">
          <div id="view-home">
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-label">Active Members</span>
                <span class="stat-val" id="stat-active">--</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Today's Visits</span>
                <span class="stat-val" id="stat-today">--</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Total Revenue</span>
                <span class="stat-val" style="color:var(--success)">$<span id="stat-rev">--</span></span>
              </div>
            </div>
            
            <div class="card">
              <div class="flex-between" style="margin-bottom:15px;">
                 <h3 style="margin:0;">Recent Activity</h3>
                 <button class="btn btn-outline" style="font-size:12px;" onclick="app.nav('attendance')">View All</button>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Time</th><th>Name</th><th>Status</th></tr></thead>
                  <tbody id="tbl-attendance-recent"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-members" class="hidden">
            <div class="card">
              <div class="flex-between" style="margin-bottom:20px; flex-wrap:wrap; gap:10px;">
                <input id="search" placeholder="Search members..." style="width:300px; margin:0;" onkeyup="app.filter()">
                <button class="btn btn-primary" onclick="app.modals.add.open()">+ Add Member</button>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Plan</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody id="tbl-members"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-attendance" class="hidden">
            <div class="card">
              <h3>Full Attendance Log</h3>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Time</th><th>Name</th><th>Result</th></tr></thead>
                  <tbody id="tbl-attendance-full"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="text-align:center; margin-top:0;">⚡ Check-In</h3>
        <input id="checkin-id" type="number" placeholder="Enter Member ID" style="font-size:18px; padding:15px; text-align:center;" autofocus>
        <button class="btn btn-primary w-full" onclick="app.checkIn()">Submit</button>
        <div id="checkin-res" style="margin-top:20px; text-align:center; font-weight:bold; height:20px;"></div>
        <button class="btn btn-outline w-full" style="margin-top:15px;" onclick="app.modals.checkin.close()">Close</button>
      </div>
    </div>

    <div id="modal-add" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="margin-top:0;">New Member</h3>
        <form onsubmit="app.addMember(event)">
          <label>Full Name</label><input name="name" required>
          <label>Phone Number</label><input name="phone" required>
          <div class="flex">
            <div class="w-full"><label>Plan</label><select name="plan"><option>Standard</option><option>Premium</option></select></div>
            <div class="w-full"><label>Months</label><input name="duration" type="number" value="1" required></div>
          </div>
          <div class="flex" style="justify-content:flex-end; margin-top:15px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.add.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Member</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-pay" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="margin-top:0;">💰 Receive Payment</h3>
        <p id="pay-name" style="color:var(--text-muted); margin-bottom:20px;"></p>
        <form onsubmit="app.pay(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <label>Amount ($)</label><input name="amount" type="number" required>
          <label>Extend Expiry (Months)</label><input name="months" type="number" value="1" required>
          <div class="flex" style="justify-content:flex-end; margin-top:15px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.pay.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      function toggleSidebar() { 
        document.querySelector('.sidebar').classList.toggle('open');
        document.querySelector('.overlay').classList.toggle('open');
      }

      const app = {
        data: null,
        async init() {
          const res = await fetch('/api/bootstrap');
          this.data = await res.json();
          this.render();
        },
        
        nav(v) {
          document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
          event.currentTarget.classList.add('active');
          
          ['home', 'members', 'attendance'].forEach(id => document.getElementById('view-'+id).classList.add('hidden'));
          document.getElementById('view-'+v).classList.remove('hidden');
          document.getElementById('page-title').textContent = v === 'home' ? 'Dashboard' : v.charAt(0).toUpperCase() + v.slice(1);
          
          // Mobile close
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.overlay').classList.remove('open');
        },

        render() {
          // Stats
          document.getElementById('stat-active').innerText = this.data.stats.active;
          document.getElementById('stat-today').innerText = this.data.stats.today;
          document.getElementById('stat-rev').innerText = this.data.stats.revenue || 0;

          // Members
          const tbody = document.getElementById('tbl-members');
          tbody.innerHTML = this.data.members.map(m => {
            const isExp = new Date(m.expiry_date) < new Date();
            return \`<tr>
              <td>#\${m.id}</td>
              <td><strong>\${m.name}</strong></td>
              <td>\${m.phone}</td>
              <td>\${m.plan}</td>
              <td>\${m.expiry_date.split('T')[0]}</td>
              <td>\${isExp ? '<span class="badge bg-red">Expired</span>' : '<span class="badge bg-green">Active</span>'}</td>
              <td>
                <button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="app.modals.pay.open(\${m.id})">$ Pay</button>
                <button class="btn btn-danger" style="padding:4px 10px; font-size:12px;" onclick="app.del(\${m.id})">Del</button>
              </td>
            </tr>\`;
          }).join('');

          // Attendance
          const attRows = this.data.attendance.map(a => \`
            <tr>
              <td>\${new Date(a.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
              <td>\${a.name}</td>
              <td>\${a.status === 'success' ? '<span class="badge bg-green">OK</span>' : '<span class="badge bg-red">Expired</span>'}</td>
            </tr>\`).join('');
            
          document.getElementById('tbl-attendance-recent').innerHTML = attRows;
          document.getElementById('tbl-attendance-full').innerHTML = attRows;
        },

        async checkIn() {
          const id = document.getElementById('checkin-id').value;
          const div = document.getElementById('checkin-res');
          div.innerText = "Checking...";
          
          const res = await fetch('/api/checkin', { method:'POST', body:JSON.stringify({memberId: id}) });
          const json = await res.json();
          
          if(res.ok) {
            div.style.color = json.status === 'success' ? 'var(--success)' : 'var(--danger)';
            div.innerText = json.status === 'success' ? '✅ Welcome ' + json.name : '⛔ EXPIRED: ' + json.name;
            if(json.status === 'success') setTimeout(() => location.reload(), 1000);
          } else {
            div.style.color = 'var(--danger)';
            div.innerText = json.error || "Not found";
          }
        },

        async addMember(e) {
          e.preventDefault();
          await fetch('/api/members/add', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          location.reload();
        },

        async pay(e) {
          e.preventDefault();
          await fetch('/api/payment', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          location.reload();
        },

        async del(id) {
          if(!confirm("Delete member?")) return;
          await fetch('/api/members/delete', { method:'POST', body:JSON.stringify({id}) });
          location.reload();
        },
        
        filter() {
           const q = document.getElementById('search').value.toLowerCase();
           document.querySelectorAll('#tbl-members tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
        },

        modals: {
          checkin: { open:()=>{document.getElementById('modal-checkin').style.display='flex'; document.getElementById('checkin-id').focus()}, close:()=>document.getElementById('modal-checkin').style.display='none' },
          add: { open:()=>document.getElementById('modal-add').style.display='flex', close:()=>document.getElementById('modal-add').style.display='none' },
          pay: { 
            open:(id)=>{
              const m = app.data.members.find(x=>x.id===id);
              document.getElementById('pay-id').value=id;
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
