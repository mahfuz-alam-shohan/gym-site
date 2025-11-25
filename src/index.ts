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

function calcDueMonths(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  const exp = new Date(expiry);
  if (isNaN(exp.getTime())) return null;

  const now = new Date();
  if (exp >= now) return 0;

  let months =
    (now.getFullYear() - exp.getFullYear()) * 12 +
    (now.getMonth() - exp.getMonth());

  if (now.getDate() > exp.getDate()) months += 1;
  if (months < 1) months = 1;
  return months;
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

    .app-layout { display: flex; height: 100%; }
    .sidebar { width: 260px; background: var(--bg-nav); color: white; display: flex; flex-direction: column; flex-shrink: 0; z-index: 50; transition: transform 0.3s; }
    .main-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; position: relative; }
    
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

    .checkbox-group { margin-bottom: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .checkbox-item { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; border: 1px solid var(--border); padding: 8px; border-radius: 6px; background: #fff; }
    .checkbox-item input { width: auto; margin: 0; box-shadow: none; }
    .checkbox-item:hover { background: #f9fafb; }

    .table-responsive { overflow-x: auto; border-radius: 8px; border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; background: white; white-space: nowrap; }
    th { background: #f9fafb; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
    td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; }
    .stat-val { font-size: 28px; font-weight: 700; color: var(--text-main); margin-top: 4px; }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }

    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 12px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .center-screen { flex: 1; display: flex; align-items: center; justify-content: center; background: #f3f4f6; padding: 20px; }
    
    .badge { padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .bg-green { background: #dcfce7; color: #166534; }
    .bg-red { background: #fee2e2; color: #991b1b; }
    .bg-amber { background: #fef3c7; color: #92400e; }
    .bg-blue { background: #dbeafe; color: #1e40af; }
    
    .logo { padding: 24px; font-size: 20px; font-weight: 700; border-bottom: 1px solid #1f2937; letter-spacing: -0.5px; }
    .nav { padding: 16px; flex: 1; }
    .nav-item { padding: 12px 16px; border-radius: 8px; color: #9ca3af; cursor: pointer; margin-bottom: 4px; transition: 0.2s; font-weight: 500; display: flex; align-items: center; gap: 10px; }
    .nav-item:hover, .nav-item.active { background: #1f2937; color: white; }
    .user-footer { padding: 20px; border-top: 1px solid #1f2937; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-content { background: white; width: 100%; max-width: 500px; padding: 24px; border-radius: 16px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .checkin-results { margin-top: 10px; max-height: 220px; overflow-y: auto; border-radius: 10px; border: 1px solid var(--border); background: #f9fafb; }
    .checkin-item { padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #e5e7eb; }
    .checkin-item:last-child { border-bottom: none; }
    .checkin-item:hover { background: #ffffff; }
    .checkin-item small { display: block; color: var(--text-muted); font-size: 11px; margin-top: 2px; }

    .mobile-header { display: none; }
    @media (max-width: 768px) {
      body { overflow: auto; }
      .app-layout { flex-direction: column; height: auto; }
      .sidebar { position: fixed; inset: 0 auto 0 0; height: 100%; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .mobile-header { display: flex; justify-content: space-between; padding: 16px; background: white; border-bottom: 1px solid var(--border); align-items: center; }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; }
      .overlay.open { display: block; }
      .main-content { padding-top: 0; }
      .card { padding: 16px; }
      th, td { padding: 10px 12px; font-size: 13px; }
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
    // Added 'permissions' column
    `CREATE TABLE IF NOT EXISTS users (
       id INTEGER PRIMARY KEY, 
       email TEXT UNIQUE, 
       password_hash TEXT, 
       name TEXT, 
       role TEXT, 
       permissions TEXT DEFAULT '[]' 
    )`,
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

      // Initial Setup (Creates the first ADMIN)
      if (url.pathname === "/api/setup" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(body.gymName).run();
        
        const hash = await hashPassword(body.password);
        // Clean existing users to ensure only one admin at bootstrap
        await env.DB.prepare("DELETE FROM users").run(); 
        
        // Admin gets role 'admin' and all permissions
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
        return new Response("Database Reset Complete. Go to / to setup again.", { status: 200 });
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

      // --- USER MANAGEMENT (Admin Only) ---

      if (url.pathname === "/api/users/list") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const users = await env.DB.prepare("SELECT id, name, email, role, permissions FROM users ORDER BY id").all();
        return json({ users: users.results });
      }

      if (url.pathname === "/api/users/add" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        const email = body.email.trim().toLowerCase();
        
        // Check duplicate
        const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
        if (exists) return json({ error: "Email already exists" }, 400);

        const hash = await hashPassword(body.password);
        const perms = JSON.stringify(body.permissions || []);
        
        // Ensure role is respected. Only admin can create admins.
        const newRole = body.role || 'staff'; 

        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, ?, ?)")
          .bind(email, hash, body.name, newRole, perms).run();
        
        return json({ success: true });
      }

      if (url.pathname === "/api/users/update" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        const perms = JSON.stringify(body.permissions || []);
        
        if (body.password && body.password.length > 0) {
           const hash = await hashPassword(body.password);
           await env.DB.prepare("UPDATE users SET name=?, email=?, role=?, permissions=?, password_hash=? WHERE id=?")
            .bind(body.name, body.email, body.role, perms, hash, body.id).run();
        } else {
           await env.DB.prepare("UPDATE users SET name=?, email=?, role=?, permissions=? WHERE id=?")
            .bind(body.name, body.email, body.role, perms, body.id).run();
        }
        return json({ success: true });
      }

      if (url.pathname === "/api/users/delete" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Forbidden' }, 403);
        const body = await req.json() as any;
        if (body.id === user.id) return json({ error: "Cannot delete yourself" }, 400);
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(body.id).run();
        return json({ success: true });
      }

      // --- MEMBER & SYSTEM APIS ---

      // Print PDF logic
      if (url.pathname === "/dues/print") {
        // ... (Keep existing Print logic completely standard)
        // For brevity, using the same logic as previous, simplified here
        const gymRow = await env.DB.prepare("SELECT value FROM config WHERE key='gym_name'").first<any>();
        const gymName = (gymRow && gymRow.value) || "Gym OS";
        const resMembers = await env.DB.prepare("SELECT * FROM members ORDER BY id").all<any>();
        const members = resMembers.results || [];
        const processed = members.map((m: any) => ({ ...m, dueMonths: calcDueMonths(m.expiry_date as string | null) }))
          .filter((m: any) => m.dueMonths && m.dueMonths > 0)
          .sort((a: any, b: any) => (b.dueMonths || 0) - (a.dueMonths || 0));
        
        // Construct HTML (Simplified for this update context, strictly keeps previous functionality)
        const rowsHtml = processed.length ? processed.map((m: any) => `<tr><td>${m.name}</td><td>${m.phone}</td><td>${m.plan}</td><td>${m.dueMonths} Mo Due</td></tr>`).join("") : "<tr><td>No dues</td></tr>";
        return new Response(`<html><body><h1>${gymName} - Due Report</h1><table border="1" width="100%">${rowsHtml}</table></body></html>`, { headers: {"Content-Type":"text/html"}});
      }

      if (url.pathname === "/api/members/search" && req.method === "POST") {
        const body = await req.json() as any;
        const qRaw = (body.query || "").toString().trim();
        if (!qRaw) return json({ results: [] });
        const maybeId = Number(qRaw);
        let res;
        if (!isNaN(maybeId)) {
          res = await env.DB.prepare("SELECT id, name, phone, plan, expiry_date FROM members WHERE id = ? OR name LIKE ? OR phone LIKE ? LIMIT 10").bind(maybeId, `%${qRaw}%`, `%${qRaw}%`).all();
        } else {
          res = await env.DB.prepare("SELECT id, name, phone, plan, expiry_date FROM members WHERE name LIKE ? OR phone LIKE ? LIMIT 10").bind(`%${qRaw}%`, `%${qRaw}%`).all();
        }
        const results = (res.results || []).map((m: any) => ({ ...m, dueMonths: calcDueMonths(m.expiry_date) }));
        return json({ results });
      }

      if (url.pathname === "/api/bootstrap") {
        const configRows = await env.DB.prepare("SELECT key, value FROM config").all<any>();
        const config: Record<string, string> = {};
        for (const row of configRows.results || []) config[row.key] = row.value;

        // Settings
        const attendanceThreshold = parseInt(config["attendance_threshold_days"] || "3", 10);
        const inactiveAfterMonths = parseInt(config["inactive_after_due_months"] || "3", 10);
        let membershipPlans;
        try { membershipPlans = JSON.parse(config["membership_plans"] || '["Standard","Premium"]'); } catch { membershipPlans = ["Standard","Premium"]; }

        // Process Members (Update Status)
        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all<any>();
        const membersProcessed: any[] = [];
        let activeCount=0, dueMembersCount=0, inactiveMembersCount=0, totalDueMonths=0;

        for (const m of membersRaw.results || []) {
          const dueMonths = calcDueMonths(m.expiry_date);
          let newStatus = m.status || "active";
          if (dueMonths != null && dueMonths >= inactiveAfterMonths) { newStatus = "inactive"; inactiveMembersCount++; }
          else if (dueMonths != null && dueMonths > 0) { newStatus = "due"; dueMembersCount++; }
          else { newStatus = "active"; activeCount++; }
          if (dueMonths && dueMonths > 0) totalDueMonths += dueMonths;
          
          if (newStatus !== m.status) await env.DB.prepare("UPDATE members SET status = ? WHERE id = ?").bind(newStatus, m.id).run();
          membersProcessed.push({ ...m, status: newStatus, dueMonths });
        }

        const attendanceToday = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date FROM attendance a JOIN members m ON a.member_id = m.id WHERE date(a.check_in_time) = date('now') ORDER BY a.id DESC").all<any>();
        const attendanceHistory = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date FROM attendance a JOIN members m ON a.member_id = m.id ORDER BY a.id DESC LIMIT 50").all<any>();
        const todayVisits = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = date('now')").first<any>();
        const revenue = await env.DB.prepare("SELECT sum(amount) as t FROM payments").first<any>();

        return json({
          user: { ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] }, // Pass permissions to frontend
          members: membersProcessed,
          attendanceToday: (attendanceToday.results || []).map((r:any) => ({...r, dueMonths: calcDueMonths(r.expiry_date)})),
          attendanceHistory: (attendanceHistory.results || []).map((r:any) => ({...r, dueMonths: calcDueMonths(r.expiry_date)})),
          stats: { active: activeCount, today: todayVisits?.c || 0, revenue: revenue?.t || 0, dueMembers: dueMembersCount, inactiveMembers: inactiveMembersCount, totalDueMonths },
          settings: { attendanceThreshold, inactiveAfterMonths, membershipPlans }
        });
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
        // Simple security check for this specific route
        if (user.role !== 'admin') return json({ error: 'Unauthorized' }, 403);
        const body = await req.json() as any;
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('attendance_threshold_days', ?)").bind(String(body.attendanceThreshold)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('inactive_after_due_months', ?)").bind(String(body.inactiveAfterMonths)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(JSON.stringify(typeof body.membershipPlans === 'string' ? body.membershipPlans.split(',') : body.membershipPlans)).run();
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
   5. FRONTEND (Single Page App)
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
      </div>
    </div>
    <script>
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
  const perms = user.permissions ? JSON.parse(user.permissions) : [];
  const isAdmin = user.role === 'admin';

  // Helper to check permission
  const can = (p: string) => isAdmin || perms.includes(p);

  // Generate Menu Items based on permissions
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
        <div class="logo">💪 Gym OS <span style="font-size:10px; font-weight:normal; opacity:0.7; margin-left:5px;">v2.4</span></div>
        <div class="nav">
          ${navItems}
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
              <canvas id="chart-dues" height="120"></canvas>
            </div>
            <div class="card">
              <h3 style="margin:0 0 15px 0;">Attendance Trend</h3>
              <canvas id="chart-attendance" height="120"></canvas>
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
                <h3 style="margin:0;">Attendance History</h3>
                <div class="flex" style="gap:8px;">
                  <input type="date" id="history-date" style="margin-bottom:0; max-width:160px;">
                  <button class="btn btn-outline" style="font-size:12px; padding:6px 10px;" onclick="app.applyHistoryFilter()">Filter</button>
                  <button class="btn btn-outline" style="font-size:12px; padding:6px 10px;" onclick="app.clearHistoryFilter()">Clear</button>
                </div>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Result</th><th>Due</th></tr></thead>
                  <tbody id="tbl-attendance-history"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-payments" class="hidden">
            <div class="card">
              <div class="flex-between" style="margin-bottom:10px;">
                <h3 style="margin:0;">Search Member for Payment</h3>
              </div>
              <input id="pay-search" placeholder="Search by ID, name or phone..." style="margin-bottom:0;" onkeyup="app.onPaymentSearchInput(event)">
              <div id="pay-search-results" class="checkin-results" style="margin-top:10px;"></div>
            </div>

            <div class="card">
              <div class="flex-between" style="margin-bottom:10px;">
                <h3 style="margin:0;">Critical Dues</h3>
                <button class="btn btn-outline" style="font-size:12px; padding:6px 10px;" onclick="window.open('/dues/print','_blank')">Print List (PDF)</button>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Plan</th><th>Expiry</th><th>Status</th><th>Due</th><th>Pay</th></tr></thead>
                  <tbody id="tbl-dues"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div id="view-settings" class="hidden">
            <div class="card">
              <h3>System Settings</h3>
              <form id="settings-form" onsubmit="app.saveSettings(event)">
                <label>Minimum attendance days per month to count as billable</label>
                <input name="attendanceThreshold" type="number" min="1" max="31" required>
                
                <label>Months of due after which membership becomes <strong>inactive</strong></label>
                <input name="inactiveAfterMonths" type="number" min="1" max="36" required>
                
                <label>Membership plan names (comma-separated)</label>
                <input name="membershipPlans" type="text" required placeholder="Standard, Premium">
                
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
                 <div>
                   <h3 style="margin:0;">User Access Management</h3>
                   <p style="color:var(--text-muted); font-size:13px; margin:4px 0 0 0;">Manage staff logins and permissions.</p>
                 </div>
                 <button class="btn btn-primary" onclick="app.modals.user.open()">+ Add User</button>
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
        <h3 style="text-align:center; margin-top:0;">⚡ Check-In</h3>
        <input id="checkin-id" type="text" placeholder="Search by ID, name or phone" style="font-size:18px; padding:15px; text-align:center;" autofocus onkeyup="app.onCheckinInput(event)">
        <div id="checkin-suggestions" class="checkin-results"></div>
        <button class="btn btn-primary w-full" onclick="app.checkIn()">Submit</button>
        <div id="checkin-res" style="margin-top:20px; text-align:center; font-weight:bold; min-height:20px;"></div>
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
            <div class="w-full"><label>Plan</label><select name="plan" id="plan-select"></select></div>
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

    <div id="modal-user" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="margin-top:0;" id="user-modal-title">Add New User</h3>
        <form id="user-form" onsubmit="app.saveUser(event)">
          <input type="hidden" name="id" id="u-id">
          <label>Name</label><input name="name" id="u-name" required>
          <label>Email</label><input name="email" id="u-email" type="email" required>
          <label>Password <span style="font-weight:normal; font-size:11px; color:gray;" id="u-pass-hint"></span></label>
          <input name="password" id="u-password" type="password">
          
          <label>Role</label>
          <select name="role" id="u-role" onchange="app.togglePerms(this.value)">
             <option value="staff">Staff / Trainer</option>
             <option value="admin">Admin</option>
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

    <script>
      function toggleSidebar() { 
        document.querySelector('.sidebar').classList.toggle('open');
        document.querySelector('.overlay').classList.toggle('open');
      }

      const currentUser = {
         role: "${user.role}",
         permissions: ${user.permissions || '[]'}
      };

      const app = {
        data: null,
        userList: [],
        charts: { dues: null, attendance: null },

        async init() {
          const res = await fetch('/api/bootstrap');
          this.data = await res.json();
          this.render();
          this.applySettingsUI();
          
          // Initial Route logic based on permission
          if(this.can('attendance')) this.nav('attendance');
          else if(this.can('home')) this.nav('home');
          else if(this.can('members')) this.nav('members');
          else this.nav('home'); // Fallback

          // Load users if admin
          if(currentUser.role === 'admin') this.loadUsers();
        },
        
        can(perm) {
           return currentUser.role === 'admin' || currentUser.permissions.includes(perm);
        },

        nav(v) {
          if (v === 'users' && currentUser.role !== 'admin') return;
          if (v !== 'users' && !this.can(v)) {
             alert('You do not have access to this page.');
             return;
          }

          document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
          const navs = document.querySelectorAll('.nav .nav-item');
          navs.forEach(el => {
            if (el.textContent.toLowerCase().includes(v === 'home' ? 'overview' : v) ) el.classList.add('active');
            if (v === 'users' && el.textContent.includes('User')) el.classList.add('active');
          });
          
          ['home', 'members', 'attendance', 'history', 'payments', 'settings', 'users'].forEach(id => {
            const view = document.getElementById('view-'+id);
            if (view) view.classList.add('hidden');
          });
          document.getElementById('view-'+v).classList.remove('hidden');
          document.getElementById('page-title').textContent = v === 'home' ? 'Dashboard' : v.charAt(0).toUpperCase() + v.slice(1);
          
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.overlay').classList.remove('open');
        },

        render() {
          if(document.getElementById('stat-active')) {
            document.getElementById('stat-active').innerText = this.data.stats.active;
            document.getElementById('stat-today').innerText = this.data.stats.today;
            document.getElementById('stat-rev').innerText = this.data.stats.revenue || 0;
            document.getElementById('stat-due').innerText = this.data.stats.dueMembers || 0;
          }

          const tbody = document.getElementById('tbl-members');
          tbody.innerHTML = (this.data.members || []).map(m => {
            let statusBadge = '<span class="badge bg-green">Active</span>';
            if (m.status === 'due') statusBadge = '<span class="badge bg-amber">Due</span>';
            if (m.status === 'inactive') statusBadge = '<span class="badge bg-red">Inactive</span>';
            return \`<tr><td>#\${m.id}</td><td><strong>\${m.name}</strong></td><td>\${m.phone}</td><td>\${m.plan}</td><td>\${m.expiry_date ? m.expiry_date.split('T')[0] : '-'}</td><td>\${statusBadge}</td><td><button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="app.modals.pay.open(\${m.id})">$ Pay</button> <button class="btn btn-danger" style="padding:4px 10px; font-size:12px;" onclick="app.del(\${m.id})">Del</button></td></tr>\`;
          }).join('');

          const today = this.data.attendanceToday || [];
          const todayRows = today.length ? today.map(a => {
            const t = new Date(a.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const due = a.dueMonths > 0 ? a.dueMonths + ' Mo Due' : 'No due';
            const statusBadge = a.status === 'success' ? '<span class="badge bg-green">OK</span>' : '<span class="badge bg-red">Expired</span>';
            return \`<tr><td>\${t}</td><td>\${a.name}</td><td>\${statusBadge}</td><td>\${due}</td></tr>\`;
          }).join('') : '<tr><td colspan="4">No check-ins yet today.</td></tr>';
          document.getElementById('tbl-attendance-today').innerHTML = todayRows;

          this.renderHistoryTable(null);
          this.renderDuesTable();
          this.renderCharts();
        },

        renderDuesTable() {
           const duesTbody = document.getElementById('tbl-dues');
           const duesMembers = (this.data.members || []).filter(m => m.dueMonths && m.dueMonths > 0).sort((a,b) => (b.dueMonths || 0) - (a.dueMonths || 0));
           duesTbody.innerHTML = duesMembers.length ? duesMembers.map(m => {
             const statusBadge = m.status === 'inactive' ? '<span class="badge bg-red">Inactive</span>' : '<span class="badge bg-amber">Due</span>';
             return \`<tr><td>#\${m.id}</td><td>\${m.name}</td><td>\${m.plan}</td><td>\${m.expiry_date.split('T')[0]}</td><td>\${statusBadge}</td><td>\${m.dueMonths} Mo</td><td><button class="btn btn-outline" style="padding:4px 10px;" onclick="app.modals.pay.open(\${m.id})">Pay</button></td></tr>\`;
           }).join('') : '<tr><td colspan="7">No dues currently.</td></tr>';
        },

        renderHistoryTable(filterDate) {
          const tbody = document.getElementById('tbl-attendance-history');
          const history = this.data.attendanceHistory || [];
          let list = filterDate ? history.filter(a => a.check_in_time.startsWith(filterDate)) : history;
          if (!list.length) { tbody.innerHTML = '<tr><td colspan="5">No data.</td></tr>'; return; }
          tbody.innerHTML = list.map(a => {
            const d = new Date(a.check_in_time);
            return \`<tr><td>\${d.toISOString().split('T')[0]}</td><td>\${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td><td>\${a.name}</td><td>\${a.status==='success'?'<span class="badge bg-green">OK</span>':'<span class="badge bg-red">Expired</span>'}</td><td>\${a.dueMonths>0?a.dueMonths+' Mo':'No'}</td></tr>\`;
          }).join('');
        },

        renderCharts() {
          if (typeof Chart === 'undefined') return;
          const members = this.data.members || [];
          
          // Dues Chart
          if (this.charts.dues) this.charts.dues.destroy();
          const ctx1 = document.getElementById('chart-dues');
          if(ctx1) {
             this.charts.dues = new Chart(ctx1.getContext('2d'), {
               type: 'bar',
               data: {
                 labels: ['No Due', '1 Month', '2+ Months', 'Inactive'],
                 datasets: [{ label: 'Members', data: [
                   members.filter(m => !m.dueMonths || m.dueMonths <= 0).length,
                   members.filter(m => m.dueMonths === 1).length,
                   members.filter(m => m.dueMonths >= 2 && m.status !== 'inactive').length,
                   members.filter(m => m.status === 'inactive').length
                 ], backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'] }]
               },
               options: { plugins: { legend: { display: false } } }
             });
          }

          // Attendance Chart
          if (this.charts.attendance) this.charts.attendance.destroy();
          const history = this.data.attendanceHistory || [];
          const labels = [], counts = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString(undefined, {weekday:'short'}));
            counts.push(history.filter(h => h.check_in_time.startsWith(iso)).length);
          }
          const ctx2 = document.getElementById('chart-attendance');
          if(ctx2) {
            this.charts.attendance = new Chart(ctx2.getContext('2d'), {
               type: 'line',
               data: { labels, datasets: [{ label: 'Visits', data: counts, borderColor: '#6366f1', tension: 0.3 }] },
               options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, precision:0 } } }
            });
          }
        },

        /* --- USER MANAGEMENT --- */
        async loadUsers() {
           const res = await fetch('/api/users/list');
           if(res.ok) {
             const data = await res.json();
             this.userList = data.users;
             this.renderUserTable();
           }
        },

        renderUserTable() {
           const tbody = document.getElementById('tbl-users');
           tbody.innerHTML = this.userList.map(u => {
              const perms = u.role === 'admin' ? 'ALL' : (JSON.parse(u.permissions || '[]').join(', ') || 'None');
              const roleBadge = u.role === 'admin' ? '<span class="badge bg-blue">Admin</span>' : '<span class="badge bg-green">Staff</span>';
              return \`<tr><td>#\${u.id}</td><td>\${u.name}</td><td>\${u.email}</td><td>\${roleBadge}</td><td style="white-space:normal; max-width:200px;">\${perms}</td>
              <td>
                <button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="app.editUser(\${u.id})">Edit</button>
                <button class="btn btn-danger" style="padding:4px 10px; font-size:12px;" onclick="app.deleteUser(\${u.id})">Del</button>
              </td></tr>\`;
           }).join('');
        },

        editUser(id) {
           const u = this.userList.find(x => x.id === id);
           if(!u) return;
           document.getElementById('user-modal-title').innerText = "Edit User";
           document.getElementById('u-id').value = u.id;
           document.getElementById('u-name').value = u.name;
           document.getElementById('u-email').value = u.email;
           document.getElementById('u-password').required = false;
           document.getElementById('u-pass-hint').innerText = "(Leave blank to keep current)";
           document.getElementById('u-role').value = u.role;
           
           // Set permissions
           const perms = JSON.parse(u.permissions || '[]');
           document.querySelectorAll('input[name="permissions"]').forEach(cb => {
              cb.checked = perms.includes(cb.value);
           });
           
           this.togglePerms(u.role);
           app.modals.user.open();
        },

        togglePerms(role) {
           const container = document.getElementById('u-perms-container');
           if(role === 'admin') container.classList.add('hidden');
           else container.classList.remove('hidden');
        },

        async saveUser(e) {
           e.preventDefault();
           const formData = new FormData(e.target);
           const data = Object.fromEntries(formData);
           
           // Collect checked permissions
           const perms = [];
           document.querySelectorAll('input[name="permissions"]:checked').forEach(cb => perms.push(cb.value));
           data.permissions = perms;

           const isEdit = !!data.id;
           const url = isEdit ? '/api/users/update' : '/api/users/add';
           
           const res = await fetch(url, { 
             method: 'POST', 
             body: JSON.stringify(data)
           });
           
           if(res.ok) {
             app.modals.user.close();
             this.loadUsers();
           } else {
             const json = await res.json();
             alert(json.error || 'Failed');
           }
        },

        async deleteUser(id) {
           if(!confirm("Are you sure you want to delete this user?")) return;
           const res = await fetch('/api/users/delete', { method:'POST', body:JSON.stringify({id})});
           if(res.ok) this.loadUsers();
           else alert("Failed to delete");
        },

        /* --- UI LOGIC --- */
        applySettingsUI() {
          const settings = this.data.settings || {};
          const form = document.getElementById('settings-form');
          if (form) {
            form.querySelector('input[name="attendanceThreshold"]').value = settings.attendanceThreshold || 3;
            form.querySelector('input[name="inactiveAfterMonths"]').value = settings.inactiveAfterMonths || 3;
            form.querySelector('input[name="membershipPlans"]').value = (settings.membershipPlans || ['Standard','Premium']).join(', ');
          }
          const select = document.getElementById('plan-select');
          if (select) select.innerHTML = (settings.membershipPlans || ['Standard','Premium']).map(p => '<option>'+p+'</option>').join('');
        },

        async saveSettings(e) {
          e.preventDefault();
          const form = e.target;
          const statusEl = document.getElementById('settings-status');
          statusEl.textContent = 'Saving...';
          const res = await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({
              attendanceThreshold: form.querySelector('input[name="attendanceThreshold"]').value,
              inactiveAfterMonths: form.querySelector('input[name="inactiveAfterMonths"]').value,
              membershipPlans: form.querySelector('input[name="membershipPlans"]').value
            })
          });
          if (res.ok) setTimeout(() => location.reload(), 600);
          else statusEl.textContent = 'Failed';
        },

        // Checkin Search logic
        onCheckinInput(event) {
          const val = event.target.value;
          if (this.searchTimeout) clearTimeout(this.searchTimeout);
          this.searchTimeout = setTimeout(async () => {
             const box = document.getElementById('checkin-suggestions');
             if(!val.trim()) { box.innerHTML = ''; return; }
             const res = await fetch('/api/members/search', { method:'POST', body:JSON.stringify({query:val})});
             const data = await res.json();
             if(!data.results.length) { box.innerHTML = '<div class="checkin-item">No matches</div>'; return; }
             box.innerHTML = data.results.map(m => \`<div class="checkin-item" onclick="document.getElementById('checkin-id').value=\${m.id}; document.getElementById('checkin-suggestions').innerHTML=''; document.getElementById('checkin-id').focus();"><strong>#\${m.id} · \${m.name}</strong></div>\`).join('');
          }, 200);
          if (event.key === 'Enter') this.checkIn();
        },

        async checkIn() {
          const id = document.getElementById('checkin-id').value.trim();
          const div = document.getElementById('checkin-res');
          div.innerText = "Checking...";
          const res = await fetch('/api/checkin', { method:'POST', body:JSON.stringify({memberId: id}) });
          const json = await res.json();
          div.style.color = json.status === 'success' ? 'var(--success)' : 'var(--danger)';
          div.innerText = json.status === 'success' ? '✅ Welcome ' + json.name : (json.error || '⛔ Error');
          if(json.status === 'success') setTimeout(() => location.reload(), 800);
        },

        // Other Actions
        async addMember(e) { e.preventDefault(); await fetch('/api/members/add', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) }); location.reload(); },
        async pay(e) { e.preventDefault(); await fetch('/api/payment', { method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target))) }); location.reload(); },
        async del(id) { if(!confirm("Delete?")) return; await fetch('/api/members/delete', { method:'POST', body:JSON.stringify({id}) }); location.reload(); },
        filter() { const q = document.getElementById('search').value.toLowerCase(); document.querySelectorAll('#tbl-members tr').forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none'); },
        applyHistoryFilter() { this.renderHistoryTable(document.getElementById('history-date').value); },
        clearHistoryFilter() { document.getElementById('history-date').value=''; this.renderHistoryTable(null); },

        onPaymentSearchInput(event) {
          const val = event.target.value;
          if (this.paymentSearchTimeout) clearTimeout(this.paymentSearchTimeout);
          this.paymentSearchTimeout = setTimeout(async () => {
             const box = document.getElementById('pay-search-results');
             if(!val.trim()) { box.innerHTML = ''; return; }
             const res = await fetch('/api/members/search', { method:'POST', body:JSON.stringify({query:val})});
             const data = await res.json();
             if(!data.results.length) { box.innerHTML = '<div class="checkin-item">No matches</div>'; return; }
             box.innerHTML = data.results.map(m => {
               const due = m.dueMonths > 0 ? m.dueMonths + ' Mo Due' : 'No due';
               return \`<div class="checkin-item" onclick="app.modals.pay.open(\${m.id})"><strong>#\${m.id} · \${m.name}</strong><small>\${due} · Tap to pay</small></div>\`;
             }).join('');
          }, 200);
        },

        modals: {
          checkin: { open:()=>{ document.getElementById('modal-checkin').style.display='flex'; document.getElementById('checkin-id').value=''; document.getElementById('checkin-suggestions').innerHTML=''; document.getElementById('checkin-id').focus(); }, close:()=>document.getElementById('modal-checkin').style.display='none' },
          add: { open:()=>document.getElementById('modal-add').style.display='flex', close:()=>document.getElementById('modal-add').style.display='none' },
          pay: { open:(id)=>{ const m = app.data.members.find(x=>x.id===id); document.getElementById('pay-id').value=id; document.getElementById('pay-name').innerText = m ? ('Taking payment for: ' + m.name) : ''; document.getElementById('modal-pay').style.display='flex'; }, close:()=>document.getElementById('modal-pay').style.display='none' },
          user: { 
             open:()=> { 
                document.getElementById('modal-user').style.display='flex'; 
                document.getElementById('user-modal-title').innerText="Add New User";
                document.getElementById('user-form').reset();
                document.getElementById('u-id').value = "";
                document.getElementById('u-password').required = true;
                document.getElementById('u-pass-hint').innerText = "";
                document.getElementById('u-perms-container').classList.remove('hidden');
             }, 
             close:()=>document.getElementById('modal-user').style.display='none' 
          }
        }
      };
      
      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
