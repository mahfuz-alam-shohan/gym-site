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
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE, PUT",
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

// Calculate how many months have passed since expiry
function calcDueMonths(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  const exp = new Date(expiry);
  if (isNaN(exp.getTime())) return null;

  const now = new Date();
  if (exp >= now) return 0; // Not expired yet

  let months =
    (now.getFullYear() - exp.getFullYear()) * 12 +
    (now.getMonth() - exp.getMonth());

  // If we are past the day of month (e.g. Expired on 5th, today is 10th), add partial month logic if strict,
  // but usually for gyms, if you enter the new month, you owe for it.
  if (now.getDate() > exp.getDate()) months += 1;
  
  if (months < 1) months = 1;
  return months;
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

    .app-layout { display: flex; height: 100%; }
    .sidebar { width: 260px; background: var(--bg-nav); color: white; display: flex; flex-direction: column; flex-shrink: 0; z-index: 50; transition: transform 0.3s; }
    .main-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; position: relative; }
    
    .card { background: var(--bg-card); padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid var(--border); margin-bottom: 20px; }
    .btn { padding: 8px 14px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-outline { background: white; border: 1px solid var(--border); color: var(--text-main); }
    .btn-danger { background: var(--danger); color: white; }
    .w-full { width: 100%; }
    
    input, select { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; transition: border 0.2s; }
    input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }
    label { display: block; margin-bottom: 5px; font-size: 13px; font-weight: 600; color: var(--text-main); }

    .checkbox-group { margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; border: 1px solid var(--border); padding: 8px; border-radius: 6px; background: #fff; }
    
    .table-responsive { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; background: white; white-space: nowrap; }
    th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
    td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; }
    .stat-val { font-size: 24px; font-weight: 700; color: var(--text-main); margin-top: 4px; }
    .stat-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }

    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 12px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .center-screen { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 20px; }
    
    .badge { padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .bg-green { background: #dcfce7; color: #166534; }
    .bg-red { background: #fee2e2; color: #991b1b; }
    .bg-amber { background: #fef3c7; color: #92400e; }
    .bg-blue { background: #dbeafe; color: #1e40af; }
    
    .nav { padding: 16px; flex: 1; }
    .nav-item { padding: 10px 16px; border-radius: 8px; color: #9ca3af; cursor: pointer; margin-bottom: 2px; font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 10px; }
    .nav-item:hover, .nav-item.active { background: #1f2937; color: white; }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-content { background: white; width: 100%; max-width: 600px; padding: 24px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; }

    .checkin-results { margin-top: 10px; max-height: 220px; overflow-y: auto; border-radius: 10px; border: 1px solid var(--border); background: #f9fafb; }
    .checkin-item { padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #e5e7eb; }
    .checkin-item:hover { background: #ffffff; }

    .mobile-header { display: none; }
    @media (max-width: 768px) {
      body { overflow: auto; }
      .app-layout { flex-direction: column; height: auto; }
      .sidebar { position: fixed; inset: 0 auto 0 0; height: 100%; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .mobile-header { display: flex; justify-content: space-between; padding: 16px; background: white; border-bottom: 1px solid var(--border); align-items: center; }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; }
      .overlay.open { display: block; }
      .checkbox-group { grid-template-columns: 1fr; }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}

/* ========================================================================
   3. DATABASE SETUP
   ======================================================================== */

async function initDB(env: Env) {
  const q = [
    `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT, permissions TEXT DEFAULT '[]')`,
    `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT, phone TEXT, plan TEXT, joined_at TEXT, expiry_date TEXT, status TEXT DEFAULT 'active')`,
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, check_in_time TEXT, status TEXT)`,
    `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, member_id INTEGER, amount INTEGER, date TEXT)`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
  ];
  for (const sql of q) await env.DB.prepare(sql).run();
}

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

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
      await initDB(env);

      /* --- PUBLIC ROUTES --- */

      if (url.pathname === "/") {
        const config = await env.DB.prepare("SELECT value FROM config WHERE key = 'gym_name'").first<any>();
        const user = await getSession(req, env);
        if (!config) return renderSetup();
        if (user) return Response.redirect(url.origin + "/dashboard", 302);
        return renderLogin(config.value as string);
      }

      if (url.pathname === "/api/setup" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(body.gymName).run();
        
        const hash = await hashPassword(body.password);
        await env.DB.prepare("DELETE FROM users").run(); 
        const allPerms = JSON.stringify(['home','members','attendance','history','payments','settings']);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, 'admin', ?)")
          .bind(email, hash, body.adminName, allPerms).run();
          
        return json({ success: true });
      }

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

      if (url.pathname === "/api/nuke") {
        await factoryReset(env);
        return new Response("Reset Complete", { status: 200 });
      }

      if (url.pathname === "/api/logout") {
        return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" } });
      }

      /* --- PROTECTED ROUTES --- */

      const user = await getSession(req, env);
      if (!user) {
        if (url.pathname.startsWith('/api')) return json({ error: "Unauthorized" }, 401);
        return Response.redirect(url.origin + "/", 302);
      }

      if (url.pathname === "/dashboard") return renderDashboard(user);

      // --- USER MGMT ---
      if (url.pathname === "/api/users/list") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const users = await env.DB.prepare("SELECT id, name, email, role, permissions FROM users ORDER BY id").all();
        return json({ users: users.results });
      }

      if (url.pathname === "/api/users/add" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(body.email).first();
        if (exists) return json({ error: "Email exists" }, 400);
        const hash = await hashPassword(body.password);
        const perms = JSON.stringify(body.permissions || []);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, ?, ?)").bind(body.email, hash, body.name, body.role, perms).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/users/update" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        const perms = JSON.stringify(body.permissions || []);
        if (body.password) {
           const hash = await hashPassword(body.password);
           await env.DB.prepare("UPDATE users SET name=?, email=?, role=?, permissions=?, password_hash=? WHERE id=?").bind(body.name, body.email, body.role, perms, hash, body.id).run();
        } else {
           await env.DB.prepare("UPDATE users SET name=?, email=?, role=?, permissions=? WHERE id=?").bind(body.name, body.email, body.role, perms, body.id).run();
        }
        return json({ success: true });
      }

      if (url.pathname === "/api/users/delete" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        if(body.id === user.id) return json({error:"Cannot delete self"}, 400);
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(body.id).run();
        return json({ success: true });
      }

      // --- MEMBERS & DATA ---
      if (url.pathname === "/api/bootstrap") {
        const configRows = await env.DB.prepare("SELECT key, value FROM config").all<any>();
        const config: Record<string, string> = {};
        for (const row of configRows.results || []) config[row.key] = row.value;

        const attendanceThreshold = parseInt(config["attendance_threshold_days"] || "3", 10);
        const inactiveAfterMonths = parseInt(config["inactive_after_due_months"] || "3", 10);
        const monthlyPrice = parseInt(config["monthly_price"] || "0", 10);
        let membershipPlans;
        try { membershipPlans = JSON.parse(config["membership_plans"] || '["Standard","Premium"]'); } catch { membershipPlans = ["Standard","Premium"]; }

        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all<any>();
        const membersProcessed: any[] = [];
        let activeCount=0, dueMembersCount=0, inactiveMembersCount=0;

        for (const m of membersRaw.results || []) {
          const dueMonths = calcDueMonths(m.expiry_date);
          let newStatus = m.status || "active";
          if (dueMonths != null && dueMonths >= inactiveAfterMonths) { newStatus = "inactive"; inactiveMembersCount++; }
          else if (dueMonths != null && dueMonths > 0) { newStatus = "due"; dueMembersCount++; }
          else { newStatus = "active"; activeCount++; }
          
          if (newStatus !== m.status) await env.DB.prepare("UPDATE members SET status = ? WHERE id = ?").bind(newStatus, m.id).run();
          membersProcessed.push({ ...m, status: newStatus, dueMonths });
        }

        const attendanceToday = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date FROM attendance a JOIN members m ON a.member_id = m.id WHERE date(a.check_in_time) = date('now') ORDER BY a.id DESC").all<any>();
        const attendanceHistory = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date FROM attendance a JOIN members m ON a.member_id = m.id ORDER BY a.id DESC LIMIT 50").all<any>();
        const todayVisits = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = date('now')").first<any>();
        const revenue = await env.DB.prepare("SELECT sum(amount) as t FROM payments").first<any>();

        return json({
          user: { ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] },
          members: membersProcessed,
          attendanceToday: (attendanceToday.results || []).map((r:any) => ({...r, dueMonths: calcDueMonths(r.expiry_date)})),
          attendanceHistory: (attendanceHistory.results || []).map((r:any) => ({...r, dueMonths: calcDueMonths(r.expiry_date)})),
          stats: { active: activeCount, today: todayVisits?.c || 0, revenue: revenue?.t || 0, dueMembers: dueMembersCount, inactiveMembers: inactiveMembersCount },
          settings: { attendanceThreshold, inactiveAfterMonths, membershipPlans, monthlyPrice }
        });
      }

      if (url.pathname === "/api/members/history" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const history = await env.DB.prepare(`
          SELECT check_in_time, status 
          FROM attendance 
          WHERE member_id = ? 
          ORDER BY check_in_time DESC
        `).bind(memberId).all();
        return json({ history: history.results || [] });
      }

      if (url.pathname === "/api/members/search" && req.method === "POST") {
        const body = await req.json() as any;
        const qRaw = (body.query || "").toString().trim();
        const maybeId = Number(qRaw);
        let res;
        if (!isNaN(maybeId) && maybeId > 0) {
          res = await env.DB.prepare("SELECT id, name, phone, plan, expiry_date FROM members WHERE id = ? OR name LIKE ? OR phone LIKE ? LIMIT 10").bind(maybeId, `%${qRaw}%`, `%${qRaw}%`).all();
        } else {
          res = await env.DB.prepare("SELECT id, name, phone, plan, expiry_date FROM members WHERE name LIKE ? OR phone LIKE ? LIMIT 10").bind(`%${qRaw}%`, `%${qRaw}%`).all();
        }
        const results = (res.results || []).map((m: any) => ({ ...m, dueMonths: calcDueMonths(m.expiry_date) }));
        return json({ results });
      }

      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const body = await req.json() as any;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + parseInt(body.duration));
        await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date) VALUES (?, ?, ?, ?, ?)").bind(body.name, body.phone, body.plan, new Date().toISOString(), expiry.toISOString()).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/checkin" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        if (!member) return json({ error: "Member not found" }, 404);

        const alreadyToday = await env.DB.prepare("SELECT id FROM attendance WHERE member_id = ? AND date(check_in_time) = date('now') LIMIT 1").bind(memberId).first();
        if (alreadyToday) return json({ error: "Already checked in today", code: "DUPLICATE" }, 400);
        
        const isExpired = new Date(member.expiry_date) < new Date();
        const status = isExpired ? 'expired' : 'success';
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, new Date().toISOString(), status).run();
        return json({ success: true, status, name: member.name, isExpired });
      }

      if (url.pathname === "/api/payment" && req.method === "POST") {
        const { memberId, amount, months } = await req.json() as any;
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, amount, new Date().toISOString()).run();
        const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
        let newDate = new Date(member.expiry_date);
        if (newDate < new Date()) newDate = new Date();
        newDate.setMonth(newDate.getMonth() + parseInt(months));
        await env.DB.prepare("UPDATE members SET expiry_date = ?, status = 'active' WHERE id = ?").bind(newDate.toISOString(), memberId).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/members/delete" && req.method === "POST") {
        const { id } = await req.json() as any;
        await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM attendance WHERE member_id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM payments WHERE member_id = ?").bind(id).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/settings" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Unauthorized' }, 403);
        const body = await req.json() as any;
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('attendance_threshold_days', ?)").bind(String(body.attendanceThreshold)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('inactive_after_due_months', ?)").bind(String(body.inactiveAfterMonths)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('monthly_price', ?)").bind(String(body.monthlyPrice)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(JSON.stringify(typeof body.membershipPlans === 'string' ? body.membershipPlans.split(',') : body.membershipPlans)).run();
        return json({ success: true });
      }

    } catch (e: any) { return json({ error: e.message }, 500); }
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
   5. FRONTEND
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
           <button onclick="nukeDB()" class="btn btn-danger" style="font-size:11px;">⚠ Factory Reset Database</button>
        </div>
      </div>
    </div>
    <script>
      async function nukeDB() {
        if(!confirm("Delete ALL data?")) return;
        await fetch('/api/nuke'); location.reload();
      }
      document.getElementById('form').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/setup', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          if(res.ok) window.location.reload();
          else throw new Error("Setup failed");
        } catch(err) { document.getElementById('error').textContent = err.message; }
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
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit = async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
          if(res.ok) window.location.href = '/dashboard';
          else { const d = await res.json(); throw new Error(d.error || "Login failed"); }
        } catch(err) { document.getElementById('error').textContent = err.message; }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any) {
  const perms = user.permissions ? JSON.parse(user.permissions) : [];
  const isAdmin = user.role === 'admin';
  const can = (p: string) => isAdmin || perms.includes(p);

  let navItems = '';
  if (can('home')) navItems += `<div class="nav-item" onclick="app.nav('home')">📊 Overview</div>`;
  if (can('members')) navItems += `<div class="nav-item" onclick="app.nav('members')">👥 Members</div>`;
  if (can('attendance')) navItems += `<div class="nav-item" onclick="app.nav('attendance')">⏰ Today</div>`;
  if (can('history')) navItems += `<div class="nav-item" onclick="app.nav('history')">📜 History</div>`;
  if (can('payments')) navItems += `<div class="nav-item" onclick="app.nav('payments')">💵 Payments</div>`;
  if (can('settings')) navItems += `<div class="nav-item" onclick="app.nav('settings')">⚙ Settings</div>`;
  if (isAdmin) navItems += `<div class="nav-item" onclick="app.nav('users')">🔐 User Access</div>`;

  const html = `${baseHead("Dashboard")}
  <body>
    <div class="app-layout">
      <div class="mobile-header">
         <div style="font-weight:bold;">Gym OS</div>
         <button class="btn btn-outline" onclick="toggleSidebar()">☰</button>
      </div>
      <div class="overlay" onclick="toggleSidebar()"></div>

      <aside class="sidebar">
        <div style="padding:24px; font-size:20px; font-weight:700; border-bottom:1px solid #1f2937;">💪 Gym OS</div>
        <div class="nav">${navItems}</div>
        <div style="padding:20px; border-top:1px solid #1f2937;">
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
          <div id="view-home" class="hidden">
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
              <div class="stat-card">
                <span class="stat-label">Members With Due</span>
                <span class="stat-val" id="stat-due">--</span>
              </div>
            </div>
            <div class="card">
              <h3 style="margin:0 0 15px 0;">Dues Overview</h3>
              <canvas id="chart-dues" height="100"></canvas>
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
                  <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Plan</th><th>Expiry</th><th>Due</th><th>Actions</th></tr></thead>
                  <tbody id="tbl-members"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-attendance" class="hidden">
            <div class="card">
              <h3>Today's Attendance</h3>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Time</th><th>Name</th><th>Result</th><th>Due</th></tr></thead>
                  <tbody id="tbl-attendance-today"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-history" class="hidden">
            <div class="card">
              <div class="flex-between" style="margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                <h3 style="margin:0;">Activity Log (Last 50)</h3>
                <div class="flex" style="gap:8px;">
                  <input type="date" id="history-date" style="margin-bottom:0; max-width:160px;">
                  <button class="btn btn-outline" onclick="app.applyHistoryFilter()">Filter</button>
                  <button class="btn btn-outline" onclick="app.clearHistoryFilter()">Clear</button>
                </div>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Result</th></tr></thead>
                  <tbody id="tbl-attendance-history"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-payments" class="hidden">
            <div class="card">
              <h3>Search & Collect</h3>
              <input id="pay-search" placeholder="Search by ID, name or phone..." style="margin-bottom:10px;" onkeyup="app.onPaymentSearchInput(event)">
              <div id="pay-search-results" class="checkin-results"></div>
            </div>
            <div class="card">
              <div class="flex-between" style="margin-bottom:10px;">
                <h3 style="margin:0;">Members with Dues</h3>
                <button class="btn btn-outline" onclick="window.open('/dues/print','_blank')">Print List (PDF)</button>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Due Months</th><th>Amount Due</th><th>Action</th></tr></thead>
                  <tbody id="tbl-dues"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-settings" class="hidden">
            <div class="card">
              <h3>System Settings</h3>
              <form id="settings-form" onsubmit="app.saveSettings(event)">
                <label>Monthly Membership Price (Currency Unit)</label>
                <input name="monthlyPrice" type="number" required>

                <label>Attendance Threshold (Days/Month to count active)</label>
                <input name="attendanceThreshold" type="number" min="1" max="31" required>
                
                <label>Inactive after X months of due</label>
                <input name="inactiveAfterMonths" type="number" min="1" max="36" required>
                
                <label>Membership plan names (comma-separated)</label>
                <input name="membershipPlans" type="text" required>
                
                <div class="flex-between" style="margin-top:15px; gap:10px;">
                  <button type="submit" class="btn btn-primary">Save Settings</button>
                  <span id="settings-status" style="font-size:12px; color:var(--text-muted);"></span>
                </div>
              </form>
            </div>
          </div>

          <div id="view-users" class="hidden">
            <div class="card">
               <div class="flex-between" style="margin-bottom:20px;">
                 <h3 style="margin:0;">User Access</h3>
                 <button class="btn btn-primary" onclick="app.openAddUser()">+ Add User</button>
               </div>
               <div class="table-responsive">
                 <table>
                   <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Permissions</th><th>Actions</th></tr></thead>
                   <tbody id="tbl-users"></tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="text-align:center;">⚡ Check-In</h3>
        <input id="checkin-id" type="text" placeholder="Search ID/Name..." style="font-size:18px; padding:15px; text-align:center;" autofocus onkeyup="app.onCheckinInput(event)">
        <div id="checkin-suggestions" class="checkin-results"></div>
        <button class="btn btn-primary w-full" onclick="app.checkIn()">Submit</button>
        <div id="checkin-res" style="margin-top:20px; text-align:center; font-weight:bold; min-height:20px;"></div>
        <button class="btn btn-outline w-full" style="margin-top:15px;" onclick="app.modals.checkin.close()">Close</button>
      </div>
    </div>

    <div id="modal-add" class="modal-backdrop">
      <div class="modal-content">
        <h3>New Member</h3>
        <form onsubmit="app.addMember(event)">
          <label>Full Name</label><input name="name" required>
          <label>Phone Number</label><input name="phone" required>
          <div class="flex">
            <div class="w-full"><label>Plan</label><select name="plan" id="plan-select"></select></div>
            <div class="w-full"><label>Months</label><input name="duration" type="number" value="1" required></div>
          </div>
          <div class="flex" style="justify-content:flex-end; margin-top:15px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.add.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-pay" class="modal-backdrop">
      <div class="modal-content">
        <h3>💰 Receive Payment</h3>
        <p id="pay-name" style="color:var(--text-muted); margin-bottom:20px;"></p>
        <form onsubmit="app.pay(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <label>Amount</label><input name="amount" type="number" required>
          <label>Extend Expiry (Months)</label><input name="months" type="number" value="1" required>
          <div class="flex" style="justify-content:flex-end; margin-top:15px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.pay.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Confirm</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-user" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="user-modal-title">User</h3>
        <form id="user-form" onsubmit="app.saveUser(event)">
          <input type="hidden" name="id" id="u-id">
          <label>Name</label><input name="name" id="u-name" required>
          <label>Email</label><input name="email" id="u-email" type="email" required>
          <label>Password <span style="font-size:11px; color:gray;" id="u-pass-hint"></span></label>
          <input name="password" id="u-password" type="password">
          <label>Role</label>
          <select name="role" id="u-role" onchange="app.togglePerms(this.value)">
             <option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
          <div id="u-perms-container">
             <label style="margin-top:15px;">Access Permissions</label>
             <div class="checkbox-group">
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="home"> Overview</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="members"> Members</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="attendance"> Attendance</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="history"> History</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="payments"> Payments</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="settings"> Settings</label>
             </div>
          </div>
          <div class="flex" style="justify-content:flex-end; margin-top:20px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.user.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save User</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-member-history" class="modal-backdrop">
      <div class="modal-content">
        <div class="flex-between">
            <h3 id="mh-title" style="margin:0;">Attendance Sheet</h3>
            <button class="btn btn-outline" onclick="document.getElementById('modal-member-history').style.display='none'">Close</button>
        </div>
        <div class="table-responsive" style="margin-top:15px; max-height:400px; overflow-y:auto;">
           <table>
             <thead><tr><th>Date</th><th>Time</th><th>Status</th></tr></thead>
             <tbody id="tbl-mh"></tbody>
           </table>
        </div>
      </div>
    </div>

    <script>
      function toggleSidebar() { 
        document.querySelector('.sidebar').classList.toggle('open');
        document.querySelector('.overlay').classList.toggle('open');
      }

      function formatTime(iso) {
         if(!iso) return '-';
         return new Date(iso).toLocaleString('en-US', {
            timeZone: 'Asia/Dhaka',
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
         });
      }

      const currentUser = { role: "${user.role}", permissions: ${user.permissions || '[]'} };
      const app = {
        data: null, userList: [], searchTimeout: null,
        
        async init() {
          const res = await fetch('/api/bootstrap');
          this.data = await res.json();
          this.render();
          this.applySettingsUI();
          if(currentUser.role === 'admin') this.loadUsers();
          this.nav(this.can('attendance') ? 'attendance' : 'home');
        },
        
        can(perm) { return currentUser.role === 'admin' || currentUser.permissions.includes(perm); },

        nav(v) {
          if (v === 'users' && currentUser.role !== 'admin') return;
          if (v !== 'users' && !this.can(v)) return alert('Access Denied');
          document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
          document.querySelectorAll('.nav .nav-item').forEach(el => { if(el.textContent.toLowerCase().includes(v==='home'?'overview':v)) el.classList.add('active'); });
          ['home', 'members', 'attendance', 'history', 'payments', 'settings', 'users'].forEach(id => {
            const el = document.getElementById('view-'+id); if(el) el.classList.add('hidden');
          });
          document.getElementById('view-'+v).classList.remove('hidden');
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.overlay').classList.remove('open');
        },

        getDueDetails(m) {
           if(!m.dueMonths || m.dueMonths <= 0) return '';
           const today = new Date();
           const months = [];
           for(let i=0; i < m.dueMonths; i++) {
              const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
              months.push(d.toLocaleString('en-US', { month:'short' }));
           }
           return months.reverse().join(', ');
        },

        render() {
          const price = this.data.settings.monthlyPrice || 0;
          
          if(document.getElementById('stat-active')) {
            document.getElementById('stat-active').innerText = this.data.stats.active;
            document.getElementById('stat-today').innerText = this.data.stats.today;
            document.getElementById('stat-rev').innerText = this.data.stats.revenue;
            document.getElementById('stat-due').innerText = this.data.stats.dueMembers;
          }

          document.getElementById('tbl-members').innerHTML = (this.data.members || []).map(m => {
            let statusBadge = '<span class="badge bg-green">Active</span>';
            if (m.status === 'due') statusBadge = '<span class="badge bg-amber">Due</span>';
            if (m.status === 'inactive') statusBadge = '<span class="badge bg-red">Inactive</span>';
            
            const dueAmt = (m.dueMonths > 0) ? (m.dueMonths * price) : 0;
            const dueTxt = dueAmt > 0 ? (dueAmt + ' (' + m.dueMonths + ' Mo)') : '-';

            return \`<tr>
              <td>#\${m.id}</td><td><strong>\${m.name}</strong></td><td>\${m.phone}</td><td>\${m.plan}</td>
              <td>\${m.expiry_date ? m.expiry_date.split('T')[0] : '-'}</td>
              <td>\${statusBadge}<div style="font-size:11px;color:red">\${dueTxt}</div></td>
              <td>
                <button class="btn btn-outline" onclick="app.showHistory(\${m.id}, '\${m.name}')">History</button>
                <button class="btn btn-outline" onclick="app.modals.pay.open(\${m.id})">Pay</button>
                <button class="btn btn-danger" onclick="app.del(\${m.id})">Del</button>
              </td>
            </tr>\`;
          }).join('');

          const todayRows = (this.data.attendanceToday || []).map(a => 
             \`<tr><td>\${formatTime(a.check_in_time).split(', ')[1]}</td><td>\${a.name}</td><td>\${a.status==='success'?'<span class="badge bg-green">OK</span>':'<span class="badge bg-red">Expired</span>'}</td><td>\${a.dueMonths>0?a.dueMonths+' Mo Due':'-'}</td></tr>\`
          ).join('') || '<tr><td colspan="4">No check-ins yet.</td></tr>';
          document.getElementById('tbl-attendance-today').innerHTML = todayRows;

          this.renderHistoryTable(null);
          
          const duesMembers = (this.data.members || []).filter(m => m.dueMonths > 0).sort((a,b) => b.dueMonths - a.dueMonths);
          document.getElementById('tbl-dues').innerHTML = duesMembers.map(m => {
             const amt = m.dueMonths * price;
             const monthsTxt = this.getDueDetails(m);
             return \`<tr>
               <td>#\${m.id}</td><td>\${m.name}</td><td><span class="badge bg-\${m.status==='inactive'?'red':'amber'}">\${m.status}</span></td>
               <td>\${m.dueMonths} <small style="color:#666">(\${monthsTxt})</small></td>
               <td style="font-weight:bold; color:#ef4444">\${amt}</td>
               <td><button class="btn btn-primary" onclick="app.modals.pay.open(\${m.id})">Pay</button></td>
             </tr>\`;
          }).join('') || '<tr><td colspan="6">No dues.</td></tr>';
          
          this.renderCharts();
        },

        async showHistory(id, name) {
           document.getElementById('mh-title').innerText = name + " - Attendance";
           document.getElementById('tbl-mh').innerHTML = '<tr><td colspan="3">Loading...</td></tr>';
           document.getElementById('modal-member-history').style.display = 'flex';
           
           const res = await fetch('/api/members/history', { method:'POST', body:JSON.stringify({memberId:id}) });
           const data = await res.json();
           const rows = (data.history || []).map(h => {
             const d = new Date(h.check_in_time);
             return \`<tr>
               <td>\${d.toLocaleDateString('en-US', {timeZone:'Asia/Dhaka', month:'short', day:'numeric', year:'numeric'})}</td>
               <td>\${d.toLocaleTimeString('en-US', {timeZone:'Asia/Dhaka', hour:'2-digit', minute:'2-digit'})}</td>
               <td>\${h.status==='success'?'✅':'❌'}</td>
             </tr>\`;
           }).join('') || '<tr><td colspan="3">No records found.</td></tr>';
           document.getElementById('tbl-mh').innerHTML = rows;
        },

        renderHistoryTable(filterDate) {
          const list = filterDate ? (this.data.attendanceHistory || []).filter(a => a.check_in_time.startsWith(filterDate)) : (this.data.attendanceHistory || []);
          document.getElementById('tbl-attendance-history').innerHTML = list.length ? list.map(a => 
            \`<tr><td>\${formatTime(a.check_in_time).split(', ')[0]}</td><td>\${formatTime(a.check_in_time).split(', ')[1]}</td><td>\${a.name}</td><td>\${a.status==='success'?'OK':'Expired'}</td></tr>\`
          ).join('') : '<tr><td colspan="4">No data.</td></tr>';
        },

        /* --- USER MGMT FIX --- */
        openAddUser() {
           document.getElementById('modal-user').style.display='flex'; 
           document.getElementById('user-modal-title').innerText="Add New User";
           document.getElementById('user-form').reset();
           document.getElementById('u-id').value = "";
           document.getElementById('u-password').required = true;
           document.getElementById('u-pass-hint').innerText = "";
           this.togglePerms('staff'); 
        },

        editUser(id) {
           const u = this.userList.find(x => x.id === id);
           if(!u) return;
           document.getElementById('user-modal-title').innerText = "Edit User";
           document.getElementById('u-id').value = u.id;
           document.getElementById('u-name').value = u.name;
           document.getElementById('u-email').value = u.email;
           document.getElementById('u-password').required = false;
           document.getElementById('u-pass-hint').innerText = "(Leave blank to keep)";
           document.getElementById('u-role').value = u.role;
           const perms = JSON.parse(u.permissions || '[]');
           document.querySelectorAll('input[name="permissions"]').forEach(cb => cb.checked = perms.includes(cb.value));
           this.togglePerms(u.role);
           document.getElementById('modal-user').style.display='flex'; // Open modal AFTER filling data
        },

        togglePerms(role) {
           const container = document.getElementById('u-perms-container');
           if(role === 'admin') container.classList.add('hidden');
           else container.classList.remove('hidden');
        },
        
        async loadUsers() {
           const res = await fetch('/api/users/list');
           if(res.ok) {
             const data = await res.json();
             this.userList = data.users;
             document.getElementById('tbl-users').innerHTML = this.userList.map(u => \`<tr><td>#\${u.id}</td><td>\${u.name}</td><td>\${u.email}</td><td>\${u.role}</td><td style="font-size:11px; white-space:normal; max-width:150px;">\${u.role==='admin'?'ALL':(JSON.parse(u.permissions).join(', '))}</td><td><button class="btn btn-outline" onclick="app.editUser(\${u.id})">Edit</button> <button class="btn btn-danger" onclick="app.deleteUser(\${u.id})">Del</button></td></tr>\`).join('');
           }
        },
        
        async saveUser(e) {
           e.preventDefault();
           const data = Object.fromEntries(new FormData(e.target));
           const perms = [];
           document.querySelectorAll('input[name="permissions"]:checked').forEach(cb => perms.push(cb.value));
           data.permissions = perms;
           const url = data.id ? '/api/users/update' : '/api/users/add';
           const res = await fetch(url, { method: 'POST', body: JSON.stringify(data)});
           if(res.ok) { document.getElementById('modal-user').style.display='none'; this.loadUsers(); } 
           else { alert((await res.json()).error); }
        },
        async deleteUser(id) { if(confirm("Delete?")) { await fetch('/api/users/delete', { method:'POST', body:JSON.stringify({id})}); this.loadUsers(); } },

        /* --- SETTINGS --- */
        applySettingsUI() {
          const s = this.data.settings;
          const form = document.getElementById('settings-form');
          form.querySelector('input[name="monthlyPrice"]').value = s.monthlyPrice || 0;
          form.querySelector('input[name="attendanceThreshold"]').value = s.attendanceThreshold;
          form.querySelector('input[name="inactiveAfterMonths"]').value = s.inactiveAfterMonths;
          form.querySelector('input[name="membershipPlans"]').value = (s.membershipPlans).join(', ');
          document.getElementById('plan-select').innerHTML = s.membershipPlans.map(p=>`<option>${p}</option>`).join('');
        },
        async saveSettings(e) {
           e.preventDefault();
           document.getElementById('settings-status').innerText = 'Saving...';
           await fetch('/api/settings', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) });
           location.reload();
        },

        /* --- ACTIONS --- */
        async checkIn() {
          const id = document.getElementById('checkin-id').value;
          const res = await fetch('/api/checkin', { method:'POST', body:JSON.stringify({memberId:id}) });
          const json = await res.json();
          const div = document.getElementById('checkin-res');
          div.innerText = json.status==='success' ? ('✅ Welcome ' + json.name) : (json.error || '⛔ Error');
          div.style.color = json.status==='success' ? 'var(--success)' : 'var(--danger)';
          if(json.status==='success') setTimeout(()=>location.reload(), 800);
        },
        onCheckinInput(e) {
           const val = e.target.value;
           if(this.searchTimeout) clearTimeout(this.searchTimeout);
           this.searchTimeout = setTimeout(async ()=>{
              if(!val.trim()) { document.getElementById('checkin-suggestions').innerHTML=''; return; }
              const res = await fetch('/api/members/search', { method:'POST', body:JSON.stringify({query:val})});
              const data = await res.json();
              document.getElementById('checkin-suggestions').innerHTML = data.results.map(m=>`<div class="checkin-item" onclick="document.getElementById('checkin-id').value=${m.id}; document.getElementById('checkin-suggestions').innerHTML=''; app.checkIn()"><strong>${m.name}</strong></div>`).join('');
           }, 200);
        },
        
        async addMember(e) { e.preventDefault(); await fetch('/api/members/add', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) }); location.reload(); },
        async pay(e) { e.preventDefault(); await fetch('/api/payment', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) }); location.reload(); },
        async del(id) { if(confirm("Delete?")) await fetch('/api/members/delete', { method:'POST', body:JSON.stringify({id}) }); location.reload(); },
        filter() { const q = document.getElementById('search').value.toLowerCase(); document.querySelectorAll('#tbl-members tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none'); },
        applyHistoryFilter() { this.renderHistoryTable(document.getElementById('history-date').value); },
        clearHistoryFilter() { document.getElementById('history-date').value=''; this.renderHistoryTable(null); },
        onPaymentSearchInput(e) {
           const val = e.target.value;
           setTimeout(async ()=>{
              if(!val.trim()) { document.getElementById('pay-search-results').innerHTML=''; return; }
              const res = await fetch('/api/members/search', { method:'POST', body:JSON.stringify({query:val})});
              const data = await res.json();
              document.getElementById('pay-search-results').innerHTML = data.results.map(m=>`<div class="checkin-item" onclick="app.modals.pay.open(${m.id})"><strong>${m.name}</strong> - ${m.dueMonths} Mo Due</div>`).join('');
           }, 200);
        },
        
        renderCharts() {
           if(typeof Chart === 'undefined') return;
           const members = this.data.members || [];
           const ctx1 = document.getElementById('chart-dues');
           if(ctx1) new Chart(ctx1.getContext('2d'), { type: 'bar', data: { labels: ['No Due', '1 Mo', '2+ Mo', 'Inactive'], datasets: [{ data: [ members.filter(m=>!m.dueMonths||m.dueMonths<=0).length, members.filter(m=>m.dueMonths===1).length, members.filter(m=>m.dueMonths>=2 && m.status!=='inactive').length, members.filter(m=>m.status==='inactive').length ], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'] }] }, options: {plugins:{legend:{display:false}}} });
        },

        modals: {
          checkin: { open:()=>{ document.getElementById('modal-checkin').style.display='flex'; document.getElementById('checkin-id').focus(); }, close:()=>document.getElementById('modal-checkin').style.display='none' },
          add: { open:()=>document.getElementById('modal-add').style.display='flex', close:()=>document.getElementById('modal-add').style.display='none' },
          pay: { open:(id)=>{ const m = app.data.members.find(x=>x.id===id); document.getElementById('pay-id').value=id; document.getElementById('pay-name').innerText = m ? m.name : ''; document.getElementById('modal-pay').style.display='flex'; }, close:()=>document.getElementById('modal-pay').style.display='none' },
          user: { close:()=>document.getElementById('modal-user').style.display='none' }
        }
      };
      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
