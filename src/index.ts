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

// Robust Password Hashing
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
   2. HTML SYSTEM (UI)
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
      --primary: #2563eb; --primary-dark: #1d4ed8;
      --bg: #f8fafc; --card: #ffffff; --text: #0f172a; --border: #e2e8f0;
      --radius: 8px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); height: 100vh; display: flex; flex-direction: column; }
    
    /* Layouts */
    .center-screen { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .dashboard-layout { display: flex; height: 100vh; overflow: hidden; }
    
    /* Components */
    .card { background: var(--card); padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); width: 100%; max-width: 400px; border: 1px solid var(--border); }
    .card h2 { margin-top: 0; font-size: 20px; text-align: center; color: var(--primary); }
    
    input, select, button { width: 100%; padding: 12px; margin-bottom: 12px; border-radius: var(--radius); border: 1px solid var(--border); font-size: 14px; }
    input:focus { outline: 2px solid var(--primary); border-color: transparent; }
    
    button { background: var(--primary); color: white; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
    button:hover { background: var(--primary-dark); }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    
    .error-msg { background: #fee2e2; color: #b91c1c; padding: 10px; border-radius: 6px; font-size: 13px; margin-bottom: 15px; display: none; text-align: center; }

    /* Dashboard Sidebar */
    .sidebar { width: 250px; background: #1e293b; color: white; display: flex; flex-direction: column; padding: 20px; }
    .logo { font-size: 20px; font-weight: bold; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; }
    .nav-item { padding: 12px; color: #cbd5e1; cursor: pointer; border-radius: 6px; margin-bottom: 5px; }
    .nav-item:hover, .nav-item.active { background: #334155; color: white; }
    .main { flex: 1; overflow-y: auto; padding: 20px; }
    
    /* Tables */
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    
    /* Mobile */
    @media(max-width: 768px) {
      .dashboard-layout { flex-direction: column; }
      .sidebar { width: 100%; padding: 10px; flex-direction: row; justify-content: space-between; align-items: center; height: 60px; }
      .nav-item { display: none; } /* Simplified mobile nav for now */
      .sidebar .logo { margin: 0; }
      .mobile-logout { display: block; font-size: 12px; color: #fca5a5; text-decoration: none; }
    }
  </style>
</head>`;
}

/* ========================================================================
   3. DATABASE SETUP
   ======================================================================== */

async function setupDatabase(env: Env) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS gym (id INTEGER PRIMARY KEY, name TEXT)`,
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, password_hash TEXT, name TEXT, role TEXT)`,
    `CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT, phone TEXT, plan TEXT, status TEXT DEFAULT 'active', joined_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY, member_id INTEGER, date TEXT)`,
    `CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER, expires_at TEXT)`
  ];
  for (const q of queries) await env.DB.prepare(q).run();
}

/* ========================================================================
   4. ROUTER
   ======================================================================== */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    
    // Global Error Handler for the Worker
    try {
      await setupDatabase(env);

      // --- PUBLIC ROUTES ---
      if (url.pathname === "/") {
        const gym = await env.DB.prepare("SELECT * FROM gym").first();
        const user = await getSession(req, env);
        
        if (!gym) return renderSetup(); // No gym? Go to setup
        if (user) return Response.redirect(url.origin + "/dashboard", 302); // Logged in? Go to dashboard
        return renderLogin(gym.name as string); // Default: Login
      }

      // API: Setup
      if (url.pathname === "/api/setup" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        
        // 1. Save Gym Name
        await env.DB.prepare("INSERT INTO gym (name) VALUES (?)").bind(body.gymName).run();
        
        // 2. Create Admin User
        const hash = await hashPassword(body.password);
        await env.DB.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, 'admin')")
          .bind(email, hash, body.adminName).run();
        
        return json({ success: true });
      }

      // API: Login
      if (url.pathname === "/api/login" && req.method === "POST") {
        const body = await req.json() as any;
        const email = (body.email || "").trim().toLowerCase();
        const password = (body.password || "").trim();

        // 1. Find User
        const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first<any>();
        
        // 2. Verify
        if (!user || !(await verifyPassword(password, user.password_hash))) {
          return json({ error: "Invalid email or password" }, 401);
        }

        // 3. Create Session
        const token = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
          .bind(token, user.id, expires).run();

        return new Response(JSON.stringify({ success: true }), {
          headers: { 
            "Set-Cookie": `gym_auth=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800`,
            "Content-Type": "application/json"
          }
        });
      }

      // API: Logout
      if (url.pathname === "/api/logout") {
        return new Response(null, {
          status: 302, 
          headers: { Location: "/", "Set-Cookie": "gym_auth=; Max-Age=0; Path=/" }
        });
      }

      // --- PROTECTED ROUTES ---
      const session = await getSession(req, env);
      if (!session) {
        if (url.pathname.startsWith("/api/")) return json({ error: "Unauthorized" }, 401);
        return Response.redirect(url.origin + "/", 302);
      }

      if (url.pathname === "/dashboard") return renderDashboard(session);

      // API: Get Data
      if (url.pathname === "/api/data") {
        const members = await env.DB.prepare("SELECT * FROM members ORDER BY id DESC").all();
        const stats = await env.DB.prepare("SELECT count(*) as count FROM members").first();
        return json({ 
          user: session, 
          members: members.results, 
          stats 
        });
      }

      // API: Add Member
      if (url.pathname === "/api/members/add" && req.method === "POST") {
        const body = await req.json() as any;
        await env.DB.prepare("INSERT INTO members (name, phone, plan, joined_at) VALUES (?, ?, ?, ?)")
          .bind(body.name, body.phone, body.plan, new Date().toISOString()).run();
        return json({ success: true });
      }

      return new Response("Not Found", { status: 404 });

    } catch (e: any) {
      // Global Crash Handler - Prevents "Internal Server Error" text
      return json({ error: e.message || "Server Error" }, 500);
    }
  }
};

/* --- HELPERS --- */

async function getSession(req: Request, env: Env) {
  const cookie = req.headers.get("Cookie");
  if (!cookie) return null;
  const token = cookie.match(/gym_auth=([^;]+)/)?.[1];
  if (!token) return null;
  
  return await env.DB.prepare(`
    SELECT u.id, u.name, u.email, u.role 
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).bind(token).first<any>();
}

/* ========================================================================
   5. VIEWS (HTML)
   ======================================================================== */

function renderSetup() {
  const html = `${baseHead("Install Gym System")}
  <body>
    <div class="center-screen">
      <div class="card">
        <h2>🚀 System Setup</h2>
        <div id="error-box" class="error-msg"></div>
        <form id="setupForm">
          <label>Gym Name</label>
          <input name="gymName" required placeholder="e.g. Iron Gym">
          
          <label>Admin Name</label>
          <input name="adminName" required placeholder="Your Name">
          
          <label>Admin Email</label>
          <input name="email" type="email" required placeholder="you@example.com">
          
          <label>Password</label>
          <input name="password" type="password" required placeholder="******">
          
          <button type="submit" id="btn-submit">Install System</button>
        </form>
      </div>
    </div>
    <script>
      const form = document.getElementById('setupForm');
      const btn = document.getElementById('btn-submit');
      const errBox = document.getElementById('error-box');

      form.onsubmit = async (e) => {
        e.preventDefault();
        
        // 1. UI Loading State
        btn.textContent = "Installing...";
        btn.disabled = true;
        errBox.style.display = 'none';

        try {
          // 2. Network Request
          const res = await fetch('/api/setup', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
          });

          // 3. Handle Response
          if (res.ok) {
            window.location.href = '/'; // Success! Reload to see login
          } else {
            const data = await res.json();
            throw new Error(data.error || 'Setup failed');
          }
        } catch (err) {
          // 4. Handle Errors (Unlock button)
          errBox.textContent = err.message;
          errBox.style.display = 'block';
        } finally {
          // 5. Always Reset Button
          btn.textContent = "Install System";
          btn.disabled = false;
        }
      };
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderLogin(gymName: string) {
  const html = `${baseHead("Login")}
  <body>
    <div class="center-screen">
      <div class="card">
        <h2>${gymName}</h2>
        <p style="text-align:center; color:#64748b; margin-top:-10px;">Staff Portal</p>
        
        <div id="error-box" class="error-msg"></div>
        
        <form id="loginForm">
          <label>Email</label>
          <input name="email" type="email" required placeholder="admin@example.com">
          
          <label>Password</label>
          <input name="password" type="password" required>
          
          <button type="submit" id="btn-login">Login</button>
        </form>
      </div>
    </div>
    <script>
      const form = document.getElementById('loginForm');
      const btn = document.getElementById('btn-login');
      const errBox = document.getElementById('error-box');

      form.onsubmit = async (e) => {
        e.preventDefault();

        // 1. Lock Button
        btn.textContent = "Verifying...";
        btn.disabled = true;
        errBox.style.display = 'none';

        try {
          // 2. Make Request
          const res = await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
          });

          // 3. Check Success
          if (res.ok) {
            window.location.href = '/dashboard';
          } else {
            // 4. Parse Error
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
          }
        } catch (err) {
          // 5. Show Error & Unlock
          console.error(err);
          errBox.textContent = err.message || "Connection Error";
          errBox.style.display = 'block';
        } finally {
          // 6. ALWAYS Unlock Button
          btn.textContent = "Login";
          btn.disabled = false;
        }
      };
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

