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

const ALL_MENUS = [
  "home",
  "members",
  "attendance",
  "history",
  "payments",
  "settings",
];

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

function normalizeMenus(raw: any): string[] {
  const ensureValid = (arr: any[]) =>
    arr
      .map((x) => String(x).trim())
      .filter((x) => ALL_MENUS.includes(x));

  if (!raw) return [...ALL_MENUS];
  if (Array.isArray(raw)) {
    const arr = ensureValid(raw);
    return arr.length ? arr : [...ALL_MENUS];
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const arr = ensureValid(parsed);
        return arr.length ? arr : [...ALL_MENUS];
      }
    } catch {}

    const arr = ensureValid(raw.split(","));
    return arr.length ? arr : [...ALL_MENUS];
  }

  return [...ALL_MENUS];
}

function hasPermission(user: any, menu: string | string[]): boolean {
  const menus = Array.isArray(menu) ? menu : [menu];
  const allowed = normalizeMenus(user?.permissions);
  return menus.some((m) => allowed.includes(m));
}

/** Calculate how many months are due based on expiry date vs now.
 *  - returns 0 => no due
 *  - >=1 => that many months due
 *  - null => no expiry / invalid date
 */
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
    
    .logo { padding: 24px; font-size: 20px; font-weight: 700; border-bottom: 1px solid #1f2937; letter-spacing: -0.5px; }
    .nav { padding: 16px; flex: 1; }
    .nav-item { padding: 12px 16px; border-radius: 8px; color: #9ca3af; cursor: pointer; margin-bottom: 4px; transition: 0.2s; font-weight: 500; display: flex; align-items: center; gap: 10px; }
    .nav-item:hover, .nav-item.active { background: #1f2937; color: white; }
    .user-footer { padding: 20px; border-top: 1px solid #1f2937; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
    .modal-content { background: white; width: 100%; max-width: 440px; padding: 24px; border-radius: 16px; animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
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
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT, permissions TEXT)`,
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

  try {
    await env.DB.prepare("ALTER TABLE users ADD COLUMN permissions TEXT").run();
  } catch {}
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
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, 'admin', ?)")
          .bind(email, hash, body.adminName, JSON.stringify(ALL_MENUS)).run();
          
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

      // PRINTABLE DUE LIST (HTML → user prints to PDF)
      if (url.pathname === "/dues/print") {
        const gymRow = await env.DB.prepare("SELECT value FROM config WHERE key='gym_name'").first<any>();
        const gymName = (gymRow && gymRow.value) || "Gym OS";

        const resMembers = await env.DB.prepare("SELECT * FROM members ORDER BY id").all<any>();
        const members = resMembers.results || [];
        const processed = members.map((m: any) => ({
          ...m,
          dueMonths: calcDueMonths(m.expiry_date as string | null)
        })).filter((m: any) => m.dueMonths && m.dueMonths > 0)
          .sort((a: any, b: any) => (b.dueMonths || 0) - (a.dueMonths || 0));

        const todayStr = new Date().toISOString().split("T")[0];

        const rowsHtml = processed.length
          ? processed.map((m: any) => {
              const exp = m.expiry_date ? m.expiry_date.split("T")[0] : "-";
              const dueText = m.dueMonths + " month" + (m.dueMonths > 1 ? "s" : "") + " due";
              const status = (m.status || "due").toUpperCase();
              return `
                <tr>
                  <td>#${m.id}</td>
                  <td>${m.name}</td>
                  <td>${m.phone || "-"}</td>
                  <td>${m.plan || "-"}</td>
                  <td>${exp}</td>
                  <td>${status}</td>
                  <td>${dueText}</td>
                </tr>`;
            }).join("")
          : `<tr><td colspan="7" style="text-align:center; padding:24px;">No members with due right now.</td></tr>`;

        const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Due Members Report - ${gymName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      margin: 0;
      padding: 32px;
      background: #f9fafb;
      color: #111827;
    }
    .report-wrapper {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      padding: 28px 32px;
      box-shadow: 0 10px 40px rgba(15,23,42,0.12);
      border: 1px solid #e5e7eb;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 16px;
    }
    .report-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #111827;
    }
    .report-meta {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }
    .badge-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .08em;
      background: #eff6ff;
      color: #1d4ed8;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 13px;
    }
    th, td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #6b7280;
      background: #f9fafb;
    }
    tr:nth-child(even) td {
      background: #f9fafb;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .footer-note {
      margin-top: 18px;
      font-size: 11px;
      color: #9ca3af;
      text-align: right;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .report-wrapper {
        box-shadow: none;
        border-radius: 0;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="report-wrapper">
    <div class="report-header">
      <div>
        <div class="report-title">${gymName}</div>
        <div class="badge-pill">Due Members Report</div>
      </div>
      <div class="report-meta">
        Generated on: ${todayStr}<br>
        Generated by: ${user.name || "Gym Staff"}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Member Name</th>
          <th>Phone</th>
          <th>Plan</th>
          <th>Expiry</th>
          <th>Status</th>
          <th>Due</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="footer-note">
      Tip: Use your browser's <strong>Print → Save as PDF</strong> to export this report.
    </div>
  </div>
</body>
</html>`;

        return new Response(html, { headers: { "Content-Type": "text/html" } });
      }

      // member live search
      if (url.pathname === "/api/members/search" && req.method === "POST") {
        if (!hasPermission(user, ["attendance", "members"])) return json({ error: "Forbidden" }, 403);
        const body = await req.json() as any;
        const qRaw = (body.query || "").toString().trim();
        if (!qRaw) return json({ results: [] });

        const maybeId = Number(qRaw);
        let res;

        if (!isNaN(maybeId)) {
          res = await env.DB.prepare(`
            SELECT id, name, phone, plan, expiry_date 
            FROM members
            WHERE id = ? OR name LIKE ? OR phone LIKE ?
            ORDER BY id DESC
            LIMIT 10
          `).bind(maybeId, `%${qRaw}%`, `%${qRaw}%`).all();
        } else {
          res = await env.DB.prepare(`
            SELECT id, name, phone, plan, expiry_date 
            FROM members
            WHERE name LIKE ? OR phone LIKE ?
            ORDER BY id DESC
            LIMIT 10
          `).bind(`%${qRaw}%`, `%${qRaw}%`).all();
        }

        const results = (res.results || []).map((m: any) => ({
          ...m,
          dueMonths: calcDueMonths(m.expiry_date as string | null)
        }));
        return json({ results });
      }

      // bootstrap data
      if (url.pathname === "/api/bootstrap") {
        const allowedMenus = normalizeMenus(user.permissions);
        const configRows = await env.DB.prepare("SELECT key, value FROM config").all<any>();
        const config: Record<string, string> = {};
        for (const row of configRows.results || []) {
          config[row.key] = row.value;
        }

        const attendanceThreshold = parseInt(config["attendance_threshold_days"] || "3", 10);
        const inactiveAfterMonths = parseInt(config["inactive_after_due_months"] || "3", 10);
        let membershipPlans: string[];
        try {
          membershipPlans = config["membership_plans"]
            ? JSON.parse(config["membership_plans"])
            : ["Standard", "Premium"];
        } catch {
          membershipPlans = ["Standard", "Premium"];
        }

        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all<any>();
        const membersProcessed: any[] = [];

        let activeCount = 0;
        let dueMembersCount = 0;
        let inactiveMembersCount = 0;
        let totalDueMonths = 0;

        for (const m of membersRaw.results || []) {
          const dueMonths = calcDueMonths(m.expiry_date as string | null);
          let newStatus = m.status || "active";

          if (dueMonths != null && dueMonths >= inactiveAfterMonths) {
            newStatus = "inactive";
            inactiveMembersCount++;
          } else if (dueMonths != null && dueMonths > 0) {
            newStatus = "due";
            dueMembersCount++;
          } else {
            newStatus = "active";
            activeCount++;
          }

          if (dueMonths && dueMonths > 0) totalDueMonths += dueMonths;

          if (newStatus !== m.status) {
            await env.DB.prepare("UPDATE members SET status = ? WHERE id = ?")
              .bind(newStatus, m.id)
              .run();
          }

          membersProcessed.push({
            ...m,
            status: newStatus,
            dueMonths,
          });
        }

        const attendanceToday = await env.DB.prepare(`
          SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date
          FROM attendance a 
          JOIN members m ON a.member_id = m.id 
          WHERE date(a.check_in_time) = date('now')
          ORDER BY a.id DESC
        `).all<any>();

        const attendanceHistory = await env.DB.prepare(`
          SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date
          FROM attendance a 
          JOIN members m ON a.member_id = m.id 
          ORDER BY a.id DESC
        `).all<any>();
        
        const todayVisits = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = date('now')").first<any>();
        const revenue = await env.DB.prepare("SELECT sum(amount) as t FROM payments").first<any>();

        const attendanceTodayWithDue = (attendanceToday.results || []).map((r: any) => ({
          ...r,
          dueMonths: calcDueMonths(r.expiry_date as string | null)
        }));
        const attendanceHistoryWithDue = (attendanceHistory.results || []).map((r: any) => ({
          ...r,
          dueMonths: calcDueMonths(r.expiry_date as string | null)
        }));
        
        const payload: any = {
          user: { ...user, permissions: allowedMenus },
          members: membersProcessed,
          attendanceToday: attendanceTodayWithDue,
          attendanceHistory: attendanceHistoryWithDue,
          stats: {
            active: activeCount,
            today: todayVisits?.c || 0,
            revenue: revenue?.t || 0,
            dueMembers: dueMembersCount,
            inactiveMembers: inactiveMembersCount,
            totalDueMonths
          },
          allowedMenus,
          settings: {
            attendanceThreshold,
            inactiveAfterMonths,
            membershipPlans
          }
        };

        if (user.role === "admin") {
          const team = await env.DB.prepare("SELECT id, name, email, role, permissions FROM users ORDER BY id").all<any>();
          payload.teamUsers = (team.results || []).map((u: any) => ({
            ...u,
            permissions: normalizeMenus(u.permissions)
          }));
        }

        return json(payload);
      }

      if (url.pathname === "/api/members/add" && req.method === "POST") {
        if (!hasPermission(user, "members")) return json({ error: "Forbidden" }, 403);
        const body = await req.json() as any;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + parseInt(body.duration));
        
        await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date) VALUES (?, ?, ?, ?, ?)")
          .bind(body.name, body.phone, body.plan, new Date().toISOString(), expiry.toISOString()).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/checkin" && req.method === "POST") {
        if (!hasPermission(user, "attendance")) return json({ error: "Forbidden" }, 403);
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        if (!member) return json({ error: "Member not found" }, 404);

        const alreadyToday = await env.DB.prepare(`
          SELECT id FROM attendance
          WHERE member_id = ? AND date(check_in_time) = date('now')
          LIMIT 1
        `).bind(memberId).first<any>();

        if (alreadyToday) {
          return json({ error: "Already checked in today", code: "DUPLICATE" }, 400);
        }
        
        const isExpired = new Date(member.expiry_date) < new Date();
        const status = isExpired ? 'expired' : 'success';
        
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)")
          .bind(memberId, new Date().toISOString(), status).run();
        return json({ success: true, status, name: member.name, isExpired });
      }

      if (url.pathname === "/api/payment" && req.method === "POST") {
        if (!hasPermission(user, "payments")) return json({ error: "Forbidden" }, 403);
        const { memberId, amount, months } = await req.json() as any;
        
        await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)")
          .bind(memberId, amount, new Date().toISOString()).run();
        
        const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
        let newDate = new Date(member.expiry_date);
        if (newDate < new Date()) newDate = new Date();
        newDate.setMonth(newDate.getMonth() + parseInt(months));
        
        await env.DB.prepare("UPDATE members SET expiry_date = ?, status = 'active' WHERE id = ?")
          .bind(newDate.toISOString(), memberId).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/members/delete" && req.method === "POST") {
        if (!hasPermission(user, "members")) return json({ error: "Forbidden" }, 403);
        const { id } = await req.json() as any;
        await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM attendance WHERE member_id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM payments WHERE member_id = ?").bind(id).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/settings" && req.method === "POST") {
        if (!hasPermission(user, "settings")) return json({ error: "Forbidden" }, 403);
        const body = await req.json() as any;
        const attendanceThreshold = parseInt(body.attendanceThreshold) || 3;
        const inactiveAfterMonths = parseInt(body.inactiveAfterMonths) || 3;
        let membershipPlans: string[];

        if (Array.isArray(body.membershipPlans)) {
          membershipPlans = body.membershipPlans.map((x: any) => String(x).trim()).filter(Boolean);
        } else if (typeof body.membershipPlans === "string") {
          membershipPlans = body.membershipPlans.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else {
          membershipPlans = ["Standard", "Premium"];
        }

        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('attendance_threshold_days', ?)").bind(String(attendanceThreshold)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('inactive_after_due_months', ?)").bind(String(inactiveAfterMonths)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(JSON.stringify(membershipPlans)).run();

        return json({ success: true });
      }

      if (url.pathname === "/api/users" && req.method === "GET") {
        if (user.role !== "admin") return json({ error: "Forbidden" }, 403);
        const team = await env.DB.prepare("SELECT id, name, email, role, permissions FROM users ORDER BY id").all<any>();
        return json({
          users: (team.results || []).map((u: any) => ({
            ...u,
            permissions: normalizeMenus(u.permissions)
          }))
        });
      }

      if (url.pathname === "/api/users" && req.method === "POST") {
        if (user.role !== "admin") return json({ error: "Forbidden" }, 403);
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        const name = (body.name || "").trim();
        const role = body.role === "admin" ? "admin" : "staff";
        const password = body.password || "";
        const permissions = normalizeMenus(body.permissions);

        if (!email || !password || !name) return json({ error: "Missing fields" }, 400);

        const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first<any>();
        if (exists) return json({ error: "Email already in use" }, 400);

        const hash = await hashPassword(password);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, ?, ?)")
          .bind(email, hash, name, role, JSON.stringify(permissions))
          .run();

        return json({ success: true });
      }

      if (url.pathname === "/api/users/update" && req.method === "POST") {
        if (user.role !== "admin") return json({ error: "Forbidden" }, 403);
        const body = await req.json() as any;
        const id = parseInt(body.id);
        if (!id) return json({ error: "Invalid user" }, 400);

        const permissions = normalizeMenus(body.permissions);
        const role = body.role === "admin" ? "admin" : "staff";
        const name = (body.name || "").trim();

        await env.DB.prepare("UPDATE users SET permissions = ?, role = ?, name = COALESCE(?, name) WHERE id = ?")
          .bind(JSON.stringify(permissions), role, name || null, id)
          .run();

        if (body.password) {
          const hash = await hashPassword(body.password);
          await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?")
            .bind(hash, id)
            .run();
        }

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
  return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?")
    .bind(token)
    .first();
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
  const html = `${baseHead("Dashboard")}
  <body>
    <div class="app-layout">
      <div class="mobile-header">
         <div style="font-weight:bold;">Gym OS</div>
         <button class="btn btn-outline" onclick="toggleSidebar()">☰</button>
      </div>
      <div class="overlay" onclick="toggleSidebar()"></div>

      <aside class="sidebar">
        <div class="logo">💪 Gym OS <span style="font-size:10px; font-weight:normal; opacity:0.7; margin-left:5px;">v2.3</span></div>
        <div class="nav" id="nav-list"></div>
        <div class="user-footer">
          <div style="font-weight:600;">${user.name}</div>
          <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">${user.role.toUpperCase()}</div>
          <a href="/api/logout" style="color:#fca5a5; font-size:12px; text-decoration:none;">Sign Out &rarr;</a>
        </div>
      </aside>

      <main class="main-content">
        <div class="flex-between" style="padding: 24px 24px 0 24px;">
           <h2 id="page-title" style="margin:0;">Today</h2>
           <button class="btn btn-primary" id="quick-checkin" onclick="app.modals.checkin.open()">⚡ Quick Check-In</button>
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
              <div class="stat-card">
                <span class="stat-label">Inactive Members</span>
                <span class="stat-val" id="stat-inactive">--</span>
              </div>
            </div>

            <div class="card">
              <div class="flex-between" style="margin-bottom:15px;">
                 <h3 style="margin:0;">Dues Overview</h3>
              </div>
              <canvas id="chart-dues" height="120"></canvas>
            </div>

            <div class="card">
              <div class="flex-between" style="margin-bottom:15px;">
                 <h3 style="margin:0;">Attendance (Last 7 Days)</h3>
              </div>
              <canvas id="chart-attendance" height="120"></canvas>
            </div>
            
            <div class="card">
              <div class="flex-between" style="margin-bottom:15px;">
                 <h3 style="margin:0;">Recent Activity (Today)</h3>
                 <button class="btn btn-outline" style="font-size:12px;" onclick="app.nav('attendance')">View Today</button>
              </div>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>Time</th><th>Name</th><th>Result</th><th>Due</th></tr></thead>
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

          <div id="view-attendance">
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
              <h3>Payments & Dues</h3>
              <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">
                Use search below to find a member and collect fees. Members with the worst due condition are listed in the table.
              </p>
              <div class="stats-grid">
                <div class="stat-card">
                  <span class="stat-label">Members With Due</span>
                  <span class="stat-val" id="pay-stat-due">--</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Inactive Members</span>
                  <span class="stat-val" id="pay-stat-inactive">--</span>
                </div>
                <div class="stat-card">
                  <span class="stat-label">Total Due Months</span>
                  <span class="stat-val" id="pay-stat-totaldue">--</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="flex-between" style="margin-bottom:10px;">
                <h3 style="margin:0;">Search Member for Payment</h3>
              </div>
              <input id="pay-search" placeholder="Search by ID, name or phone..." style="margin-bottom:0;" onkeyup="app.onPaymentSearchInput(event)">
              <div id="pay-search-results" class="checkin-results" style="margin-top:10px;"></div>
            </div>

            <div class="card">
              <div class="flex-between" style="margin-bottom:10px;">
                <h3 style="margin:0;">Worst Dues (Most Critical Members)</h3>
                <button class="btn btn-outline" style="font-size:12px; padding:6px 10px;" onclick="window.open('/dues/print','_blank')">
                  Print Due List (PDF)
                </button>
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
              <p style="color:var(--text-muted); font-size:13px; margin-bottom:20px;">
                Configure billing logic and membership plans. Dues and inactive status are auto-calculated from expiry and your rules.
              </p>
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

            <div class="card" id="team-card" style="display:none;">
              <div class="flex-between" style="align-items:flex-start;">
                <div>
                  <h3 style="margin:0;">Team Access</h3>
                  <p style="color:var(--text-muted); font-size:13px; margin-top:6px;">
                    Add new staff accounts and control which menus are visible to them.
                  </p>
                </div>
                <span id="user-status" style="font-size:12px; color:var(--text-muted);"></span>
              </div>

              <form id="user-form" onsubmit="app.createUser(event)" style="margin-bottom:18px;">
                <div class="flex" style="gap:12px;">
                  <div class="w-full">
                    <label>Name</label><input name="name" required placeholder="Staff name">
                  </div>
                  <div class="w-full">
                    <label>Email</label><input name="email" type="email" required placeholder="staff@gym.com">
                  </div>
                </div>
                <div class="flex" style="gap:12px;">
                  <div class="w-full">
                    <label>Password</label><input name="password" type="password" required placeholder="Set password">
                  </div>
                  <div class="w-full">
                    <label>Role</label>
                    <select name="role">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div style="margin-bottom:12px;">
                  <label>Allowed Menus</label>
                  <div id="user-perms-new" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:4px;"></div>
                </div>
                <div class="flex" style="justify-content:flex-end; gap:10px;">
                  <button type="reset" class="btn btn-outline">Clear</button>
                  <button type="submit" class="btn btn-primary">Add User</button>
                </div>
              </form>

              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Menus</th>
                      <th style="width:140px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="tbl-users">
                    <tr><td colspan="4" style="text-align:center; padding:14px; color:var(--text-muted);">Loading team...</td></tr>
                  </tbody>
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
        <input 
          id="checkin-id" 
          type="text" 
          placeholder="Search by ID, name or phone" 
          style="font-size:18px; padding:15px; text-align:center;" 
          autofocus
          onkeyup="app.onCheckinInput(event)"
        >
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
            <div class="w-full">
              <label>Plan</label>
              <select name="plan" id="plan-select"></select>
            </div>
            <div class="w-full">
              <label>Months</label><input name="duration" type="number" value="1" required>
            </div>
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
        allowedMenus: [],
        teamUsers: [],
        searchTimeout: null,
        paymentSearchTimeout: null,
        charts: { dues: null, attendance: null },
        menuConfig: [
          { id: 'home', label: 'Overview', icon: '📊' },
          { id: 'members', label: 'Members', icon: '👥' },
          { id: 'attendance', label: 'Today', icon: '⏰' },
          { id: 'history', label: 'History', icon: '📜' },
          { id: 'payments', label: 'Payments', icon: '💵' },
          { id: 'settings', label: 'Settings', icon: '⚙' }
        ],

        async init() {
          const res = await fetch('/api/bootstrap');
          this.data = await res.json();
          this.allowedMenus = (this.data.allowedMenus && this.data.allowedMenus.length)
            ? this.data.allowedMenus
            : this.menuConfig.map(m => m.id);
          this.teamUsers = this.data.teamUsers || [];
          this.renderNav();
          this.render();
          this.applySettingsUI();
          this.renderTeam();
          this.toggleQuickCheckin();
          const defaultNav = this.allowedMenus.includes('attendance') ? 'attendance' : (this.allowedMenus[0] || 'home');
          this.nav(defaultNav); // default: today's attendance or first allowed
        },

        nav(v) {
          if (!this.allowedMenus.includes(v)) return;
          document.querySelectorAll('#nav-list .nav-item').forEach(e => e.classList.remove('active'));
          const navs = document.querySelectorAll('#nav-list .nav-item');
          navs.forEach(el => {
            if (el.dataset.nav === v) el.classList.add('active');
          });

          this.menuConfig.map(m => m.id).forEach(id => {
            const view = document.getElementById('view-'+id);
            if (view) view.classList.add('hidden');
          });
          document.getElementById('view-'+v).classList.remove('hidden');
          document.getElementById('page-title').textContent =
            v === 'home' ? 'Dashboard' : v.charAt(0).toUpperCase() + v.slice(1);
          
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.overlay').classList.remove('open');
        },

        renderNav() {
          const nav = document.getElementById('nav-list');
          if (!nav) return;
          nav.innerHTML = this.menuConfig
            .filter(item => this.allowedMenus.includes(item.id))
            .map(item => {
              return '<div class="nav-item" data-nav="' + item.id +
                '" onclick="app.nav(\\'' + item.id + '\\')">' + item.icon + ' ' + item.label + '</div>';
            })
            .join('');
        },

        render() {
          document.getElementById('stat-active').innerText = this.data.stats.active;
          document.getElementById('stat-today').innerText = this.data.stats.today;
          document.getElementById('stat-rev').innerText = this.data.stats.revenue || 0;
          document.getElementById('stat-due').innerText = this.data.stats.dueMembers || 0;
          document.getElementById('stat-inactive').innerText = this.data.stats.inactiveMembers || 0;

          document.getElementById('pay-stat-due').innerText = this.data.stats.dueMembers || 0;
          document.getElementById('pay-stat-inactive').innerText = this.data.stats.inactiveMembers || 0;
          document.getElementById('pay-stat-totaldue').innerText = this.data.stats.totalDueMonths || 0;

          const tbody = document.getElementById('tbl-members');
          tbody.innerHTML = (this.data.members || []).map(m => {
            let statusBadge = '<span class="badge bg-green">Active</span>';
            if (m.status === 'due') statusBadge = '<span class="badge bg-amber">Due</span>';
            if (m.status === 'inactive') statusBadge = '<span class="badge bg-red">Inactive</span>';
            return '<tr>' +
              '<td>#' + m.id + '</td>' +
              '<td><strong>' + m.name + '</strong></td>' +
              '<td>' + m.phone + '</td>' +
              '<td>' + m.plan + '</td>' +
              '<td>' + (m.expiry_date ? m.expiry_date.split('T')[0] : '-') + '</td>' +
              '<td>' + statusBadge + '</td>' +
              '<td>' +
                '<button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="app.modals.pay.open(' + m.id + ')">$ Pay</button>' +
                '<button class="btn btn-danger" style="padding:4px 10px; font-size:12px;" onclick="app.del(' + m.id + ')">Del</button>' +
              '</td>' +
            '</tr>';
          }).join('');

          const today = this.data.attendanceToday || [];
          const history = this.data.attendanceHistory || [];

          const todayRows = today.length ? today.map(a => {
            const t = new Date(a.check_in_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const due = a.dueMonths == null
              ? '-'
              : (a.dueMonths <= 0 ? 'No due' : a.dueMonths + ' month' + (a.dueMonths > 1 ? 's' : '') + ' due');
            const statusBadge = a.status === 'success'
              ? '<span class="badge bg-green">OK</span>'
              : '<span class="badge bg-red">Expired</span>';
            return '<tr>' +
              '<td>' + t + '</td>' +
              '<td>' + a.name + '</td>' +
              '<td>' + statusBadge + '</td>' +
              '<td>' + due + '</td>' +
            '</tr>';
          }).join('') : '<tr><td colspan="4">No check-ins yet today.</td></tr>';

          document.getElementById('tbl-attendance-recent').innerHTML = todayRows;
          document.getElementById('tbl-attendance-today').innerHTML = todayRows;

          this.renderHistoryTable(null);

          const duesTbody = document.getElementById('tbl-dues');
          const duesMembers = (this.data.members || [])
            .filter(m => m.dueMonths && m.dueMonths > 0)
            .sort((a,b) => (b.dueMonths || 0) - (a.dueMonths || 0));
          duesTbody.innerHTML = duesMembers.length ? duesMembers.map(m => {
            const dueText = m.dueMonths + ' month' + (m.dueMonths > 1 ? 's' : '') + ' due';
            let statusBadge = '<span class="badge bg-amber">Due</span>';
            if (m.status === 'inactive') statusBadge = '<span class="badge bg-red">Inactive</span>';
            return '<tr>' +
              '<td>#' + m.id + '</td>' +
              '<td>' + m.name + '</td>' +
              '<td>' + m.plan + '</td>' +
              '<td>' + (m.expiry_date ? m.expiry_date.split('T')[0] : '-') + '</td>' +
              '<td>' + statusBadge + '</td>' +
              '<td>' + dueText + '</td>' +
              '<td><button class="btn btn-outline" style="padding:4px 10px; font-size:12px;" onclick="app.modals.pay.open(' + m.id + ')">$ Pay</button></td>' +
            '</tr>';
          }).join('') : '<tr><td colspan="7">No dues currently.</td></tr>';

          this.renderCharts();
        },

        renderHistoryTable(filterDate) {
          const tbody = document.getElementById('tbl-attendance-history');
          const history = this.data.attendanceHistory || [];
          let list = history;
          if (filterDate) {
            list = history.filter(a => a.check_in_time && a.check_in_time.startsWith(filterDate));
          }

          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5">No attendance for selected date.</td></tr>';
            return;
          }

          const rows = list.map(a => {
            const d = new Date(a.check_in_time);
            const dateStr = d.toISOString().split('T')[0];
            const timeStr = d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
            const due = a.dueMonths == null 
              ? '-' 
              : (a.dueMonths <= 0 ? 'No due' : a.dueMonths + ' month' + (a.dueMonths > 1 ? 's' : '') + ' due');
            const statusBadge = a.status === 'success' 
              ? '<span class="badge bg-green">OK</span>' 
              : '<span class="badge bg-red">Expired</span>';
            return '<tr>' +
              '<td>' + dateStr + '</td>' +
              '<td>' + timeStr + '</td>' +
              '<td>' + a.name + '</td>' +
              '<td>' + statusBadge + '</td>' +
              '<td>' + due + '</td>' +
            '</tr>';
          }).join('');
          tbody.innerHTML = rows;
        },

        applyHistoryFilter() {
          const input = document.getElementById('history-date');
          const val = input && input.value ? input.value : null;
          this.renderHistoryTable(val);
        },

        clearHistoryFilter() {
          const input = document.getElementById('history-date');
          if (input) input.value = '';
          this.renderHistoryTable(null);
        },

        renderCharts() {
          if (typeof Chart === 'undefined') return;

          const members = this.data.members || [];
          const noDue = members.filter(m => !m.dueMonths || m.dueMonths <= 0).length;
          const due1 = members.filter(m => m.dueMonths === 1).length;
          const due2plus = members.filter(m => m.dueMonths >= 2 && m.status !== 'inactive').length;
          const inactive = members.filter(m => m.status === 'inactive').length;

          const ctx1El = document.getElementById('chart-dues');
          if (ctx1El && ctx1El.getContext) {
            const ctx1 = ctx1El.getContext('2d');
            if (this.charts.dues) this.charts.dues.destroy();
            this.charts.dues = new Chart(ctx1, {
              type: 'bar',
              data: {
                labels: ['No Due', '1 Month Due', '2+ Months Due', 'Inactive'],
                datasets: [{
                  label: 'Members',
                  data: [noDue, due1, due2plus, inactive]
                }]
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }
            });
          }

          const history = this.data.attendanceHistory || [];
          const labels = [];
          const counts = [];

          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateIso = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
            labels.push(label);
            const c = history.filter(h => h.check_in_time && h.check_in_time.startsWith(dateIso)).length;
            counts.push(c);
          }

          const ctx2El = document.getElementById('chart-attendance');
          if (ctx2El && ctx2El.getContext) {
            const ctx2 = ctx2El.getContext('2d');
            if (this.charts.attendance) this.charts.attendance.destroy();
            this.charts.attendance = new Chart(ctx2, {
              type: 'line',
              data: {
                labels,
                datasets: [{
                  label: 'Check-ins',
                  data: counts,
                  tension: 0.3
                }]
              },
              options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, precision: 0 } }
              }
            });
          }
        },

        applySettingsUI() {
          const settings = this.data.settings || {};
          const form = document.getElementById('settings-form');
          if (form) {
            const th = form.querySelector('input[name="attendanceThreshold"]');
            const inact = form.querySelector('input[name="inactiveAfterMonths"]');
            const plans = form.querySelector('input[name="membershipPlans"]');
            if (th) th.value = settings.attendanceThreshold || 3;
            if (inact) inact.value = settings.inactiveAfterMonths || 3;
            if (plans) plans.value = (settings.membershipPlans || ['Standard','Premium']).join(', ');
          }

          const select = document.getElementById('plan-select');
          if (select) {
            const plansArray = (settings.membershipPlans || ['Standard','Premium']);
            select.innerHTML = plansArray.map(p => '<option>' + p + '</option>').join('');
          }

          const permContainer = document.getElementById('user-perms-new');
          if (permContainer) {
            permContainer.innerHTML = this.menuConfig.map(m => {
              return '<label style="display:flex; align-items:center; gap:6px; font-size:13px;">' +
                '<input type="checkbox" name="perm-new" value="' + m.id + '" checked>' +
                m.label +
                '</label>';
            }).join('');
          }

          const teamCard = document.getElementById('team-card');
          if (teamCard) {
            teamCard.style.display = this.data.user?.role === 'admin' ? 'block' : 'none';
          }
        },

          collectPermissions(prefix) {
            const boxes = Array.from(document.querySelectorAll('input[name="' + prefix + '"]'));
            const selected = boxes
              .filter((b: any) => b && b.checked)
              .map((b: any) => b.value);
            return selected.length ? selected : this.menuConfig.map(m => m.id);
          },

        renderTeam() {
          const tbody = document.getElementById('tbl-users');
          if (!tbody) return;
          if (this.data.user?.role !== 'admin') {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:14px; color:var(--text-muted);">You do not have permission to manage users.</td></tr>';
            return;
          }

          if (!this.teamUsers.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:14px; color:var(--text-muted);">No team members yet.</td></tr>';
            return;
          }

          tbody.innerHTML = this.teamUsers.map(u => {
            const checks = this.menuConfig.map(m => {
              const checked = (u.permissions || []).includes(m.id) ? 'checked' : '';
              return '<label style="display:inline-flex; align-items:center; gap:6px; margin-right:10px; font-size:12px;">' +
                '<input type="checkbox" name="perm-' + u.id + '" value="' + m.id + '" ' + checked + '>' +
                m.label +
              '</label>';
            }).join('');

            return '<tr>' +
                '<td>' +
                  '<input id="user-name-' + u.id + '" value="' + (u.name || '') + '" style="margin-bottom:6px;" />' +
                  '<div style="color:var(--text-muted); font-size:12px;">' + u.email + '</div>' +
                '</td>' +
                '<td>' +
                  '<select id="role-' + u.id + '" style="min-width:120px;">' +
                    '<option value="staff" ' + (u.role === 'staff' ? 'selected' : '') + '>Staff</option>' +
                    '<option value="admin" ' + (u.role === 'admin' ? 'selected' : '') + '>Admin</option>' +
                  '</select>' +
                '</td>' +
                '<td>' +
                  '<div style="display:flex; flex-wrap:wrap; gap:6px;">' + checks + '</div>' +
                  '<input id="pwd-' + u.id + '" type="password" placeholder="New password (optional)" style="margin-top:8px;">' +
                '</td>' +
                '<td>' +
                  '<button class="btn btn-primary" style="padding:8px 12px; font-size:12px;" onclick="app.updateUser(' + u.id + ')">Save</button>' +
                '</td>' +
              '</tr>';
          }).join('');
        },

        async createUser(e) {
          e.preventDefault();
          const form = e.target;
          const userStatus = document.getElementById('user-status');
          if (userStatus) { userStatus.style.color = 'var(--text-muted)'; userStatus.textContent = 'Saving...'; }

          const formData = new FormData(form);
          const permissions = this.collectPermissions('perm-new');
          const body: any = Object.fromEntries(formData.entries());
          body.permissions = permissions;

          const res = await fetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(body)
          });

          if (res.ok) {
            form.reset();
            if (userStatus) { userStatus.style.color = 'var(--success)'; userStatus.textContent = 'User created'; }
            await this.refreshUsers();
          } else {
            const data = await res.json();
            if (userStatus) { userStatus.style.color = 'var(--danger)'; userStatus.textContent = data.error || 'Failed'; }
          }
        },

        async refreshUsers() {
          const res = await fetch('/api/users');
          if (!res.ok) return;
          const data = await res.json();
          this.teamUsers = data.users || [];
          this.renderTeam();
        },

        async updateUser(id) {
          const userStatus = document.getElementById('user-status');
          if (userStatus) { userStatus.style.color = 'var(--text-muted)'; userStatus.textContent = 'Updating...'; }

          const permissions = this.collectPermissions('perm-' + id);
          const roleEl = document.getElementById('role-' + id);
          const pwdEl = document.getElementById('pwd-' + id);
          const nameEl = document.getElementById('user-name-' + id);
          const roleVal = roleEl && roleEl.value !== undefined ? roleEl.value : undefined;
          const pwdVal = pwdEl && pwdEl.value !== undefined ? pwdEl.value : undefined;
          const nameVal = nameEl && nameEl.value !== undefined ? nameEl.value : undefined;

          const res = await fetch('/api/users/update', {
            method: 'POST',
            body: JSON.stringify({
              id,
              permissions,
              role: roleVal,
              password: pwdVal,
              name: nameVal
            })
          });

          if (res.ok) {
            if (pwdEl) pwdEl.value = '';
            if (userStatus) { userStatus.style.color = 'var(--success)'; userStatus.textContent = 'Updated'; }
            await this.refreshUsers();
          } else {
            const data = await res.json();
            if (userStatus) { userStatus.style.color = 'var(--danger)'; userStatus.textContent = data.error || 'Failed'; }
          }
        },

        toggleQuickCheckin() {
          const btn = document.getElementById('quick-checkin');
          if (!btn) return;
          btn.style.display = this.allowedMenus.includes('attendance') ? 'inline-flex' : 'none';
        },

        async saveSettings(e) {
          e.preventDefault();
          const form = e.target;
          const attendanceThreshold = form.querySelector('input[name="attendanceThreshold"]').value;
          const inactiveAfterMonths = form.querySelector('input[name="inactiveAfterMonths"]').value;
          const membershipPlans = form.querySelector('input[name="membershipPlans"]').value;

          const statusEl = document.getElementById('settings-status');
          if (statusEl) statusEl.textContent = 'Saving...';

          const res = await fetch('/api/settings', {
            method: 'POST',
            body: JSON.stringify({
              attendanceThreshold,
              inactiveAfterMonths,
              membershipPlans
            })
          });

          if (res.ok) {
            if (statusEl) {
              statusEl.style.color = 'var(--success)';
              statusEl.textContent = 'Saved. Reloading...';
            }
            setTimeout(() => location.reload(), 600);
          } else {
            if (statusEl) {
              statusEl.style.color = 'var(--danger)';
              statusEl.textContent = 'Failed to save settings';
            }
          }
        },

        onCheckinInput(event) {
          const val = event.target.value;
          this.searchCheckin(val);
          if (event.key === 'Enter') {
            this.checkIn();
          }
        },

        async searchCheckin(term) {
          const box = document.getElementById('checkin-suggestions');
          if (!term || !term.trim()) {
            box.innerHTML = '';
            return;
          }

          if (this.searchTimeout) clearTimeout(this.searchTimeout);
          this.searchTimeout = setTimeout(async () => {
            const res = await fetch('/api/members/search', {
              method: 'POST',
              body: JSON.stringify({ query: term })
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = data.results || [];
            if (!list.length) {
              box.innerHTML = '<div class="checkin-item">No matches found</div>';
              return;
            }
            box.innerHTML = list.map(m => {
              const exp = m.expiry_date ? m.expiry_date.split('T')[0] : '-';
              const due = m.dueMonths == null
                ? '-'
                : (m.dueMonths <= 0 ? 'No due' : m.dueMonths + ' month' + (m.dueMonths > 1 ? 's' : '') + ' due');
              return '<div class="checkin-item" onclick="app.selectCheckin(' + m.id + ')">' +
                '<strong>#' + m.id + ' · ' + m.name + '</strong>' +
                '<small>Plan: ' + (m.plan || '-') + ' · Exp: ' + exp + ' · Due: ' + due + '</small>' +
              '</div>';
            }).join('');
          }, 200);
        },

        onPaymentSearchInput(event) {
          const val = event.target.value;
          this.searchPayment(val);
        },

        async searchPayment(term) {
          const box = document.getElementById('pay-search-results');
          if (!term || !term.trim()) {
            box.innerHTML = '';
            return;
          }

          if (this.paymentSearchTimeout) clearTimeout(this.paymentSearchTimeout);
          this.paymentSearchTimeout = setTimeout(async () => {
            const res = await fetch('/api/members/search', {
              method: 'POST',
              body: JSON.stringify({ query: term })
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = data.results || [];
            if (!list.length) {
              box.innerHTML = '<div class="checkin-item">No matches found</div>';
              return;
            }
            box.innerHTML = list.map(m => {
              const exp = m.expiry_date ? m.expiry_date.split('T')[0] : '-';
              const due = m.dueMonths == null
                ? '-'
                : (m.dueMonths <= 0 ? 'No due' : m.dueMonths + ' month' + (m.dueMonths > 1 ? 's' : '') + ' due');
              return '<div class="checkin-item" onclick="app.modals.pay.open(' + m.id + ')">' +
                '<strong>#' + m.id + ' · ' + m.name + '</strong>' +
                '<small>Plan: ' + (m.plan || '-') + ' · Exp: ' + exp + ' · Due: ' + due + ' · Tap to collect payment</small>' +
              '</div>';
            }).join('');
          }, 200);
        },

        selectCheckin(id) {
          const input = document.getElementById('checkin-id');
          input.value = id;
          document.getElementById('checkin-suggestions').innerHTML = '';
          input.focus();
        },

        async checkIn() {
          const id = document.getElementById('checkin-id').value.trim();
          const div = document.getElementById('checkin-res');
          div.innerText = "Checking...";
          
          if (!id) {
            div.style.color = 'var(--danger)';
            div.innerText = "Please enter a member ID.";
            return;
          }

          const res = await fetch('/api/checkin', { method:'POST', body:JSON.stringify({memberId: id}) });
          const json = await res.json();
          
          if(res.ok) {
            div.style.color = json.status === 'success' ? 'var(--success)' : 'var(--danger)';
            div.innerText = json.status === 'success' ? '✅ Welcome ' + json.name : '⛔ EXPIRED: ' + json.name;
            if(json.status === 'success') setTimeout(() => location.reload(), 800);
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
           document.querySelectorAll('#tbl-members tr').forEach(r => {
             r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
           });
        },

        modals: {
          checkin: { 
            open:()=>{
              const m = document.getElementById('modal-checkin');
              m.style.display='flex'; 
              const input = document.getElementById('checkin-id');
              input.value = '';
              document.getElementById('checkin-suggestions').innerHTML = '';
              document.getElementById('checkin-res').innerText = '';
              input.focus();
            }, 
            close:()=>document.getElementById('modal-checkin').style.display='none' 
          },
          add: { 
            open:()=>document.getElementById('modal-add').style.display='flex', 
            close:()=>document.getElementById('modal-add').style.display='none' 
          },
          pay: { 
            open:(id)=>{
              const m = app.data.members.find(x=>x.id===id);
              document.getElementById('pay-id').value=id;
              document.getElementById('pay-name').innerText = m ? ('Taking payment for: ' + m.name + ' (#' + m.id + ')') : '';
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