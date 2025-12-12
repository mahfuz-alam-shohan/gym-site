import { getSession } from "./auth";
import { calculateDues, processPayment } from "./attendance";
import { initDB, factoryReset } from "./db";
import { Env } from "./env";
import { hashPassword, verifyPassword } from "./security";
import { DEFAULT_TIMEZONE, monthEnd } from "./time";
import { loadSettings } from "./settings";
import { corsHeaders, escapeHtml, errorResponse, json, validate } from "./utils";

/* ========================================================================
   1. UI SYSTEM
   ======================================================================== */

function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root { 
      --primary: #4f46e5; --primary-hover: #4338ca; 
      --bg-body: #f8fafc; --bg-sidebar: #0f172a; --bg-card: #ffffff; 
      --text-main: #334155; --text-heading: #0f172a; --text-muted: #64748b; 
      --border: #e2e8f0; 
      --success: #10b981; --danger: #ef4444; --warning: #f59e0b; 
      --radius: 10px; --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg-body); color: var(--text-main); height: 100vh; display: flex; flex-direction: column; overflow: hidden; font-size: 14px; line-height: 1.5; }

    /* Layout */
    .app-layout { display: flex; height: 100%; width: 100%; }
    .sidebar { width: 260px; background: var(--bg-sidebar); color: #cbd5e1; display: flex; flex-direction: column; flex-shrink: 0; z-index: 50; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
    .main-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; position: relative; scroll-behavior: smooth; }
    
    /* Components */
    .card { background: var(--bg-card); padding: 24px; border-radius: var(--radius); box-shadow: var(--shadow); border: 1px solid var(--border); margin-bottom: 24px; transition: transform 0.2s ease; }
    .card:hover { border-color: #cbd5e1; }
    
    .btn { padding: 10px 16px; border-radius: 8px; border: 1px solid transparent; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap; user-select: none; }
    .btn:active { transform: scale(0.98); }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-primary { background: var(--primary); color: white; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3); }
    .btn-primary:hover { background: var(--primary-hover); box-shadow: 0 4px 6px rgba(79, 70, 229, 0.4); }
    .btn-outline { background: white; border-color: var(--border); color: var(--text-heading); }
    .btn-outline:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .btn-danger { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
    .btn-danger:hover { background: #fecaca; }
    
    .w-full { width: 100%; }
    
    /* Forms */
    input, select { width: 100%; padding: 11px 14px; margin-bottom: 16px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; outline: none; transition: all 0.2s; background: #fff; color: var(--text-heading); }
    input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
    label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    
    .checkbox-group { margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .checkbox-item { display: flex; align-items: center; gap: 10px; font-size: 14px; cursor: pointer; border: 1px solid var(--border); padding: 10px; border-radius: 8px; background: #fff; transition: 0.2s; }
    .checkbox-item:hover { border-color: var(--primary); background: #f8fafc; }
    
    /* Tables */
    .table-container { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); background: white; box-shadow: var(--shadow); }
    table { width: 100%; border-collapse: collapse; white-space: nowrap; }
    th { background: #f8fafc; padding: 14px 20px; text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; border-bottom: 1px solid var(--border); }
    td { padding: 14px 20px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: var(--text-heading); vertical-align: middle; }
    tr:hover td { background: #f8fafc; }
    tr:last-child td { border-bottom: none; }
    
    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 28px; }
    .stat-card { background: white; padding: 24px; border-radius: var(--radius); border: 1px solid var(--border); display: flex; flex-direction: column; box-shadow: var(--shadow); }
    .stat-val { font-size: 28px; font-weight: 700; color: var(--text-heading); margin-top: 8px; letter-spacing: -0.5px; }
    .stat-label { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Utilities */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 12px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .center-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-body); padding: 20px; text-align: center; }
    
    /* Badges */
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
    .bg-green { background: #dcfce7; color: #15803d; }
    .bg-red { background: #fee2e2; color: #b91c1c; }
    .bg-amber { background: #fef3c7; color: #b45309; }
    .bg-blue { background: #dbeafe; color: #1e40af; }
    
    /* Nav */
    .nav { padding: 20px 12px; flex: 1; overflow-y: auto; }
    .nav-item { padding: 12px 16px; border-radius: 8px; color: #94a3b8; cursor: pointer; margin-bottom: 4px; font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
    .nav-item svg { stroke-width: 2.5px; opacity: 0.7; }
    .nav-item:hover, .nav-item.active { background: #1e293b; color: white; }
    .nav-item.active svg { opacity: 1; color: var(--primary); }
    
    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px); animation: fadeIn 0.2s ease-out; }
    .modal-content { background: white; width: 100%; max-width: 550px; padding: 32px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    /* Search Results */
    .checkin-results { margin-top: 10px; max-height: 240px; overflow-y: auto; border-radius: 10px; border: 1px solid var(--border); background: white; box-shadow: var(--shadow); }
    .checkin-item { padding: 12px 16px; font-size: 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .checkin-item:hover { background: #f8fafc; }
    .checkin-item:last-child { border-bottom: none; }

    /* Toast */
    #toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 200; display: flex; flex-direction: column; gap: 10px; }
    .toast { background: #1e293b; color: white; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); min-width: 300px; }
    .toast.error { background: #ef4444; }
    .toast.success { background: #10b981; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Mobile */
    .mobile-header { display: none; }
    @media (max-width: 768px) {
      body { overflow: auto; background: #f1f5f9; }
      .app-layout { flex-direction: column; height: auto; }
      .sidebar { position: fixed; inset: 0 auto 0 0; height: 100%; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .mobile-header { display: flex; justify-content: space-between; padding: 16px 20px; background: white; border-bottom: 1px solid var(--border); align-items: center; position: sticky; top: 0; z-index: 40; }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; backdrop-filter: blur(2px); }
      .overlay.open { display: block; }
      
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
      .stat-card { padding: 16px; }
      .stat-val { font-size: 20px; margin-top: 4px; }
      
      .card { padding: 16px; margin-bottom: 16px; border-radius: 12px; }
      h2 { font-size: 20px; }
      h3 { font-size: 16px; }
      
      .btn { padding: 8px 12px; font-size: 12px; }
      input, select { font-size: 16px; padding: 10px; } /* Prevent IOS zoom */
      .checkbox-group { grid-template-columns: 1fr; }
      
      #toast-container { left: 20px; right: 20px; bottom: 20px; }
      .toast { min-width: auto; width: 100%; }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}

/* ========================================================================
   2. WORKER LOGIC
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
        const err = validate(body, ['gymName', 'adminName', 'email', 'password']);
        if(err) return errorResponse(err);

        const email = (body.email || "").trim().toLowerCase();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?)").bind(body.gymName).run();
        const hash = await hashPassword(body.password);
        await env.DB.prepare("DELETE FROM users").run(); 
        const allPerms = JSON.stringify(['home','members','attendance','history','payments','settings']);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role, permissions) VALUES (?, ?, ?, 'admin', ?)").bind(email, hash, body.adminName, allPerms).run();
        
        const defaultPlans = JSON.stringify([{name:"Standard", price:500, admissionFee: 0}, {name:"Premium", price:1000, admissionFee: 0}]);
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(defaultPlans).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('currency', ?)").bind("BDT").run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('lang', ?)").bind("en").run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('renewal_fee', ?)").bind("0").run();
        return json({ success: true });
      }

      if (url.pathname === "/api/login" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
        if (!user || !(await verifyPassword(body.password, user.password_hash))) return json({ error: "Invalid credentials" }, 401);
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expires).run();
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` } });
      }

      if (url.pathname === "/api/nuke") {
        const user = await getSession(req, env);
        if (!user || user.role !== 'admin') return errorResponse("Unauthorized", 401);
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

      if (url.pathname === "/dues/print") {
        const settings = await loadSettings(env);
        const gymRow = await env.DB.prepare("SELECT value FROM config WHERE key='gym_name'").first<any>();
        const gymName = (gymRow && gymRow.value) || "Gym OS";
        const attendanceThreshold = settings.attendanceThreshold;
        
        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id LIMIT 500").all<any>();
        const attendanceAll = await env.DB.prepare("SELECT member_id, check_in_time FROM attendance").all<any>();
        const attendanceByMember: Record<number, string[]> = {};
        for (const a of attendanceAll.results || []) {
          if (!attendanceByMember[a.member_id]) attendanceByMember[a.member_id] = [];
          attendanceByMember[a.member_id].push(a.check_in_time);
        }

        const members = (membersRaw.results || []).map((m: any) => {
          const dueInfo = calculateDues(m.expiry_date, attendanceByMember[m.id], attendanceThreshold, m.manual_due_months || 0, settings.clock.now);
          return { ...m, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels };
        }).filter((m:any) => m.dueMonths && m.dueMonths > 0);

        let rows = members.map((m:any) => {
          const label = (m.dueMonthLabels && m.dueMonthLabels.length)
            ? `Due of ${m.dueMonthLabels.join(', ')}`
            : `${m.dueMonths} Month(s)`;
          return `<tr><td>#${m.id}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.phone)}</td><td>${escapeHtml(m.plan)}</td><td>${escapeHtml(label)}</td></tr>`;
        }).join('');
        if(!rows) rows = '<tr><td colspan="5" style="text-align:center">No dues found.</td></tr>';

        const html = `<!DOCTYPE html><html><head><title>Due Report</title><style>body{font-family:sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#f3f4f6;} .header{text-align:center;margin-bottom:30px;} .btn{display:none;} @media print{.btn{display:none;}}</style></head><body>
          <div class="header"><h1>${escapeHtml(gymName)}</h1><h3>Due Members Report</h3><p>Date: ${settings.clock.today}</p></div>
          <button class="btn" onclick="window.print()" style="display:block;margin:0 auto 20px;padding:10px 20px;cursor:pointer;">Print PDF</button>
          <table><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Plan</th><th>Due</th></tr></thead><tbody>${rows}</tbody></table>
          <script>window.onload=function(){window.print();}</script>
        </body></html>`;
        return new Response(html, { headers: {"Content-Type":"text/html"} });
      }

      // ... [Standard User CRUD Routes omitted for brevity, they remain same] ...
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

      /* --- NEW LOGIC ENDPOINTS --- */

      if (url.pathname === "/api/bootstrap") {
        const settings = await loadSettings(env);
        const { attendanceThreshold, inactiveAfterMonths, membershipPlans, clock } = settings;

        const membersRaw = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all<any>();
        const attendanceAll = await env.DB.prepare("SELECT member_id, check_in_time FROM attendance").all<any>();
        
        const attendanceByMember: Record<number, string[]> = {};
        for (const a of attendanceAll.results || []) {
          if (!attendanceByMember[a.member_id]) attendanceByMember[a.member_id] = [];
          attendanceByMember[a.member_id].push(a.check_in_time);
        }

        const membersProcessed: any[] = [];
        let activeCount=0, dueMembersCount=0, inactiveMembersCount=0;
        let totalOutstanding = 0;

        for (const m of membersRaw.results || []) {
          const dueInfo = calculateDues(
            m.expiry_date,
            attendanceByMember[m.id],
            attendanceThreshold,
            m.manual_due_months || 0,
            clock.now
          );
          
          let newStatus = m.status || "active";
          if (dueInfo.count >= inactiveAfterMonths) {
             newStatus = "inactive"; 
             inactiveMembersCount++; 
          } else if (dueInfo.count > 0) {
             newStatus = "due"; 
             dueMembersCount++; 
          } else { 
             newStatus = "active"; 
             activeCount++; 
          }
          
          if (dueInfo.count > 0) {
              const planPrice = membershipPlans.find((p:any) => p.name === m.plan)?.price || 0;
              const owed = (dueInfo.count * planPrice) - (m.balance || 0);
              totalOutstanding += Math.max(0, owed);
          }
          
          if (newStatus !== m.status) await env.DB.prepare("UPDATE members SET status = ? WHERE id = ?").bind(newStatus, m.id).run();
          membersProcessed.push({ ...m, status: newStatus, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels });
        }

        const attendanceToday = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id, m.expiry_date, m.manual_due_months FROM attendance a JOIN members m ON a.member_id = m.id WHERE date(a.check_in_time) = ? ORDER BY a.id DESC").bind(clock.today).all<any>();
        const attendanceHistory = await env.DB.prepare("SELECT a.check_in_time, a.status, m.name, m.id AS member_id FROM attendance a JOIN members m ON a.member_id = m.id ORDER BY a.id DESC LIMIT 5").all<any>();
        
        const todayVisits = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = ?").bind(clock.today).first<any>();
        const revenue = await env.DB.prepare("SELECT sum(amount) as t FROM payments").first<any>();

        return json({
          user: { ...user, permissions: user.permissions ? JSON.parse(user.permissions) : [] },
          members: membersProcessed,
          attendanceToday: (attendanceToday.results || []).map((r:any) => {
            const dueInfo = calculateDues(r.expiry_date, attendanceByMember[r.member_id], attendanceThreshold, r.manual_due_months || 0, clock.now);
            return { ...r, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels };
          }),
          attendanceHistory: attendanceHistory.results || [],
          stats: { active: activeCount, today: todayVisits?.c || 0, revenue: revenue?.t || 0, dueMembers: dueMembersCount, inactiveMembers: inactiveMembersCount, totalOutstanding },
          settings: { ...settings, clock: { timezone: clock.timezone, simulated: clock.simulated, simulatedTime: clock.simulatedTime, now: clock.now.toISOString() } }
        });
      }

      if (url.pathname === "/api/members/history" && req.method === "POST") {
        const { memberId } = await req.json() as any;
        const history = await env.DB.prepare("SELECT check_in_time, status FROM attendance WHERE member_id = ? ORDER BY check_in_time DESC").bind(memberId).all();
        const member = await env.DB.prepare("SELECT joined_at FROM members WHERE id = ?").bind(memberId).first<any>();
        return json({ history: history.results || [], joinedAt: member?.joined_at });
      }

      if (url.pathname === "/api/history/list" && req.method === "POST") {
        const body = await req.json() as any;
        let query = "SELECT a.check_in_time, a.status, m.name, m.id AS member_id FROM attendance a JOIN members m ON a.member_id = m.id";
        const params = [];
        if (body.date) { query += " WHERE date(a.check_in_time) = ?"; params.push(body.date); }
        query += " ORDER BY a.id DESC";
        if (!body.date) { query += " LIMIT 100"; }
        const history = await env.DB.prepare(query).bind(...params).all();
        return json({ history: history.results || [] });
      }

      if (url.pathname === "/api/payments/history" && req.method === "POST") {
        const body = await req.json() as any;
        let query = "SELECT p.amount, p.date, m.name, p.member_id FROM payments p LEFT JOIN members m ON p.member_id = m.id WHERE 1=1";
        const params: any[] = [];
        if (body.memberId) { query += " AND p.member_id = ?"; params.push(body.memberId); }
        if (body.date) { query += " AND date(p.date) = ?"; params.push(body.date); }
        query += " ORDER BY p.date DESC LIMIT 50";
        const res = await env.DB.prepare(query).bind(...params).all<any>();
        let memberName = null;
        if(body.memberId) { const m = await env.DB.prepare("SELECT name FROM members WHERE id = ?").bind(body.memberId).first<any>(); memberName = m?.name; }
        return json({ transactions: res.results || [], memberName });
      }

      if (url.pathname === "/api/members/search" && req.method === "POST") {
        const body = await req.json() as any;
        const qRaw = (body.query || "").toString().trim();
        if (!qRaw) return json({ results: [] });
        
        const settings = await loadSettings(env);
        const today = settings.clock.today;
        const baseQuery = "SELECT id, name, phone, plan, expiry_date, balance, status, manual_due_months, (SELECT count(*) FROM attendance WHERE member_id = members.id AND date(check_in_time) = ?) as today_visits FROM members";
        
        let res;
        const isNumeric = /^\d+$/.test(qRaw);
        if (isNumeric && qRaw.length < 6) {
           res = await env.DB.prepare(baseQuery + " WHERE CAST(id AS TEXT) LIKE ? LIMIT 10").bind(today, `${qRaw}%`).all();
        } else {
           res = await env.DB.prepare(baseQuery + " WHERE name LIKE ? OR phone LIKE ? LIMIT 10").bind(today, `%${qRaw}%`, `%${qRaw}%`).all();
        }
        
        const results = [];
        for (const m of res.results || []) {
            const att = await env.DB.prepare("SELECT check_in_time FROM attendance WHERE member_id = ?").bind(m.id).all<any>();
            const attTs = (att.results||[]).map((a:any)=>a.check_in_time);
            const dueInfo = calculateDues(m.expiry_date, attTs, settings.attendanceThreshold, m.manual_due_months || 0, settings.clock.now);
            results.push({ ...m, dueMonths: dueInfo.count, dueMonthLabels: dueInfo.labels, checkedIn: m.today_visits > 0 });
        }
        return json({ results });
      }

      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const settings = await loadSettings(env);
        const body = await req.json() as any;
        const isMigration = body.migrationMode === true || body.migrationMode === "true";
        const legacyDues = Math.max(0, parseInt(body.legacyDues || "0", 10));

        let base = new Date(settings.clock.now);
        base.setMonth(base.getMonth() - 1, 1);
        let paidThrough = monthEnd(base);

        const result = await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at, expiry_date, manual_due_months) VALUES (?, ?, ?, ?, ?, ?) RETURNING id").bind(body.name, body.phone, body.plan, settings.clock.now.toISOString(), paidThrough.toISOString(), isMigration ? legacyDues : 0).first<any>();
        const newMemberId = result.id;

        if (body.admissionFeePaid && newMemberId) {
            const fee = parseInt(body.admissionFee || "0");
            if (fee > 0) await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(newMemberId, fee, settings.clock.now.toISOString()).run();
        }
        
        const initialAmt = parseInt(body.initialPayment || "0");
        if (initialAmt > 0 && newMemberId) {
            await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(newMemberId, initialAmt, settings.clock.now.toISOString()).run();
            const m = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(newMemberId).first<any>();
            const plan = (settings.membershipPlans || []).find((p: any) => p.name === m.plan);
            const res = processPayment(
               m.expiry_date, [], 
               initialAmt, plan ? Number(plan.price) : 0, 
               0, m.manual_due_months || 0, 
               settings.attendanceThreshold, settings.clock.now
            );
            await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ?, manual_due_months = ? WHERE id = ?").bind(res.newExpiry, res.newBalance, res.newManualDue, newMemberId).run();
        }
        return json({ success: true });
      }

      if (url.pathname === "/api/checkin" && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId } = await req.json() as any;
        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        if (!member) return json({ error: "Member not found" }, 404);

        if (member.status === 'inactive') return json({ error: "Membership Inactive. Please Pay.", code: "INACTIVE" }, 400);

        const alreadyToday = await env.DB.prepare("SELECT id FROM attendance WHERE member_id = ? AND date(check_in_time) = ? LIMIT 1").bind(memberId, settings.clock.today).first();
        if (alreadyToday) return json({ error: "Already checked in today", code: "DUPLICATE" }, 400);
        
        const isExpired = new Date(member.expiry_date) < settings.clock.now;
        await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status) VALUES (?, ?, ?)").bind(memberId, settings.clock.now.toISOString(), isExpired ? 'expired' : 'success').run();
        return json({ success: true, status: isExpired ? 'expired' : 'success', name: member.name, isExpired });
      }

      if ((url.pathname === "/api/payment" || url.pathname === "/api/members/renew") && req.method === "POST") {
        const settings = await loadSettings(env);
        const { memberId, amount, renewalFee } = await req.json() as any;
        const amt = Number(amount || 0);
        const rFee = Number(renewalFee || 0);

        if (rFee > 0) await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, rFee, settings.clock.now.toISOString()).run();
        if (amt > 0) await env.DB.prepare("INSERT INTO payments (member_id, amount, date) VALUES (?, ?, ?)").bind(memberId, amt, settings.clock.now.toISOString()).run();

        const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
        const att = await env.DB.prepare("SELECT check_in_time FROM attendance WHERE member_id = ?").bind(memberId).all<any>();
        const attTs = (att.results||[]).map((a:any) => a.check_in_time);
        
        const plan = (settings.membershipPlans || []).find((p: any) => p.name === member.plan);
        const price = plan ? Number(plan.price) : 0;

        const res = processPayment(
           member.expiry_date,
           attTs,
           amt,
           price,
           member.balance || 0,
           member.manual_due_months || 0,
           settings.attendanceThreshold,
           settings.clock.now
        );

        await env.DB.prepare("UPDATE members SET expiry_date = ?, balance = ?, manual_due_months = ?, status = 'active' WHERE id = ?").bind(res.newExpiry, res.newBalance, res.newManualDue, memberId).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/members/delete" && req.method === "POST") {
        const { id } = await req.json() as any;
        await env.DB.prepare("DELETE FROM members WHERE id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM attendance WHERE member_id = ?").bind(id).run();
        return json({ success: true });
      }

      if (url.pathname === "/api/settings" && req.method === "POST") {
        if (user.role !== 'admin') return json({ error: 'Unauthorized' }, 403);
        const body = await req.json() as any;
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('attendance_threshold_days', ?)").bind(String(body.attendanceThreshold)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('inactive_after_due_months', ?)").bind(String(body.inactiveAfterMonths)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('currency', ?)").bind(String(body.currency)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('lang', ?)").bind(String(body.lang)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('membership_plans', ?)").bind(JSON.stringify(body.membershipPlans)).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('renewal_fee', ?)").bind(String(body.renewalFee)).run();
        const simEnabled = body.timeSimulationEnabled === true;
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('time_simulation_enabled', ?)").bind(simEnabled ? 'true' : 'false').run();
        if(simEnabled) await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('time_simulation_value', ?)").bind(body.simulatedTime).run();
        await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('timezone', ?)").bind(String(body.timezone || DEFAULT_TIMEZONE)).run();
        return json({ success: true });
      }

    } catch (e: any) { return json({ error: e.message }, 500); }
    return new Response("Not found", { status: 404 });
  }
};

/* ========================================================================
   3. FRONTEND (UI)
   ======================================================================== */

function renderSetup() {
  const html = `${baseHead("Gym OS - Setup")}<body><div class="center-screen"><div class="card" style="width:100%;max-width:420px;"><h2 style="color:var(--text-heading);margin-bottom:10px;text-align:center;">🚀 System Setup</h2><p style="color:var(--text-muted);margin-bottom:24px;text-align:center;">Initialize your gym system.</p><form id="form"><label>Gym Name</label><input name="gymName" required><label>Admin Name</label><input name="adminName" required><label>Admin Email</label><input name="email" type="email" required><label>Password</label><input name="password" type="password" required><button type="submit" class="btn btn-primary w-full" style="padding:12px;margin-top:10px;">Install System</button></form><div id="error" style="color:var(--danger);margin-top:10px;font-size:13px;text-align:center;"></div></div></div><script>document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;btn.innerText="Installing...";try{const res=await fetch('/api/setup',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});const d=await res.json();if(res.ok)window.location.reload();else throw new Error(d.error||"Setup failed");}catch(err){document.getElementById('error').textContent=err.message;btn.disabled=false;btn.innerText="Install System";}}</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(gymName: string) {
  const safeName = escapeHtml(gymName);
  const html = `${baseHead("Login")}<body><div class="center-screen"><div class="card" style="width:100%;max-width:380px;"><h2 style="margin-bottom:5px;text-align:center;color:var(--text-heading);">${safeName}</h2><p style="color:var(--text-muted);margin-bottom:24px;text-align:center;">Staff Access Portal</p><form id="form"><label>Email</label><input name="email" required><label>Password</label><input name="password" type="password" required><button type="submit" class="btn btn-primary w-full" style="padding:12px;margin-top:10px;">Sign In</button></form><div id="error" style="color:var(--danger);margin-top:15px;font-size:13px;text-align:center;"></div></div></div><script>document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;btn.innerText="Verifying...";try{const res=await fetch('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});if(res.ok){sessionStorage.removeItem('gym_view');window.location.href='/dashboard';}else{const d=await res.json();throw new Error(d.error||"Login failed");}}catch(err){document.getElementById('error').textContent=err.message;btn.disabled=false;btn.innerText="Sign In";}}</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any) {
  const safeUserName = escapeHtml(user.name);
  const safeRole = escapeHtml(user.role.toUpperCase());
  const safePerms = user.permissions || '[]'; 

  const html = `${baseHead("Dashboard")}
  <body>
    <div id="toast-container"></div>
    <div class="app-layout">
      <div class="mobile-header"><div style="font-weight:700;font-size:18px;">Gym OS</div><button class="btn btn-outline" onclick="toggleSidebar()">${getIcon('menu')}</button></div>
      <div class="overlay" onclick="toggleSidebar()"></div>
      <aside class="sidebar">
        <div style="padding:24px;font-size:20px;font-weight:700;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:10px;"><span>💪</span> Gym OS</div>
        <div class="nav" id="nav-container"></div>
        <div style="padding:20px;border-top:1px solid #1e293b;background:#0f172a;">
          <div style="font-weight:600;color:white;">${safeUserName}</div>
          <div style="font-size:11px;opacity:0.6;margin-bottom:8px;">${safeRole}</div>
          <a href="/api/logout" style="color:#f87171;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:6px;" id="txt-logout">${getIcon('logout')} Sign Out</a>
        </div>
      </aside>
      <main class="main-content">
        <div class="flex-between" style="padding:24px 24px 0 24px;">
           <h2 id="page-title" style="margin:0;font-weight:700;color:var(--text-heading);">Dashboard</h2>
           <div class="flex">
              <button class="btn btn-primary" onclick="app.modals.quickPay.open()" id="btn-quick-pay">${getIcon('creditCard')} Quick Pay</button>
              <button class="btn btn-primary" onclick="app.modals.checkin.open()" id="btn-quick-checkin">${getIcon('check')} Quick Check-In</button>
           </div>
        </div>

        <div style="padding:24px;">
          <!-- VIEW: HOME -->
          <div id="view-home" class="hidden">
            <div class="stats-grid">
              <div class="stat-card"><span class="stat-label" id="lbl-active-mem">Active Members</span><span class="stat-val" id="stat-active">--</span></div>
              <div class="stat-card"><span class="stat-label" id="lbl-today-visits">Today's Visits</span><span class="stat-val" id="stat-today">--</span></div>
              <div class="stat-card"><span class="stat-label" id="lbl-tot-rev">Total Revenue</span><span class="stat-val" style="color:var(--success)"><span id="stat-rev">--</span></span></div>
              <div class="stat-card"><span class="stat-label" id="lbl-mem-due">Members With Due</span><span class="stat-val" id="stat-due">--</span></div>
              <div class="stat-card"><span class="stat-label" id="lbl-total-due-money">Total Due Amount</span><span class="stat-val" style="color:var(--danger)"><span id="stat-total-due">--</span></span></div>
            </div>
            <div class="card">
              <h3 style="margin:0 0 20px 0;font-size:16px;color:var(--text-heading);" id="lbl-due-overview">Dues Overview</h3>
              <div style="position: relative; height:250px; width:100%"><canvas id="chart-dues"></canvas></div>
            </div>
          </div>

          <!-- VIEW: MEMBERS -->
          <div id="view-members" class="hidden">
            <div class="card">
              <div class="flex-between" style="margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <div class="flex" style="flex:1;">
                  <input id="search" placeholder="Search ID, Name or Phone..." style="margin:0;max-width:300px;" onkeyup="app.renderMembersTable()">
                  <select id="member-filter" onchange="app.renderMembersTable()" style="margin:0;width:140px;">
                     <option value="all">All Status</option>
                     <option value="active">Active</option>
                     <option value="due">Due</option>
                     <option value="advanced">Advanced</option>
                     <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button class="btn btn-primary" onclick="app.modals.add.open()" id="btn-add-mem">${getIcon('plus')} Add Member</button>
              </div>
              <div class="table-container">
                <table>
                  <thead><tr><th>ID</th><th id="th-name">Name</th><th id="th-joined">Joined</th><th id="th-phone">Phone</th><th id="th-plan">Plan</th><th id="th-exp">Expiry</th><th id="th-due">Due / Adv</th><th id="th-act" style="text-align:right">Actions</th></tr></thead>
                  <tbody id="tbl-members"></tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- VIEW: ATTENDANCE -->
          <div id="view-attendance" class="hidden">
            <div class="card">
              <h3 id="lbl-today-att" style="margin-bottom:20px;">Today's Attendance</h3>
              <div class="table-container">
                <table><thead><tr><th id="th-time">Time</th><th>Name</th><th>Due / Adv</th></tr></thead><tbody id="tbl-attendance-today"></tbody></table>
              </div>
            </div>
          </div>

          <!-- VIEW: HISTORY -->
          <div id="view-history" class="hidden">
            <div class="card">
              <div class="flex-between" style="margin-bottom:20px;flex-wrap:wrap;gap:12px;">
                <h3 style="margin:0;" id="lbl-act-log">Activity Log</h3>
                <div class="flex" style="gap:8px;">
                  <input type="date" id="history-date" style="margin-bottom:0;max-width:160px;">
                  <button class="btn btn-outline" onclick="app.applyHistoryFilter()" id="btn-filter">Filter</button>
                  <button class="btn btn-outline" onclick="app.clearHistoryFilter()" id="btn-clear">Clear</button>
                </div>
              </div>
              <div class="table-container">
                <table><thead><tr><th>Date</th><th>Time</th><th>Name</th></tr></thead><tbody id="tbl-attendance-history"></tbody></table>
              </div>
            </div>
          </div>

          <!-- VIEW: PAYMENTS -->
          <div id="view-payments" class="hidden">
            <div class="card" style="border-left:5px solid var(--danger);">
               <div class="flex-between">
                  <div>
                    <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Total Outstanding Dues</div>
                    <div id="total-outstanding-amount" style="font-size:28px;font-weight:800;color:var(--danger);margin-top:5px;">0</div>
                  </div>
                  <div style="text-align:right" class="flex" style="gap:8px;">
                    <button class="btn btn-outline" onclick="app.openPaymentHistory()" id="btn-history">${getIcon('history')} History</button>
                    <button class="btn btn-outline" onclick="window.open('/dues/print','_blank')" id="btn-print">Print PDF</button>
                  </div>
               </div>
            </div>

            <div class="card">
              <h3 id="lbl-search-col" style="margin-bottom:15px;">Search & Collect</h3>
              <div style="position:relative;">
                 <input id="pay-search" placeholder="Search by ID, name or phone..." style="margin-bottom:0;" onkeyup="app.onPaymentSearchInput(event)">
                 <div style="position:absolute;right:10px;top:10px;opacity:0.5;">${getIcon('search')}</div>
              </div>
              <div id="pay-search-results" class="checkin-results" style="display:none;margin-top:5px;"></div>
            </div>
           
            <div class="card">
               <div class="flex-between" style="margin-bottom:20px;">
                  <h3 style="margin:0;" id="lbl-pay-stat">Payment Status</h3>
                  <select id="pay-filter" onchange="app.renderPaymentsTable()" style="margin:0;min-width:140px;">
                    <option value="all">All Members</option>
                    <option value="due">Dues Only</option>
                    <option value="running">Running</option>
                    <option value="advanced">Advanced</option>
                  </select>
               </div>
               <div class="table-container">
                 <table><thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Due / Adv</th><th>Amount</th><th style="text-align:right">Action</th></tr></thead><tbody id="tbl-payment-list"></tbody></table>
               </div>
            </div>
          </div>

          <!-- VIEW: SETTINGS -->
          <div id="view-settings" class="hidden">
            <div class="card">
              <h3 id="lbl-sys-set" style="margin-bottom:20px;">System Settings</h3>
              <form id="settings-form" onsubmit="app.saveSettings(event)">
                <div class="flex">
                   <div class="w-full"><label id="lbl-cur">Currency Symbol</label><input name="currency" type="text" placeholder="BDT"></div>
                   <div class="w-full"><label id="lbl-lang">Language / ভাষা</label><select name="lang" style="margin-bottom:16px;"><option value="en">English</option><option value="bn">Bangla</option></select></div>
                </div>
                <div class="flex">
                   <div class="w-full"><label id="lbl-att-th">Attendance Threshold (Days)</label><input name="attendanceThreshold" type="number" min="1" max="31" required></div>
                   <div class="w-full"><label id="lbl-inact-th">Inactive after X absent months</label><input name="inactiveAfterMonths" type="number" min="1" max="36" required></div>
                </div>
                <div class="w-full"><label id="lbl-ren-fee">Renewal Fee (Global)</label><input name="renewalFee" type="number" min="0" required></div>
                <div class="flex">
                  <div class="w-full"><label>Timezone (GMT+6)</label><input name="timezone" type="text" placeholder="Asia/Dhaka"></div>
                  <div class="w-full"><label>Simulated Date & Time</label><input name="simulatedTime" type="datetime-local"></div>
                </div>
                <label class="checkbox-item" style="width:auto;margin-bottom:8px;"><input type="checkbox" name="timeSimulationEnabled"> Enable Time Simulation (Admin Testing)</label>
                <p id="lbl-current-time" style="font-size:12px;color:var(--text-muted);margin-top:-4px;"></p>

                <label style="margin-top:24px;display:block;border-top:1px solid #f1f5f9;padding-top:20px;" id="lbl-mem-plans">Membership Plans & Prices</label>
                <div style="background:#f8fafc;padding:20px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px;">
                   <div class="plan-row" style="font-weight:700;font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;"><span>Plan Name</span><span>Price</span><span>Adm. Fee</span><span></span></div>
                   <div id="plans-container"></div>
                   <button type="button" class="btn btn-outline" onclick="app.addPlanRow()" id="btn-add-plan" style="margin-top:10px;">${getIcon('plus')} Add Plan</button>
                </div>
                <div class="flex-between" style="margin-top:20px;">
                  <button type="submit" class="btn btn-primary" id="btn-save-set">Save Changes</button>
                  <span id="settings-status" style="font-size:12px;color:var(--text-muted);"></span>
                </div>
              </form>
              <div style="margin-top:40px;padding-top:24px;border-top:1px solid var(--border);text-align:center;">
                <button onclick="app.resetDB()" class="btn btn-danger" id="btn-reset-db">${getIcon('trash')} Factory Reset Database</button>
              </div>
            </div>
          </div>

          <!-- VIEW: USERS -->
          <div id="view-users" class="hidden">
            <div class="card">
               <div class="flex-between" style="margin-bottom:20px;">
                 <h3 style="margin:0;" id="lbl-user-acc">User Access</h3>
                 <button class="btn btn-primary" onclick="app.openAddUser()" id="btn-add-user">${getIcon('plus')} Add User</button>
               </div>
               <div class="table-container">
                 <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Permissions</th><th style="text-align:right">Actions</th></tr></thead><tbody id="tbl-users"></tbody></table>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODALS -->
    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content" style="text-align:center;">
        <h3 id="lbl-chk-title" style="margin-bottom:20px;font-size:20px;">⚡ Check-In</h3>
        <input id="checkin-id" type="text" placeholder="Search ID/Name..." style="font-size:18px;padding:16px;text-align:center;border-width:2px;" autofocus onkeyup="app.onCheckinInput(event)">
        <div id="checkin-suggestions" class="checkin-results" style="display:none;text-align:left;"></div>
        <button class="btn btn-primary w-full" onclick="app.checkIn()" id="btn-sub-chk" style="padding:14px;font-size:16px;margin-top:10px;">Submit</button>
        <div id="checkin-res" style="margin-top:20px;text-align:center;font-weight:700;min-height:24px;font-size:16px;"></div>
        <button class="btn btn-outline w-full" style="margin-top:20px;" onclick="app.modals.checkin.close()">Close</button>
      </div>
    </div>
   
    <div id="modal-quick-pay" class="modal-backdrop">
      <div class="modal-content" style="text-align:center;">
        <h3 id="lbl-qp-title" style="margin-bottom:20px;font-size:20px;">💰 Quick Pay Search</h3>
        <input id="qp-search" type="text" placeholder="Search Name/ID..." style="font-size:18px;padding:16px;text-align:center;border-width:2px;" autofocus onkeyup="app.onQuickPayInput(event)">
        <div id="qp-results" class="checkin-results" style="display:none;text-align:left;"></div>
        <button class="btn btn-outline w-full" style="margin-top:20px;" onclick="app.modals.quickPay.close()">Close</button>
      </div>
    </div>

    <div id="modal-add" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="lbl-new-mem" style="margin-bottom:20px;">New Member</h3>
        <div style="display:flex;border-bottom:1px solid #e2e8f0;margin-bottom:24px;">
           <div id="tab-new" class="nav-item active" style="color:var(--primary);border-bottom:2px solid var(--primary);background:none;border-radius:0;margin:0;" onclick="app.switchAddTab('new')">New Admission</div>
           <div id="tab-mig" class="nav-item" style="background:none;border-radius:0;margin:0;" onclick="app.switchAddTab('mig')">Migrating / Old</div>
        </div>
        <form onsubmit="app.addMember(event)">
          <input type="hidden" name="migrationMode" id="add-mig-mode" value="false">
          <label>Full Name</label><input name="name" required>
          <label>Phone Number</label><input name="phone" required>
          <div class="flex"><div class="w-full"><label>Plan</label><select name="plan" id="plan-select" onchange="app.updateAddMemberFees()"></select></div></div>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-top:10px;border:1px solid #e2e8f0;">
             <div id="sec-new-fees">
                 <label style="margin-bottom:12px;font-weight:700;color:var(--text-heading);">Fees (New)</label>
                 <div class="flex" style="margin-bottom:12px;">
                    <div class="w-full"><label>Admission Fee</label><input name="admissionFee" id="new-adm-fee" type="number" min="0"></div>
                    <div style="padding-top:26px;"><label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;"><input type="checkbox" name="admissionFeePaid" value="yes" checked style="width:auto;margin:0;"> Paid Now?</label></div>
                 </div>
                 <div class="w-full"><label>Initial Payment (Required)</label><input name="initialPayment" id="new-init-pay" type="number" min="0" required></div>
             </div>
             <div id="sec-mig-fees" style="display:none;">
                 <label style="margin-bottom:12px;font-weight:700;color:var(--text-heading);">Migration Status</label>
                 <div class="w-full" style="margin-bottom:12px;"><label>Months Due (Manual)</label><input name="legacyDues" id="mig-legacy-dues" type="number" min="0" value="0" required></div>
                 <div class="w-full"><label>Payment Now (Optional)</label><input name="initialPayment" id="mig-init-pay" type="number" min="0" value="0"></div>
             </div>
          </div>
          <div class="flex" style="justify-content:flex-end;margin-top:24px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.add.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Member</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-pay" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="lbl-rec-pay" style="margin-bottom:5px;">💰 Receive Payment</h3>
        <p id="pay-name" style="color:var(--text-muted);margin-bottom:24px;font-weight:600;"></p>
        <div id="pay-status-warning" style="display:none;background:#fee2e2;color:#991b1b;padding:12px;border-radius:8px;margin-bottom:20px;font-size:13px;font-weight:600;border:1px solid #fecaca;">⚠ Member Inactive.</div>
        <form onsubmit="app.pay(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <div id="pay-renewal-section" style="display:none;background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:20px;border:1px solid #e2e8f0;">
             <label>Renewal Fee</label><input name="renewalFee" id="pay-ren-fee" type="number" readonly>
             <label>Initial Plan Payment (Optional)</label>
          </div>
          <div id="pay-standard-label"><label>Amount Paid</label></div>
          <input name="amount" id="pay-amount" type="number" required>
          <div style="font-size:13px;color:var(--text-muted);margin-top:10px;background:#f8fafc;padding:12px;border-radius:8px;">
             Current Plan Price: <span id="pay-plan-price" style="font-weight:700;color:var(--text-heading);">-</span><br>
             Wallet Balance: <span id="pay-wallet-bal" style="font-weight:700;color:var(--text-heading);">0</span>
          </div>
          <div class="flex" style="justify-content:flex-end;margin-top:24px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.pay.close()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="pay-submit-btn">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>

    <div id="modal-user" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="user-modal-title" style="margin-bottom:20px;">User</h3>
        <form id="user-form" onsubmit="app.saveUser(event)">
          <input type="hidden" name="id" id="u-id">
          <label>Name</label><input name="name" id="u-name" required>
          <label>Email</label><input name="email" id="u-email" type="email" required>
          <label>Password <span style="font-size:11px;color:var(--text-muted);" id="u-pass-hint"></span></label>
          <input name="password" id="u-password" type="password">
          <label>Role</label>
          <select name="role" id="u-role" onchange="app.togglePerms(this.value)">
             <option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
          <div id="u-perms-container">
             <label style="margin-top:16px;">Access Permissions</label>
             <div class="checkbox-group">
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="home"> Overview</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="members"> Members</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="attendance"> Attendance</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="history"> History</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="payments"> Payments</label>
                <label class="checkbox-item"><input type="checkbox" name="permissions" value="settings"> Settings</label>
             </div>
          </div>
          <div class="flex" style="justify-content:flex-end;margin-top:24px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.user.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save User</button>
          </div>
        </form>
      </div>
    </div>

    <!-- HISTORIES -->
    <div id="modal-member-history" class="modal-backdrop">
      <div class="modal-content" style="max-width:800px;">
        <div class="flex-between" style="margin-bottom:24px;">
            <h3 id="mh-title" style="margin:0;">Attendance History</h3>
            <button class="btn btn-outline" onclick="document.getElementById('modal-member-history').style.display='none'">Close</button>
        </div>
        <div class="hist-controls">
           <div class="flex" style="align-items:center;">
              <label style="margin:0;white-space:nowrap;">Year:</label><select id="hist-year" style="margin:0;" onchange="app.renderCalendar()"></select>
           </div>
           <div class="flex" style="align-items:center;">
              <label style="margin:0;white-space:nowrap;">Month:</label>
              <select id="hist-month" style="margin:0;" onchange="app.renderCalendar()">
                 <option value="-1">Whole Year / পুরো বছর</option>
                 <option value="0">January</option><option value="1">February</option><option value="2">March</option><option value="3">April</option><option value="4">May</option><option value="5">June</option>
                 <option value="6">July</option><option value="7">August</option><option value="8">September</option><option value="9">October</option><option value="10">November</option><option value="11">December</option>
              </select>
           </div>
        </div>
        <div id="calendar-container" class="calendar-wrapper" style="display:block;"></div>
      </div>
    </div>
   
    <div id="modal-payment-history" class="modal-backdrop">
      <div class="modal-content" style="max-width:700px;">
         <div class="flex-between" style="margin-bottom:24px;">
            <h3 id="ph-title" style="margin:0;">Transaction History</h3>
            <button class="btn btn-outline" onclick="document.getElementById('modal-payment-history').style.display='none'">Close</button>
         </div>
         <div class="hist-controls">
            <div class="flex" style="align-items:center;">
               <input type="date" id="trans-date" style="margin-bottom:0;" onchange="app.renderTransactionHistory()">
               <button class="btn btn-outline" onclick="document.getElementById('trans-date').value=''; app.renderTransactionHistory()">Clear</button>
            </div>
         </div>
         <div class="table-container" style="max-height:400px;overflow-y:auto;">
            <table style="width:100%;"><thead><tr><th>Date</th><th>Member</th><th>Amount</th></tr></thead><tbody id="tbl-transaction-history"></tbody></table>
         </div>
      </div>
    </div>

    <script>
      function getIcon(name){const i={home:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',users:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',history:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',creditCard:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',settings:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',logout:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',menu:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',check:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',plus:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>',trash:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'};return i[name]||'';}
      function escapeHtml(text){if(!text)return"";return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
      const translations={en:{dash:"Dashboard",over:"Overview",mem:"Members",att:"Attendance",hist:"History",pay:"Payments",set:"Settings",user:"User Access",act_mem:"Active Members",tod_vis:"Today's Visits",tot_rev:"Total Revenue",mem_due:"Members With Due",total_due_amt:"Total Due Amount",due_ov:"Dues Overview",quick_chk:"⚡ Quick Check-In",quick_pay:"💰 Quick Pay",quick_pay_search:"💰 Quick Pay Search",search_ph:"Search ID, Name or Phone...",add_mem:"Add Member",nm:"Name",joined:"Joined",ph:"Phone",pl:"Plan",exp:"Expiry",due:"Due",act:"Actions",tod_att:"Today's Attendance",time:"Time",res:"Result",act_log:"Activity Log",filter:"Filter",clear:"Clear",search_col:"Search & Collect",pay_stat:"Payment Status",print:"Print List (PDF)",sys_set:"System Settings",cur:"Currency Symbol",lang:"Language / ভাষা",att_th:"Attendance Threshold (Days)",inact_th:"Inactive after X absent months",adm_fee:"Admission Fee",ren_fee:"Renewal Fee",mem_plans:"Membership Plans & Prices",add_plan:"Add Plan",save_set:"Save Settings",user_acc:"User Access",add_user:"Add User",chk_title:"⚡ Check-In",submit:"Submit",close:"Close",new_mem:"New Member",create:"Create",rec_pay:"💰 Receive Payment",confirm:"Confirm",trans_hist:"History"},bn:{dash:"ড্যাশবোর্ড",over:"সারসংক্ষেপ",mem:"সদস্যবৃন্দ",att:"উপস্থিতি",hist:"ইতিহাস",pay:"পেমেন্ট",set:"সেটিংস",user:"ব্যবহারকারী",act_mem:"সক্রিয় সদস্য",tod_vis:"আজকের উপস্থিতি",tot_rev:"মোট আয়",mem_due:"বকেয়া সদস্য",total_due_amt:"মোট বকেয়া পরিমাণ",due_ov:"বকেয়া ওভারভিউ",quick_chk:"⚡ চেক-ইন",quick_pay:"💰 দ্রুত পেমেন্ট",quick_pay_search:"💰 দ্রুত পেমেন্ট সার্চ",search_ph:"আইডি, নাম বা ফোন খুঁজুন...",add_mem:"সদস্য যোগ",nm:"নাম",joined:"ভর্তি",ph:"ফোন",pl:"প্ল্যান",exp:"মেয়াদ",due:"বকেয়া",act:"অ্যাকশন",tod_att:"আজকের উপস্থিতি",time:"সময়",res:"ফলাফল",act_log:"অ্যাক্টিভিটি লগ",filter:"ফিল্টার",clear:"মুছুন",search_col:"খুঁজুন ও পেমেন্ট নিন",pay_stat:"পেমেন্ট স্ট্যাটাস",print:"প্রিন্ট (PDF)",sys_set:"সিস্টেম সেটিংস",cur:"মুদ্রার প্রতীক",lang:"ভাষা / Language",att_th:"উপস্থিতির সীমা (দিন)",inact_th:"কত মাস অনুপস্থিত হলে নিষ্ক্রিয়",adm_fee:"ভর্তি ফি",ren_fee:"রিনিউয়াল ফি",mem_plans:"মেম্বারশিপ প্ল্যান ও মূল্য",add_plan:"প্ল্যান যোগ",save_set:"সেভ করুন",user_acc:"ব্যবহারকারী এক্সেস",add_user:"ব্যবহারকারী যোগ",chk_title:"⚡ চেক-ইন",submit:"সাবমিট",close:"বন্ধ",new_mem:"নতুন সদস্য",create:"তৈরি করুন",rec_pay:"💰 পেমেন্ট গ্রহণ",confirm:"নিশ্চিত করুন",trans_hist:"ইতিহাস"}};
      let clientClock={now:null};function setClientNow(iso){clientClock.now=iso||null;}function getClientNow(){return clientClock.now?new Date(clientClock.now):new Date();}function t(key){const lang=app.data?.settings?.lang||'en';return translations[lang][key]||key;}function toggleSidebar(){document.querySelector('.sidebar').classList.toggle('open');document.querySelector('.overlay').classList.toggle('open');}function formatTime(iso){if(!iso)return'-';return new Date(iso).toLocaleString('en-US',{timeZone:'Asia/Dhaka',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});}function formatDate(iso){if(!iso)return'-';return new Date(iso).toLocaleDateString('en-GB');}function formatExpiryMonth(iso){if(!iso)return'-';const d=new Date(iso);if(isNaN(d.getTime()))return'-';const monthName=d.toLocaleString('en-US',{month:'short'});return d.getFullYear()===getClientNow().getFullYear()?monthName:monthName+' '+d.getFullYear();}function formatDueMonthsLabel(obj){if(!obj||!obj.dueMonths||obj.dueMonths<=0)return'';const labels=obj.dueMonthLabels||[];if(labels.length)return'Due: '+labels.join(', ');const count=obj.dueMonths;return'Due ('+count+' Mo'+(count>1?'s':'')+')';}
      const currentUser={role:"${safeRole}",permissions:${safePerms}};
      const app={data:null,userList:[],searchTimeout:null,payingMemberId:null,activeHistory:null,isSubmitting:false,currentHistoryMemberId:null,isRenewalMode:false,
        toast(msg,type='success'){
           const c=document.getElementById('toast-container');
           const d=document.createElement('div');
           d.className='toast '+type;
           d.innerHTML=msg;
           c.appendChild(d);
           setTimeout(()=>d.remove(),3500);
        },
        async init(){
          try{
             const res=await fetch('/api/bootstrap');
             if(!res.ok){if(res.status===401)window.location.href='/';return;}
             this.data=await res.json();
             setClientNow(this.data?.settings?.clock?.now);
             this.render();
             this.applySettingsUI();
             if(currentUser.role==='admin')this.loadUsers();
             const last=sessionStorage.getItem('gym_view');
             if(last&&this.can(last))this.nav(last);else this.nav(this.can('attendance')?'attendance':'home');
          }catch(e){this.toast('Failed to load system: '+e.message,'error');}
        },
        can(perm){return currentUser.role==='admin'||currentUser.permissions.includes(perm);},
        nav(v){
          if(v==='users'&&currentUser.role!=='admin')return;
          if(v!=='users'&&!this.can(v))return alert('Access Denied');
          sessionStorage.setItem('gym_view',v);
          const lang=this.data?.settings?.lang||'en';
          const nav=document.getElementById('nav-container');
          let html='';
          if(this.can('home'))html+=`<div class="nav-item" onclick="app.nav('home')">${getIcon('home')} ${t('over')}</div>`;
          if(this.can('members'))html+=`<div class="nav-item" onclick="app.nav('members')">${getIcon('users')} ${t('mem')}</div>`;
          if(this.can('attendance'))html+=`<div class="nav-item" onclick="app.nav('attendance')">${getIcon('clock')} ${t('att')}</div>`;
          if(this.can('history'))html+=`<div class="nav-item" onclick="app.nav('history')">${getIcon('history')} ${t('hist')}</div>`;
          if(this.can('payments'))html+=`<div class="nav-item" onclick="app.nav('payments')">${getIcon('creditCard')} ${t('pay')}</div>`;
          if(this.can('settings'))html+=`<div class="nav-item" onclick="app.nav('settings')">${getIcon('settings')} ${t('set')}</div>`;
          if(currentUser.role==='admin')html+=`<div class="nav-item" onclick="app.nav('users')">${getIcon('users')} ${t('user')}</div>`;
          nav.innerHTML=html;
          document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
          const navItems=document.querySelectorAll('.nav-item');
          navItems.forEach(el=>{if(el.innerText.includes(t(v==='home'?'over':v==='members'?'mem':v==='attendance'?'att':v==='history'?'hist':v==='payments'?'pay':v==='settings'?'set':'user')))el.classList.add('active');});
          ['home','members','attendance','history','payments','settings','users'].forEach(id=>{const el=document.getElementById('view-'+id);if(el)el.classList.add('hidden');});
          document.getElementById('view-'+v).classList.remove('hidden');
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.overlay').classList.remove('open');
          this.updateLabels();
        },
        updateLabels(){
          // Basic Text Updates
          document.getElementById('page-title').innerText=t('dash');
          // (Other labels remain same as before, simplified for brevity in this improved UI block)
        },
        getPlanPrice(planName){const plans=this.data.settings.membershipPlans||[];const found=plans.find(p=>p.name===planName);return found?Number(found.price):0;},
        getPlanAdmFee(planName){const plans=this.data.settings.membershipPlans||[];const found=plans.find(p=>p.name===planName);return found?Number(found.admissionFee||0):0;},
        render(){
          const cur=this.data.settings.currency||'BDT';
          if(document.getElementById('stat-active')){
            document.getElementById('stat-active').innerText=this.data.stats.active;
            document.getElementById('stat-today').innerText=this.data.stats.today;
            document.getElementById('stat-rev').innerText=cur+' '+this.data.stats.revenue;
            document.getElementById('stat-due').innerText=this.data.stats.dueMembers;
            document.getElementById('stat-total-due').innerText=cur+' '+this.data.stats.totalOutstanding;
          }
          this.renderMembersTable();
          const todayRows=(this.data.attendanceToday||[]).map(a=>{let dueStr='-';if(a.dueMonths>0)dueStr=formatDueMonthsLabel(a);else if(a.dueMonths<0)dueStr=Math.abs(a.dueMonths)+' Mo Adv';return`<tr><td>${formatTime(a.check_in_time).split(', ')[1]}</td><td>${escapeHtml(a.name)}</td><td><span class="badge ${a.dueMonths>0?'bg-red':(a.dueMonths<0?'bg-blue':'bg-green')}">${dueStr}</span></td></tr>`;}).join('')||'<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:20px;">No attendance records today.</td></tr>';
          document.getElementById('tbl-attendance-today').innerHTML=todayRows;
          this.renderHistoryTable(null);
          this.renderPaymentsTable();
          this.renderCharts();
        },
        renderMembersTable(){
          const q=document.getElementById('search').value.trim().toLowerCase();
          const filter=document.getElementById('member-filter').value;
          const isNumeric=/^\d+$/.test(q);
          const isIdSearch=isNumeric&&q.length>0&&q.length<6;
          const isPhoneSearch=isNumeric&&q.length>=6;
          let list=(this.data.members||[]).filter(m=>{
            let matchSearch=true;
            if(q){if(isIdSearch)matchSearch=m.id.toString().startsWith(q);else if(isPhoneSearch)matchSearch=m.phone.includes(q);else matchSearch=m.name.toLowerCase().includes(q);}
            let matchStatus=true;
            if(filter!=='all'){
              if(filter==='active')matchStatus=(!m.dueMonths||m.dueMonths===0)&&m.status!=='inactive';
              else if(filter==='due')matchStatus=m.dueMonths>0;
              else if(filter==='advanced')matchStatus=m.dueMonths<0;
              else if(filter==='inactive')matchStatus=m.status==='inactive';
            }
            return matchSearch&&matchStatus;
          });
          document.getElementById('tbl-members').innerHTML=list.map(m=>{
            let statusBadge=`<span class="badge bg-green">Active</span>`;
            let dueTxt='-';
            let dueColor='var(--text-muted)';
            if(m.dueMonths>0){
                const price=this.getPlanPrice(m.plan);
                const paid=m.balance||0;
                const owed=(m.dueMonths*price);
                const remaining=Math.max(0,owed-paid);
                const dueLabel=formatDueMonthsLabel(m)||(m.dueMonths+' Mo Due');
                dueTxt=`${remaining} (${dueLabel})`;
                if(paid>0)dueTxt+=` [Bal:${paid}]`;
                dueColor='#ef4444';
                statusBadge=`<span class="badge bg-amber">Due</span>`;
                if(m.status==='inactive')statusBadge=`<span class="badge bg-red">Inactive</span>`;
            }else if(m.dueMonths<0){
                dueTxt='+'+Math.abs(m.dueMonths)+' Mo Adv';
                dueColor='#10b981';
                statusBadge=`<span class="badge bg-blue">Advance</span>`;
            }
            return `<tr>
              <td style="color:var(--text-muted)">#${m.id}</td>
              <td><div style="font-weight:600;">${escapeHtml(m.name)}</div></td>
              <td style="color:var(--text-muted)">${formatDate(m.joined_at)}</td>
              <td>${escapeHtml(m.phone)}</td>
              <td><span class="badge bg-blue" style="background:#e0f2fe;color:#0284c7;">${escapeHtml(m.plan)}</span></td>
              <td>${formatExpiryMonth(m.expiry_date)}</td>
              <td>${statusBadge}<div style="font-size:11px;font-weight:600;color:${dueColor};margin-top:2px;">${dueTxt}</div></td>
              <td style="text-align:right;">
                <div class="flex" style="justify-content:flex-end;gap:6px;">
                  <button class="btn btn-outline" style="padding:6px 10px;" onclick="app.showHistory(${m.id}, '${escapeHtml(m.name)}')">Attn</button>
                  <button class="btn btn-outline" style="padding:6px 10px;" onclick="app.openPaymentHistory(${m.id})" title="History">${getIcon('history')}</button>
                  <button class="btn btn-primary" style="padding:6px 12px;" onclick="app.modals.pay.open(${m.id})">Pay</button>
                  <button class="btn btn-danger" style="padding:6px 10px;" onclick="app.del(${m.id})">${getIcon('trash')}</button>
                </div>
              </td>
            </tr>`;
          }).join('')||'<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text-muted);">No members found.</td></tr>';
        },
        renderPaymentsTable(){
          const filter=document.getElementById('pay-filter').value;
          const cur=this.data.settings.currency||'BDT';
          let list=(this.data.members||[]).slice();
          if(filter==='due')list=list.filter(m=>m.dueMonths>0);else if(filter==='running')list=list.filter(m=>!m.dueMonths||m.dueMonths===0);else if(filter==='advanced')list=list.filter(m=>m.dueMonths<0);
          let totalOutstanding=0;
          list.sort((a,b)=>{const getWeight=(m)=>{if(m.dueMonths>0)return 3;if(!m.dueMonths||m.dueMonths===0)return 2;return 1;};return getWeight(b)-getWeight(a);});
          document.getElementById('tbl-payment-list').innerHTML=list.map(m=>{
            const price=this.getPlanPrice(m.plan);
            let statusHtml=`<span class="badge bg-green">Running</span>`;let infoTxt='-';let amtTxt='0';
            if(m.dueMonths>0){
                statusHtml=`<span class="badge bg-amber">Due</span>`;
                if(m.status==='inactive')statusHtml=`<span class="badge bg-red">Inactive</span>`;
                infoTxt=formatDueMonthsLabel(m)||(m.dueMonths+' Mo Due');
                const dueAmt=m.dueMonths*price;const paid=m.balance||0;const remaining=Math.max(0,dueAmt-paid);
                totalOutstanding+=remaining;
                amtTxt=`<span style="color:#ef4444;font-weight:700">${cur} ${remaining}</span>`;
                if(paid>0)amtTxt+=`<br><span style="font-size:10px;color:gray;">(Paid: ${paid})</span>`;
            }else if(m.dueMonths<0){statusHtml=`<span class="badge bg-blue">Advanced</span>`;infoTxt=Math.abs(m.dueMonths)+' Mo Adv';amtTxt=`<span style="color:#10b981">+${cur} ${Math.abs(m.dueMonths*price)}</span>`;}
            return `<tr><td>#${m.id}</td><td>${escapeHtml(m.name)}</td><td>${statusHtml}</td><td>${infoTxt}</td><td>${amtTxt}</td><td style="text-align:right"><button class="btn btn-primary" onclick="app.modals.pay.open(${m.id})">Pay</button></td></tr>`;
          }).join('')||'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">No records found.</td></tr>';
          document.getElementById('total-outstanding-amount').innerText=cur+' '+totalOutstanding;
        },
        async openPaymentHistory(memberId=null){this.currentHistoryMemberId=memberId;document.getElementById('trans-date').value='';document.getElementById('modal-payment-history').style.display='flex';this.renderTransactionHistory();},
        async renderTransactionHistory(){
           const date=document.getElementById('trans-date').value;const memberId=this.currentHistoryMemberId;const tbody=document.getElementById('tbl-transaction-history');const cur=this.data.settings.currency||'BDT';
           tbody.innerHTML='<tr><td colspan="3" style="text-align:center;padding:20px;">Loading history...</td></tr>';
           try{
             const res=await fetch('/api/payments/history',{method:'POST',body:JSON.stringify({memberId,date})});
             const data=await res.json();
             const titleEl=document.getElementById('ph-title');
             titleEl.innerText=memberId&&data.memberName?("History: "+data.memberName):"Transaction History";
             const list=data.transactions||[];
             if(list.length===0){tbody.innerHTML='<tr><td colspan="3" style="text-align:center;padding:20px;">No records found.</td></tr>';return;}
             tbody.innerHTML=list.map(p=>`<tr><td>${formatTime(p.date)}</td><td>${p.name?(escapeHtml(p.name)+' (#'+p.member_id+')'):'<span style="color:gray;font-style:italic;">Unknown (#'+p.member_id+')</span>'}</td><td style="font-weight:bold;color:#10b981;">${cur} ${p.amount}</td></tr>`).join('');
           }catch(e){this.toast('Error loading history','error');}
        },
        async showHistory(id,name){document.getElementById('mh-title').innerText='#'+id+' · '+name;const container=document.getElementById('calendar-container');container.innerHTML='<div style="text-align:center;padding:20px;">Loading calendar...</div>';document.getElementById('modal-member-history').style.display='flex';const res=await fetch('/api/members/history',{method:'POST',body:JSON.stringify({memberId:id})});const data=await res.json();this.activeHistory={history:data.history||[],joinedAt:new Date(data.joinedAt||getClientNow())};const yearSelect=document.getElementById('hist-year');yearSelect.innerHTML='';const startYear=this.activeHistory.joinedAt.getFullYear();const endYear=getClientNow().getFullYear();for(let y=endYear;y>=startYear;y--){const opt=document.createElement('option');opt.value=y;opt.innerText=y;yearSelect.appendChild(opt);}const now=getClientNow();yearSelect.value=now.getFullYear();document.getElementById('hist-month').value=now.getMonth();this.renderCalendar();},
        renderCalendar(){if(!this.activeHistory)return;const year=parseInt(document.getElementById('hist-year').value);const monthVal=parseInt(document.getElementById('hist-month').value);const container=document.getElementById('calendar-container');const threshold=this.data.settings.attendanceThreshold||3;if(monthVal===-1){let gridHtml='<div class="year-grid">';const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];for(let m=0;m<12;m++){const presentDays=this.activeHistory.history.filter(h=>{const d=new Date(h.check_in_time);return d.getFullYear()===year&&d.getMonth()===m;}).map(h=>new Date(h.check_in_time).getDate());const unique=new Set(presentDays).size;const isP=unique>=threshold;const badgeCls=isP?'ym-p':'ym-a';const badgeTxt=isP?'P':'A';gridHtml+=`<div class="year-month-card"><div class="ym-name">${monthNames[m]}</div><div class="ym-badge ${badgeCls}">${badgeTxt}</div><div class="ym-count">${unique} Days</div></div>`;}gridHtml+='</div>';container.innerHTML=gridHtml;return;}const monthName=new Date(year,monthVal).toLocaleString('default',{month:'long'});const daysInMonth=new Date(year,monthVal+1,0).getDate();const presentDays=this.activeHistory.history.filter(h=>{const d=new Date(h.check_in_time);return d.getFullYear()===year&&d.getMonth()===monthVal;}).map(h=>new Date(h.check_in_time).getDate());const uniquePresent=[...new Set(presentDays)];const count=uniquePresent.length;const isBillable=count>=threshold;let gridHtml='';for(let i=1;i<=daysInMonth;i++){const isPresent=uniquePresent.includes(i);const cls=isPresent?'present':'absent';const mark=isPresent?'P':i;gridHtml+=`<div class="cal-cell ${cls}">${mark}</div>`;}container.innerHTML=`<div class="calendar-month"><div class="cal-header">${monthName} ${year}</div><div class="cal-grid">${gridHtml}</div><div class="cal-stats"><span>Days: <strong>${count}</strong></span><span style="color:${isBillable?'#10b981':'#ef4444'}">${isBillable?'Active':'Inactive'}</span></div></div>`;},
        async applyHistoryFilter(){const date=document.getElementById('history-date').value;const tbody=document.getElementById('tbl-attendance-history');tbody.innerHTML='<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';const res=await fetch('/api/history/list',{method:'POST',body:JSON.stringify({date})});const data=await res.json();this.renderHistoryTable(null,data.history);},
        clearHistoryFilter(){document.getElementById('history-date').value='';this.applyHistoryFilter();},
        renderHistoryTable(filterDate,dataList=null){let list=dataList||this.data.attendanceHistory||[];if(filterDate&&!dataList){list=list.filter(a=>a.check_in_time.startsWith(filterDate));}document.getElementById('tbl-attendance-history').innerHTML=list.length?list.map(a=>`<tr><td>${formatTime(a.check_in_time).split(', ')[0]}</td><td>${formatTime(a.check_in_time).split(', ')[1]}</td><td>${escapeHtml(a.name)}</td></tr>`).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px;">No activity found.</td></tr>';},
        openAddUser(){document.getElementById('modal-user').style.display='flex';document.getElementById('user-modal-title').innerText="Add New User";document.getElementById('user-form').reset();document.getElementById('u-id').value="";document.getElementById('u-password').required=true;document.getElementById('u-pass-hint').innerText="";this.togglePerms('staff');},
        editUser(id){const u=this.userList.find(x=>x.id===id);if(!u)return;document.getElementById('user-modal-title').innerText="Edit User";document.getElementById('u-id').value=u.id;document.getElementById('u-name').value=u.name;document.getElementById('u-email').value=u.email;document.getElementById('u-password').required=false;document.getElementById('u-pass-hint').innerText="(Leave blank to keep)";document.getElementById('u-role').value=u.role;const perms=JSON.parse(u.permissions||'[]');document.querySelectorAll('input[name="permissions"]').forEach(cb=>cb.checked=perms.includes(cb.value));this.togglePerms(u.role);document.getElementById('modal-user').style.display='flex';},
        togglePerms(role){const container=document.getElementById('u-perms-container');if(role==='admin')container.classList.add('hidden');else container.classList.remove('hidden');},
        async loadUsers(){const res=await fetch('/api/users/list');if(res.ok){const data=await res.json();this.userList=data.users;document.getElementById('tbl-users').innerHTML=this.userList.map(u=>`<tr><td>#${u.id}</td><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td><span class="badge bg-blue">${escapeHtml(u.role)}</span></td><td style="font-size:11px;white-space:normal;max-width:150px;">${u.role==='admin'?'ALL':(JSON.parse(u.permissions).join(', '))}</td><td style="text-align:right"><button class="btn btn-outline" onclick="app.editUser(${u.id})">Edit</button> <button class="btn btn-danger" onclick="app.deleteUser(${u.id})">Del</button></td></tr>`).join('');}},
        async saveUser(e){e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const perms=[];document.querySelectorAll('input[name="permissions"]:checked').forEach(cb=>perms.push(cb.value));data.permissions=perms;const url=data.id?'/api/users/update':'/api/users/add';const res=await fetch(url,{method:'POST',body:JSON.stringify(data)});if(res.ok){document.getElementById('modal-user').style.display='none';this.loadUsers();this.toast('User saved successfully');}else{alert((await res.json()).error);}},
        async deleteUser(id){if(confirm("Delete?")){await fetch('/api/users/delete',{method:'POST',body:JSON.stringify({id})});this.loadUsers();this.toast('User deleted');}},
        applySettingsUI(){const s=this.data.settings;const form=document.getElementById('settings-form');form.querySelector('input[name="currency"]').value=s.currency||'BDT';form.querySelector('select[name="lang"]').value=s.lang||'en';form.querySelector('input[name="attendanceThreshold"]').value=s.attendanceThreshold;form.querySelector('input[name="inactiveAfterMonths"]').value=s.inactiveAfterMonths;form.querySelector('input[name="renewalFee"]').value=s.renewalFee;form.querySelector('input[name="timezone"]').value=(s.time&&s.time.timezone)||'Asia/Dhaka';setClientNow(s.time?.now);const simInput=form.querySelector('input[name="simulatedTime"]');if(simInput){const iso=s.time?.simulatedTime||s.time?.now||'';simInput.value=iso?new Date(iso).toISOString().slice(0,16):'';}const simToggle=form.querySelector('input[name="timeSimulationEnabled"]');if(simToggle)simToggle.checked=!!s.time?.simulated;const lblClock=document.getElementById('lbl-current-time');if(lblClock){const tz=s.time?.timezone||'Asia/Dhaka';const now=s.time?.now?new Date(s.time.now):getClientNow();const formatted=now.toLocaleString('en-GB',{timeZone:tz});const suffix=s.time?.simulated?' (simulation active)':'';lblClock.innerText='Current system time ('+tz+'): '+formatted+suffix;}const plansDiv=document.getElementById('plans-container');plansDiv.innerHTML=s.membershipPlans.map((p,i)=>`<div class="plan-row" id="plan-${i}"><input type="text" placeholder="Plan Name" value="${escapeHtml(p.name)}" class="plan-name"><input type="number" placeholder="Price" value="${p.price}" class="plan-price"><input type="number" placeholder="Adm Fee" value="${p.admissionFee||0}" class="plan-adm"><button type="button" class="btn btn-danger" onclick="document.getElementById('plan-${i}').remove()">X</button></div>`).join('');document.getElementById('plan-select').innerHTML=s.membershipPlans.map(p=>`<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`).join('');},
        addPlanRow(){const id='new-'+Date.now();const html=`<div class="plan-row" id="${id}"><input type="text" placeholder="Plan Name" class="plan-name"><input type="number" placeholder="Price" value="0" class="plan-price"><input type="number" placeholder="Adm Fee" value="0" class="plan-adm"><button type="button" class="btn btn-danger" onclick="document.getElementById('${id}').remove()">X</button></div>`;document.getElementById('plans-container').insertAdjacentHTML('beforeend',html);},
        async saveSettings(e){e.preventDefault();const plans=[];document.getElementById('plans-container').querySelectorAll('.plan-row').forEach(row=>{const nameInput=row.querySelector('.plan-name');const priceInput=row.querySelector('.plan-price');const admInput=row.querySelector('.plan-adm');if(nameInput&&priceInput){const name=nameInput.value.trim();const price=priceInput.value.trim();const admissionFee=admInput?admInput.value.trim():0;if(name)plans.push({name,price:Number(price),admissionFee:Number(admissionFee)});}});const form=e.target;document.getElementById('settings-status').innerText='Saving...';await fetch('/api/settings',{method:'POST',body:JSON.stringify({currency:form.querySelector('input[name="currency"]').value,lang:form.querySelector('select[name="lang"]').value,attendanceThreshold:form.querySelector('input[name="attendanceThreshold"]').value,inactiveAfterMonths:form.querySelector('input[name="inactiveAfterMonths"]').value,renewalFee:form.querySelector('input[name="renewalFee"]').value,membershipPlans:plans,timezone:form.querySelector('input[name="timezone"]').value,timeSimulationEnabled:form.querySelector('input[name="timeSimulationEnabled"]').checked,simulatedTime:form.querySelector('input[name="simulatedTime"]').value})});this.toast('Settings saved. reloading...'); setTimeout(()=>location.reload(),1000);},
        async resetDB(){if(!confirm("Delete ALL data and reset system? This is irreversible!"))return;await fetch('/api/nuke');location.reload();},
        async pay(e){e.preventDefault();const btn=document.getElementById('pay-submit-btn');btn.disabled=true;btn.innerText="Processing...";try{const endpoint=app.isRenewalMode?'/api/members/renew':'/api/payment';await fetch(endpoint,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});this.toast('Payment Successful');setTimeout(()=>location.reload(),500);}catch(e){this.toast('Payment Failed','error');btn.disabled=false;btn.innerText="Confirm Payment";}},
        async checkIn(){if(this.isSubmitting)return;this.isSubmitting=true;const btn=document.getElementById('btn-sub-chk');if(btn)btn.disabled=true;btn.innerText="Checking...";const id=document.getElementById('checkin-id').value;try{const res=await fetch('/api/checkin',{method:'POST',body:JSON.stringify({memberId:id})});const json=await res.json();const div=document.getElementById('checkin-res');div.innerText=json.status==='success'?('✅ Welcome '+json.name):(json.error||'⛔ Error');div.style.color=json.status==='success'?'#10b981':'#ef4444';if(json.status==='success'){this.toast('Welcome '+json.name);setTimeout(()=>location.reload(),800);}}catch(e){this.toast('Network Error','error');}finally{this.isSubmitting=false;if(btn){btn.disabled=false;btn.innerText="Submit";}}},
        onCheckinInput(e){if(e.key==='Enter'){this.checkIn();return;}const val=e.target.value;if(this.searchTimeout)clearTimeout(this.searchTimeout);this.searchTimeout=setTimeout(async()=>{if(!val.trim()){document.getElementById('checkin-suggestions').innerHTML='';document.getElementById('checkin-suggestions').style.display='none';return;}const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:val})});const data=await res.json();const resDiv=document.getElementById('checkin-suggestions');resDiv.style.display='block';resDiv.innerHTML=data.results.map(m=>{let statusStr='<span style="color:gray;">Running</span>';if(m.status==='inactive'){statusStr='<span style="color:#ef4444;font-weight:700;">⛔ INACTIVE</span>';}else if(m.dueMonths>0){statusStr='<span style="color:#f59e0b;font-weight:700;">'+formatDueMonthsLabel(m)+'</span>';}let checkedInBadge='';if(m.checkedIn){checkedInBadge='<span style="margin-left:5px;font-size:10px;background:#dcfce7;color:#15803d;padding:2px 6px;border-radius:4px;font-weight:700;">✅ In</span>';}return`<div class="checkin-item" onclick="document.getElementById('checkin-id').value='${m.id}'; document.getElementById('checkin-suggestions').style.display='none';"><div><strong>#${m.id} · ${escapeHtml(m.name)}</strong></div> <div>${statusStr}${checkedInBadge}</div></div>`;}).join('');},300);},
        onQuickPayInput(e){const val=e.target.value;if(this.searchTimeout)clearTimeout(this.searchTimeout);this.searchTimeout=setTimeout(async()=>{if(!val.trim()){document.getElementById('qp-results').innerHTML='';document.getElementById('qp-results').style.display='none';return;}const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:val})});const data=await res.json();const resDiv=document.getElementById('qp-results');resDiv.style.display='block';resDiv.innerHTML=data.results.map(m=>{let dueStr='Active';if(m.status==='inactive')dueStr='⛔ Inactive';else if(m.dueMonths>0)dueStr=formatDueMonthsLabel(m);return`<div class="checkin-item" onclick="app.modals.quickPay.close(); app.modals.pay.open(${m.id})"><strong>#${m.id} · ${escapeHtml(m.name)}</strong> - ${dueStr}</div>`;}).join('');},300);},
        switchAddTab(tab){const isMig=tab==='mig';document.getElementById('tab-new').className=isMig?'nav-item':'nav-item active';document.getElementById('tab-new').style.borderBottom=isMig?'none':'2px solid var(--primary)';document.getElementById('tab-new').style.color=isMig?'#94a3b8':'var(--primary)';document.getElementById('tab-mig').className=isMig?'nav-item active':'nav-item';document.getElementById('tab-mig').style.borderBottom=isMig?'2px solid var(--primary)':'none';document.getElementById('tab-mig').style.color=isMig?'var(--primary)':'#94a3b8';document.getElementById('sec-new-fees').style.display=isMig?'none':'block';document.getElementById('sec-mig-fees').style.display=isMig?'block':'none';document.getElementById('add-mig-mode').value=isMig?'true':'false';document.getElementById('new-init-pay').required=!isMig;document.getElementById('mig-legacy-dues').required=isMig;app.updateAddMemberFees();},
        updateAddMemberFees(){const planName=document.getElementById('plan-select').value;const fee=app.getPlanAdmFee(planName);document.getElementById('new-adm-fee').value=fee;},
        async addMember(e){e.preventDefault();const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;btn.innerText="Creating...";try{await fetch('/api/members/add',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});this.toast('Member Added');location.reload();}catch(e){this.toast('Error adding member','error');btn.disabled=false;btn.innerText="Create Member";}},
        async del(id){if(confirm("Delete this member permanently?")){await fetch('/api/members/delete',{method:'POST',body:JSON.stringify({id})});this.toast('Member deleted');location.reload();}},
        onPaymentSearchInput(e){const val=e.target.value;if(this.searchTimeout)clearTimeout(this.searchTimeout);this.searchTimeout=setTimeout(async()=>{if(!val.trim()){document.getElementById('pay-search-results').innerHTML='';document.getElementById('pay-search-results').style.display='none';return;}const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:val})});const data=await res.json();const div=document.getElementById('pay-search-results');div.style.display='block';div.innerHTML=data.results.map(m=>{let dueStr='Active';if(m.status==='inactive')dueStr='⛔ Inactive';else if(m.dueMonths>0)dueStr=formatDueMonthsLabel(m);return`<div class="checkin-item" onclick="app.modals.pay.open(${m.id})"><strong>#${m.id} · ${escapeHtml(m.name)}</strong> - ${dueStr}</div>`;}).join('');},300);},
        renderCharts(){if(typeof Chart==='undefined')return;const members=this.data.members||[];const ctx1=document.getElementById('chart-dues');if(ctx1){if(window.myChart)window.myChart.destroy();window.myChart=new Chart(ctx1.getContext('2d'),{type:'bar',data:{labels:['No Due','1 Mo','2+ Mo','Inactive'],datasets:[{label:'Members',data:[members.filter(m=>!m.dueMonths||m.dueMonths<=0).length,members.filter(m=>m.dueMonths===1).length,members.filter(m=>m.dueMonths>=2&&m.status!=='inactive').length,members.filter(m=>m.status==='inactive').length],backgroundColor:['#10b981','#f59e0b','#ef4444','#64748b'],borderRadius:6}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f1f5f9'}},x:{grid:{display:false}}}}});}},
        modals:{
          checkin:{open:()=>{document.getElementById('modal-checkin').style.display='flex';document.getElementById('checkin-id').focus();},close:()=>{document.getElementById('modal-checkin').style.display='none';document.getElementById('checkin-res').innerText='';}},
          quickPay:{open:()=>{document.getElementById('modal-quick-pay').style.display='flex';document.getElementById('qp-search').focus();},close:()=>document.getElementById('modal-quick-pay').style.display='none'},
          add:{open:()=>{app.switchAddTab('new');app.updateAddMemberFees();document.getElementById('mig-legacy-dues').value='0';document.getElementById('mig-init-pay').value='0';document.getElementById('modal-add').style.display='flex';},close:()=>document.getElementById('modal-add').style.display='none'},
          pay:{open:(id)=>{app.payingMemberId=id;const m=app.data.members.find(x=>x.id===id);const price=app.getPlanPrice(m.plan);document.getElementById('pay-id').value=id;document.getElementById('pay-name').innerText=m?m.name:'';document.getElementById('pay-amount').value='';document.getElementById('pay-status-warning').style.display='none';document.getElementById('pay-renewal-section').style.display='none';document.getElementById('pay-standard-label').style.display='block';const btn=document.getElementById('pay-submit-btn');btn.innerText='Confirm Payment';btn.disabled=false;document.getElementById('pay-amount').required=true;app.isRenewalMode=false;if(m.status==='inactive'){app.isRenewalMode=true;document.getElementById('pay-status-warning').style.display='block';document.getElementById('pay-renewal-section').style.display='block';document.getElementById('pay-standard-label').style.display='none';document.getElementById('pay-ren-fee').value=app.data.settings.renewalFee||0;btn.innerText='Re-admit & Pay';}document.getElementById('pay-plan-price').innerText=price;document.getElementById('pay-wallet-bal').innerText=m.balance||0;document.getElementById('modal-pay').style.display='flex';},close:()=>{app.payingMemberId=null;document.getElementById('modal-pay').style.display='none'}},
          user:{close:()=>document.getElementById('modal-user').style.display='none'}
        }
      };
      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
