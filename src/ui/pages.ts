import { escapeHtml } from "../utils";
import { baseHead, getIcon } from "./head";

/* ========================================================================
   2. PAGES & COMPONENTS
   ======================================================================== */

export function renderSetup() {
  const html = `${baseHead("Gym OS - Setup")}
  <body>
    <div class="center-screen">
      <div style="font-size:48px;margin-bottom:20px;">🚀</div>
      <div class="card" style="width:100%;max-width:440px;text-align:center;">
        <h2 style="margin-bottom:10px;font-size:28px;">Let's Get Started!</h2>
        <p style="color:var(--text-muted);margin-bottom:32px;">Initialize your new Gym OS system.</p>
        <form id="form" style="text-align:left;">
          <label>Gym Name</label><input name="gymName" required placeholder="e.g. Iron Paradise">
          <label>Admin Name</label><input name="adminName" required placeholder="Your Name">
          <label>Admin Email</label><input name="email" type="email" required placeholder="admin@gym.com">
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:16px;font-size:16px;margin-top:10px;">Install System</button>
        </form>
        <div id="error" style="color:var(--danger);margin-top:20px;font-weight:700;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;btn.innerText="Setting things up...";try{const res=await fetch('/api/setup',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});const d=await res.json();if(res.ok)window.location.reload();else throw new Error(d.error||"Setup failed");}catch(err){document.getElementById('error').textContent=err.message;btn.disabled=false;btn.innerText="Install System";}}
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export function renderLogin(gymName: string) {
  const safeName = escapeHtml(gymName);
  const html = `${baseHead("Login")}
  <body>
    <div class="center-screen">
      <div style="font-size:48px;margin-bottom:20px;">💪</div>
      <div class="card" style="width:100%;max-width:400px;text-align:center;">
        <h2 style="margin-bottom:8px;font-size:24px;">${safeName}</h2>
        <p style="color:var(--text-muted);margin-bottom:32px;font-weight:600;">Welcome back, Staff!</p>
        <form id="form" style="text-align:left;">
          <label>Email</label><input name="email" required placeholder="name@email.com">
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:16px;font-size:16px;margin-top:10px;">✨ Sign In</button>
        </form>
        <div id="error" style="color:var(--danger);margin-top:20px;font-weight:700;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;btn.innerText="Checking...";try{const res=await fetch('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});if(res.ok){sessionStorage.removeItem('gym_view');window.location.href='/dashboard';}else{const d=await res.json();throw new Error(d.error||"Login failed");}}catch(err){document.getElementById('error').textContent=err.message;btn.disabled=false;btn.innerText="✨ Sign In";}}
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export function renderDashboard(user: any) {
  const safeUserName = escapeHtml(user.name);
  const safeRole = escapeHtml(user.role.toUpperCase());
  const safePerms = user.permissions || '[]'; 

  const html = `${baseHead("Dashboard")}
  <body>
    <div id="toast-container"></div>
    <div class="app-layout">
      <!-- Mobile Header -->
      <div class="mobile-header">
        <div class="flex">
          <span style="font-size:24px;">💪</span>
          <div style="font-weight:800;font-size:18px;color:var(--text-heading);">Gym OS</div>
        </div>
        <button class="btn btn-outline" style="padding:8px 12px;border-radius:12px;" onclick="toggleSidebar()">${getIcon('menu')}</button>
      </div>
      <div class="overlay" onclick="toggleSidebar()"></div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div style="padding:32px 24px;display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <div style="width:40px;height:40px;background:var(--primary);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;">💪</div>
          <div>
             <div style="font-weight:900;font-size:18px;color:var(--text-heading);line-height:1;">Gym OS</div>
             <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-top:4px;">MANAGEMENT</div>
          </div>
        </div>
        
        <div class="nav" id="nav-container"></div>
        
        <div style="padding:24px;margin-top:auto;">
          <div style="background:#f9fafb;padding:16px;border-radius:16px;border:2px solid #f3f4f6;">
            <div style="font-weight:800;color:var(--text-heading);font-size:14px;">${safeUserName}</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:12px;">${safeRole}</div>
            <a href="/api/logout" style="color:#ef4444;font-size:13px;text-decoration:none;display:flex;align-items:center;gap:8px;font-weight:700;" id="txt-logout">${getIcon('logout')} Sign Out</a>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar with Quick Actions -->
        <div class="flex-between" style="padding:20px 10px 30px 10px;">
           <div>
             <h2 id="page-title" style="margin:0;font-size:28px;">Dashboard</h2>
             <div style="color:var(--text-muted);font-size:14px;font-weight:600;margin-top:4px;">Let's be productive today! 🚀</div>
           </div>
           
           <div class="flex" style="gap:16px;">
              <!-- Floating Quick Actions -->
              <button class="btn btn-accent" onclick="app.modals.quickPay.open()" id="btn-quick-pay" style="box-shadow: 0 8px 20px -6px rgba(236, 72, 153, 0.5);">
                ${getIcon('creditCard')} <span style="display:none; @media(min-width:600px){display:inline;}">Quick Pay</span>
              </button>
              <button class="btn btn-primary" onclick="app.modals.checkin.open()" id="btn-quick-checkin" style="box-shadow: 0 8px 20px -6px rgba(139, 92, 246, 0.5);">
                ${getIcon('zap')} <span style="display:none; @media(min-width:600px){display:inline;}">Quick Check-In</span>
              </button>
           </div>
        </div>

        <div style="padding:0 10px 40px 10px;">
          
          <!-- VIEW: HOME -->
          <div id="view-home" class="hidden">
            <div class="stats-grid">
              <div class="stat-card">
                 <div class="stat-icon" style="color:#10b981;background:#d1fae5;">⚡</div>
                 <span class="stat-val" id="stat-active">--</span>
                 <span class="stat-label" id="lbl-active-mem">Active Members</span>
              </div>
              <div class="stat-card">
                 <div class="stat-icon" style="color:#f59e0b;background:#fef3c7;">👣</div>
                 <span class="stat-val" id="stat-today">--</span>
                 <span class="stat-label" id="lbl-today-visits">Visits Today</span>
              </div>
              <div class="stat-card">
                 <div class="stat-icon" style="color:#6366f1;background:#e0e7ff;">💰</div>
                 <span class="stat-val" style="color:#6366f1;font-size:24px;" id="stat-rev">--</span>
                 <span class="stat-label" id="lbl-tot-rev">Revenue</span>
              </div>
              <div class="stat-card">
                 <div class="stat-icon" style="color:#ef4444;background:#fee2e2;">⚠️</div>
                 <span class="stat-val" style="color:#ef4444" id="stat-due">--</span>
                 <span class="stat-label" id="lbl-mem-due">Members Due</span>
              </div>
              <div class="stat-card">
                 <div class="stat-icon" style="color:#ec4899;background:#fce7f3;">📉</div>
                 <span class="stat-val" style="color:#ec4899;font-size:24px;" id="stat-total-due">--</span>
                 <span class="stat-label" id="lbl-total-due-money">Outstanding</span>
              </div>
            </div>

            <div class="flex-between" style="align-items:start; gap:24px;">
                <div class="card" style="flex:2;min-width:300px;">
                  <h3 style="margin:0 0 24px 0;font-size:18px;" id="lbl-due-overview">📊 Dues Overview</h3>
                  <div style="position: relative; height:220px; width:100%"><canvas id="chart-dues"></canvas></div>
                </div>
                <div class="card" style="flex:1;min-width:280px;">
                   <h3 style="margin:0 0 20px 0;font-size:18px;">🕒 Latest Check-ins</h3>
                   <div class="table-container">
                     <table style="font-size:13px;">
                       <tbody id="tbl-attendance-today-mini"></tbody>
                     </table>
                     <button class="btn btn-outline w-full" style="margin-top:10px;" onclick="app.nav('attendance')">View All</button>
                   </div>
                </div>
            </div>
          </div>

          <!-- VIEW: MEMBERS -->
          <div id="view-members" class="hidden">
            <div class="flex-between" style="margin-bottom:24px;">
               <div class="flex" style="flex:1; background:white; padding:8px; border-radius:16px; border:2px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <div style="padding-left:12px;opacity:0.5;">${getIcon('search')}</div>
                  <input id="search" placeholder="Find member by ID, Name or Phone..." style="margin:0;border:none;background:transparent;box-shadow:none;padding:12px;" onkeyup="app.renderMembersTable()">
                  <select id="member-filter" onchange="app.renderMembersTable()" style="margin:0;width:140px;border:none;background:#f3f4f6;border-radius:12px;margin-right:4px;">
                     <option value="all">All Members</option>
                     <option value="active">Active Only</option>
                     <option value="due">Due Only</option>
                     <option value="advanced">Advanced</option>
                     <option value="inactive">Inactive</option>
                  </select>
               </div>
               <button class="btn btn-primary" onclick="app.modals.add.open()" id="btn-add-mem">${getIcon('plus')} New Member</button>
            </div>

            <div class="table-container">
                <table>
                  <thead><tr><th>ID</th><th id="th-name">Name / Info</th><th id="th-plan">Plan</th><th id="th-exp">Expiry</th><th id="th-due">Status</th><th id="th-act" style="text-align:right">Actions</th></tr></thead>
                  <tbody id="tbl-members"></tbody>
                </table>
            </div>
          </div>

          <!-- VIEW: ATTENDANCE -->
          <div id="view-attendance" class="hidden">
            <div class="card">
              <h3 id="lbl-today-att" style="margin-bottom:20px;">📅 Today's Attendance</h3>
              <div class="table-container">
                <table><thead><tr><th id="th-time">Time</th><th>Name</th><th>Status</th></tr></thead><tbody id="tbl-attendance-today"></tbody></table>
              </div>
            </div>
          </div>

          <!-- VIEW: HISTORY -->
          <div id="view-history" class="hidden">
            <div class="card">
              <div class="flex-between" style="margin-bottom:24px;">
                <h3 style="margin:0;" id="lbl-act-log">📜 Activity Log</h3>
                <div class="flex" style="gap:8px;">
                  <input type="date" id="history-date" style="margin-bottom:0;max-width:180px;">
                  <button class="btn btn-outline" onclick="app.applyHistoryFilter()" id="btn-filter">Filter</button>
                </div>
              </div>
              <div class="table-container">
                <table><thead><tr><th>Date</th><th>Time</th><th>Name</th></tr></thead><tbody id="tbl-attendance-history"></tbody></table>
              </div>
            </div>
          </div>

          <!-- VIEW: PAYMENTS -->
          <div id="view-payments" class="hidden">
            <div class="flex-between" style="margin-bottom:24px; align-items:stretch;">
                 <div class="card" style="flex:1; margin:0; background:#fff1f2; border-color:#fecaca;">
                    <div style="font-size:12px;font-weight:800;color:#9f1239;text-transform:uppercase;margin-bottom:4px;">Total Outstanding Dues</div>
                    <div id="total-outstanding-amount" style="font-size:36px;font-weight:900;color:#be123c;">0</div>
                 </div>
                 <div class="card" style="flex:1; margin:0; display:flex; align-items:center; justify-content:center; gap:12px;">
                    <button class="btn btn-outline" onclick="app.openPaymentHistory()" id="btn-history">${getIcon('history')} History</button>
                    <button class="btn btn-outline" onclick="window.open('/dues/print','_blank')" id="btn-print">📄 Print Due List</button>
                 </div>
            </div>

            <div class="card">
              <h3 id="lbl-search-col" style="margin-bottom:20px;">💰 Collect Payments</h3>
              
              <div style="margin-bottom:24px;position:relative;">
                 <input id="pay-search" placeholder="Type Name or ID to collect..." style="margin-bottom:0;padding-left:48px;" onkeyup="app.onPaymentSearchInput(event)">
                 <div style="position:absolute;left:16px;top:14px;opacity:0.4;">${getIcon('search')}</div>
                 <div id="pay-search-results" class="checkin-results" style="display:none;position:absolute;width:100%;z-index:20;box-shadow:0 10px 30px rgba(0,0,0,0.1);"></div>
              </div>
           
               <div class="flex-between" style="margin-bottom:16px;">
                  <h4 style="margin:0;color:var(--text-muted);text-transform:uppercase;font-size:12px;">Due List</h4>
                  <select id="pay-filter" onchange="app.renderPaymentsTable()" style="margin:0;min-width:140px;width:auto;">
                    <option value="due">Dues Only</option>
                    <option value="all">All Members</option>
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
              <h3 id="lbl-sys-set" style="margin-bottom:24px;">⚙️ System Settings</h3>
              <form id="settings-form" onsubmit="app.saveSettings(event)">
                <div class="flex">
                   <div class="w-full"><label id="lbl-cur">Currency Symbol</label><input name="currency" type="text" placeholder="BDT"></div>
                   <div class="w-full"><label id="lbl-lang">Language</label><select name="lang" style="margin-bottom:20px;"><option value="en">English</option><option value="bn">Bangla</option></select></div>
                </div>
                <div class="flex">
                   <div class="w-full"><label id="lbl-att-th">Min. Attendance (Days)</label><input name="attendanceThreshold" type="number" min="1" max="31" required></div>
                   <div class="w-full"><label id="lbl-inact-th">Inactive after (Months)</label><input name="inactiveAfterMonths" type="number" min="1" max="36" required></div>
                </div>
                <div class="w-full"><label id="lbl-ren-fee">Renewal Fee</label><input name="renewalFee" type="number" min="0" required></div>
                
                <div style="background:#f5f3ff; padding:20px; border-radius:16px; margin:20px 0;">
                    <label>Developer Zone (Time Travel)</label>
                    <div class="flex">
                      <div class="w-full"><label>Timezone</label><input name="timezone" type="text" placeholder="Asia/Dhaka"></div>
                      <div class="w-full"><label>Simulated Date</label><input name="simulatedTime" type="datetime-local"></div>
                    </div>
                    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;"><input type="checkbox" name="timeSimulationEnabled" style="width:auto;margin:0;"> Enable Time Simulation</label>
                    <p id="lbl-current-time" style="font-size:12px;color:var(--text-muted);margin-top:8px;"></p>
                </div>

                <label style="margin-top:24px;font-size:16px;color:var(--text-heading);" id="lbl-mem-plans">🏷️ Membership Plans</label>
                <div style="background:#f9fafb;padding:20px;border-radius:16px;border:2px solid #f3f4f6;margin-bottom:24px;">
                   <div class="plan-row" style="font-weight:800;font-size:11px;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px;display:grid;grid-template-columns:2fr 1fr 1fr 40px;gap:10px;"><span>Name</span><span>Price</span><span>Adm. Fee</span><span></span></div>
                   <div id="plans-container"></div>
                   <button type="button" class="btn btn-outline w-full" onclick="app.addPlanRow()" id="btn-add-plan" style="margin-top:10px;">${getIcon('plus')} Add Another Plan</button>
                </div>
                <div class="flex-between">
                  <button type="submit" class="btn btn-primary" id="btn-save-set">Save Changes</button>
                  <button onclick="app.resetDB()" class="btn btn-danger" type="button" id="btn-reset-db" style="font-size:12px;">${getIcon('trash')} Factory Reset</button>
                </div>
              </form>
            </div>
          </div>

          <!-- VIEW: USERS -->
          <div id="view-users" class="hidden">
            <div class="card">
               <div class="flex-between" style="margin-bottom:24px;">
                 <h3 style="margin:0;" id="lbl-user-acc">👥 User Access</h3>
                 <button class="btn btn-primary" onclick="app.openAddUser()" id="btn-add-user">${getIcon('plus')} Add User</button>
               </div>
               <div class="table-container">
                 <table><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Permissions</th><th style="text-align:right">Actions</th></tr></thead><tbody id="tbl-users"></tbody></table>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- MODALS -->
    
    <!-- CHECK-IN MODAL -->
    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content" style="text-align:center;">
        <div style="font-size:48px;margin-bottom:10px;">⚡</div>
        <h3 id="lbl-chk-title" style="margin-bottom:24px;font-size:24px;">Daily Check-In</h3>
        <input id="checkin-id" type="text" placeholder="Type ID or Name..." style="font-size:18px;padding:18px;text-align:center;border-width:3px;" autofocus onkeyup="app.onCheckinInput(event)">
        <div id="checkin-suggestions" class="checkin-results" style="display:none;text-align:left;"></div>
        
        <button class="btn btn-primary w-full" onclick="app.checkIn()" id="btn-sub-chk" style="padding:16px;font-size:16px;margin-top:16px;">Check In Now</button>
        <div id="checkin-res" style="margin-top:20px;font-weight:800;min-height:24px;font-size:16px;"></div>
        <button class="btn btn-outline w-full" style="margin-top:20px;border:none;" onclick="app.modals.checkin.close()">Close</button>
      </div>
    </div>
   
    <!-- QUICK PAY MODAL -->
    <div id="modal-quick-pay" class="modal-backdrop">
      <div class="modal-content" style="text-align:center;">
        <div style="font-size:48px;margin-bottom:10px;">💰</div>
        <h3 id="lbl-qp-title" style="margin-bottom:24px;font-size:24px;">Quick Pay</h3>
        <input id="qp-search" type="text" placeholder="Search Member..." style="font-size:18px;padding:18px;text-align:center;border-width:3px;" autofocus onkeyup="app.onQuickPayInput(event)">
        <div id="qp-results" class="checkin-results" style="display:none;text-align:left;"></div>
        <button class="btn btn-outline w-full" style="margin-top:20px;border:none;" onclick="app.modals.quickPay.close()">Close</button>
      </div>
    </div>

    <!-- ADD MEMBER MODAL -->
    <div id="modal-add" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="lbl-new-mem" style="margin-bottom:24px;font-size:22px;">New Member</h3>
        
        <div style="display:flex;background:#f3f4f6;padding:4px;border-radius:12px;margin-bottom:24px;">
           <div id="tab-new" style="flex:1;text-align:center;padding:10px;border-radius:10px;cursor:pointer;font-weight:700;transition:0.2s;background:white;color:var(--primary);box-shadow:0 2px 4px rgba(0,0,0,0.05);" onclick="app.switchAddTab('new')">New Admission</div>
           <div id="tab-mig" style="flex:1;text-align:center;padding:10px;border-radius:10px;cursor:pointer;font-weight:700;transition:0.2s;color:var(--text-muted);" onclick="app.switchAddTab('mig')">Old / Migrating</div>
        </div>

        <form onsubmit="app.addMember(event)">
          <input type="hidden" name="migrationMode" id="add-mig-mode" value="false">
          <label>Full Name</label><input name="name" required placeholder="John Doe">
          <label>Phone Number</label><input name="phone" required placeholder="017...">
          <div class="w-full"><label>Plan</label><select name="plan" id="plan-select" onchange="app.updateAddMemberFees()"></select></div>
          
          <div style="background:#f5f3ff;padding:20px;border-radius:16px;margin-top:10px;border:2px solid #ede9fe;">
             <div id="sec-new-fees">
                 <label style="margin-bottom:12px;font-weight:800;color:var(--primary);">Payment Details</label>
                 <div class="flex" style="margin-bottom:12px;">
                    <div class="w-full"><label>Admission Fee</label><input name="admissionFee" id="new-adm-fee" type="number" min="0"></div>
                    <div style="padding-top:26px;"><label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;background:white;padding:10px;border-radius:12px;border:1px solid #ddd;"><input type="checkbox" name="admissionFeePaid" value="yes" checked style="width:auto;margin:0;"> Paid?</label></div>
                 </div>
                 <div class="w-full"><label>Initial Payment (Required)</label><input name="initialPayment" id="new-init-pay" type="number" min="0" required placeholder="Amount..."></div>
             </div>
             <div id="sec-mig-fees" style="display:none;">
                 <label style="margin-bottom:12px;font-weight:800;color:var(--primary);">Migration Status</label>
                 <div class="w-full" style="margin-bottom:12px;"><label>Months Due (Legacy)</label><input name="legacyDues" id="mig-legacy-dues" type="number" min="0" value="0" required></div>
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

    <!-- PAY MODAL -->
    <div id="modal-pay" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="lbl-rec-pay" style="margin-bottom:8px;font-size:22px;">Receive Payment</h3>
        <p id="pay-name" style="color:var(--primary);margin-bottom:24px;font-weight:800;font-size:18px;"></p>
        
        <div id="pay-status-warning" style="display:none;background:#fee2e2;color:#991b1b;padding:16px;border-radius:16px;margin-bottom:20px;font-size:14px;font-weight:700;border:2px solid #fecaca;">⚠️ Member is Inactive. Re-admission required.</div>
        
        <form onsubmit="app.pay(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <div id="pay-renewal-section" style="display:none;background:#f5f3ff;padding:16px;border-radius:16px;margin-bottom:20px;border:2px solid #ede9fe;">
             <label>Renewal Fee</label><input name="renewalFee" id="pay-ren-fee" type="number" readonly style="background:#e0e7ff;">
             <label>Plus Plan Payment (Optional)</label>
          </div>
          
          <div id="pay-standard-label"><label>Amount Paid</label></div>
          <input name="amount" id="pay-amount" type="number" required placeholder="Enter amount..." style="font-size:24px;font-weight:800;color:var(--primary);">
          
          <div style="font-size:13px;color:var(--text-muted);margin-top:10px;background:#f9fafb;padding:16px;border-radius:16px;border:1px solid #f3f4f6;">
             <div class="flex-between"><span>Plan Price:</span> <span id="pay-plan-price" style="font-weight:800;color:var(--text-heading);">-</span></div>
             <div class="flex-between" style="margin-top:4px;"><span>Wallet Balance:</span> <span id="pay-wallet-bal" style="font-weight:800;color:var(--text-heading);">0</span></div>
          </div>
          
          <div class="flex" style="justify-content:flex-end;margin-top:24px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.pay.close()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="pay-submit-btn">Confirm Payment</button>
          </div>
        </form>
      </div>
    </div>

    <!-- USER MODAL -->
    <div id="modal-user" class="modal-backdrop">
      <div class="modal-content">
        <h3 id="user-modal-title" style="margin-bottom:24px;">User Access</h3>
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
             <label style="margin-top:16px;margin-bottom:10px;">Access Permissions</label>
             <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9fafb;padding:10px;border-radius:8px;"><input type="checkbox" name="permissions" value="home" style="width:auto;margin:0;"> Overview</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9fafb;padding:10px;border-radius:8px;"><input type="checkbox" name="permissions" value="members" style="width:auto;margin:0;"> Members</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9fafb;padding:10px;border-radius:8px;"><input type="checkbox" name="permissions" value="attendance" style="width:auto;margin:0;"> Attendance</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9fafb;padding:10px;border-radius:8px;"><input type="checkbox" name="permissions" value="history" style="width:auto;margin:0;"> History</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9fafb;padding:10px;border-radius:8px;"><input type="checkbox" name="permissions" value="payments" style="width:auto;margin:0;"> Payments</label>
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;background:#f9fafb;padding:10px;border-radius:8px;"><input type="checkbox" name="permissions" value="settings" style="width:auto;margin:0;"> Settings</label>
             </div>
          </div>
          <div class="flex" style="justify-content:flex-end;margin-top:24px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.user.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save User</button>
          </div>
        </form>
      </div>
    </div>

    <!-- HISTORY MODALS -->
    <div id="modal-member-history" class="modal-backdrop">
      <div class="modal-content" style="max-width:800px;">
        <div class="flex-between" style="margin-bottom:24px;">
            <h3 id="mh-title" style="margin:0;">Attendance History</h3>
            <button class="btn btn-outline" onclick="document.getElementById('modal-member-history').style.display='none'">Close</button>
        </div>
        <div class="flex" style="margin-bottom:20px; background:#f9fafb; padding:10px; border-radius:12px;">
           <div class="flex" style="align-items:center;">
              <label style="margin:0;white-space:nowrap;">Year:</label><select id="hist-year" style="margin:0;min-width:100px;border:none;" onchange="app.renderCalendar()"></select>
           </div>
           <div class="flex" style="align-items:center;">
              <label style="margin:0;white-space:nowrap;">Month:</label>
              <select id="hist-month" style="margin:0;border:none;" onchange="app.renderCalendar()">
                 <option value="-1">Whole Year</option>
                 <option value="0">January</option><option value="1">February</option><option value="2">March</option><option value="3">April</option><option value="4">May</option><option value="5">June</option>
                 <option value="6">July</option><option value="7">August</option><option value="8">September</option><option value="9">October</option><option value="10">November</option><option value="11">December</option>
              </select>
           </div>
        </div>
        <div id="calendar-container"></div>
        
        <style>
          .year-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; }
          .year-month-card { background: #f3f4f6; padding: 10px; border-radius: 12px; text-align: center; }
          .ym-name { font-weight: 800; font-size: 13px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; }
          .ym-badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-weight: 800; font-size: 14px; margin-bottom: 5px; }
          .ym-p { background: #d1fae5; color: #047857; }
          .ym-a { background: #fee2e2; color: #b91c1c; }
          .ym-count { font-size: 11px; color: var(--text-muted); font-weight: 700; }
          
          .calendar-month { text-align: center; }
          .cal-header { font-size: 20px; font-weight: 900; color: var(--text-heading); margin-bottom: 20px; }
          .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; max-width: 500px; margin: 0 auto; }
          .cal-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-weight: 700; font-size: 14px; }
          .cal-cell.present { background: var(--success); color: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4); }
          .cal-cell.absent { background: #f3f4f6; color: #9ca3af; }
          .cal-stats { margin-top: 20px; font-weight: 700; display: flex; gap: 20px; justify-content: center; }
        </style>
      </div>
    </div>
   
    <div id="modal-payment-history" class="modal-backdrop">
      <div class="modal-content" style="max-width:700px;">
         <div class="flex-between" style="margin-bottom:24px;">
            <h3 id="ph-title" style="margin:0;">Transaction History</h3>
            <button class="btn btn-outline" onclick="document.getElementById('modal-payment-history').style.display='none'">Close</button>
         </div>
         <div style="background:#f9fafb; padding:12px; border-radius:12px; margin-bottom:20px;" class="flex">
            <input type="date" id="trans-date" style="margin-bottom:0;" onchange="app.renderTransactionHistory()">
            <button class="btn btn-outline" onclick="document.getElementById('trans-date').value=''; app.renderTransactionHistory()">Clear</button>
         </div>
         <div class="table-container" style="max-height:400px;overflow-y:auto;">
            <table style="width:100%;"><thead><tr><th>Date</th><th>Member</th><th>Amount</th></tr></thead><tbody id="tbl-transaction-history"></tbody></table>
         </div>
      </div>
    </div>

    <!-- MAIN SCRIPT -->
    <script>
      /* --- TRANSLATIONS (Optimized) --- */
      const translations={en:{dash:"Dashboard",over:"Overview",mem:"Members",att:"Attendance",hist:"History",pay:"Payments",set:"Settings",user:"User Access",act_mem:"Active Members",tod_vis:"Visits Today",tot_rev:"Revenue",mem_due:"Members Due",total_due_amt:"Outstanding",due_ov:"Dues Overview",quick_chk:"⚡ Check-In",quick_pay:"💰 Quick Pay",quick_pay_search:"Quick Pay",search_ph:"Find member...",add_mem:"New Member",nm:"Name / Info",joined:"Joined",ph:"Phone",pl:"Plan",exp:"Expiry",due:"Status",act:"Actions",tod_att:"Today's Attendance",time:"Time",res:"Result",act_log:"Activity Log",filter:"Filter",clear:"Clear",search_col:"Collect Payments",pay_stat:"Due List",print:"Print Due List",sys_set:"System Settings",cur:"Currency",lang:"Language",att_th:"Min Attendance",inact_th:"Inactive Months",adm_fee:"Adm Fee",ren_fee:"Renewal Fee",mem_plans:"Membership Plans",add_plan:"Add Plan",save_set:"Save Changes",user_acc:"User Access",add_user:"Add User",chk_title:"Daily Check-In",submit:"Check In",close:"Close",new_mem:"New Member",create:"Create Member",rec_pay:"Receive Payment",confirm:"Confirm Payment",trans_hist:"History"},bn:{dash:"ড্যাশবোর্ড",over:"সারসংক্ষেপ",mem:"সদস্য",att:"উপস্থিতি",hist:"ইতিহাস",pay:"পেমেন্ট",set:"সেটিংস",user:"ব্যবহারকারী",act_mem:"সক্রিয় সদস্য",tod_vis:"আজকের উপস্থিতি",tot_rev:"মোট আয়",mem_due:"বকেয়া সদস্য",total_due_amt:"মোট বকেয়া",due_ov:"বকেয়া ওভারভিউ",quick_chk:"⚡ চেক-ইন",quick_pay:"💰 পেমেন্ট",quick_pay_search:"পেমেন্ট খুঁজুন",search_ph:"খুঁজুন...",add_mem:"সদস্য যোগ",nm:"নাম ও তথ্য",joined:"ভর্তি",ph:"ফোন",pl:"প্ল্যান",exp:"মেয়াদ",due:"অবস্থা",act:"অ্যাকশন",tod_att:"আজকের উপস্থিতি",time:"সময়",res:"ফলাফল",act_log:"লগ",filter:"ফিল্টার",clear:"মুছুন",search_col:"পেমেন্ট গ্রহণ",pay_stat:"বকেয়া তালিকা",print:"প্রিন্ট",sys_set:"সিস্টেম সেটিংস",cur:"মুদ্রা",lang:"ভাষা",att_th:"উপস্থিতির সীমা",inact_th:"নিষ্ক্রিয় সীমা",adm_fee:"ভর্তি ফি",ren_fee:"রিনিউয়াল ফি",mem_plans:"মেম্বারশিপ প্ল্যান",add_plan:"প্ল্যান যোগ",save_set:"সেভ করুন",user_acc:"ব্যবহারকারী",add_user:"ব্যবহারকারী যোগ",chk_title:"চেক-ইন",submit:"সাবমিট",close:"বন্ধ",new_mem:"নতুন সদস্য",create:"তৈরি করুন",rec_pay:"পেমেন্ট গ্রহণ",confirm:"নিশ্চিত করুন",trans_hist:"ইতিহাস"}};
      
      let clientClock={now:null};
      function setClientNow(iso){clientClock.now=iso||null;}
      function getClientNow(){return clientClock.now?new Date(clientClock.now):new Date();}
      function t(key){const lang=app.data?.settings?.lang||'en';return translations[lang][key]||key;}
      
      function toggleSidebar(){document.querySelector('.sidebar').classList.toggle('open');document.querySelector('.overlay').classList.toggle('open');}
      function formatTime(iso){if(!iso)return'-';return new Date(iso).toLocaleString('en-US',{timeZone:'Asia/Dhaka',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true});}
      function formatDate(iso){if(!iso)return'-';return new Date(iso).toLocaleDateString('en-GB');}
      function formatExpiryMonth(iso){if(!iso)return'-';const d=new Date(iso);if(isNaN(d.getTime()))return'-';const monthName=d.toLocaleString('en-US',{month:'short'});return d.getFullYear()===getClientNow().getFullYear()?monthName:monthName+' '+d.getFullYear();}
      function formatDueMonthsLabel(obj){if(!obj||!obj.dueMonths||obj.dueMonths<=0)return'';const labels=obj.dueMonthLabels||[];if(labels.length)return'Due: '+labels.join(', ');return'Due ('+obj.dueMonths+' Mo)';}
      
      const currentUser={role:"${safeRole}",permissions:${safePerms}};
      
      const app={
        data:null, userList:[], searchTimeout:null, payingMemberId:null, activeHistory:null, isSubmitting:false, currentHistoryMemberId:null, isRenewalMode:false,
        
        toast(msg,type='success'){
           const c=document.getElementById('toast-container');
           const d=document.createElement('div');
           d.className='toast '+type;
           d.innerHTML=type==='success'?'✅ '+msg:'⚠️ '+msg;
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
             if(last&&this.can(last))this.nav(last);else this.nav(this.can('home')?'home':'members');
          }catch(e){this.toast('System Load Failed: '+e.message,'error');}
        },
        
        can(perm){return currentUser.role==='admin'||currentUser.permissions.includes(perm);},
        
        nav(v){
          if(v==='users'&&currentUser.role!=='admin')return;
          if(v!=='users'&&!this.can(v))return alert('Access Denied');
          sessionStorage.setItem('gym_view',v);
          const lang=this.data?.settings?.lang||'en';
          
          // Render Sidebar
          const nav=document.getElementById('nav-container');
          let html='';
          if(this.can('home'))html+=\`<div class="nav-item" onclick="app.nav('home')">${getIcon('home')} \${t('over')}</div>\`;
          if(this.can('members'))html+=\`<div class="nav-item" onclick="app.nav('members')">${getIcon('users')} \${t('mem')}</div>\`;
          if(this.can('attendance'))html+=\`<div class="nav-item" onclick="app.nav('attendance')">${getIcon('clock')} \${t('att')}</div>\`;
          if(this.can('history'))html+=\`<div class="nav-item" onclick="app.nav('history')">${getIcon('history')} \${t('hist')}</div>\`;
          if(this.can('payments'))html+=\`<div class="nav-item" onclick="app.nav('payments')">${getIcon('creditCard')} \${t('pay')}</div>\`;
          if(this.can('settings'))html+=\`<div class="nav-item" onclick="app.nav('settings')">${getIcon('settings')} \${t('set')}</div>\`;
          if(currentUser.role==='admin')html+=\`<div class="nav-item" onclick="app.nav('users')">${getIcon('users')} \${t('user')}</div>\`;
          nav.innerHTML=html;
          
          // Set Active State
          const navItems=document.querySelectorAll('.nav-item');
          navItems.forEach(el=>{
             // Simple hack to find active item based on text content match
             if(el.textContent.trim().includes(t(v==='home'?'over':v==='members'?'mem':v==='attendance'?'att':v==='history'?'hist':v==='payments'?'pay':v==='settings'?'set':'user')))el.classList.add('active');
          });

          // Toggle View
          ['home','members','attendance','history','payments','settings','users'].forEach(id=>{const el=document.getElementById('view-'+id);if(el)el.classList.add('hidden');});
          document.getElementById('view-'+v).classList.remove('hidden');
          
          // Mobile Menu Close
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.overlay').classList.remove('open');
          
          // Update Page Title
          document.getElementById('page-title').innerText=t(v==='home'?'dash':v==='members'?'mem':v==='attendance'?'att':v==='history'?'hist':v==='payments'?'pay':v==='settings'?'set':'user');
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
          
          // Render Attendance Table
          const todayRows=(this.data.attendanceToday||[]).map(a=>{let dueStr='';if(a.dueMonths>0)dueStr='<span style="color:#ef4444;font-size:11px;font-weight:700;">(Due)</span>';return\`<tr><td>\${formatTime(a.check_in_time).split(', ')[1]}</td><td><div style="font-weight:700;">\${escapeHtml(a.name)}</div></td><td>\${a.status==='success'?'<span class="badge bg-green">IN</span>':'<span class="badge bg-red">EXPIRED</span>'} \${dueStr}</td></tr>\`;}).join('')||'<tr><td colspan="3" style="text-align:center;padding:20px;color:var(--text-muted);">😴 No check-ins yet today.</td></tr>';
          document.getElementById('tbl-attendance-today').innerHTML=todayRows;
          if(document.getElementById('tbl-attendance-today-mini')) document.getElementById('tbl-attendance-today-mini').innerHTML = (this.data.attendanceToday||[]).slice(0,5).map(a=>\`<tr><td>\${formatTime(a.check_in_time).split(', ')[1]}</td><td>\${escapeHtml(a.name)}</td></tr>\`).join('')||'<tr><td colspan="2" style="text-align:center;color:gray;">No check-ins</td></tr>';

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
            let statusBadge=\`<span class="badge bg-green">Running</span>\`;
            let statusTxt='Active';
            let statusColor='var(--text-muted)';
            if(m.dueMonths>0){
                const price=this.getPlanPrice(m.plan);
                const paid=m.balance||0;
                const owed=(m.dueMonths*price);
                const remaining=Math.max(0,owed-paid);
                const dueLabel=formatDueMonthsLabel(m)||(m.dueMonths+' Mo');
                statusTxt=\`\${remaining} (\${dueLabel})\`;
                statusColor='#ef4444';
                statusBadge=\`<span class="badge bg-amber">Due</span>\`;
                if(m.status==='inactive')statusBadge=\`<span class="badge bg-red">Inactive</span>\`;
            }else if(m.dueMonths<0){
                statusTxt='+'+Math.abs(m.dueMonths)+' Mo Adv';
                statusColor='#10b981';
                statusBadge=\`<span class="badge bg-blue">Advance</span>\`;
            }
            return \`<tr>
              <td style="color:var(--text-muted);font-weight:800;">#\${m.id}</td>
              <td><div style="font-weight:800;font-size:15px;">\${escapeHtml(m.name)}</div><div style="font-size:12px;color:var(--text-muted);">\${escapeHtml(m.phone)}</div></td>
              <td><span style="font-size:12px;background:#f3f4f6;padding:4px 8px;border-radius:6px;font-weight:700;">\${escapeHtml(m.plan)}</span></td>
              <td style="font-size:13px;">\${formatExpiryMonth(m.expiry_date)}</td>
              <td>\${statusBadge}<div style="font-size:11px;font-weight:700;color:\${statusColor};margin-top:2px;">\${statusTxt}</div></td>
              <td style="text-align:right;">
                <div class="flex" style="justify-content:flex-end;gap:8px;">
                  <button class="btn btn-outline" style="padding:8px;width:36px;height:36px;border-radius:50%;" onclick="app.showHistory(\${m.id}, '\${escapeHtml(m.name)}')">📜</button>
                  <button class="btn btn-primary" style="padding:8px 16px;border-radius:12px;font-size:12px;" onclick="app.modals.pay.open(\${m.id})">PAY</button>
                  <button class="btn btn-danger" style="padding:8px;width:36px;height:36px;border-radius:50%;" onclick="app.del(\${m.id})">${getIcon('trash')}</button>
                </div>
              </td>
            </tr>\`;
          }).join('')||'<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted);">No members found.</td></tr>';
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
            let statusHtml=\`<span class="badge bg-green">Running</span>\`;let infoTxt='-';let amtTxt='0';
            if(m.dueMonths>0){
                statusHtml=\`<span class="badge bg-amber">Due</span>\`;
                if(m.status==='inactive')statusHtml=\`<span class="badge bg-red">Inactive</span>\`;
                infoTxt=formatDueMonthsLabel(m)||(m.dueMonths+' Mo Due');
                const dueAmt=m.dueMonths*price;const paid=m.balance||0;const remaining=Math.max(0,dueAmt-paid);
                totalOutstanding+=remaining;
                amtTxt=\`<span style="color:#ef4444;font-weight:800;font-size:15px;">\${cur} \${remaining}</span>\`;
                if(paid>0)amtTxt+=\`<br><span style="font-size:10px;color:gray;">(Paid: \${paid})</span>\`;
            }else if(m.dueMonths<0){statusHtml=\`<span class="badge bg-blue">Adv</span>\`;infoTxt=Math.abs(m.dueMonths)+' Mo Adv';amtTxt=\`<span style="color:#10b981;font-weight:700">+\${cur} \${Math.abs(m.dueMonths*price)}</span>\`;}
            return \`<tr><td>#\${m.id}</td><td>\${escapeHtml(m.name)}</td><td>\${statusHtml}</td><td>\${infoTxt}</td><td>\${amtTxt}</td><td style="text-align:right"><button class="btn btn-primary" onclick="app.modals.pay.open(\${m.id})">Collect</button></td></tr>\`;
          }).join('')||'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted);">No records found.</td></tr>';
          document.getElementById('total-outstanding-amount').innerText=cur+' '+totalOutstanding;
        },
        
        async openPaymentHistory(memberId=null){this.currentHistoryMemberId=memberId;document.getElementById('trans-date').value='';document.getElementById('modal-payment-history').style.display='flex';this.renderTransactionHistory();},
        
        async renderTransactionHistory(){
           const date=document.getElementById('trans-date').value;const memberId=this.currentHistoryMemberId;const tbody=document.getElementById('tbl-transaction-history');const cur=this.data.settings.currency||'BDT';
           tbody.innerHTML='<tr><td colspan="3" style="text-align:center;padding:20px;">Loading...</td></tr>';
           try{
             const res=await fetch('/api/payments/history',{method:'POST',body:JSON.stringify({memberId,date})});
             const data=await res.json();
             const titleEl=document.getElementById('ph-title');
             titleEl.innerText=memberId&&data.memberName?("History: "+data.memberName):"Transaction History";
             const list=data.transactions||[];
             if(list.length===0){tbody.innerHTML='<tr><td colspan="3" style="text-align:center;padding:20px;">No records found.</td></tr>';return;}
             tbody.innerHTML=list.map(p=>\`<tr><td>\${formatTime(p.date)}</td><td>\${p.name?(escapeHtml(p.name)+' (#'+p.member_id+')'):'<span style="color:gray;font-style:italic;">(#'+p.member_id+')</span>'}</td><td style="font-weight:800;color:#10b981;">\${cur} \${p.amount}</td></tr>\`).join('');
           }catch(e){this.toast('Error loading history','error');}
        },
        
        async showHistory(id,name){document.getElementById('mh-title').innerText='Attendance: '+name;const container=document.getElementById('calendar-container');container.innerHTML='<div style="text-align:center;padding:20px;">Loading calendar...</div>';document.getElementById('modal-member-history').style.display='flex';const res=await fetch('/api/members/history',{method:'POST',body:JSON.stringify({memberId:id})});const data=await res.json();this.activeHistory={history:data.history||[],joinedAt:new Date(data.joinedAt||getClientNow())};const yearSelect=document.getElementById('hist-year');yearSelect.innerHTML='';const startYear=this.activeHistory.joinedAt.getFullYear();const endYear=getClientNow().getFullYear();for(let y=endYear;y>=startYear;y--){const opt=document.createElement('option');opt.value=y;opt.innerText=y;yearSelect.appendChild(opt);}const now=getClientNow();yearSelect.value=now.getFullYear();document.getElementById('hist-month').value=now.getMonth();this.renderCalendar();},
        
        renderCalendar(){if(!this.activeHistory)return;const year=parseInt(document.getElementById('hist-year').value);const monthVal=parseInt(document.getElementById('hist-month').value);const container=document.getElementById('calendar-container');const threshold=this.data.settings.attendanceThreshold||3;if(monthVal===-1){let gridHtml='<div class="year-grid">';const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];for(let m=0;m<12;m++){const presentDays=this.activeHistory.history.filter(h=>{const d=new Date(h.check_in_time);return d.getFullYear()===year&&d.getMonth()===m;}).map(h=>new Date(h.check_in_time).getDate());const unique=new Set(presentDays).size;const isP=unique>=threshold;const badgeCls=isP?'ym-p':'ym-a';const badgeTxt=isP?'P':'A';gridHtml+=\`<div class="year-month-card"><div class="ym-name">\${monthNames[m]}</div><div class="ym-badge \${badgeCls}">\${badgeTxt}</div><div class="ym-count">\${unique} Days</div></div>\`;}gridHtml+='</div>';container.innerHTML=gridHtml;return;}const monthName=new Date(year,monthVal).toLocaleString('default',{month:'long'});const daysInMonth=new Date(year,monthVal+1,0).getDate();const presentDays=this.activeHistory.history.filter(h=>{const d=new Date(h.check_in_time);return d.getFullYear()===year&&d.getMonth()===monthVal;}).map(h=>new Date(h.check_in_time).getDate());const uniquePresent=[...new Set(presentDays)];const count=uniquePresent.length;const isBillable=count>=threshold;let gridHtml='';for(let i=1;i<=daysInMonth;i++){const isPresent=uniquePresent.includes(i);const cls=isPresent?'present':'absent';const mark=isPresent?'P':i;gridHtml+=\`<div class="cal-cell \${cls}">\${mark}</div>\`;}container.innerHTML=\`<div class="calendar-month"><div class="cal-header">\${monthName} \${year}</div><div class="cal-grid">\${gridHtml}</div><div class="cal-stats"><span>Days: <strong>\${count}</strong></span><span style="color:\${isBillable?'#10b981':'#ef4444'}">\${isBillable?'Active':'Inactive'}</span></div></div>\`;},
        
        async applyHistoryFilter(){const date=document.getElementById('history-date').value;const tbody=document.getElementById('tbl-attendance-history');tbody.innerHTML='<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>';const res=await fetch('/api/history/list',{method:'POST',body:JSON.stringify({date})});const data=await res.json();this.renderHistoryTable(null,data.history);},
        
        renderHistoryTable(filterDate,dataList=null){let list=dataList||this.data.attendanceHistory||[];if(filterDate&&!dataList){list=list.filter(a=>a.check_in_time.startsWith(filterDate));}document.getElementById('tbl-attendance-history').innerHTML=list.length?list.map(a=>\`<tr><td>\${formatDate(a.check_in_time)}</td><td>\${formatTime(a.check_in_time).split(', ')[1]}</td><td>\${escapeHtml(a.name)}</td></tr>\`).join(''):'<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:20px;">No activity found.</td></tr>';},
        
        openAddUser(){document.getElementById('modal-user').style.display='flex';document.getElementById('user-modal-title').innerText="Add New User";document.getElementById('user-form').reset();document.getElementById('u-id').value="";document.getElementById('u-password').required=true;document.getElementById('u-pass-hint').innerText="";this.togglePerms('staff');},
        
        async loadUsers(){const res=await fetch('/api/users/list');if(res.ok){const data=await res.json();this.userList=data.users;document.getElementById('tbl-users').innerHTML=this.userList.map(u=>\`<tr><td>#\${u.id}</td><td>\${escapeHtml(u.name)}</td><td><span class="badge bg-blue">\${escapeHtml(u.role)}</span></td><td style="font-size:11px;white-space:normal;max-width:150px;">\${u.role==='admin'?'ALL':(JSON.parse(u.permissions).join(', '))}</td><td style="text-align:right"><button class="btn btn-danger" onclick="app.deleteUser(\${u.id})">Remove</button></td></tr>\`).join('');}},
        async saveUser(e){e.preventDefault();const data=Object.fromEntries(new FormData(e.target));const perms=[];document.querySelectorAll('input[name="permissions"]:checked').forEach(cb=>perms.push(cb.value));data.permissions=perms;const url=data.id?'/api/users/update':'/api/users/add';const res=await fetch(url,{method:'POST',body:JSON.stringify(data)});if(res.ok){document.getElementById('modal-user').style.display='none';this.loadUsers();this.toast('User saved successfully');}else{alert((await res.json()).error);}},
        async deleteUser(id){if(confirm("Delete?")){await fetch('/api/users/delete',{method:'POST',body:JSON.stringify({id})});this.loadUsers();this.toast('User deleted');}},
        togglePerms(role){const container=document.getElementById('u-perms-container');if(role==='admin')container.classList.add('hidden');else container.classList.remove('hidden');},

        applySettingsUI(){const s=this.data.settings;const form=document.getElementById('settings-form');form.querySelector('input[name="currency"]').value=s.currency||'BDT';form.querySelector('select[name="lang"]').value=s.lang||'en';form.querySelector('input[name="attendanceThreshold"]').value=s.attendanceThreshold;form.querySelector('input[name="inactiveAfterMonths"]').value=s.inactiveAfterMonths;form.querySelector('input[name="renewalFee"]').value=s.renewalFee;form.querySelector('input[name="timezone"]').value=(s.time&&s.time.timezone)||'Asia/Dhaka';setClientNow(s.time?.now);const simInput=form.querySelector('input[name="simulatedTime"]');if(simInput){const iso=s.time?.simulatedTime||s.time?.now||'';simInput.value=iso?new Date(iso).toISOString().slice(0,16):'';}const simToggle=form.querySelector('input[name="timeSimulationEnabled"]');if(simToggle)simToggle.checked=!!s.time?.simulated;const lblClock=document.getElementById('lbl-current-time');if(lblClock){const tz=s.time?.timezone||'Asia/Dhaka';const now=s.time?.now?new Date(s.time.now):getClientNow();lblClock.innerText='Server Time: '+now.toLocaleString('en-GB',{timeZone:tz});}const plansDiv=document.getElementById('plans-container');plansDiv.innerHTML=s.membershipPlans.map((p,i)=>\`<div class="plan-row" id="plan-\${i}"><input type="text" placeholder="Name" value="\${escapeHtml(p.name)}" class="plan-name" style="margin:0;"><input type="number" placeholder="Price" value="\${p.price}" class="plan-price" style="margin:0;"><input type="number" placeholder="Adm" value="\${p.admissionFee||0}" class="plan-adm" style="margin:0;"><button type="button" class="btn btn-danger" onclick="document.getElementById('plan-\${i}').remove()" style="padding:0;width:30px;height:30px;border-radius:50%;">X</button></div>\`).join('');document.getElementById('plan-select').innerHTML=s.membershipPlans.map(p=>\`<option value="\${escapeHtml(p.name)}">\${escapeHtml(p.name)}</option>\`).join('');},
        addPlanRow(){const id='new-'+Date.now();const html=\`<div class="plan-row" id="\${id}"><input type="text" placeholder="Name" class="plan-name" style="margin:0;"><input type="number" placeholder="Price" value="0" class="plan-price" style="margin:0;"><input type="number" placeholder="Adm" value="0" class="plan-adm" style="margin:0;"><button type="button" class="btn btn-danger" onclick="document.getElementById('\${id}').remove()" style="padding:0;width:30px;height:30px;border-radius:50%;">X</button></div>\`;document.getElementById('plans-container').insertAdjacentHTML('beforeend',html);},
        async saveSettings(e){e.preventDefault();const plans=[];document.getElementById('plans-container').querySelectorAll('.plan-row').forEach(row=>{const nameInput=row.querySelector('.plan-name');const priceInput=row.querySelector('.plan-price');const admInput=row.querySelector('.plan-adm');if(nameInput&&priceInput){const name=nameInput.value.trim();const price=priceInput.value.trim();const admissionFee=admInput?admInput.value.trim():0;if(name)plans.push({name,price:Number(price),admissionFee:Number(admissionFee)});}});const form=e.target;document.getElementById('btn-save-set').innerText='Saving...';await fetch('/api/settings',{method:'POST',body:JSON.stringify({currency:form.querySelector('input[name="currency"]').value,lang:form.querySelector('select[name="lang"]').value,attendanceThreshold:form.querySelector('input[name="attendanceThreshold"]').value,inactiveAfterMonths:form.querySelector('input[name="inactiveAfterMonths"]').value,renewalFee:form.querySelector('input[name="renewalFee"]').value,membershipPlans:plans,timezone:form.querySelector('input[name="timezone"]').value,timeSimulationEnabled:form.querySelector('input[name="timeSimulationEnabled"]').checked,simulatedTime:form.querySelector('input[name="simulatedTime"]').value})});this.toast('Settings Saved'); setTimeout(()=>location.reload(),1000);},
        async resetDB(){if(!confirm("Reset everything?"))return;await fetch('/api/nuke');location.reload();},
        
        async pay(e){e.preventDefault();const btn=document.getElementById('pay-submit-btn');btn.disabled=true;btn.innerText="Processing...";try{const endpoint=app.isRenewalMode?'/api/members/renew':'/api/payment';await fetch(endpoint,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});this.toast('Payment Successful');setTimeout(()=>location.reload(),500);}catch(e){this.toast('Payment Failed','error');btn.disabled=false;btn.innerText="Confirm Payment";}},
        
        async checkIn(){if(this.isSubmitting)return;this.isSubmitting=true;const btn=document.getElementById('btn-sub-chk');if(btn)btn.disabled=true;btn.innerText="Please wait...";const id=document.getElementById('checkin-id').value;try{const res=await fetch('/api/checkin',{method:'POST',body:JSON.stringify({memberId:id})});const json=await res.json();const div=document.getElementById('checkin-res');div.innerText=json.status==='success'?('✅ Welcome '+json.name):(json.error||'⛔ Error');div.style.color=json.status==='success'?'var(--success)':'var(--danger)';if(json.status==='success'){this.toast('Welcome '+json.name);setTimeout(()=>location.reload(),800);}}catch(e){this.toast('Network Error','error');}finally{this.isSubmitting=false;if(btn){btn.disabled=false;btn.innerText="Check In Now";}}},
        
        onCheckinInput(e){if(e.key==='Enter'){this.checkIn();return;}const val=e.target.value;if(this.searchTimeout)clearTimeout(this.searchTimeout);this.searchTimeout=setTimeout(async()=>{if(!val.trim()){document.getElementById('checkin-suggestions').innerHTML='';document.getElementById('checkin-suggestions').style.display='none';return;}const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:val})});const data=await res.json();const resDiv=document.getElementById('checkin-suggestions');resDiv.style.display='block';resDiv.innerHTML=data.results.map(m=>{let statusStr='<span style="color:gray;">Running</span>';if(m.status==='inactive'){statusStr='<span style="color:red;font-weight:700;">⛔ INACTIVE</span>';}else if(m.dueMonths>0){statusStr='<span style="color:orange;font-weight:700;">'+formatDueMonthsLabel(m)+'</span>';}return\`<div class="checkin-item" onclick="document.getElementById('checkin-id').value='\${m.id}'; document.getElementById('checkin-suggestions').style.display='none';"><div>#\${m.id} · \${escapeHtml(m.name)}</div> <div>\${statusStr}</div></div>\`;}).join('');},300);},
        
        onQuickPayInput(e){const val=e.target.value;if(this.searchTimeout)clearTimeout(this.searchTimeout);this.searchTimeout=setTimeout(async()=>{if(!val.trim()){document.getElementById('qp-results').innerHTML='';document.getElementById('qp-results').style.display='none';return;}const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:val})});const data=await res.json();const resDiv=document.getElementById('qp-results');resDiv.style.display='block';resDiv.innerHTML=data.results.map(m=>{let dueStr='Active';if(m.status==='inactive')dueStr='⛔ Inactive';else if(m.dueMonths>0)dueStr=formatDueMonthsLabel(m);return\`<div class="checkin-item" onclick="app.modals.quickPay.close(); app.modals.pay.open(\${m.id})"><strong>#\${m.id} · \${escapeHtml(m.name)}</strong> - \${dueStr}</div>\`;}).join('');},300);},
        
        switchAddTab(tab){const isMig=tab==='mig';const tNew=document.getElementById('tab-new');const tMig=document.getElementById('tab-mig');tNew.style.background=isMig?'transparent':'white';tNew.style.color=isMig?'#6b7280':'var(--primary)';tNew.style.boxShadow=isMig?'none':'0 2px 4px rgba(0,0,0,0.05)';tMig.style.background=isMig?'white':'transparent';tMig.style.color=isMig?'var(--primary)':'#6b7280';tMig.style.boxShadow=isMig?'0 2px 4px rgba(0,0,0,0.05)':'none';document.getElementById('sec-new-fees').style.display=isMig?'none':'block';document.getElementById('sec-mig-fees').style.display=isMig?'block':'none';document.getElementById('add-mig-mode').value=isMig?'true':'false';document.getElementById('new-init-pay').required=!isMig;document.getElementById('mig-legacy-dues').required=isMig;app.updateAddMemberFees();},
        
        updateAddMemberFees(){const planName=document.getElementById('plan-select').value;const fee=app.getPlanAdmFee(planName);document.getElementById('new-adm-fee').value=fee;},
        async addMember(e){e.preventDefault();const btn=e.target.querySelector('button[type="submit"]');btn.disabled=true;btn.innerText="Creating...";try{await fetch('/api/members/add',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});this.toast('Member Added!');location.reload();}catch(e){this.toast('Error adding member','error');btn.disabled=false;btn.innerText="Create Member";}},
        async del(id){if(confirm("Delete this member permanently?")){await fetch('/api/members/delete',{method:'POST',body:JSON.stringify({id})});this.toast('Member deleted');location.reload();}},
        
        onPaymentSearchInput(e){const val=e.target.value;if(this.searchTimeout)clearTimeout(this.searchTimeout);this.searchTimeout=setTimeout(async()=>{if(!val.trim()){document.getElementById('pay-search-results').innerHTML='';document.getElementById('pay-search-results').style.display='none';return;}const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:val})});const data=await res.json();const div=document.getElementById('pay-search-results');div.style.display='block';div.innerHTML=data.results.map(m=>{let dueStr='Active';if(m.status==='inactive')dueStr='⛔ Inactive';else if(m.dueMonths>0)dueStr='⚠️ '+formatDueMonthsLabel(m);return\`<div class="checkin-item" onclick="app.modals.pay.open(\${m.id})"><div>#\${m.id} · \${escapeHtml(m.name)}</div> <div style="font-size:12px;">\${dueStr}</div></div>\`;}).join('');},300);},
        
        renderCharts(){if(typeof Chart==='undefined')return;const members=this.data.members||[];const ctx1=document.getElementById('chart-dues');if(ctx1){if(window.myChart)window.myChart.destroy();window.myChart=new Chart(ctx1.getContext('2d'),{type:'bar',data:{labels:['No Due','1 Mo','2+ Mo','Inactive'],datasets:[{label:'Members',data:[members.filter(m=>!m.dueMonths||m.dueMonths<=0).length,members.filter(m=>m.dueMonths===1).length,members.filter(m=>m.dueMonths>=2&&m.status!=='inactive').length,members.filter(m=>m.status==='inactive').length],backgroundColor:['#10b981','#f59e0b','#ef4444','#64748b'],borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#f3f4f6'}},x:{grid:{display:false}}}}});}},
        
        modals:{
          checkin:{open:()=>{document.getElementById('modal-checkin').style.display='flex';document.getElementById('checkin-id').focus();},close:()=>{document.getElementById('modal-checkin').style.display='none';document.getElementById('checkin-res').innerText='';}},
          quickPay:{open:()=>{document.getElementById('modal-quick-pay').style.display='flex';document.getElementById('qp-search').focus();},close:()=>document.getElementById('modal-quick-pay').style.display='none'},
          add:{open:()=>{app.switchAddTab('new');app.updateAddMemberFees();document.getElementById('mig-legacy-dues').value='0';document.getElementById('mig-init-pay').value='0';document.getElementById('modal-add').style.display='flex';},close:()=>document.getElementById('modal-add').style.display='none'},
          pay:{open:(id)=>{app.payingMemberId=id;const m=app.data.members.find(x=>x.id===id);const price=app.getPlanPrice(m.plan);document.getElementById('pay-id').value=id;document.getElementById('pay-name').innerText=m?m.name:'';document.getElementById('pay-amount').value='';document.getElementById('pay-status-warning').style.display='none';document.getElementById('pay-renewal-section').style.display='none';document.getElementById('pay-standard-label').style.display='block';const btn=document.getElementById('pay-submit-btn');btn.innerText='Confirm Payment';btn.disabled=false;document.getElementById('pay-amount').required=true;app.isRenewalMode=false;if(m.status==='inactive'){app.isRenewalMode=true;document.getElementById('pay-status-warning').style.display='block';document.getElementById('pay-renewal-section').style.display='block';document.getElementById('pay-standard-label').style.display='none';document.getElementById('pay-ren-fee').value=app.data.settings.renewalFee||0;btn.innerText='Re-admit & Pay';}document.getElementById('pay-plan-price').innerText=price;document.getElementById('pay-wallet-bal').innerText=m.balance||0;document.getElementById('modal-pay').style.display='flex';},close:()=>{app.payingMemberId=null;document.getElementById('modal-pay').style.display='none'}},
          user:{close:()=>document.getElementById('modal-user').style.display='none'}
        }
      };
      
      // Close overlays on Escape
      document.addEventListener('keydown', function(event) { if (event.key === "Escape") { document.querySelectorAll('.modal-backdrop').forEach(el=>el.style.display='none'); }});

      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
