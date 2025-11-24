import { D1Database, R2Bucket } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  BUCKET?: R2Bucket;
}

/* ========================================================================
   1. SHARED UTILITIES
   ======================================================================== */

// Standardize API Responses
function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Security: Hash passwords securely
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Security: Verify passwords
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password);
  return hashed === hash;
}

/* ========================================================================
   2. HTML HEAD & STYLES (The UI System)
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
      --primary: #4f46e5;
      --primary-dark: #4338ca;
      --bg-body: #f3f4f6;
      --bg-sidebar: #111827;
      --bg-card: #ffffff;
      --text-main: #1f2937;
      --text-muted: #6b7280;
      --border: #e5e7eb;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
      --radius: 8px;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body {
      margin: 0; font-family: 'Inter', sans-serif;
      background: var(--bg-body); color: var(--text-main); font-size: 14px; line-height: 1.5;
      height: 100vh; display: flex; overflow: hidden;
    }

    /* --- LAYOUT --- */
    .sidebar {
      width: 260px; background: var(--bg-sidebar); color: white; display: flex; flex-direction: column;
      flex-shrink: 0; transition: transform 0.3s ease; z-index: 50;
    }
    .main-content {
      flex: 1; overflow-y: auto; display: flex; flex-direction: column; position: relative;
    }
    .top-bar {
      background: white; border-bottom: 1px solid var(--border); padding: 16px 24px;
      display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 40;
    }
    .container { padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }

    /* Mobile Layout */
    .mobile-toggle { display: none; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-main); }
    .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 45; display: none; }
    
    @media (max-width: 768px) {
      .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); height: 100%; }
      .sidebar.open { transform: translateX(0); }
      .mobile-toggle { display: block; }
      .mobile-overlay.open { display: block; }
      .container { padding: 16px; }
    }

    /* --- COMPONENTS --- */
    .logo { 
      font-size: 18px; font-weight: 700; padding: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); 
      display: flex; align-items: center; gap: 10px; color: #fff; letter-spacing: 0.5px;
    }
    
    .nav-links { list-style: none; padding: 16px; margin: 0; flex: 1; }
    .nav-item { 
      padding: 12px 16px; border-radius: var(--radius); cursor: pointer; display: flex; align-items: center; gap: 12px;
      color: #9ca3af; transition: all 0.2s; margin-bottom: 4px; font-weight: 500;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
    .nav-item.active { background: var(--primary); color: white; }
    
    .card { background: var(--bg-card); border-radius: var(--radius); box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; border: 1px solid var(--border); margin-bottom: 24px; }
    .card h3 { margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: var(--text-main); }

    .grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .stat-val { font-size: 28px; font-weight: 700; color: var(--text-main); margin-top: 4px; }
    .stat-label { color: var(--text-muted); font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }

    /* Tables */
    .table-container { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; white-space: nowrap; background: white; }
    th { text-align: left; padding: 14px 16px; background: #f9fafb; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 12px; font-weight: 600; text-transform: uppercase; }
    td { padding: 14px 16px; border-bottom: 1px solid var(--border); color: var(--text-main); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #f9fafb; }

    /* Forms */
    input, select, textarea { 
      width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius);
      font-size: 14px; margin-bottom: 16px; transition: border 0.2s; background: #fff;
    }
    input:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 13px; color: var(--text-main); }
    
    button { 
      padding: 10px 18px; border: none; border-radius: var(--radius); font-weight: 600; cursor: pointer; font-size: 14px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: white; border: 1px solid var(--border); color: var(--text-main); }
    .btn-outline:hover { background: #f9fafb; border-color: #d1d5db; }
    .btn-danger { background: #fee2e2; color: #b91c1c; }
    .btn-danger:hover { background: #fecaca; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .w-full { width: 100%; }

    /* Badges */
    .badge { padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.red { background: #fee2e2; color: #b91c1c; }

    /* Utilities */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 12px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .text-sm { font-size: 12px; color: var(--text-muted); }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #e5e7eb; display: grid; place-items: center; font-weight: 600; font-size: 12px; color: #4b5563; }

    /* Modals & Toasts */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; place-items: center; z-index: 100; padding: 20px; }
    .modal-content { background: white; padding: 24px; border-radius: 12px; width: 100%; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    
    .toast-container { position: fixed; top: 20px; right: 20px; z-index: 200; display: flex; flex-direction: column; gap: 10px; }
    .toast { background: #1f2937; color: white; padding: 12px 16px; border-radius: 8px; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); animation: slideIn 0.3s; display: flex; align-items: center; gap: 8px; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  </style>
</head>`;
}

/* ========================================================================
   3. DATABASE SETUP (D1)
   ======================================================================== */

async function setupDatabase(env: Env) {
  const statements = [
    // Gym Info
    `CREATE TABLE IF NOT EXISTS gym (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )`,
    // Users (Admin/Staff)
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    // Membership Plans
    `CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      duration_months INTEGER DEFAULT 1
    )`,
    // Members
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT,
      gender TEXT,
      plan_id INTEGER,
      expiry_date TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      joined_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    )`,
    // Attendance
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      check_in_time TEXT NOT NULL,
      status TEXT DEFAULT 'success',
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )`,
    // Payments
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      amount INTEGER NOT NULL,
      date TEXT DEFAULT (datetime('now')),
      type TEXT DEFAULT 'membership',
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
    )`,
    // Sessions
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )`
  ];

  await env.DB.prepare("PRAGMA foreign_keys = ON").run();
  for (const sql of statements) await env.DB.prepare(sql).run();
}

/* ========================================================================
   4. ROUTER & CONTROLLERS
   ======================================================================== */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Ensure DB structure
    await setupDatabase(env);

    /* --- PUBLIC ROUTES --- */
    if (path === "/") {
      // 1. Check if system is installed
      const gym = await env.DB.prepare("SELECT * FROM gym").first();
      if (!gym) return renderSetup();
      
      // 2. Check if user is already logged in
      const user = await getSession(request, env);
      if (user) return Response.redirect(url.origin + "/dashboard", 302);
      
      // 3. Show Login
      return renderLogin(gym.name);
    }

    if (path === "/api/setup" && request.method === "POST") return handleSetup(request, env);
    if (path === "/api/login" && request.method === "POST") return handleLogin(request, env);

    /* --- PROTECTED ROUTES (Middleware) --- */
    const user = await getSession(request, env);
    
    // Auth Guard
    if (!user) {
      if (path.startsWith("/api/")) return json({ error: "Unauthorized" }, 401);
      return Response.redirect(url.origin + "/", 302);
    }

    // Dashboard View
    if (path === "/dashboard") return renderDashboard(user);

    // Logout
    if (path === "/api/logout") {
      const cookie = request.headers.get("Cookie") || "";
      const token = cookie.match(/gym_auth=([^;]+)/)?.[1];
      if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" }});
    }

    // Bootstrap Data (The key to the SPA)
    if (path === "/api/bootstrap") return handleBootstrap(env, user);

    // API Operations
    if (path === "/api/member/add") return handleAddMember(request, env);
    if (path === "/api/member/delete") return handleDeleteMember(request, env, user);
    if (path === "/api/checkin") return handleCheckIn(request, env);
    if (path === "/api/payment/add") return handleAddPayment(request, env);
    if (path === "/api/plan/add") return handleAddPlan(request, env, user);

    return new Response("Not Found", { status: 404 });
  }
};

/* --- BACKEND HANDLERS --- */

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  const token = cookie.match(/gym_auth=([^;]+)/)?.[1];
  if (!token) return null;

  return await env.DB.prepare(`
    SELECT s.user_id, s.role, u.name, u.email 
    FROM sessions s JOIN users u ON s.user_id = u.id 
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).bind(token).first<any>();
}

async function handleSetup(req: Request, env: Env) {
  const body = await req.json() as any;
  const gymName = (body.gymName || "").trim();
  const name = (body.adminName || "").trim();
  const email = (body.adminEmail || "").trim().toLowerCase(); // Normalize email
  const password = (body.password || "").trim();

  if (!gymName || !name || !email || !password) return json({ error: "Missing fields" }, 400);

  // 1. Create Gym
  await env.DB.prepare("INSERT INTO gym (name) VALUES (?)").bind(gymName).run();
  
  // 2. Create Admin
  const hash = await hashPassword(password);
  await env.DB.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')")
    .bind(name, email, hash).run();
  
  return json({ success: true });
}

async function handleLogin(req: Request, env: Env) {
  const body = await req.json() as any;
  const email = (body.email || "").trim().toLowerCase(); // Normalize email
  const password = (body.password || "").trim();

  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
  
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return json({ error: "Invalid credentials" }, 401);
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 86400000 * 7).toISOString(); // 7 days
  await env.DB.prepare("INSERT INTO sessions (token, user_id, role, expires_at) VALUES (?, ?, ?, ?)")
    .bind(token, user.id, user.role, expires).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`, "Content-Type": "application/json" }
  });
}

async function handleBootstrap(env: Env, user: any) {
  const [members, plans, recentAttendance, stats, revenue] = await Promise.all([
    env.DB.prepare(`SELECT m.*, p.name as plan_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id ORDER BY m.full_name ASC`).all(),
    env.DB.prepare("SELECT * FROM plans").all(),
    env.DB.prepare(`SELECT a.id, a.check_in_time, a.status, m.full_name, m.id as member_id FROM attendance a JOIN members m ON a.member_id = m.id ORDER BY a.check_in_time DESC LIMIT 50`).all(),
    env.DB.prepare(`SELECT (SELECT count(*) FROM members WHERE status = 'active') as active_members, (SELECT count(*) FROM attendance WHERE date(check_in_time) = date('now')) as today_checkins`).first(),
    env.DB.prepare(`SELECT sum(amount) as total FROM payments WHERE date(date) > date('now', '-30 days')`).first()
  ]);

  return json({
    user,
    members: members.results,
    plans: plans.results,
    attendance: recentAttendance.results,
    stats: { ...stats, revenue: revenue?.total || 0 }
  });
}

async function handleCheckIn(req: Request, env: Env) {
  const { memberId } = await req.json() as any;
  const now = new Date().toISOString();

  const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
  if (!member) return json({ error: "Member not found" }, 404);

  let status = 'success';
  let message = 'Welcome!';
  if (member.expiry_date && new Date(member.expiry_date) < new Date()) {
    status = 'rejected';
    message = 'Membership Expired!';
  }

  // Insert & Return Log
  await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)")
    .bind(memberId, now, status).run();
  
  return json({ 
    success: true, 
    entry: { member_id: member.id, full_name: member.full_name, check_in_time: now, status: status },
    message 
  });
}

async function handleAddMember(req: Request, env: Env) {
  const { name, phone, gender, planId, notes } = await req.json() as any;
  
  // Calculate expiry
  let expiry = null;
  let planName = null;
  if (planId) {
    const plan = await env.DB.prepare("SELECT * FROM plans WHERE id = ?").bind(planId).first<any>();
    if (plan) {
      planName = plan.name;
      const d = new Date();
      d.setMonth(d.getMonth() + plan.duration_months);
      expiry = d.toISOString();
    }
  }

  // Uses RETURNING to get ID properly
  const res = await env.DB.prepare(`
    INSERT INTO members (full_name, phone, gender, plan_id, expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING *
  `).bind(name, phone, gender, planId, expiry, notes).first<any>();

  return json({ success: true, member: { ...res, plan_name: planName } });
}

async function handleAddPayment(req: Request, env: Env) {
  const { memberId, amount, extendMonths } = await req.json() as any;

  await env.DB.prepare("INSERT INTO payments (member_id, amount) VALUES (?, ?)").bind(memberId, amount).run();

  const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
  let newExpiry = new Date();
  if (member.expiry_date && new Date(member.expiry_date) > new Date()) {
    newExpiry = new Date(member.expiry_date);
  }
  newExpiry.setMonth(newExpiry.getMonth() + parseInt(extendMonths));

  await env.DB.prepare("UPDATE members SET expiry_date = ?, status = 'active' WHERE id = ?")
    .bind(newExpiry.toISOString(), memberId).run();

  return json({ success: true, new_expiry: newExpiry.toISOString() });
}

async function handleAddPlan(req: Request, env: Env, user: any) {
  if (user.role === 'staff') return json({ error: "Access Denied" }, 403);
  const { name, price, duration } = await req.json() as any;
  const plan = await env.DB.prepare("INSERT INTO plans (name, price, duration_months) VALUES (?, ?, ?) RETURNING *")
    .bind(name, price, duration).first();
  return json({ success: true, plan });
}

async function handleDeleteMember(req: Request, env: Env, user: any) {
  if (user.role !== 'owner') return json({ error: "Only Owners can delete" }, 403);
  const { id } = await req.json() as any;
  await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
  return json({ success: true });
}

/* ========================================================================
   5. FRONTEND VIEWS
   ======================================================================== */

function renderSetup(): Response {
  return new Response(`${baseHead("System Setup")}
  <body style="justify-content:center; align-items:center;">
    <div class="card" style="width:100%; max-width:400px; padding:32px;">
      <div style="text-align:center; margin-bottom:24px;">
        <h2 style="font-size:24px; margin:0;">🚀 Initial Setup</h2>
        <p style="color:var(--text-muted)">Let's get your gym running.</p>
      </div>
      <form onsubmit="doSetup(event)">
        <label>Gym Name</label><input name="gymName" required placeholder="e.g. Iron Titan Gym">
        <label>Admin Name</label><input name="adminName" required placeholder="Your Name">
        <label>Admin Email</label><input name="adminEmail" type="email" required placeholder="you@example.com">
        <label>Password</label><input name="password" type="password" required>
        <button type="submit" class="btn-primary w-full" id="btn-setup">Install System</button>
      </form>
    </div>
    <script>
      async function doSetup(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-setup');
        btn.textContent = 'Installing...'; btn.disabled = true;
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('/api/setup', { method:'POST', body: JSON.stringify(data) });
        if(res.ok) window.location.href = '/';
        else { alert('Setup Failed. Try again.'); btn.textContent = 'Install System'; btn.disabled = false; }
      }
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(gymName: string): Response {
  return new Response(`${baseHead("Login")}
  <body style="justify-content:center; align-items:center;">
    <div class="card" style="width:100%; max-width:380px; padding:32px;">
      <div style="text-align:center; margin-bottom:24px;">
        <h2 style="margin:0 0 8px 0;">${gymName}</h2>
        <p style="color:var(--text-muted); margin:0;">Staff Access Portal</p>
      </div>
      <form onsubmit="doLogin(event)">
        <label>Email</label><input name="email" type="email" required placeholder="you@example.com">
        <label>Password</label><input name="password" type="password" required>
        <button type="submit" class="btn-primary w-full" id="btn-login">Access Dashboard</button>
      </form>
    </div>
    <script>
      async function doLogin(e) {
        e.preventDefault();
        const btn = document.getElementById('btn-login');
        btn.textContent = 'Verifying...'; btn.disabled = true;
        
        const res = await fetch('/api/login', { method:'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
        if(res.ok) window.location.href = '/dashboard';
        else { 
          const err = await res.json();
          alert(err.error || 'Invalid Credentials'); 
          btn.textContent = 'Access Dashboard'; btn.disabled = false; 
        }
      }
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any): Response {
  const html = `${baseHead("Dashboard")}
  <body>
    <!-- SIDEBAR -->
    <div class="mobile-overlay" onclick="app.toggleSidebar()"></div>
    <aside class="sidebar">
      <div class="logo">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        GymOS
      </div>
      <ul class="nav-links">
        <li class="nav-item active" onclick="app.nav('dashboard')">📊 Dashboard</li>
        <li class="nav-item" onclick="app.nav('members')">👥 Members</li>
        <li class="nav-item" onclick="app.nav('attendance')">⏰ Attendance</li>
        ${user.role === 'owner' ? `<li class="nav-item" onclick="app.nav('settings')">⚙️ Settings & Plans</li>` : ''}
      </ul>
      <div style="padding: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="color:white; font-weight:600;">${user.name}</div>
        <div style="font-size:12px; opacity:0.6; margin-bottom:12px;">${user.role.toUpperCase()}</div>
        <a href="/api/logout" style="color: #fca5a5; text-decoration:none; font-size:12px;">Sign Out &rarr;</a>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main-content">
      <header class="top-bar">
        <div class="flex">
          <button class="mobile-toggle" onclick="app.toggleSidebar()">☰</button>
          <h3 style="margin:0; font-size:18px;">Dashboard</h3>
        </div>
        <button class="btn-primary" onclick="app.openCheckIn()">⚡ Quick Check-In</button>
      </header>

      <div class="container">
        <div id="loading" style="text-align:center; padding:60px; color:var(--text-muted)">
          <div style="font-size:30px; margin-bottom:10px;">⏳</div>Loading your gym data...
        </div>
        
        <!-- DASHBOARD VIEW -->
        <div id="view-dashboard" class="view hidden">
          <div class="grid-stats">
            <div class="stat-card">
              <div class="stat-label">Active Members</div>
              <div class="stat-val" id="stat-active">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Check-ins Today</div>
              <div class="stat-val" id="stat-today">0</div>
            </div>
            ${user.role === 'owner' ? `
            <div class="stat-card">
              <div class="stat-label">Revenue (30d)</div>
              <div class="stat-val" style="color:var(--success)">$<span id="stat-revenue">0</span></div>
            </div>` : ''}
          </div>

          <div class="card">
            <h3>Recent Activity</h3>
            <div class="table-container">
              <table id="dash-table">
                <thead><tr><th>Time</th><th>Member</th><th>Status</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- MEMBERS VIEW -->
        <div id="view-members" class="view hidden">
          <div class="flex-between" style="margin-bottom:20px;">
            <input type="text" id="search-member" placeholder="Search name or ID..." style="max-width:300px; margin:0;" onkeyup="app.filterMembers()">
            <button class="btn-primary" onclick="app.modals.member.open()">+ Add Member</button>
          </div>
          <div class="table-container">
            <table id="table-members">
              <thead><tr><th>Member</th><th>Phone</th><th>Plan</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <!-- ATTENDANCE VIEW -->
        <div id="view-attendance" class="view hidden">
          <div class="card">
            <h3>Attendance Log</h3>
            <div class="table-container">
              <table id="table-attendance-full">
                <thead><tr><th>Time</th><th>ID</th><th>Name</th><th>Status</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- SETTINGS VIEW -->
        <div id="view-settings" class="view hidden">
          <div class="card" style="max-width:600px;">
            <h3>Create Membership Plan</h3>
            <form onsubmit="app.actions.addPlan(event)">
              <label>Plan Name</label>
              <input name="name" required placeholder="e.g. Gold Monthly">
              <div class="flex">
                <div class="w-full">
                  <label>Price</label>
                  <input name="price" type="number" required placeholder="50">
                </div>
                <div class="w-full">
                  <label>Duration (Months)</label>
                  <input name="duration" type="number" value="1" required>
                </div>
              </div>
              <button class="btn-primary" type="submit">Create Plan</button>
            </form>
            <div style="margin-top:20px;">
               <h4>Active Plans</h4>
               <ul id="list-plans" style="padding-left:20px; color:var(--text-muted)"></ul>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- MODALS -->
    
    <!-- 1. ADD MEMBER -->
    <div id="modal-member" class="modal-backdrop">
      <div class="modal-content">
        <h3>New Member</h3>
        <form onsubmit="app.actions.addMember(event)">
          <label>Full Name</label>
          <input name="name" required placeholder="John Doe">
          <div class="flex">
            <div class="w-full"><label>Phone</label><input name="phone" placeholder="01XXX..."></div>
            <div class="w-full"><label>Gender</label><select name="gender"><option value="m">Male</option><option value="f">Female</option></select></div>
          </div>
          <label>Membership Plan</label>
          <select name="planId" id="select-plans"><option value="">Select Plan...</option></select>
          <label>Notes</label>
          <input name="notes" placeholder="Optional notes...">
          <div class="flex" style="justify-content:flex-end; margin-top:10px;">
            <button type="button" class="btn-outline" onclick="app.modals.member.close()">Cancel</button>
            <button type="submit" class="btn-primary">Save Member</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 2. PAYMENT -->
    <div id="modal-payment" class="modal-backdrop">
      <div class="modal-content">
        <h3>Record Payment</h3>
        <div id="pay-info" style="background:#f3f4f6; padding:10px; border-radius:6px; margin-bottom:15px; font-weight:500;"></div>
        <form onsubmit="app.actions.addPayment(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <label>Amount Paid</label>
          <input name="amount" type="number" required placeholder="0.00">
          <label>Extend Validity By</label>
          <select name="extendMonths">
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">1 Year</option>
          </select>
          <div class="flex" style="justify-content:flex-end; margin-top:10px;">
            <button type="button" class="btn-outline" onclick="app.modals.payment.close()">Cancel</button>
            <button type="submit" class="btn-primary">Confirm</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 3. CHECK-IN -->
    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="text-align:center">⚡ Quick Check-In</h3>
        <input id="checkin-search" placeholder="Type member name or ID..." style="font-size:16px; padding:12px; margin-top:10px;" autofocus>
        <div id="checkin-results" style="margin-top:10px; max-height:200px; overflow-y:auto; border:1px solid var(--border); border-radius:8px; display:none;"></div>
        <button class="btn-outline w-full" style="margin-top:10px;" onclick="app.modals.checkin.close()">Close</button>
      </div>
    </div>

    <div class="toast-container" id="toasts"></div>

    <script>
      const app = {
        state: { members: [], attendance: [], plans: [], stats: {} },
        userRole: "${user.role}",

        init: async () => {
          try {
            const res = await fetch('/api/bootstrap');
            if (!res.ok) throw new Error('Auth Failed');
            app.state = await res.json();
            document.getElementById('loading').classList.add('hidden');
            app.renderAll();
            app.nav('dashboard');
          } catch(e) {
            window.location.href = '/';
          }
        },

        /* --- NAVIGATION --- */
        nav: (view) => {
          document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
          document.getElementById('view-' + view).classList.remove('hidden');
          
          document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
          const navMap = { 'dashboard':0, 'members':1, 'attendance':2, 'settings':3 };
          const idx = navMap[view];
          if(document.querySelectorAll('.nav-item')[idx]) document.querySelectorAll('.nav-item')[idx].classList.add('active');
          
          // Mobile close
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.mobile-overlay').classList.remove('open');
        },
        
        toggleSidebar: () => {
          document.querySelector('.sidebar').classList.toggle('open');
          document.querySelector('.mobile-overlay').classList.toggle('open');
        },

        /* --- RENDERERS --- */
        renderAll: () => {
          app.renderStats();
          app.renderMembers();
          app.renderAttendance();
          app.renderPlans();
        },

        renderStats: () => {
          document.getElementById('stat-active').textContent = app.state.stats.active_members || 0;
          document.getElementById('stat-today').textContent = app.state.stats.today_checkins || 0;
          const revEl = document.getElementById('stat-revenue');
          if(revEl) revEl.textContent = app.state.stats.revenue || 0;
        },

        renderMembers: () => {
          const tbody = document.querySelector('#table-members tbody');
          tbody.innerHTML = '';
          app.state.members.forEach(m => {
            const isExpired = m.expiry_date && new Date(m.expiry_date) < new Date();
            const badge = isExpired ? '<span class="badge red">Expired</span>' : '<span class="badge green">Active</span>';
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td>
                <div class="flex">
                  <div class="avatar">\${m.full_name.substring(0,2).toUpperCase()}</div>
                  <div>
                    <div style="font-weight:600">\${m.full_name}</div>
                    <div class="text-sm">#\${m.id}</div>
                  </div>
                </div>
              </td>
              <td>\${m.phone || '-'}</td>
              <td>\${m.plan_name || 'No Plan'}</td>
              <td>\${m.expiry_date ? m.expiry_date.split('T')[0] : '-'}</td>
              <td>\${badge}</td>
              <td>
                <button class="btn-outline btn-sm" onclick="app.modals.payment.open(\${m.id})">Pay</button>
                \${app.userRole === 'owner' ? \`<button class="btn-danger btn-sm" onclick="app.actions.deleteMember(\${m.id})">Del</button>\` : ''}
              </td>
            \`;
            tbody.appendChild(tr);
          });
        },

        renderAttendance: () => {
          const rows = app.state.attendance.map(a => {
            const time = new Date(a.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const badge = a.status === 'success' ? '<span class="badge green">OK</span>' : '<span class="badge red">REJECTED</span>';
            return \`<tr><td>\${time}</td><td>#\${a.member_id}</td><td><strong>\${a.full_name}</strong></td><td>\${badge}</td></tr>\`;
          });
          document.querySelector('#dash-table tbody').innerHTML = rows.slice(0,5).join('');
          document.querySelector('#table-attendance-full tbody').innerHTML = rows.join('');
        },

        renderPlans: () => {
          const sel = document.getElementById('select-plans');
          const list = document.getElementById('list-plans');
          sel.innerHTML = '<option value="">Select Plan...</option>';
          list.innerHTML = '';
          
          app.state.plans.forEach(p => {
            sel.innerHTML += \`<option value="\${p.id}">\${p.name} - $\${p.price}</option>\`;
            list.innerHTML += \`<li>\${p.name} ($\${p.price} / \${p.duration_months} mo)</li>\`;
          });
        },

        /* --- ACTIONS --- */
        actions: {
          addMember: async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            const res = await fetch('/api/member/add', { method:'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
            if(res.ok) {
              const json = await res.json();
              app.state.members.unshift(json.member);
              app.state.stats.active_members++;
              app.renderAll();
              app.modals.member.close();
              app.toast('Member added successfully');
              e.target.reset();
            }
            btn.disabled = false;
          },

          deleteMember: async (id) => {
            if(!confirm('Delete this member? History will be lost.')) return;
            const res = await fetch('/api/member/delete', { method:'POST', body: JSON.stringify({id}) });
            if(res.ok) {
              app.state.members = app.state.members.filter(m => m.id !== id);
              app.renderMembers();
              app.toast('Member deleted');
            }
          },

          addPayment: async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('/api/payment/add', { method:'POST', body: JSON.stringify(data) });
            if(res.ok) {
              const json = await res.json();
              const m = app.state.members.find(x => x.id == data.memberId);
              if(m) m.expiry_date = json.new_expiry;
              if(app.state.stats.revenue !== undefined) app.state.stats.revenue += parseInt(data.amount);
              
              app.renderAll();
              app.modals.payment.close();
              app.toast('Payment recorded successfully');
              e.target.reset();
            }
            btn.disabled = false;
          },

          addPlan: async (e) => {
            e.preventDefault();
            const res = await fetch('/api/plan/add', { method:'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
            if(res.ok) {
              const json = await res.json();
              app.state.plans.push(json.plan);
              app.renderPlans();
              app.toast('Plan created');
              e.target.reset();
            }
          },

          checkIn: async (id) => {
            const res = await fetch('/api/checkin', { method:'POST', body: JSON.stringify({memberId: id}) });
            const json = await res.json();
            if(res.ok) {
              // REACTIVE UPDATE: Add to front of array instantly
              app.state.attendance.unshift(json.entry);
              app.state.stats.today_checkins++;
              
              app.renderAttendance();
              app.renderStats();
              
              app.modals.checkin.close();
              const type = json.entry.status === 'success' ? 'success' : 'error';
              app.toast(json.message, type);
            } else {
              app.toast('Check-in failed', 'error');
            }
          }
        },

        /* --- UTILS --- */
        filterMembers: () => {
          const q = document.getElementById('search-member').value.toLowerCase();
          const rows = document.querySelectorAll('#table-members tbody tr');
          rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
        },

        modals: {
          member: {
            open: () => document.getElementById('modal-member').style.display = 'grid',
            close: () => document.getElementById('modal-member').style.display = 'none'
          },
          payment: {
            open: (id) => {
              const m = app.state.members.find(x => x.id === id);
              document.getElementById('pay-id').value = id;
              document.getElementById('pay-info').innerText = 'Member: ' + m.full_name;
              document.getElementById('modal-payment').style.display = 'grid';
            },
            close: () => document.getElementById('modal-payment').style.display = 'none'
          },
          checkin: {
            close: () => document.getElementById('modal-checkin').style.display = 'none'
          }
        },

        openCheckIn: () => {
          document.getElementById('modal-checkin').style.display = 'grid';
          const inp = document.getElementById('checkin-search');
          inp.value = ''; inp.focus();
          document.getElementById('checkin-results').style.display = 'none';
        },

        toast: (msg, type='success') => {
          const t = document.createElement('div');
          t.className = 'toast';
          t.innerHTML = \`<span>\${type==='error'?'⚠️':'✅'}</span> \${msg}\`;
          if(type==='error') t.style.background = '#7f1d1d';
          document.getElementById('toasts').appendChild(t);
          setTimeout(() => t.remove(), 3000);
        }
      };

      // Live Search Logic
      document.getElementById('checkin-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const resBox = document.getElementById('checkin-results');
        resBox.innerHTML = '';
        if(q.length < 1) { resBox.style.display = 'none'; return; }
        
        const matches = app.state.members.filter(m => m.full_name.toLowerCase().includes(q) || m.id.toString() == q).slice(0,5);
        
        if(matches.length > 0) {
          resBox.style.display = 'block';
          matches.forEach(m => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.style.cursor = 'pointer';
            div.innerHTML = \`<b>\${m.full_name}</b> <span style="font-size:12px; color:#666">#\${m.id}</span>\`;
            div.onmouseover = () => div.style.background = '#f9fafb';
            div.onmouseout = () => div.style.background = 'white';
            div.onclick = () => app.actions.checkIn(m.id);
            resBox.appendChild(div);
          });
        } else {
          resBox.style.display = 'none';
        }
      });

      // Start
      app.init();
    </script>
  </body></html>`;
  
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
