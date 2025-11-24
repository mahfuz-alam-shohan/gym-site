export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
}

/* ========================================================================
   1. SHARED UTILITIES & TYPES
   ======================================================================== */

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Helper to standardise API responses
function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper to verify passwords
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
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --primary-soft: #eff6ff;
      --bg-body: #f8fafc;
      --bg-card: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --danger: #ef4444;
      --success: #22c55e;
      --warning: #f59e0b;
      --radius: 12px;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body {
      margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg-body); color: var(--text-main); font-size: 14px; line-height: 1.5;
      padding-bottom: 80px; /* Space for mobile nav */
    }

    /* Layout */
    .container { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .card { background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; margin-bottom: 16px; border: 1px solid var(--border); }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .flex { display: flex; align-items: center; gap: 10px; }
    .flex-col { display: flex; flex-direction: column; gap: 10px; }
    .justify-between { justify-content: space-between; }
    .hidden { display: none !important; }

    /* Typography */
    h1, h2, h3 { margin: 0 0 10px 0; letter-spacing: -0.025em; }
    h1 { font-size: 24px; font-weight: 800; color: var(--text-main); }
    h2 { font-size: 18px; font-weight: 600; }
    p { margin: 0 0 10px 0; color: var(--text-muted); }
    .text-sm { font-size: 12px; }
    .text-danger { color: var(--danger); }

    /* Forms */
    label { display: block; font-weight: 600; margin-bottom: 4px; font-size: 13px; color: var(--text-main); }
    input, select, textarea {
      width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border);
      background: #fff; font-size: 15px; transition: border-color 0.15s; appearance: none;
    }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

    /* Buttons */
    button {
      cursor: pointer; border: none; font-weight: 600; border-radius: 8px; padding: 10px 16px;
      font-size: 14px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-secondary { background: white; border: 1px solid var(--border); color: var(--text-main); }
    .btn-danger { background: #fee2e2; color: var(--danger); }
    .btn-ghost { background: transparent; color: var(--text-muted); padding: 6px 10px; }
    button:disabled { opacity: 0.7; cursor: not-allowed; }

    /* Components */
    .badge {
      padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase;
    }
    .badge.green { background: #dcfce7; color: #15803d; }
    .badge.red { background: #fee2e2; color: #b91c1c; }
    .badge.blue { background: #dbeafe; color: #1d4ed8; }

    .avatar {
      width: 40px; height: 40px; border-radius: 10px; background: var(--border); object-fit: cover;
      display: flex; align-items: center; justify-content: center; font-weight: bold; color: var(--text-muted);
    }

    /* Navigation */
    .navbar {
      position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid var(--border);
      display: flex; justify-content: space-around; padding: 10px 0; padding-bottom: max(10px, env(safe-area-inset-bottom));
      z-index: 50; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--text-muted);
      font-size: 10px; font-weight: 600; text-decoration: none; padding: 4px 12px; border-radius: 8px;
    }
    .nav-item svg { width: 24px; height: 24px; }
    .nav-item.active { color: var(--primary); background: var(--primary-soft); }

    /* Desktop Sidebar Override */
    @media (min-width: 768px) {
      body { padding-left: 240px; padding-bottom: 0; }
      .navbar {
        top: 0; left: 0; bottom: 0; right: auto; width: 240px; flex-direction: column;
        justify-content: flex-start; border-top: none; border-right: 1px solid var(--border);
        padding: 20px 12px; gap: 8px;
      }
      .nav-item { flex-direction: row; font-size: 14px; padding: 12px; width: 100%; }
      .nav-logo { margin-bottom: 24px; padding-left: 12px; }
    }

    /* Utils */
    .toast-container { position: fixed; top: 16px; right: 16px; z-index: 100; display: flex; flex-direction: column; gap: 8px; }
    .toast { background: #1e293b; color: white; padding: 12px 16px; border-radius: 8px; font-size: 13px; animation: slideIn 0.3s ease; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* Table */
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; color: var(--text-muted); font-weight: 600; padding: 12px; border-bottom: 1px solid var(--border); }
    td { padding: 12px; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
  </style>
</head>`;
}

/* ========================================================================
   3. DATABASE SETUP & SCHEMA
   ======================================================================== */

async function setupDatabase(env: Env) {
  const statements = [
    // Gyms
    `CREATE TABLE IF NOT EXISTS gyms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'mixed',
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    // Accounts (Staff/Admin)
    `CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'owner', 'manager', 'worker')),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
    )`,
    // Membership Plans
    `CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      billing TEXT NOT NULL, 
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE
    )`,
    // Members
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      plan_id INTEGER,
      full_name TEXT NOT NULL,
      phone TEXT,
      status TEXT DEFAULT 'active',
      due_date TEXT, 
      avatar_url TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
    )`,
    // Attendance
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      check_in TEXT NOT NULL,
      status TEXT DEFAULT 'present',
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )`,
    // Payments
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gym_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      date TEXT DEFAULT (datetime('now')),
      note TEXT,
      FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )`,
    // Sessions
    `CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      account_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )`
  ];

  // Enable FKs for this connection
  await env.DB.prepare("PRAGMA foreign_keys = ON").run();

  // Run schema creation
  for (const stmt of statements) {
    await env.DB.prepare(stmt).run();
  }
}

/* ========================================================================
   4. WORKER HANDLER (ROUTER)
   ======================================================================== */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    await setupDatabase(env); // Ensure DB exists

    // 4.1. PUBLIC ROUTES
    if (url.pathname === "/" && request.method === "GET") {
      const gymCount = await env.DB.prepare("SELECT COUNT(*) as c FROM gyms").first<any>();
      if (!gymCount || gymCount.c === 0) return renderSetup();
      
      const session = await getSession(request, env);
      if (session) return Response.redirect(url.origin + "/dashboard", 302);
      return renderLogin();
    }

    if (url.pathname === "/api/setup" && request.method === "POST") return handleSetup(request, env);
    if (url.pathname === "/api/login" && request.method === "POST") return handleLogin(request, env);
    
    // 4.2. STATIC ASSETS (Avatars)
    if (url.pathname.startsWith("/media/") && request.method === "GET") {
      if (!env.BUCKET) return new Response("No storage", { status: 404 });
      const key = url.pathname.replace("/media/", "");
      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      return new Response(obj.body, { headers: { "Content-Type": obj.httpMetadata?.contentType || "image/jpeg" } });
    }

    // 4.3. PROTECTED ROUTES (Middleware)
    const session = await getSession(request, env);
    if (!session) {
      if (url.pathname.startsWith("/api/")) return json({ error: "Unauthorized" }, 401);
      return Response.redirect(url.origin + "/", 302);
    }

    // 4.4. APP ROUTES
    if (url.pathname === "/dashboard") return renderDashboard(session);
    if (url.pathname === "/api/logout") return handleLogout(env, session.token);

    // 4.5. API ROUTES (Data)
    try {
      if (url.pathname === "/api/bootstrap") return handleBootstrap(env, session);
      if (url.pathname === "/api/member/add") return handleAddMember(request, env, session);
      if (url.pathname === "/api/member/delete") return handleDeleteMember(request, env, session);
      if (url.pathname === "/api/attendance/checkin") return handleCheckIn(request, env, session);
      if (url.pathname === "/api/payment/add") return handleAddPayment(request, env, session);
      if (url.pathname === "/api/plan/add") return handleAddPlan(request, env, session);
      if (url.pathname === "/api/staff/add") return handleAddStaff(request, env, session);
    } catch (e: any) {
      return json({ error: e.message || "Server Error" }, 500);
    }

    return new Response("Not Found", { status: 404 });
  }
};

/* ========================================================================
   5. BACKEND CONTROLLERS
   ======================================================================== */

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  const match = cookie.match(/gym_token=([^;]+)/);
  if (!match) return null;
  const token = match[1];

  const session = await env.DB.prepare(`
    SELECT s.token, a.id, a.gym_id, a.role, a.name, a.email 
    FROM sessions s 
    JOIN accounts a ON s.account_id = a.id 
    WHERE s.token = ?
  `).bind(token).first<any>();

  if (!session) return null;
  return session;
}

async function handleSetup(req: Request, env: Env) {
  const body: any = await req.json();
  const { gymName, adminName, adminEmail, adminPass } = body;

  try {
    // 1. Create Gym - Use RETURNING to get ID reliably
    const gym = await env.DB.prepare("INSERT INTO gyms (name) VALUES (?) RETURNING id").bind(gymName).first<any>();
    
    // 2. Create Admin
    const passHash = await hashPassword(adminPass);
    const acc = await env.DB.prepare(
      "INSERT INTO accounts (gym_id, role, name, email, password_hash) VALUES (?, 'admin', ?, ?, ?) RETURNING id"
    ).bind(gym.id, adminName, adminEmail, passHash).first<any>();

    // 3. Create Session
    const token = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)")
      .bind(token, acc.id, new Date(Date.now() + 86400000 * 30).toISOString()).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Set-Cookie": `gym_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`
      }
    });
  } catch (e: any) {
    return json({ error: "Setup failed: " + e.message }, 500);
  }
}

async function handleLogin(req: Request, env: Env) {
  const { email, password } = await req.json() as any;
  const acc = await env.DB.prepare("SELECT * FROM accounts WHERE email = ?").bind(email).first<any>();
  
  if (!acc || !(await verifyPassword(password, acc.password_hash))) {
    return json({ error: "Invalid credentials" }, 401);
  }

  const token = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, acc.id, new Date(Date.now() + 86400000 * 30).toISOString()).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Set-Cookie": `gym_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000` }
  });
}

async function handleLogout(env: Env, token: string) {
  await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return new Response(null, {
    status: 302,
    headers: { "Location": "/", "Set-Cookie": "gym_token=; Max-Age=0; Path=/" }
  });
}

// Loads all initial data for the dashboard
async function handleBootstrap(env: Env, session: any) {
  const { gym_id } = session;
  
  // Parallel fetch for speed
  const [members, plans, attendance, stats] = await Promise.all([
    env.DB.prepare(`
      SELECT m.*, p.name as plan_name, p.price as plan_price
      FROM members m LEFT JOIN plans p ON m.plan_id = p.id 
      WHERE m.gym_id = ? ORDER BY m.full_name ASC
    `).bind(gym_id).all(),
    env.DB.prepare("SELECT * FROM plans WHERE gym_id = ?").bind(gym_id).all(),
    env.DB.prepare(`
      SELECT a.*, m.full_name, m.avatar_url 
      FROM attendance a JOIN members m ON a.member_id = m.id 
      WHERE a.gym_id = ? ORDER BY a.check_in DESC LIMIT 50
    `).bind(gym_id).all(),
    env.DB.prepare(`
      SELECT 
        (SELECT count(*) FROM members WHERE gym_id = ?) as member_count,
        (SELECT count(*) FROM attendance WHERE gym_id = ? AND date(check_in) = date('now')) as today_count
    `).bind(gym_id, gym_id).first()
  ]);

  return json({
    user: session,
    members: members.results,
    plans: plans.results,
    attendance: attendance.results,
    stats: stats
  });
}

async function handleAddMember(req: Request, env: Env, session: any) {
  const fd = await req.json() as any;
  
  let avatarUrl = null;
  // Handle basic base64 image upload if provided
  if (fd.photoData && env.BUCKET) {
    const bin = Uint8Array.from(atob(fd.photoData.split(',')[1]), c => c.charCodeAt(0));
    const key = `avatars/${crypto.randomUUID()}.jpg`;
    await env.BUCKET.put(key, bin, { httpMetadata: { contentType: 'image/jpeg' }});
    avatarUrl = key;
  }

  // Use RETURNING to get the new member immediately
  const newMember = await env.DB.prepare(`
    INSERT INTO members (gym_id, full_name, phone, plan_id, avatar_url, due_date)
    VALUES (?, ?, ?, ?, ?, date('now')) RETURNING *
  `).bind(session.gym_id, fd.name, fd.phone, fd.planId || null, avatarUrl).first();

  return json({ success: true, member: newMember });
}

async function handleCheckIn(req: Request, env: Env, session: any) {
  const { memberId } = await req.json() as any;
  
  // Record attendance
  const entry = await env.DB.prepare(`
    INSERT INTO attendance (gym_id, member_id, check_in)
    VALUES (?, ?, datetime('now', 'localtime')) RETURNING *
  `).bind(session.gym_id, memberId).first<any>();

  // Fetch enriched data to return to UI
  const details = await env.DB.prepare("SELECT full_name, avatar_url FROM members WHERE id = ?").bind(memberId).first<any>();

  return json({ success: true, entry: { ...entry, ...details } });
}

async function handleDeleteMember(req: Request, env: Env, session: any) {
  if (session.role !== 'admin' && session.role !== 'owner') return json({ error: "Forbidden" }, 403);
  const { id } = await req.json() as any;
  await env.DB.prepare("DELETE FROM members WHERE id = ? AND gym_id = ?").bind(id, session.gym_id).run();
  return json({ success: true });
}

async function handleAddPayment(req: Request, env: Env, session: any) {
  const { memberId, amount, months } = await req.json() as any;
  
  // 1. Record payment
  await env.DB.prepare("INSERT INTO payments (gym_id, member_id, amount) VALUES (?, ?, ?)")
    .bind(session.gym_id, memberId, amount).run();

  // 2. Extend due date
  // Logic: If due_date is in past, set to NOW + X months. If future, add X months to it.
  const member = await env.DB.prepare("SELECT due_date FROM members WHERE id = ?").bind(memberId).first<any>();
  let baseDate = new Date();
  const currentDue = new Date(member.due_date);
  
  if (currentDue > baseDate) baseDate = currentDue; // Extend from future date
  
  baseDate.setMonth(baseDate.getMonth() + parseInt(months));
  const newDueStr = baseDate.toISOString().split('T')[0];

  await env.DB.prepare("UPDATE members SET due_date = ?, status = 'active' WHERE id = ?")
    .bind(newDueStr, memberId).run();

  return json({ success: true, new_due_date: newDueStr });
}

async function handleAddPlan(req: Request, env: Env, session: any) {
  const { name, price } = await req.json() as any;
  const plan = await env.DB.prepare("INSERT INTO plans (gym_id, name, price, billing) VALUES (?, ?, ?, 'monthly') RETURNING *")
    .bind(session.gym_id, name, price).first();
  return json({ success: true, plan });
}

async function handleAddStaff(req: Request, env: Env, session: any) {
  if (session.role !== 'admin' && session.role !== 'owner') return json({ error: "Forbidden" }, 403);
  const { name, email, password, role } = await req.json() as any;
  const hash = await hashPassword(password);
  
  await env.DB.prepare("INSERT INTO accounts (gym_id, name, email, role, password_hash) VALUES (?, ?, ?, ?, ?)")
    .bind(session.gym_id, name, email, role, hash).run();
  
  return json({ success: true });
}

/* ========================================================================
   6. FRONTEND PAGES (Single File Generators)
   ======================================================================== */

function renderSetup(): Response {
  const html = `${baseHead("Gym Setup")}
  <body class="flex" style="justify-content: center; min-height: 100vh; background: #eff6ff;">
    <div class="card" style="width: 100%; max-width: 400px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 40px;">🏋️</div>
        <h1>Welcome</h1>
        <p>Let's set up your gym system.</p>
      </div>
      <form id="setupForm" class="flex-col">
        <div><label>Gym Name</label><input name="gymName" required placeholder="My Fitness Center"></div>
        <div><label>Admin Name</label><input name="adminName" required placeholder="Your Name"></div>
        <div><label>Admin Email</label><input name="adminEmail" type="email" required placeholder="admin@gym.com"></div>
        <div><label>Password</label><input name="adminPass" type="password" required></div>
        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 10px;">Create Gym &rarr;</button>
      </form>
    </div>
    <script>
      document.getElementById('setupForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.textContent = 'Creating...'; btn.disabled = true;
        const body = Object.fromEntries(new FormData(e.target));
        const res = await fetch('/api/setup', { method: 'POST', body: JSON.stringify(body) });
        if(res.ok) window.location.href = '/dashboard';
        else { alert('Error creating gym'); btn.disabled = false; btn.textContent = 'Try Again'; }
      };
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(): Response {
  const html = `${baseHead("Login")}
  <body class="flex" style="justify-content: center; min-height: 100vh; background: #f8fafc;">
    <div class="card" style="width: 100%; max-width: 360px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: var(--primary);">Gym Login</h1>
        <p>Sign in to manage your center</p>
      </div>
      <form id="loginForm" class="flex-col">
        <div><label>Email</label><input name="email" type="email" required></div>
        <div><label>Password</label><input name="password" type="password" required></div>
        <button type="submit" class="btn-primary" style="width: 100%; margin-top: 10px;">Sign In</button>
        <p id="error" class="text-danger text-sm" style="text-align: center; display:none;">Invalid credentials</p>
      </form>
    </div>
    <script>
      document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const body = Object.fromEntries(new FormData(e.target));
        const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(body) });
        if(res.ok) window.location.href = '/dashboard';
        else document.getElementById('error').style.display = 'block';
      };
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(session: any): Response {
  const html = `${baseHead("Dashboard")}
  <body>
    <nav class="navbar">
      <div class="nav-logo hidden" style="display:block; font-weight:800; font-size:18px; color:var(--primary);">
        FitManager <span style="font-size:10px; color:#64748b; display:block; font-weight:400;">${session.name}</span>
      </div>
      <a href="#" class="nav-item active" onclick="app.nav('home')">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        Home
      </a>
      <a href="#" class="nav-item" onclick="app.nav('members')">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        Members
      </a>
      <a href="#" class="nav-item" onclick="app.nav('checkin')">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Check-In
      </a>
      <a href="/api/logout" class="nav-item" style="color:var(--danger)">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        Logout
      </a>
    </nav>

    <div class="container">
      <div id="loading" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading Gym Data...</div>
      
      <div id="view-home" class="view hidden">
        <div class="grid">
          <div class="card">
            <h2>Active Members</h2>
            <div class="flex" style="align-items: baseline;">
              <span id="stat-members" style="font-size: 32px; font-weight: 800;">-</span>
              <span class="text-sm">total</span>
            </div>
          </div>
          <div class="card">
            <h2>Today's Attendance</h2>
            <div class="flex" style="align-items: baseline;">
              <span id="stat-today" style="font-size: 32px; font-weight: 800; color: var(--success);">-</span>
              <span class="text-sm">check-ins</span>
            </div>
          </div>
        </div>

        <h3>Latest Activity</h3>
        <div class="card" style="padding: 0;">
          <table id="table-attendance">
            <tbody></tbody>
          </table>
        </div>
      </div>

      <div id="view-members" class="view hidden">
        <div class="flex justify-between" style="margin-bottom: 16px;">
          <h1>Members</h1>
          <button class="btn-primary" onclick="app.modals.addMember.open()">+ Add New</button>
        </div>
        <input type="text" id="search-members" placeholder="Search by name or phone..." onkeyup="app.renderMembers()" style="margin-bottom: 16px;">
        <div class="grid" id="grid-members"></div>
      </div>

      <div id="view-checkin" class="view hidden">
        <div class="card" style="max-width: 500px; margin: 0 auto; text-align: center;">
          <h1>Quick Check-In</h1>
          <p>Select a member to mark them as present.</p>
          <input id="checkin-search" placeholder="Type member name..." style="font-size: 18px; padding: 16px; margin-bottom: 16px;">
          <div id="checkin-results" class="flex-col" style="text-align: left;"></div>
        </div>
      </div>

    </div>

    <div id="modal-add-member" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="card" style="width: 100%; max-width: 400px;">
        <h2>New Member</h2>
        <form onsubmit="app.actions.addMember(event)" class="flex-col">
          <input name="name" required placeholder="Full Name">
          <input name="phone" required placeholder="Phone Number">
          <select name="planId" id="select-plan-add"><option value="">No Plan</option></select>
          <label class="btn-secondary" style="justify-content: flex-start;">
            📷 Upload Photo <input type="file" name="photo" accept="image/*" hidden onchange="this.previousElementSibling.textContent = '✅ Photo Selected'">
          </label>
          <div class="flex" style="margin-top: 10px;">
            <button type="button" class="btn-secondary" style="flex:1" onclick="app.modals.addMember.close()">Cancel</button>
            <button type="submit" class="btn-primary" style="flex:1">Save</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-payment" class="hidden" style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div class="card" style="width: 100%; max-width: 400px;">
        <h2>Record Payment</h2>
        <p id="pay-member-name"></p>
        <form onsubmit="app.actions.addPayment(event)" class="flex-col">
          <input type="hidden" name="memberId" id="pay-member-id">
          <input name="amount" type="number" required placeholder="Amount Paid">
          <select name="months" required>
            <option value="1">1 Month</option>
            <option value="3">3 Months</option>
            <option value="6">6 Months</option>
            <option value="12">1 Year</option>
          </select>
          <div class="flex" style="margin-top: 10px;">
            <button type="button" class="btn-secondary" style="flex:1" onclick="document.getElementById('modal-payment').style.display='none'">Cancel</button>
            <button type="submit" class="btn-primary" style="flex:1">Confirm</button>
          </div>
        </form>
      </div>
    </div>

    <div class="toast-container" id="toast-area"></div>

    <script>
      const app = {
        data: { members: [], attendance: [], plans: [], stats: {} },
        
        init: async () => {
          const res = await fetch('/api/bootstrap');
          if (!res.ok) return window.location.href = '/'; // kick to login
          const json = await res.json();
          app.data = json;
          document.getElementById('loading').classList.add('hidden');
          app.renderAll();
          app.nav('home');
        },

        nav: (viewName) => {
          document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
          document.getElementById('view-' + viewName).classList.remove('hidden');
          document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
          // Simple active state logic
          const map = { 'home':0, 'members':1, 'checkin':2 };
          if(document.querySelectorAll('.nav-item')[map[viewName]]) 
            document.querySelectorAll('.nav-item')[map[viewName]].classList.add('active');
        },

        toast: (msg, type = 'success') => {
          const el = document.createElement('div');
          el.className = 'toast';
          el.textContent = (type === 'success' ? '✅ ' : '⚠️ ') + msg;
          document.getElementById('toast-area').appendChild(el);
          setTimeout(() => el.remove(), 3000);
        },

        renderAll: () => {
          app.renderStats();
          app.renderAttendanceTable();
          app.renderMembers();
          app.renderPlanSelect();
        },

        renderStats: () => {
          document.getElementById('stat-members').textContent = app.data.stats.member_count || 0;
          document.getElementById('stat-today').textContent = app.data.stats.today_count || 0;
        },

        renderAttendanceTable: () => {
          const tbody = document.querySelector('#table-attendance tbody');
          tbody.innerHTML = app.data.attendance.length ? '' : '<tr><td colspan="3" style="text-align:center">No records today</td></tr>';
          
          app.data.attendance.forEach(row => {
            const time = new Date(row.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const tr = document.createElement('tr');
            tr.innerHTML = \`
              <td width="50"><img src="\${row.avatar_url ? '/media/'+row.avatar_url : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ddd%22/><text x=%2250%22 y=%2250%22 dy=%22.35em%22 text-anchor=%22middle%22 font-size=%2240%22>👤</text></svg>'}" class="avatar"></td>
              <td><strong>\${row.full_name}</strong><br><span class="text-sm">\${time}</span></td>
              <td style="text-align:right"><span class="badge green">Present</span></td>
            \`;
            tbody.appendChild(tr);
          });
        },

        renderMembers: () => {
          const q = document.getElementById('search-members').value.toLowerCase();
          const grid = document.getElementById('grid-members');
          grid.innerHTML = '';
          
          const filtered = app.data.members.filter(m => m.full_name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q)));
          
          filtered.forEach(m => {
            const isDue = new Date(m.due_date) < new Date();
            const planName = m.plan_name || 'No Plan';
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = \`
              <div class="flex justify-between">
                <div class="flex">
                  <img src="\${m.avatar_url ? '/media/'+m.avatar_url : 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22%23ddd%22/><text x=%2250%22 y=%2250%22 dy=%22.35em%22 text-anchor=%22middle%22 font-size=%2240%22>👤</text></svg>'}" class="avatar">
                  <div>
                    <div style="font-weight:700">\${m.full_name}</div>
                    <div class="text-sm">\${m.phone || 'No Phone'}</div>
                  </div>
                </div>
                <div class="badge \${isDue ? 'red' : 'green'}">\${isDue ? 'DUE' : 'PAID'}</div>
              </div>
              <div style="margin-top:10px; font-size:12px; color:var(--text-muted);">
                Plan: <strong>\${planName}</strong><br>
                Due: \${m.due_date || 'N/A'}
              </div>
              <div class="flex" style="margin-top:12px;">
                <button class="btn-secondary" style="flex:1; font-size:12px" onclick="app.modals.payment.open(\${m.id})">💰 Pay</button>
                <button class="btn-danger" style="width:auto" onclick="app.actions.deleteMember(\${m.id})">🗑️</button>
              </div>
            \`;
            grid.appendChild(card);
          });
        },

        renderPlanSelect: () => {
          const sel = document.getElementById('select-plan-add');
          sel.innerHTML = '<option value="">Select a Plan...</option>';
          app.data.plans.forEach(p => {
            sel.innerHTML += \`<option value="\${p.id}">\${p.name} - \${p.price}</option>\`;
          });
        },

        modals: {
          addMember: {
            open: () => document.getElementById('modal-add-member').style.display = 'flex',
            close: () => document.getElementById('modal-add-member').style.display = 'none'
          },
          payment: {
            open: (id) => {
              const m = app.data.members.find(x => x.id === id);
              if(!m) return;
              document.getElementById('pay-member-id').value = id;
              document.getElementById('pay-member-name').textContent = 'For: ' + m.full_name;
              document.getElementById('modal-payment').style.display = 'flex';
            }
          }
        },

        actions: {
          addMember: async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.textContent = 'Saving...'; btn.disabled = true;

            const fd = new FormData(e.target);
            const data = Object.fromEntries(fd);
            
            // Handle Photo Base64
            const file = fd.get('photo');
            if (file && file.size > 0) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = async () => {
                data.photoData = reader.result; 
                app.actions._submitMember(data);
              }
            } else {
              app.actions._submitMember(data);
            }
          },

          _submitMember: async (data) => {
            const res = await fetch('/api/member/add', { method: 'POST', body: JSON.stringify(data) });
            if (res.ok) {
              const json = await res.json();
              app.data.members.unshift(json.member); // Update state locally
              app.data.stats.member_count++;
              app.renderMembers();
              app.renderStats();
              app.modals.addMember.close();
              app.toast('Member Added');
              document.querySelector('#modal-add-member form').reset();
            } else {
              alert('Error adding member');
            }
            // Reset button
            const btn = document.querySelector('#modal-add-member button[type="submit"]');
            btn.textContent = 'Save'; btn.disabled = false;
          },

          deleteMember: async (id) => {
            if(!confirm('Delete this member? History will be lost.')) return;
            const res = await fetch('/api/member/delete', { method: 'POST', body: JSON.stringify({id}) });
            if(res.ok) {
              app.data.members = app.data.members.filter(m => m.id !== id);
              app.data.stats.member_count--;
              app.renderAll();
              app.toast('Member deleted');
            }
          },

          addPayment: async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target));
            const res = await fetch('/api/payment/add', { method: 'POST', body: JSON.stringify(data) });
            if(res.ok) {
              const json = await res.json();
              // Update local state
              const m = app.data.members.find(x => x.id == data.memberId);
              if(m) m.due_date = json.new_due_date;
              app.renderMembers();
              document.getElementById('modal-payment').style.display = 'none';
              app.toast('Payment Recorded');
              e.target.reset();
            }
          },

          checkIn: async (id) => {
            const res = await fetch('/api/attendance/checkin', { method: 'POST', body: JSON.stringify({memberId: id}) });
            if(res.ok) {
              const json = await res.json();
              app.data.attendance.unshift(json.entry);
              app.data.stats.today_count++;
              app.renderStats();
              app.renderAttendanceTable();
              document.getElementById('checkin-search').value = '';
              document.getElementById('checkin-results').innerHTML = '';
              app.toast('Checked In: ' + json.entry.full_name);
              app.nav('home'); // Go to dashboard to see it
            }
          }
        }
      };

      // Checkin Search Logic
      document.getElementById('checkin-search').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const div = document.getElementById('checkin-results');
        div.innerHTML = '';
        if(q.length < 2) return;
        
        const matches = app.data.members.filter(m => m.full_name.toLowerCase().includes(q)).slice(0,5);
        matches.forEach(m => {
          const btn = document.createElement('div');
          btn.style.cssText = 'padding:10px; border:1px solid #eee; margin-bottom:5px; border-radius:8px; cursor:pointer; background:white';
          btn.innerHTML = \`<strong>\${m.full_name}</strong> <span style="font-size:12px; color:#666">\${m.phone||''}</span>\`;
          btn.onclick = () => app.actions.checkIn(m.id);
          div.appendChild(btn);
        });
      });

      // Start App
      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