function renderDashboard(user: any) {
  const html = `${baseHead("Dashboard")}
  <body>
    <div class="dashboard-layout">
      <aside class="sidebar">
        <div class="logo">
          <span>💪 GymOS</span>
        </div>
        <div>
          <div class="nav-item active">📊 Dashboard</div>
          <div class="nav-item">👥 Members</div>
          <div class="nav-item">⚙️ Settings</div>
        </div>
        <div style="margin-top:auto">
          <div style="font-size:12px; opacity:0.7">Logged in as</div>
          <div>${user.name}</div>
          <a href="/api/logout" class="mobile-logout" style="color:#fca5a5; margin-top:5px; display:inline-block;">Sign Out</a>
        </div>
      </aside>

      <main class="main">
        <h1 style="margin-top:0">Overview</h1>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px;">
          <div style="background:white; padding:20px; border-radius:8px; border:1px solid #e2e8f0">
            <div style="color:#64748b; font-size:12px; font-weight:bold; text-transform:uppercase">Total Members</div>
            <div style="font-size:32px; font-weight:bold; color:#0f172a" id="stat-count">...</div>
          </div>
          <div style="background:white; padding:20px; border-radius:8px; border:1px solid #e2e8f0">
             <div style="color:#64748b; font-size:12px; font-weight:bold; text-transform:uppercase">Quick Actions</div>
             <button style="margin-top:10px;" onclick="openModal()">+ Add Member</button>
          </div>
        </div>

        <h3>Recent Members</h3>
        <table>
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Plan</th><th>Status</th></tr>
          </thead>
          <tbody id="member-table">
            <tr><td colspan="4" style="text-align:center; padding:20px">Loading...</td></tr>
          </tbody>
        </table>
      </main>
    </div>

    <div id="modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); align-items:center; justify-content:center;">
      <div class="card" style="width:400px;">
        <h2 style="margin-bottom:20px;">Add Member</h2>
        <form id="addMemberForm">
          <label>Full Name</label><input name="name" required>
          <label>Phone</label><input name="phone" required>
          <label>Plan</label>
          <select name="plan">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <div style="display:flex; gap:10px;">
            <button type="button" style="background:white; color:#333; border:1px solid #ccc" onclick="closeModal()">Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>

    <script>
      // Load Data on Start
      async function loadData() {
        try {
          const res = await fetch('/api/data');
          if(!res.ok) throw new Error('Failed to load');
          const data = await res.json();
          
          document.getElementById('stat-count').textContent = data.stats.count;
          
          const tbody = document.getElementById('member-table');
          tbody.innerHTML = '';
          data.members.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`<td>\${m.name}</td><td>\${m.phone}</td><td>\${m.plan}</td><td><span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:bold">Active</span></td>\`;
            tbody.appendChild(tr);
          });
        } catch(e) {
          console.error(e);
        }
      }
      
      loadData();

      // Modal Logic
      function openModal() { document.getElementById('modal').style.display = 'flex'; }
      function closeModal() { document.getElementById('modal').style.display = 'none'; }

      // Add Member Logic
      document.getElementById('addMemberForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = "Saving..."; btn.disabled = true;
        
        const res = await fetch('/api/members/add', {
            method: 'POST',
            body: JSON.stringify(Object.fromEntries(new FormData(e.target)))
        });
        
        if(res.ok) {
            closeModal();
            e.target.reset();
            loadData(); // Reload table
        } else {
            alert('Error adding member');
        }
        btn.textContent = "Save"; btn.disabled = false;
      };
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
