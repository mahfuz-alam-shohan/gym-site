import { escapeHtml } from "./utils";

export function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(title)}</title>
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
    .btn { padding: 8px 14px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; font-size:13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }
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
    .flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
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

    .plan-row { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; }
    .plan-row input { margin-bottom: 0; }

    .hist-controls { display: flex; gap: 10px; margin-bottom: 20px; background: #f9fafb; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; flex-wrap: wrap; }
    .calendar-month { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .cal-header { text-align: center; font-weight: bold; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
    .cal-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 12px; border-radius: 6px; background: #f3f4f6; color: #9ca3af; font-weight: 500; }
    .cal-cell.present { background: #22c55e; color: white; font-weight: bold; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3); }
    .cal-cell.absent { background: #fecaca; color: #ef4444; opacity: 0.5; }
    .cal-stats { margin-top: 15px; font-size: 13px; display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid #f3f4f6; }

    .year-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px; }
    .year-month-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; text-align: center; background: #fff; }
    .ym-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; color: #374151; }
    .ym-badge { display: inline-block; width: 30px; height: 30px; line-height: 30px; border-radius: 50%; font-weight: bold; font-size: 14px; color: white; margin-bottom: 5px; }
    .ym-p { background: #22c55e; }
    .ym-a { background: #ef4444; }
    .ym-count { font-size: 11px; color: #6b7280; }

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

      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
      .stat-card { padding: 12px; border-radius: 8px; }
      .stat-val { font-size: 18px; margin-top: 2px; }
      .stat-label { font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .card { padding: 16px; border-radius: 8px; }
      h2, h3 { font-size: 18px; }

      .btn { padding: 6px 10px; font-size: 11px; }
      .flex-between { gap: 8px; }
      input, select { font-size: 13px; }

      .plan-row { grid-template-columns: 1fr 1fr; }
      .plan-row input:nth-child(3) { grid-column: span 2; }
      .plan-row button { grid-column: span 2; }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}

export function renderSetup() {
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
          const d = await res.json();
          if(res.ok) window.location.reload();
          else throw new Error(d.error || "Setup failed");
        } catch(err) { document.getElementById('error').textContent = err.message; }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export function renderLogin(gymName: string) {
  const safeName = escapeHtml(gymName);
  const html = `${baseHead("Login")}
  <body>
    <div class="center-screen">
      <div class="card" style="width: 100%; max-width: 380px;">
        <h2 style="margin-bottom:5px;">${safeName}</h2>
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
          if(res.ok) {
            sessionStorage.removeItem('gym_view');
            window.location.href = '/dashboard';
          } else { const d = await res.json(); throw new Error(d.error || "Login failed"); }
        } catch(err) { document.getElementById('error').textContent = err.message; }
      }
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export function renderDashboard(user: any) {
  const safeUserName = escapeHtml(user.name);
  const safeRole = escapeHtml(user.role.toUpperCase());
  const safePerms = user.permissions || '[]';
  const safeRoleRaw = escapeHtml(user.role);

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
        <div class="nav" id="nav-container"></div>
        <div style="padding:20px; border-top:1px solid #1f2937;">
          <div style="font-weight:600;">${safeUserName}</div>
          <div style="font-size:12px; opacity:0.7; margin-bottom:8px;">${safeRole}</div>
          <a href="/api/logout" style="color:#fca5a5; font-size:12px; text-decoration:none;" id="txt-logout">Sign Out &rarr;</a>
        </div>
      </aside>

      <main class="main-content">
        <div class="flex-between" style="padding: 24px 24px 0 24px;">
           <h2 id="page-title" style="margin:0;">Dashboard</h2>
           <div class="flex">
              <button class="btn btn-primary" onclick="app.modals.quickPay.open()" id="btn-quick-pay">💰 Quick Pay</button>
              <button class="btn btn-primary" onclick="app.modals.checkin.open()" id="btn-quick-checkin">⚡ Quick Check-In</button>
           </div>
        </div>

        <div style="padding: 24px;">
          <!-- VIEW: HOME -->
          <div id="view-home" class="hidden">
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-label" id="lbl-active-mem">Active Members</span>
                <span class="stat-val" id="stat-active">--</span>
              </div>
              <div class="stat-card">
                <span class="stat-label" id="lbl-today-visits">Today's Visits</span>
                <span class="stat-val" id="stat-today">--</span>
              </div>
              <div class="stat-card">
                <span class="stat-label" id="lbl-tot-rev">Total Revenue</span>
                <span class="stat-val" id="stat-rev">--</span>
              </div>
            </div>

            <div class="card">
              <div class="flex-between">
                <div>
                  <h3 style="margin:0;">Member Snapshot</h3>
                  <p style="margin:0; color:var(--text-muted); font-size:13px;">Quick overview of member health</p>
                </div>
                <button class="btn btn-outline" onclick="app.renderCharts()">Refresh Charts</button>
              </div>
              <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top:20px;">
                <canvas id="chart-dues"></canvas>
                <div style="border:1px solid var(--border); border-radius:12px; padding:16px;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="color:var(--text-muted);">Statuses</span>
                    <span id="stat-status-total" style="font-weight:700;">--</span>
                  </div>
                  <div style="display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; font-size:13px;">
                    <div style="display:flex; justify-content:space-between;"><span>Active</span><strong id="stat-status-active">--</strong></div>
                    <div style="display:flex; justify-content:space-between;"><span>Inactive</span><strong id="stat-status-inactive">--</strong></div>
                    <div style="display:flex; justify-content:space-between;"><span>Due Months &gt;=2</span><strong id="stat-status-highdue">--</strong></div>
                    <div style="display:flex; justify-content:space-between;"><span>Advance Paid</span><strong id="stat-status-adv">--</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- VIEW: MEMBERS -->
          <div id="view-members" class="hidden">
            <div class="flex-between" style="margin-bottom:15px;">
              <div>
                <h3 style="margin:0;">Members</h3>
                <p style="margin:0; color:var(--text-muted); font-size:13px;">Manage, filter and edit members</p>
              </div>
              <div class="flex">
                <input id="search" placeholder="Search name, phone, plan" style="max-width:220px;" oninput="app.filter()">
                <button class="btn btn-primary" onclick="app.modals.add.open()">＋ Add Member</button>
              </div>
            </div>
            <div class="table-responsive">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Plan</th><th>Joined</th><th>Expiry</th><th>Status</th><th>Due</th><th>Balance</th><th></th></tr></thead>
                <tbody id="tbl-members"></tbody>
              </table>
            </div>
          </div>

          <!-- VIEW: ATTENDANCE -->
          <div id="view-attendance" class="hidden">
            <div class="flex-between" style="margin-bottom:15px;">
              <div>
                <h3 style="margin:0;">Attendance</h3>
                <p style="margin:0; color:var(--text-muted); font-size:13px;">Check-in members with 1 click</p>
              </div>
              <div class="flex">
                <input id="checkin-id" placeholder="Enter ID" style="max-width:160px;" onkeypress="app.onCheckinInput(event)">
                <button class="btn btn-primary" onclick="app.checkIn()">Check-In</button>
              </div>
            </div>
            <div id="checkin-suggestions" class="checkin-results"></div>
            <div id="recent-checkins" class="card" style="display:none;">
              <div class="flex-between"><h3 style="margin:0;">Recent Check-ins</h3><span id="today-date"></span></div>
              <div id="checkin-list"></div>
            </div>
          </div>

          <!-- VIEW: PAYMENTS -->
          <div id="view-payments" class="hidden">
            <div class="flex-between" style="margin-bottom:15px;">
              <div>
                <h3 style="margin:0;">Payments</h3>
                <p style="margin:0; color:var(--text-muted); font-size:13px;">Record fees and manage wallet balances</p>
              </div>
              <div class="flex">
                <input id="pay-search" placeholder="Search member" style="max-width:200px;" oninput="app.onPaymentSearchInput(event)">
                <button class="btn btn-primary" onclick="app.modals.pay.open(app.data.members[0]?.id || null)">New Payment</button>
              </div>
            </div>
            <div id="pay-search-results" class="checkin-results"></div>
            <div class="table-responsive" style="margin-top:15px;">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Amount</th><th>Date</th><th>Type</th></tr></thead>
                <tbody id="tbl-payments"></tbody>
              </table>
            </div>
          </div>

          <!-- VIEW: SETTINGS -->
          <div id="view-settings" class="hidden">
            <div class="flex-between" style="margin-bottom:10px;">
              <div>
                <h3 style="margin:0;">Settings</h3>
                <p style="margin:0; color:var(--text-muted); font-size:13px;">Configure gym policies</p>
              </div>
              <button class="btn btn-outline" onclick="app.modals.user.open()">User</button>
            </div>

            <div class="card">
              <h3 style="margin-top:0;">General</h3>
              <form id="settings-form">
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px;">
                  <div><label>Attendance Threshold (days)</label><input name="attendanceThreshold" type="number" required></div>
                  <div><label>Inactive After Due Months</label><input name="inactiveAfterMonths" type="number" required></div>
                  <div><label>Renewal Fee</label><input name="renewalFee" type="number" required></div>
                  <div><label>Currency</label><input name="currency" required></div>
                  <div><label>Language</label>
                    <select name="lang">
                      <option value="en">English</option>
                      <option value="bd">Bangla</option>
                    </select>
                  </div>
                  <div>
                    <label>Timezone</label>
                    <select name="timezone">
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                      <option value="UTC">UTC</option>
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                    </select>
                  </div>
                </div>

                <div style="margin-top:20px;">
                  <h4 style="margin:0 0 10px 0;">Membership Plans</h4>
                  <div id="plan-list"></div>
                  <button type="button" class="btn btn-outline" onclick="app.addPlan()">Add Plan</button>
                </div>

                <div style="margin-top:20px;">
                  <h4 style="margin:0 0 10px 0;">Time Simulation</h4>
                  <div style="display:flex; gap:10px; align-items:center;">
                    <label style="margin:0; display:flex; align-items:center; gap:8px;">
                      <input type="checkbox" name="timeSimulationEnabled" id="time-sim-enabled">
                      Enable simulation
                    </label>
                    <input type="datetime-local" name="simulatedTime" id="time-sim-value" style="max-width:230px;">
                  </div>
                  <p style="color:var(--text-muted); font-size:12px; margin-top:6px;">Simulated time overrides the system clock for testing scenarios.</p>
                </div>

                <div style="margin-top:20px; display:flex; justify-content:flex-end; gap:10px;">
                  <button type="reset" class="btn btn-outline">Reset</button>
                  <button type="submit" class="btn btn-primary">Save Settings</button>
                </div>
              </form>
            </div>

            <div class="card">
              <h3 style="margin-top:0;">Danger Zone</h3>
              <p style="color:var(--text-muted);">Reset database, clearing all data.</p>
              <button class="btn btn-danger" onclick="confirmReset()">Factory Reset Database</button>
            </div>
          </div>

          <!-- VIEW: HISTORY -->
          <div id="view-history" class="hidden">
            <div class="flex-between" style="margin-bottom:10px;">
              <div>
                <h3 style="margin:0;">History</h3>
                <p style="margin:0; color:var(--text-muted); font-size:13px;">Review attendance & payments</p>
              </div>
              <div class="flex">
                <input type="date" id="hist-from" style="max-width:160px;">
                <input type="date" id="hist-to" style="max-width:160px;">
                <button class="btn btn-outline" onclick="app.fetchHistory()">Filter</button>
              </div>
            </div>

            <div class="hist-controls">
              <div>
                <div style="font-size:12px; text-transform:uppercase; color:var(--text-muted);">Date Range</div>
                <div id="hist-range">--</div>
              </div>
              <div>
                <div style="font-size:12px; text-transform:uppercase; color:var(--text-muted);">Records</div>
                <div id="hist-count">--</div>
              </div>
            </div>

            <div class="card">
              <h3 style="margin-top:0;">Attendance</h3>
              <div id="calendar-grid" style="display:grid; gap:20px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));"></div>
              <div id="year-grid" class="year-grid" style="margin-top:20px;"></div>
            </div>

            <div class="card">
              <h3 style="margin-top:0;">Payments</h3>
              <div class="table-responsive">
                <table>
                  <thead><tr><th>ID</th><th>Member</th><th>Amount</th><th>Date</th><th>Type</th></tr></thead>
                  <tbody id="tbl-history-payments"></tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div class="modal-backdrop" id="modal-checkin">
      <div class="modal-content">
        <div class="flex-between">
          <h3 style="margin:0;">Quick Check-In</h3>
          <button class="btn btn-outline" onclick="app.modals.checkin.close()">✕</button>
        </div>
        <input id="checkin-id" placeholder="Member ID" onkeypress="app.onCheckinInput(event)">
        <div id="checkin-suggestions" class="checkin-results"></div>
      </div>
    </div>

    <div class="modal-backdrop" id="modal-add">
      <div class="modal-content">
        <div class="flex-between">
          <div style="display:flex; gap:12px; align-items:center;">
            <h3 style="margin:0;">Add Member</h3>
            <div style="display:flex; gap:8px;">
              <div id="tab-new" class="nav-item" onclick="app.switchAddTab('new')">New Join</div>
              <div id="tab-mig" class="nav-item" onclick="app.switchAddTab('mig')">Migration</div>
            </div>
          </div>
          <button class="btn btn-outline" onclick="app.modals.add.close()">✕</button>
        </div>

        <form id="form-add">
          <input type="hidden" name="isMigration" id="add-mig-mode" value="false">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            <div>
              <label>Name</label><input name="name" required>
            </div>
            <div>
              <label>Phone</label><input name="phone">
            </div>
            <div>
              <label>Plan</label>
              <select name="plan" id="plan-select" onchange="app.updateAddMemberFees()"></select>
            </div>
          </div>

          <div id="sec-new-fees" style="margin-top:10px;">
            <label>Initial Payment</label><input name="initialPayment" id="new-init-pay" type="number" required>
            <label>Admission Fee</label><input name="admissionFee" id="new-adm-fee" type="number" readonly>
          </div>

          <div id="sec-mig-fees" style="margin-top:10px; display:none;">
            <label>Legacy Dues (months)</label><input name="legacyDues" id="mig-legacy-dues" type="number" min="0" value="0">
            <label>Initial Payment (optional)</label><input name="initialPayment" id="mig-init-pay" type="number" value="0">
          </div>

          <div class="checkbox-group">
            <label class="checkbox-item"><input type="checkbox" name="initCheckin" checked> Check-in after adding</label>
            <label class="checkbox-item"><input type="checkbox" name="initPayment" checked> Add payment record</label>
            <label class="checkbox-item"><input type="checkbox" name="initWallet"> Add to wallet balance</label>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.add.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Member</button>
          </div>
        </form>
      </div>
    </div>

    <div class="modal-backdrop" id="modal-pay">
      <div class="modal-content">
        <div class="flex-between"><h3 style="margin:0;">Payment</h3><button class="btn btn-outline" onclick="app.modals.pay.close()">✕</button></div>
        <form id="form-pay">
          <input type="hidden" name="memberId" id="pay-id">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
            <div><label>Member</label><div id="pay-name"></div></div>
            <div><label>Plan Price</label><div id="pay-plan-price"></div></div>
            <div><label>Wallet Balance</label><div id="pay-wallet-bal"></div></div>
          </div>
          <div id="pay-status-warning" style="background:#fff7ed; color:#92400e; padding:10px; border-radius:8px; border:1px solid #fed7aa; display:none; margin-top:10px;">
            Member is inactive. Re-activate to accept payment.
          </div>
          <div id="pay-standard-label" style="margin-top:10px; color:var(--text-muted);">Enter the amount received from the member.</div>
          <div id="pay-renewal-section" style="display:none; margin-top:10px;">
            <label>Renewal Fee</label><input name="renewalFee" id="pay-ren-fee" type="number" value="0">
          </div>
          <label style="margin-top:10px;">Payment Amount</label><input name="amount" id="pay-amount" type="number" required>
          <label>Payment Type</label>
          <select name="paymentType" id="pay-type">
            <option value="plan">Plan Payment</option>
            <option value="admission">Admission Fee</option>
            <option value="wallet">Add to Wallet</option>
            <option value="renewal">Renewal Fee</option>
          </select>
          <button type="submit" class="btn btn-primary w-full" id="pay-submit-btn">Confirm</button>
        </form>
      </div>
    </div>

    <div class="modal-backdrop" id="modal-user">
      <div class="modal-content">
        <div class="flex-between"><h3 style="margin:0;">User Settings</h3><button class="btn btn-outline" onclick="app.modals.user.close()">✕</button></div>
        <form id="form-user">
          <label>Name</label><input name="name" required value="${safeUserName}">
          <label>Email</label><input name="email" required value="${escapeHtml(user.email)}">
          <label>Password (leave blank to keep same)</label><input name="password" type="password">
          <button type="submit" class="btn btn-primary w-full">Update</button>
        </form>
      </div>
    </div>

    <div class="modal-backdrop" id="modal-quick-pay">
      <div class="modal-content">
        <div class="flex-between"><h3 style="margin:0;">Quick Pay</h3><button class="btn btn-outline" onclick="app.modals.quickPay.close()">✕</button></div>
        <input id="qp-search" placeholder="Search member" oninput="app.onQuickPayInput(event)">
        <div id="qp-results" class="checkin-results"></div>
      </div>
    </div>

    <script>
      const user = { name: "${safeUserName}", role: "${safeRoleRaw}", permissions: ${safePerms} };
    </script>
    <script src="/app.js"></script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
