export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket; // Optional, code falls back to SVG avatars if missing
}

/* ========================================================================
   1. SHARED UTILITIES & TYPES
   ======================================================================== */

// Standard API Response wrapper
function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Security: Hash passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
  <style>
    :root {
      --primary: #4f46e5; /* Indigo */
      --primary-dark: #4338ca;
      --bg-sidebar: #1e293b; /* Slate 800 */
      --bg-body: #f1f5f9;
      --bg-card: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-light: #cbd5e1;
      --border: #e2e8f0;
      --danger: #ef4444;
      --success: #10b981;
      --warning: #f59e0b;
      --radius: 8px;
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg-body); color: var(--text-main); font-size: 14px; line-height: 1.5;
      height: 100vh; display: flex; overflow: hidden;
    }

    /* --- LAYOUT --- */
    .sidebar {
      width: 250px; background: var(--bg-sidebar); color: white; display: flex; flex-direction: column;
      flex-shrink: 0; transition: transform 0.3s ease;
    }
    .main-content {
      flex: 1; overflow-y: auto; display: flex; flex-direction: column;
    }
    .top-bar {
      background: white; border-bottom: 1px solid var(--border); padding: 12px 24px;
      display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 10;
    }
    .container { padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }

    /* Mobile Layout */
    @media (max-width: 768px) {
      .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); z-index: 50; }
      .sidebar.open { transform: translateX(0); }
      .mobile-overlay { 
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; 
      }
      .mobile-overlay.open { display: block; }
    }

    /* --- COMPONENTS --- */
    .logo { font-size: 20px; font-weight: 700; padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; gap: 10px; }
    .nav-links { list-style: none; padding: 10px; margin: 0; flex: 1; }
    .nav-item { 
      padding: 12px; border-radius: var(--radius); cursor: pointer; display: flex; align-items: center; gap: 12px;
      color: var(--text-light); transition: all 0.2s; margin-bottom: 4px;
    }
    .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: white; }
    
    .card { background: var(--bg-card); border-radius: var(--radius); box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 20px; border: 1px solid var(--border); margin-bottom: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .card-title { font-size: 16px; font-weight: 600; margin: 0; }

    .grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: var(--radius); border: 1px solid var(--border); }
    .stat-value { font-size: 28px; font-weight: 700; color: var(--text-main); margin: 5px 0; }
    .stat-label { color: var(--text-muted); font-size: 13px; font-weight: 500; }

    /* Tables */
    .table-container { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; white-space: nowrap; }
    th { text-align: left; padding: 12px; border-bottom: 2px solid var(--bg-body); color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 12px; border-bottom: 1px solid var(--bg-body); color: var(--text-main); vertical-align: middle; }
    tr:hover { background: #f8fafc; }

    /* Forms & Inputs */
    input, select { 
      width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius);
      font-size: 14px; margin-bottom: 10px; transition: border 0.2s;
    }
    input:focus, select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    
    button { 
      padding: 10px 16px; border: none; border-radius: var(--radius); font-weight: 600; cursor: pointer; font-size: 14px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
    .btn-danger { background: #fee2e2; color: var(--danger); }
    .btn-sm { padding: 6px 12px; font-size: 12px; }

    /* Badges & Avatars */
    .badge { padding: 4px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.red { background: #fee2e2; color: #b91c1c; }
    .badge.yellow { background: #fef3c7; color: #b45309; }

    .avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; background: #e2e8f0; display: grid; place-items: center; font-weight: 600; color: #64748b; flex-shrink: 0;}
    
    /* Utilities */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 10px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .text-sm { font-size: 12px; color: var(--text-muted); }

    /* Modal */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; place-items: center; z-index: 100; }
    .modal-content { background: white; padding: 24px; border-radius: 12px; width: 100%; max-width: 450px; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Toast Notification */
    .toast-container { position: fixed; top: 20px; right: 20px; z-index: 200; display: flex; flex-direction: column; gap: 10px; }
    .toast { background: #1e293b; color: white; padding: 12px 16px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s; display: flex; align-items: center; gap: 8px; }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

  </style>
</head>`;
}

/* ========================================================================
   3. DATABASE SETUP (D1)
   ======================================================================== */

async function setupDatabase(env: Env) {
  const statements = [
    // Gym Configuration
    `CREATE TABLE IF NOT EXISTS gym (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      currency TEXT DEFAULT '$'
    )`,
    // Staff Accounts
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'staff', -- admin, owner, staff
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
    // Attendance Logs
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      check_in_time TEXT NOT NULL,
      status TEXT DEFAULT 'success', -- success, rejected
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )`,
    // Payments (New Financial Feature)
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      amount INTEGER NOT NULL,
      date TEXT DEFAULT (datetime('now')),
      type TEXT DEFAULT 'membership', -- membership, product
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
    
    // Ensure DB exists on first run
    await setupDatabase(env);

    /* --- PUBLIC ROUTES --- */
    if (path === "/") {
      // Check if gym is set up
      const gym = await env.DB.prepare("SELECT * FROM gym").first();
      if (!gym) return renderSetup();
      
      // Check session
      const user = await getSession(request, env);
      if (user) return Response.redirect(url.origin + "/dashboard", 302);
      return renderLogin(gym.name);
    }

    if (path === "/api/setup" && request.method === "POST") return handleSetup(request, env);
    if (path === "/api/login" && request.method === "POST") return handleLogin(request, env);

    /* --- PROTECTED ROUTES (Middleware) --- */
    const user = await getSession(request, env);
    if (!user) {
      if (path.startsWith("/api/")) return json({ error: "Unauthorized" }, 401);
      return Response.redirect(url.origin + "/", 302);
    }

    // App View
    if (path === "/dashboard") return renderDashboard(user);

    // API: Logout
    if (path === "/api/logout") {
      const cookie = request.headers.get("Cookie") || "";
      const token = cookie.match(/gym_auth=([^;]+)/)?.[1];
      if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" }});
    }

    // API: Bootstrap (Load all data for SPA)
    if (path === "/api/bootstrap") return handleBootstrap(env, user);

    // API: Operations
    if (path === "/api/member/add") return handleAddMember(request, env);
    if (path === "/api/member/delete") return handleDeleteMember(request, env, user);
    if (path === "/api/checkin") return handleCheckIn(request, env);
    if (path === "/api/payment/add") return handleAddPayment(request, env, user);
    if (path === "/api/plan/add") return handleAddPlan(request, env, user);

    return new Response("Not Found", { status: 404 });
  }
};

/* --- LOGIC HANDLERS --- */

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
  const { gymName, adminName, adminEmail, password } = await req.json() as any;
  
  // 1. Create Gym
  await env.DB.prepare("INSERT INTO gym (name) VALUES (?)").bind(gymName).run();
  
  // 2. Create Admin
  const hash = await hashPassword(password);
  await env.DB.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'owner')")
    .bind(adminName, adminEmail, hash).run();
  
  return json({ success: true });
}

async function handleLogin(req: Request, env: Env) {
  const { email, password } = await req.json() as any;
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
  // Parallel Fetching for Speed
  const [members, plans, recentAttendance, stats, revenue] = await Promise.all([
    env.DB.prepare(`
      SELECT m.*, p.name as plan_name 
      FROM members m LEFT JOIN plans p ON m.plan_id = p.id 
      ORDER BY m.full_name ASC`).all(),
    env.DB.prepare("SELECT * FROM plans").all(),
    env.DB.prepare(`
      SELECT a.id, a.check_in_time, a.status, m.full_name, m.id as member_id
      FROM attendance a JOIN members m ON a.member_id = m.id 
      ORDER BY a.check_in_time DESC LIMIT 50`).all(),
    env.DB.prepare(`
      SELECT 
        (SELECT count(*) FROM members WHERE status = 'active') as active_members,
        (SELECT count(*) FROM attendance WHERE date(check_in_time) = date('now')) as today_checkins
    `).first(),
    // Simple revenue Calc (Last 30 days)
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

  // Validate Member
  const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
  if (!member) return json({ error: "Member not found" }, 404);

  // Check Expiry
  let status = 'success';
  let message = 'Welcome!';
  if (member.expiry_date && new Date(member.expiry_date) < new Date()) {
    status = 'rejected';
    message = 'Membership Expired!';
    // We still log it, but as rejected (or warning)
  }

  // Insert Log
  await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)")
    .bind(memberId, now, status).run();
  
  return json({ 
    success: true, 
    entry: { 
      member_id: member.id, 
      full_name: member.full_name, 
      check_in_time: now, 
      status: status 
    },
    message 
  });
}

async function handleAddMember(req: Request, env: Env) {
  const { name, phone, gender, planId, notes } = await req.json() as any;
  
  // Calculate expiry based on plan
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

  const res = await env.DB.prepare(`
    INSERT INTO members (full_name, phone, gender, plan_id, expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?) RETURNING *
  `).bind(name, phone, gender, planId, expiry, notes).first<any>();

  return json({ success: true, member: { ...res, plan_name: planName } });
}

async function handleAddPayment(req: Request, env: Env, user: any) {
  // Only Admin/Owner can process payments usually, but let's allow staff for now
  const { memberId, amount, extendMonths } = await req.json() as any;

  // 1. Record Money
  await env.DB.prepare("INSERT INTO payments (member_id, amount) VALUES (?, ?)")
    .bind(memberId, amount).run();

  // 2. Extend Membership
  const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
  
  let newExpiry = new Date();
  if (member.expiry_date && new Date(member.expiry_date) > new Date()) {
    newExpiry = new Date(member.expiry_date); // Start from current expiry if valid
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
  if (user.role !== 'owner') return json({ error: "Only Owners can delete data" }, 403);
  const { id } = await req.json() as any;
  await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
  return json({ success: true });
}

/* ========================================================================
   5. FRONTEND VIEWS
   ======================================================================== */

function renderSetup(): Response {
  return new Response(`${baseHead("System Setup")}
  <body style="justify-content:center; background: #e2e8f0;">
    <div class="card" style="width:400px; padding:30px;">
      <h2 style="text-align:center; margin-bottom:20px;">🚀 Initial Setup</h2>
      <form onsubmit="doSetup(event)">
        <label>Gym Name</label><input name="gymName" required placeholder="e.g. Iron Titan Gym">
        <label>Admin Name</label><input name="adminName" required>
        <label>Admin Email</label><input name="adminEmail" type="email" required>
        <label>Password</label><input name="password" type="password" required>
        <button type="submit" class="btn-primary" style="width:100%">Install System</button>
      </form>
    </div>
    <script>
      async function doSetup(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const res = await fetch('/api/setup', { method:'POST', body: JSON.stringify(data) });
        if(res.ok) window.location.href = '/';
        else alert('Setup Failed');
      }
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(gymName: string): Response {
  return new Response(`${baseHead("Login")}
  <body style="justify-content:center; background: #e2e8f0;">
    <div class="card" style="width:380px; padding:30px;">
      <h2 style="text-align:center; margin-bottom:5px;">${gymName}</h2>
      <p style="text-align:center; margin-bottom:20px;">Staff Login</p>
      <form onsubmit="doLogin(event)">
        <label>Email</label><input name="email" type="email" required>
        <label>Password</label><input name="password" type="password" required>
        <button type="submit" class="btn-primary" style="width:100%">Access Dashboard</button>
      </form>
    </div>
    <script>
      async function doLogin(e) {
        e.preventDefault();
        const res = await fetch('/api/login', { method:'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
        if(res.ok) window.location.href = '/dashboard';
        else alert('Invalid Credentials');
      }
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any): Response {
  const html = `${baseHead("Dashboard")}
  <body>
    <div class="mobile-overlay" onclick="app.toggleSidebar()"></div>

    <aside class="sidebar">
      <div class="logo">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        GymOS
      </div>
      <ul class="nav-links">
        <li class="nav-item active" onclick="app.nav('dashboard')">📊 Dashboard</li>
        <li class="nav-item" onclick="app.nav('members')">👥 Members</li>
        <li class="nav-item" onclick="app.nav('attendance')">⏰ Attendance</li>
        ${user.role === 'owner' ? `<li class="nav-item" onclick="app.nav('finance')">💰 Revenue</li>` : ''}
      </ul>
      <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="font-weight:bold;">${user.name}</div>
        <div class="text-sm" style="opacity:0.7">${user.role.toUpperCase()}</div>
        <a href="/api/logout" style="color: #fda4af; text-decoration:none; font-size:12px; display:block; margin-top:10px;">Sign Out</a>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-bar">
        <div class="flex">
          <button class="btn-outline btn-sm" onclick="app.toggleSidebar()" style="padding:8px;">☰</button>
          <h3 style="margin:0;">Dashboard</h3>
        </div>
        <div class="flex">
          <button class="btn-primary" onclick="app.openCheckIn()">⚡ Quick Check-In</button>
        </div>
      </header>

      <div class="container">
        <div id="loading" style="text-align:center; padding:50px;">Loading System Data...</div>
        
        <div id="view-dashboard" class="view hidden">
          <div class="grid-stats">
            <div class="stat-card">
              <div class="stat-label">Active Members</div>
              <div class="stat-value" id="stat-active">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Check-ins Today</div>
              <div class="stat-value" id="stat-today">0</div>
            </div>
            ${user.role === 'owner' ? `
            <div class="stat-card">
              <div class="stat-label">Revenue (30d)</div>
              <div class="stat-value" style="color:var(--success)">$<span id="stat-revenue">0</span></div>
            </div>` : ''}
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recent Activity</h3>
            </div>
            <table id="dash-table">
              <thead><tr><th>Time</th><th>Member</th><th>Status</th></tr></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>

        <div id="view-members" class="view hidden">
          <div class="card-header">
            <input type="text" id="search-member" placeholder="Search members..." style="max-width:300px; margin:0;" onkeyup="app.filterMembers()">
            <button class="btn-primary" onclick="app.modals.member.open()">+ Add Member</button>
          </div>
          <div class="card" style="padding:0; overflow:hidden;">
            <div class="table-container">
              <table id="table-members">
                <thead><tr><th>Name</th><th>Phone</th><th>Plan</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>

        <div id="view-attendance" class="view hidden">
          <div class="card">
            <h3 class="card-title" style="margin-bottom:15px;">Live Attendance Log</h3>
            <div class="table-container">
              <table id="table-attendance-full">
                <thead><tr><th>Time</th><th>Member ID</th><th>Name</th><th>Status</th></tr></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div id="modal-member" class="modal-backdrop">
      <div class="modal-content">
        <h3>New Member</h3>
        <form onsubmit="app.actions.addMember(event)">
          <input name="name" required placeholder="Full Name">
          <div class="flex">
            <input name="phone" placeholder="Phone Number">
            <select name="gender" style="width:120px"><option value="m">Male</option><option value="f">Female</option></select>
          </div>
          <select name="planId" id="select-plans"><option value="">Select Plan...</option></select>
          <input name="notes" placeholder="Notes (Health issues, etc)">
          <div class="flex" style="justify-content:flex-end; margin-top:20px;">
            <button type="button" class="btn-outline" onclick="app.modals.member.close()">Cancel</button>
            <button type="submit" class="btn-primary">Create Member</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-payment" class="modal-backdrop">
      <div class="modal-content">
        <h3>Record Payment</h3>
        <p id="pay-name" class="text-sm" style="margin-bottom:15px;"></p>
        <form onsubmit="app.actions.addPayment(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <label>Amount Received</label>
          <input name="amount" type="number" required placeholder="0.00">
          <label>Extend Membership By</label>
          <select name="extendMonths">
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">1 Year</option>
          </select>
          <div class="flex" style="justify-content:flex-end; margin-top:20px;">
            <button type="button" class="btn-outline" onclick="app.modals.payment.close()">Cancel</button>
            <button type="submit" class="btn-primary">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="text-align:center">Quick Check-In</h3>
        <input id="checkin-search" placeholder="Type member name or ID..." style="font-size:18px; padding:15px; margin-top:10px;" autofocus>
        <div id="checkin-results" style="margin-top:10px; max-height:200px; overflow-y:auto; border:1px solid var(--border); border-radius:8px; display:none;"></div>
      </div>
    </div>

    <div class="toast-container" id="toasts"></div>

    <script>
      /* --- FRONTEND APPLICATION LOGIC --- */
      const app = {
        state: { members: [], attendance: [], plans: [], stats: {} },
        userRole: "${user.role}",

        // Init
        init: async () => {
          const res = await fetch('/api/bootstrap');
          if (!res.ok) window.location.href = '/';
          app.state = await res.json();
          document.getElementById('loading').classList.add('hidden');
          app.renderAll();
          app.nav('dashboard');
        },

        // Navigation
        nav: (view) => {
          document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
          document.getElementById('view-' + view).classList.remove('hidden');
          // Update Sidebar Active State
          document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
          // (Simple logic for sidebar highlight)
          if(view === 'dashboard') document.querySelectorAll('.nav-item')[0].classList.add('active');
          if(view === 'members') document.querySelectorAll('.nav-item')[1].classList.add('active');
          if(view === 'attendance') document.querySelectorAll('.nav-item')[2].classList.add('active');
          if(view === 'finance') document.querySelectorAll('.nav-item')[3]?.classList.add('active');
          
          if(window.innerWidth < 768) document.querySelector('.sidebar').classList.remove('open'); // close mobile menu
        },
        
        toggleSidebar: () => {
          document.querySelector('.sidebar').classList.toggle('open');
          document.querySelector('.mobile-overlay').classList.toggle('open');
        },

        // Renderers
        renderAll: () => {
          app.renderStats();
          app.renderMembersTable();
          app.renderAttendanceTables();
          app.renderPlanOptions();
        },

        renderStats: () => {
          document.getElementById('stat-active').textContent = app.state.stats.active_members;
          document.getElementById('stat-today').textContent = app.state.stats.today_checkins;
          if(document.getElementById('stat-revenue')) 
            document.getElementById('stat-revenue').textContent = app.state.stats.revenue || 0;
        },

        renderMembersTable: () => {
          const tbody = document.querySelector('#table-members tbody');
          tbody.innerHTML = '';
          app.state.members.forEach(m => {
            const isExpired = m.expiry_date && new Date(m.expiry_date) < new Date();
            const statusBadge = isExpired 
              ? '<span class="badge red">Expired</span>' 
              : '<span class="badge green">Active</span>';
            
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td>
                <div class="flex">
                  <div class="avatar">\${m.full_name.substring(0,2).toUpperCase()}</div>
                  <div>
                    <div style="font-weight:600">\${m.full_name}</div>
                    <div class="text-sm">ID: \${m.id}</div>
                  </div>
                </div>
              </td>
              <td>\${m.phone || '-'}</td>
              <td>\${m.plan_name || 'None'}</td>
              <td>\${m.expiry_date ? m.expiry_date.split('T')[0] : '-'}</td>
              <td>\${statusBadge}</td>
              <td>
                <button class="btn-primary btn-sm" onclick="app.modals.payment.open(\${m.id})">Pay</button>
                \${app.userRole === 'owner' ? \`<button class="btn-danger btn-sm" onclick="app.actions.deleteMember(\${m.id})">Del</button>\` : ''}
              </td>
            \`;
            tbody.appendChild(tr);
          });
        },

        renderAttendanceTables: () => {
          // We have two tables: Dashboard (short) and Full View
          const rows = app.state.attendance.map(a => {
            const time = new Date(a.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const badge = a.status === 'success' ? '<span class="badge green">OK</span>' : '<span class="badge red">Expired</span>';
            return \`
              <tr>
                <td>\${time}</td>
                <td>#\${a.member_id}</td>
                <td><strong>\${a.full_name}</strong></td>
                <td>\${badge}</td>
              </tr>
            \`;
          });
          
          document.querySelector('#dash-table tbody').innerHTML = rows.slice(0, 5).join('');
          document.querySelector('#table-attendance-full tbody').innerHTML = rows.join('');
        },

        renderPlanOptions: () => {
          const sel = document.getElementById('select-plans');
          sel.innerHTML = '<option value="">Select Plan...</option>';
          app.state.plans.forEach(p => {
            sel.innerHTML += \`<option value="\${p.id}">\${p.name} - $\${p.price}</option>\`;
          });
        },

        filterMembers: () => {
          const q = document.getElementById('search-member').value.toLowerCase();
          const rows = document.querySelectorAll('#table-members tbody tr');
          rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
          });
        },

        /* --- ACTIONS & LOGIC --- */
        actions: {
          addMember: async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('/api/member/add', { method:'POST', body: JSON.stringify(data) });
            if(res.ok) {
              const json = await res.json();
              app.state.members.unshift(json.member);
              app.state.stats.active_members++;
              app.renderAll();
              app.modals.member.close();
              app.toast('Member Added Successfully');
            }
          },
          
          deleteMember: async (id) => {
            if(!confirm('Are you sure? This cannot be undone.')) return;
            const res = await fetch('/api/member/delete', { method:'POST', body: JSON.stringify({id}) });
            if(res.ok) {
              app.state.members = app.state.members.filter(m => m.id !== id);
              app.renderMembersTable();
              app.toast('Member Deleted');
            }
          },

          addPayment: async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('/api/payment/add', { method:'POST', body: JSON.stringify(data) });
            if(res.ok) {
              const json = await res.json();
              // Update local state expiry
              const m = app.state.members.find(x => x.id == data.memberId);
              if(m) m.expiry_date = json.new_expiry;
              
              if(app.state.stats.revenue !== undefined) 
                app.state.stats.revenue += parseInt(data.amount);
              
              app.renderAll();
              app.modals.payment.close();
              app.toast('Payment Recorded & Membership Extended');
            }
          },

          checkIn: async (id) => {
            const res = await fetch('/api/checkin', { method:'POST', body: JSON.stringify({memberId: id}) });
            const json = await res.json();
            
            if(res.ok) {
              // *** LIVE UPDATE LOGIC ***
              // Add to local state immediately so UI updates without reload
              app.state.attendance.unshift(json.entry);
              app.state.stats.today_checkins++;
              app.renderStats();
              app.renderAttendanceTables();
              
              app.modals.checkin.close();
              if(json.entry.status === 'rejected') app.toast(json.message, 'error');
              else app.toast(\`Checked In: \${json.entry.full_name}\`);
            } else {
              app.toast(json.error, 'error');
            }
          }
        },

        /* --- MODALS & UTILS --- */
        modals: {
          member: {
             open: () => document.getElementById('modal-member').style.display = 'grid',
             close: () => document.getElementById('modal-member').style.display = 'none'
          },
          payment: {
            open: (id) => {
              const m = app.state.members.find(x => x.id === id);
              document.getElementById('pay-id').value = id;
              document.getElementById('pay-name').textContent = 'Member: ' + m.full_name;
              document.getElementById('modal-payment').style.display = 'grid';
            },
            close: () => document.getElementById('modal-payment').style.display = 'none'
          },
          checkin: {
            close: () => document.getElementById('modal-checkin').style.display = 'none'
          }
        },

        openCheckIn: () => {
          const m = document.getElementById('modal-checkin');
          m.style.display = 'grid';
          const input = document.getElementById('checkin-search');
          input.value = '';
          input.focus();
          document.getElementById('checkin-results').style.display = 'none';
        },

        toast: (msg, type='success') => {
          const t = document.createElement('div');
          t.className = 'toast';
          t.style.borderLeft = type === 'error' ? '4px solid var(--danger)' : '4px solid var(--success)';
          t.innerHTML = \`<span>\${type==='error'?'⚠️':'✅'}</span> \${msg}\`;
          document.getElementById('toasts').appendChild(t);
          setTimeout(() => t.remove(), 3000);
        }
      };

      // Check-in Search Logic
      document.getElementById('checkin-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const resBox = document.getElementById('checkin-results');
        resBox.innerHTML = '';
        if(q.length < 1) { resBox.style.display = 'none'; return; }
        
        const matches = app.state.members.filter(m => 
          m.full_name.toLowerCase().includes(q) || m.id.toString() === q
        ).slice(0, 5);

        if(matches.length > 0) {
          resBox.style.display = 'block';
          matches.forEach(m => {
            const div = document.createElement('div');
            div.style.padding = '10px';
            div.style.borderBottom = '1px solid #eee';
            div.style.cursor = 'pointer';
            div.innerHTML = \`<b>\${m.full_name}</b> <span class="text-sm">#\${m.id}</span>\`;
            div.onmouseover = () => div.style.background = '#f1f5f9';
            div.onmouseout = () => div.style.background = 'white';
            div.onclick = () => app.actions.checkIn(m.id);
            resBox.appendChild(div);
          });
        } else {
          resBox.style.display = 'none';
        }
      });

      // Init App
      app.init();
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}
