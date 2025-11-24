import { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
}

/* ========================================================================
   1. SECURITY & UTILITIES
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

/* ========================================================================
   2. DATABASE SCHEMA (The "Universal" Engine)
   ======================================================================== */

async function initDB(env: Env) {
  const q = [
    // Config: Stores Gym Name, Type (Unisex/Single), Currency
    `CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT)`,
    
    // Users: Staff/Admin access
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`,
    
    // Members: Enhanced with Gender, Fees, Notes
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY, 
      name TEXT, 
      gender TEXT, 
      phone TEXT, 
      plan_name TEXT, 
      monthly_fee INTEGER, 
      joined_at TEXT, 
      expiry_date TEXT, 
      notes TEXT,
      status TEXT DEFAULT 'active'
    )`,
    
    // Attendance: Linked to member
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, check_in_time TEXT, status TEXT, method TEXT)`,
    
    // Financials
    `CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, member_id INTEGER, amount INTEGER, months_paid INTEGER, date TEXT, note TEXT)`,
    
    // Auth
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
  ];
  for (const sql of q) await env.DB.prepare(sql).run();
}

/* ========================================================================
   3. WORKER LOGIC (The API)
   ======================================================================== */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
    await initDB(env); // Ensure DB works

    /* --- PUBLIC ENDPOINTS --- */

    // 1. Serve App
    if (url.pathname === "/") {
      const config = await env.DB.prepare("SELECT value FROM config WHERE key = 'gym_name'").first();
      const user = await getSession(req, env);
      
      if (!config) return renderSetup();
      if (!user) return renderLogin(config.value as string);
      return renderApp(user, config.value as string);
    }

    // 2. Setup & Login APIs
    if (url.pathname === "/api/setup" && req.method === "POST") {
      const body = await req.json() as any;
      await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('gym_name', ?), ('gym_type', ?)").bind(body.gymName, body.gymType).run();
      const hash = await hashPassword(body.password);
      await env.DB.prepare("DELETE FROM users").run(); 
      await env.DB.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')").bind(body.email, hash, body.adminName).run();
      return json({ success: true });
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      const body = await req.json() as any;
      const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(body.email).first<any>();
      if (!user || !(await verifyPassword(body.password, user.password_hash))) return json({ error: "Invalid credentials" }, 401);

      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").bind(token, user.id, expires).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` }
      });
    }

    if (url.pathname === "/api/logout") {
      return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" } });
    }

    /* --- PROTECTED ENDPOINTS --- */
    const user = await getSession(req, env);
    if (!user) return json({ error: "Unauthorized" }, 401);

    // LIVE SEARCH (The core of the new system)
    if (url.pathname === "/api/members/search") {
      const query = url.searchParams.get("q") || "";
      const sql = `
        SELECT id, name, phone, gender, plan_name, monthly_fee, expiry_date, status, notes 
        FROM members 
        WHERE name LIKE ? OR phone LIKE ? OR id = ? 
        ORDER BY expiry_date ASC LIMIT 10`;
      const results = await env.DB.prepare(sql).bind(`%${query}%`, `%${query}%`, query).all();
      
      // Calculate Dues on the fly
      const enriched = results.results.map((m: any) => {
        const expDate = new Date(m.expiry_date);
        const today = new Date();
        const isExpired = expDate < today;
        
        let dues = 0;
        let daysOverdue = 0;

        if (isExpired) {
          const diffTime = Math.abs(today.getTime() - expDate.getTime());
          daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          // Logic: If overdue, they owe at least 1 month, or more if deeply expired
          const monthsOverdue = Math.ceil(daysOverdue / 30);
          dues = monthsOverdue * m.monthly_fee;
        }

        return { ...m, isExpired, daysOverdue, dues };
      });
      return json(enriched);
    }

    // Dashboard Stats
    if (url.pathname === "/api/stats") {
      const active = await env.DB.prepare("SELECT count(*) as c FROM members WHERE expiry_date >= date('now')").first();
      const expired = await env.DB.prepare("SELECT count(*) as c FROM members WHERE expiry_date < date('now')").first();
      const todayCheckins = await env.DB.prepare("SELECT count(*) as c FROM attendance WHERE date(check_in_time) = date('now')").first();
      const monthlyRev = await env.DB.prepare("SELECT sum(amount) as t FROM payments WHERE date(date) > date('now', '-30 days')").first();
      
      return json({
        active: active?.c || 0,
        expired: expired?.c || 0,
        checkins: todayCheckins?.c || 0,
        revenue: monthlyRev?.t || 0
      });
    }

    // Check In
    if (url.pathname === "/api/checkin" && req.method === "POST") {
      const { memberId } = await req.json() as any;
      const member = await env.DB.prepare("SELECT * FROM members WHERE id = ?").bind(memberId).first<any>();
      if (!member) return json({ error: "Member not found" }, 404);

      const isExpired = new Date(member.expiry_date) < new Date();
      const status = isExpired ? 'expired_attempt' : 'success';
      
      // Only allow checkin if strictly needed logic? No, allow entry but log it as warning if expired
      await env.DB.prepare("INSERT INTO attendance (member_id, check_in_time, status, method) VALUES (?, ?, ?, 'manual')")
        .bind(memberId, new Date().toISOString(), status).run();
      
      return json({ success: true, status, member });
    }

    // Add Member
    if (url.pathname === "/api/members/add" && req.method === "POST") {
      const b = await req.json() as any;
      // Initial expiry is today if they haven't paid, or future if they have
      const expiry = new Date(); 
      // Logic: If adding, usually they pay 1 month immediately. 
      // Use the logic: today + 1 month
      expiry.setMonth(expiry.getMonth() + parseInt(b.initial_months || 1));

      const res = await env.DB.prepare(`
        INSERT INTO members (name, gender, phone, plan_name, monthly_fee, joined_at, expiry_date, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
        .bind(b.name, b.gender, b.phone, b.plan, b.fee, new Date().toISOString(), expiry.toISOString(), b.notes || "").first();
      
      // Log initial payment
      if(b.initial_payment > 0) {
         await env.DB.prepare("INSERT INTO payments (member_id, amount, months_paid, date) VALUES (?, ?, ?, ?)")
         .bind(res.id, b.initial_payment, b.initial_months, new Date().toISOString()).run();
      }
      return json({ success: true });
    }

    // Process Payment
    if (url.pathname === "/api/payment" && req.method === "POST") {
      const { memberId, amount, months } = await req.json() as any;
      
      const member = await env.DB.prepare("SELECT expiry_date FROM members WHERE id = ?").bind(memberId).first<any>();
      let newDate = new Date(member.expiry_date);
      if (newDate < new Date()) newDate = new Date(); // Reset to today if strictly expired
      newDate.setMonth(newDate.getMonth() + parseInt(months));

      await env.DB.prepare("INSERT INTO payments (member_id, amount, months_paid, date) VALUES (?, ?, ?, ?)")
        .bind(memberId, amount, months, new Date().toISOString()).run();
        
      await env.DB.prepare("UPDATE members SET expiry_date = ? WHERE id = ?").bind(newDate.toISOString(), memberId).run();
      return json({ success: true, newDate });
    }
    
    // Get All Members (Paginated - Optional, simplified here)
    if (url.pathname === "/api/members/list") {
      const res = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC LIMIT 50").all();
      return json(res.results);
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function verifyPassword(password: string, hash: string) {
  return (await hashPassword(password)) === hash;
}

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  const token = cookie?.match(/gym_auth=([^;]+)/)?.[1];
  if (!token) return null;
  return await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ?").bind(token).first();
}

/* ========================================================================
   4. FRONTEND - THE "GYM OS v3" SINGLE PAGE APP
   ======================================================================== */

// Shared Styles & Head
const HTML_HEAD = `
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>GymOS v3</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563eb; --primary-dark: #1d4ed8; --accent: #f59e0b;
      --bg: #f8fafc; --surface: #ffffff; --text: #0f172a; --text-light: #64748b;
      --danger: #ef4444; --success: #22c55e; --border: #e2e8f0;
      --radius: 12px; --shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-family: 'Inter', sans-serif; }
    body { margin: 0; background: var(--bg); color: var(--text); height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    
    /* Layout */
    .app-shell { display: flex; height: 100%; width: 100%; }
    .sidebar { width: 260px; background: #0f172a; color: white; flex-shrink: 0; display: flex; flex-direction: column; transition: 0.3s; z-index: 50; }
    .main { flex: 1; position: relative; overflow-y: auto; display: flex; flex-direction: column; }
    
    /* Mobile Logic */
    @media (max-width: 800px) {
      .sidebar { position: fixed; inset: 0 auto 0 0; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); box-shadow: 0 0 50px rgba(0,0,0,0.5); }
      .app-shell { flex-direction: column; }
    }

    /* Components */
    .btn { padding: 12px 20px; border: none; border-radius: var(--radius); font-weight: 600; cursor: pointer; transition: 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; }
    .btn-primary { background: var(--primary); color: white; }
    .btn-primary:hover { background: var(--primary-dark); }
    .btn-danger { background: var(--danger); color: white; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .card { background: var(--surface); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); border: 1px solid var(--border); margin-bottom: 16px; }
    .input { width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 15px; outline: none; transition: 0.2s; background: #fff; }
    .input:focus { border-color: var(--primary); ring: 2px solid var(--primary); }
    
    /* Utility */
    .flex { display: flex; align-items: center; gap: 10px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .flex-col { display: flex; flex-direction: column; gap: 6px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .text-sm { font-size: 13px; color: var(--text-light); }
    .text-lg { font-size: 18px; font-weight: 700; }
    .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-gray { background: #f1f5f9; color: #475569; }
    
    /* Search Bar Specifics */
    .big-search { position: relative; width: 100%; }
    .big-search input { padding: 18px 20px; font-size: 18px; border-radius: 16px; border: 2px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .big-search input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    .search-results { margin-top: 15px; display: grid; gap: 10px; }
    .member-row { display: flex; align-items: center; justify-content: space-between; background: white; padding: 16px; border-radius: 12px; border: 1px solid var(--border); cursor: pointer; transition: 0.2s; }
    .member-row:hover { border-color: var(--primary); transform: translateY(-2px); }
    
    .dues-alert { color: var(--danger); font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 4px; }
    
    /* Navigation */
    .nav-item { padding: 14px 20px; color: #94a3b8; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 12px; border-left: 3px solid transparent; }
    .nav-item.active { color: white; background: #1e293b; border-left-color: var(--primary); }
    .nav-item:hover { color: white; }

    /* Loading */
    .spinner { width: 20px; height: 20px; border: 3px solid #fff; border-bottom-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .hidden { display: none !important; }
    
    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(3px); }
    .modal { background: white; width: 95%; max-width: 500px; border-radius: 20px; padding: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: slideUp 0.3s ease; max-height: 90vh; overflow-y: auto; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>`;

function renderLogin(gymName: string) {
  return new Response(`<!doctype html><html>${HTML_HEAD}
  <body>
    <div style="flex:1; display:flex; align-items:center; justify-content:center; background:#f1f5f9; padding:20px;">
      <div class="card" style="width:100%; max-width:400px; text-align:center;">
        <h1 style="color:var(--primary); margin:0 0 10px 0;">${gymName}</h1>
        <p class="text-sm" style="margin-bottom:24px;">Staff Management Portal</p>
        <form onsubmit="doLogin(event)">
          <div class="flex-col" style="text-align:left; margin-bottom:16px;">
            <label style="font-weight:600; font-size:13px;">Email Address</label>
            <input name="email" class="input" type="email" required placeholder="staff@gym.com">
          </div>
          <div class="flex-col" style="text-align:left; margin-bottom:24px;">
            <label style="font-weight:600; font-size:13px;">Password</label>
            <input name="password" class="input" type="password" required>
          </div>
          <button class="btn btn-primary" style="width:100%">Sign In</button>
        </form>
      </div>
    </div>
    <script>
      async function doLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        const orig = btn.innerText;
        btn.innerText = "Validating..."; btn.disabled = true;
        const res = await fetch('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
        if(res.ok) location.reload();
        else { alert("Access Denied"); btn.innerText = orig; btn.disabled = false; }
      }
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}

function renderSetup() {
  return new Response(`<!doctype html><html>${HTML_HEAD}
  <body>
    <div style="flex:1; display:flex; align-items:center; justify-content:center; background:#1e293b; padding:20px;">
      <div class="card" style="width:100%; max-width:450px;">
        <h2 style="margin-top:0;">🚀 Initialize GymOS v3</h2>
        <form onsubmit="doSetup(event)">
          <div class="flex-col" style="margin-bottom:15px;">
            <label>Gym Name</label><input name="gymName" class="input" required placeholder="e.g. Titanium Fitness">
          </div>
          <div class="flex-col" style="margin-bottom:15px;">
            <label>Gym Type</label>
            <select name="gymType" class="input">
              <option value="unisex">Unisex / Co-ed</option>
              <option value="male">Male Only</option>
              <option value="female">Female Only</option>
            </select>
          </div>
          <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
          <div class="flex-col" style="margin-bottom:15px;"><label>Admin Name</label><input name="adminName" class="input" required></div>
          <div class="flex-col" style="margin-bottom:15px;"><label>Admin Email</label><input name="email" class="input" type="email" required></div>
          <div class="flex-col" style="margin-bottom:24px;"><label>Master Password</label><input name="password" class="input" type="password" required></div>
          <button class="btn btn-primary" style="width:100%">Install System</button>
        </form>
      </div>
    </div>
    <script>
      async function doSetup(e) {
        e.preventDefault();
        await fetch('/api/setup', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
        location.reload();
      }
    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}

function renderApp(user: any, gymName: string) {
  return new Response(`<!doctype html><html>${HTML_HEAD}
  <body>
    <div class="app-shell">
      <aside class="sidebar">
        <div style="padding:24px; border-bottom:1px solid #334155;">
          <div style="font-weight:800; font-size:20px; letter-spacing:-0.5px;">${gymName}</div>
          <div class="text-sm" style="opacity:0.7; margin-top:4px;">${user.name}</div>
        </div>
        <nav style="flex:1; padding:20px 0;">
          <div class="nav-item active" onclick="route('checkin')">⚡ Check-In & Search</div>
          <div class="nav-item" onclick="route('dashboard')">📊 Dashboard</div>
          <div class="nav-item" onclick="route('members')">👥 All Members</div>
        </nav>
        <div style="padding:20px;">
          <a href="/api/logout" class="btn btn-outline" style="width:100%; color:#94a3b8; border-color:#334155;">Sign Out</a>
        </div>
      </aside>

      <div class="main">
        <header style="padding:16px 24px; background:white; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:40;">
          <button class="btn btn-outline" style="padding:8px;" onclick="document.querySelector('.sidebar').classList.toggle('open')">☰</button>
          <div style="font-weight:700;" id="page-title">Check-In</div>
          <button class="btn btn-primary" onclick="modals.addMember.open()">+ New Member</button>
        </header>

        <div id="view-checkin" class="view-container" style="padding:24px;">
          <div style="max-width:800px; margin:0 auto;">
            <div class="card" style="border:2px solid var(--primary); box-shadow: 0 10px 30px rgba(37, 99, 235, 0.1);">
              <h2 style="margin-top:0; text-align:center; color:var(--primary);">Who is visiting?</h2>
              <div class="big-search">
                <input type="text" id="main-search" placeholder="Start typing name, phone or ID..." autocomplete="off" autofocus onkeyup="app.search(this.value)">
              </div>
            </div>
            
            <div id="search-results" class="search-results">
              <div style="text-align:center; color:var(--text-light); margin-top:40px;">
                 Start typing to see live status, dues, and check-in options.
              </div>
            </div>
          </div>
        </div>

        <div id="view-dashboard" class="view-container hidden" style="padding:24px;">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px;">
             <div class="card"><div class="text-sm">Active Members</div><div class="text-lg" id="stat-active">--</div></div>
             <div class="card"><div class="text-sm">Check-ins Today</div><div class="text-lg" id="stat-checkins">--</div></div>
             <div class="card"><div class="text-sm">Expired / Due</div><div class="text-lg" style="color:var(--danger)" id="stat-expired">--</div></div>
             <div class="card"><div class="text-sm">Monthly Revenue</div><div class="text-lg" style="color:var(--success)">$<span id="stat-rev">--</span></div></div>
          </div>
        </div>

        <div id="view-members" class="view-container hidden" style="padding:24px;">
           <div class="card">
              <h3>Member Directory</h3>
              <div id="member-list-container">Loading...</div>
           </div>
        </div>
      </div>
    </div>

    <div id="modal-action" class="modal-overlay">
      <div class="modal">
        <div class="flex-between">
           <h2 id="act-name" style="margin:0;"></h2>
           <span id="act-badge" class="badge"></span>
        </div>
        <p id="act-plan" class="text-sm"></p>
        
        <div id="act-dues-box" style="background:#fee2e2; color:#991b1b; padding:15px; border-radius:8px; margin:15px 0; display:none;">
           <strong>⚠️ Payment Overdue</strong>
           <div style="font-size:24px; font-weight:bold;">$<span id="act-dues-amt">0</span></div>
           <div class="text-sm">Expired on <span id="act-exp"></span></div>
        </div>

        <div id="act-ok-box" style="background:#dcfce7; color:#166534; padding:15px; border-radius:8px; margin:15px 0; display:none;">
           <strong>✅ All Good</strong>
           <div class="text-sm">Paid until <span id="act-exp-good"></span></div>
        </div>

        <div style="background:#f8fafc; padding:15px; border-radius:8px; margin-bottom:15px;">
           <label class="text-sm" style="font-weight:600">Admin Notes:</label>
           <div id="act-notes" style="font-style:italic;"></div>
        </div>

        <div class="grid-2">
           <button class="btn btn-outline w-full" onclick="modals.action.close()">Cancel</button>
           <button id="btn-checkin" class="btn btn-primary w-full" onclick="app.doCheckin()">✅ Check In</button>
        </div>
        <hr style="margin:20px 0; border:0; border-top:1px solid var(--border);">
        <h4 style="margin:0 0 10px 0;">Receive Payment</h4>
        <form onsubmit="app.doPayment(event)" class="flex" style="gap:10px;">
           <input type="hidden" name="memberId" id="pay-id">
           <input name="amount" class="input" placeholder="Amount" type="number" style="width:100px" required>
           <input name="months" class="input" placeholder="Months" type="number" value="1" style="width:80px" required>
           <button class="btn btn-primary" style="flex:1">Pay & Extend</button>
        </form>
      </div>
    </div>

    <div id="modal-add" class="modal-overlay">
      <div class="modal">
        <h2>New Member</h2>
        <form onsubmit="app.addMember(event)">
          <div class="grid-2">
             <div class="flex-col"><label>Name</label><input name="name" class="input" required></div>
             <div class="flex-col"><label>Phone</label><input name="phone" class="input" required></div>
          </div>
          <div class="grid-2" style="margin-top:10px;">
             <div class="flex-col"><label>Gender</label><select name="gender" class="input"><option>Male</option><option>Female</option></select></div>
             <div class="flex-col"><label>Plan Name</label><input name="plan" class="input" value="Standard"></div>
          </div>
          <div class="grid-2" style="margin-top:10px;">
             <div class="flex-col"><label>Monthly Fee</label><input name="fee" type="number" class="input" required></div>
             <div class="flex-col"><label>Initial Payment</label><input name="initial_payment" type="number" class="input" value="0"></div>
          </div>
          <div class="flex-col" style="margin-top:10px;"><label>Notes</label><textarea name="notes" class="input" rows="2"></textarea></div>
          <div style="margin-top:20px; text-align:right;">
             <button type="button" class="btn btn-outline" onclick="modals.addMember.close()">Cancel</button>
             <button type="submit" class="btn btn-primary">Create Member</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      // --- APP LOGIC ---
      let currentMember = null;

      const modals = {
        action: { 
          open: (m) => {
            currentMember = m;
            document.getElementById('act-name').innerText = m.name;
            document.getElementById('act-badge').innerText = m.isExpired ? 'EXPIRED' : 'ACTIVE';
            document.getElementById('act-badge').className = m.isExpired ? 'badge badge-red' : 'badge badge-green';
            document.getElementById('act-plan').innerText = m.plan_name + " (" + m.gender + ")";
            document.getElementById('act-notes').innerText = m.notes || "No notes.";
            
            document.getElementById('pay-id').value = m.id;

            // Financials
            if(m.isExpired) {
               document.getElementById('act-dues-box').style.display = 'block';
               document.getElementById('act-ok-box').style.display = 'none';
               document.getElementById('act-dues-amt').innerText = m.dues;
               document.getElementById('act-exp').innerText = m.expiry_date.split('T')[0] + " (" + m.daysOverdue + " days ago)";
               document.getElementById('btn-checkin').innerText = "⚠️ Check In Anyway";
               document.getElementById('btn-checkin').className = "btn btn-danger w-full";
            } else {
               document.getElementById('act-dues-box').style.display = 'none';
               document.getElementById('act-ok-box').style.display = 'block';
               document.getElementById('act-exp-good').innerText = m.expiry_date.split('T')[0];
               document.getElementById('btn-checkin').innerText = "✅ Check In";
               document.getElementById('btn-checkin').className = "btn btn-primary w-full";
            }
            document.getElementById('modal-action').style.display = 'flex';
          },
          close: () => document.getElementById('modal-action').style.display = 'none'
        },
        addMember: {
          open: () => document.getElementById('modal-add').style.display = 'flex',
          close: () => document.getElementById('modal-add').style.display = 'none'
        }
      };

      const app = {
        debounce: null,
        async search(q) {
           if(!q) { document.getElementById('search-results').innerHTML = ''; return; }
           clearTimeout(this.debounce);
           this.debounce = setTimeout(async () => {
              const res = await fetch('/api/members/search?q='+q);
              const data = await res.json();
              this.renderResults(data);
           }, 300);
        },

        renderResults(list) {
           const html = list.map(m => {
             const statusHtml = m.isExpired 
               ? \`<div class="dues-alert">⚠️ OWES $\${m.dues}</div>\` 
               : \`<div class="badge badge-green">Active</div>\`;
             
             return \`
             <div class="member-row" onclick='modals.action.open(\${JSON.stringify(m)})'>
                <div class="flex">
                   <div style="width:40px; height:40px; background:#e2e8f0; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#64748b;">\${m.name.charAt(0)}</div>
                   <div>
                      <div style="font-weight:600">\${m.name}</div>
                      <div class="text-sm">\${m.plan_name} • \${m.phone}</div>
                   </div>
                </div>
                \${statusHtml}
             </div>\`;
           }).join('');
           document.getElementById('search-results').innerHTML = html || '<div style="text-align:center; margin-top:20px;">No members found.</div>';
        },

        async doCheckin() {
           const res = await fetch('/api/checkin', { method: 'POST', body: JSON.stringify({ memberId: currentMember.id }) });
           if(res.ok) {
              modals.action.close();
              document.getElementById('main-search').value = '';
              document.getElementById('search-results').innerHTML = '<div class="card" style="background:#dcfce7; color:#166534; text-align:center;">✅ Checked In Successfully!</div>';
              setTimeout(() => document.getElementById('search-results').innerHTML = '', 2000);
           }
        },

        async doPayment(e) {
           e.preventDefault();
           if(!confirm("Confirm Payment?")) return;
           const res = await fetch('/api/payment', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
           if(res.ok) {
              alert("Payment Recorded & Expiry Extended");
              modals.action.close();
              app.search(currentMember.name); // Refresh search
           }
        },

        async addMember(e) {
           e.preventDefault();
           const res = await fetch('/api/members/add', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
           if(res.ok) { modals.addMember.close(); alert("Member Added!"); }
        },
        
        async loadStats() {
           const res = await fetch('/api/stats');
           const d = await res.json();
           document.getElementById('stat-active').innerText = d.active;
           document.getElementById('stat-checkins').innerText = d.checkins;
           document.getElementById('stat-expired').innerText = d.expired;
           document.getElementById('stat-rev').innerText = d.revenue;
        }
      };

      // Router
      window.route = (view) => {
         document.querySelectorAll('.view-container').forEach(el => el.classList.add('hidden'));
         document.getElementById('view-'+view).classList.remove('hidden');
         document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
         event.currentTarget.classList.add('active'); // Warning: assumes triggered by click
         document.getElementById('page-title').innerText = view === 'checkin' ? 'Check-In' : view.charAt(0).toUpperCase() + view.slice(1);
         document.querySelector('.sidebar').classList.remove('open');
         
         if(view === 'dashboard') app.loadStats();
         if(view === 'members') fetchMembers();
      };

      async function fetchMembers() {
         const res = await fetch('/api/members/list');
         const data = await res.json();
         document.getElementById('member-list-container').innerHTML = data.map(m => \`
            <div class="flex-between" style="padding:10px; border-bottom:1px solid #f1f5f9;">
               <div><strong>\${m.name}</strong> <span class="text-sm">(\${m.plan_name})</span></div>
               <div class="text-sm">\${m.phone}</div>
            </div>
         \`).join('');
      }

    </script>
  </body></html>`, { headers: { "Content-Type": "text/html" } });
}
