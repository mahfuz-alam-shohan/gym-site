import { escapeHtml } from "../utils";
import { baseHead, getIcon } from "./head";

/* ========================================================================
   2. PAGES & COMPONENTS - LOGIC & RENDER
   ======================================================================== */

// --- LOGIN & SETUP PAGES ---

export function renderSetup() {
  const html = `${baseHead("Setup Gym OS")}
  <body>
    <div class="center-screen">
      <div class="card" style="width:100%;max-width:400px;text-align:center;">
        <div style="width:48px;height:48px;background:var(--primary);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-size:24px;">🚀</div>
        <h2 style="margin-bottom:8px;">Welcome to Gym OS</h2>
        <p class="text-muted" style="margin-bottom:24px;">Let's set up your admin account to get started.</p>
        <form id="form" style="text-align:left;">
          <label>Gym Name</label><input name="gymName" required placeholder="e.g. Iron Paradise">
          <label>Admin Name</label><input name="adminName" required placeholder="Your Name">
          <label>Admin Email</label><input name="email" type="email" required placeholder="admin@gym.com">
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:14px;">Complete Setup</button>
        </form>
        <div id="error" style="color:var(--danger);margin-top:16px;font-weight:600;font-size:13px;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;btn.innerText="Setting up...";try{const res=await fetch('/api/setup',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});const d=await res.json();if(res.ok)window.location.reload();else throw new Error(d.error);}catch(err){document.getElementById('error').textContent=err.message;btn.disabled=false;btn.innerText="Complete Setup";}}
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export function renderLogin(gymName: string) {
  const safeName = escapeHtml(gymName);
  const html = `${baseHead("Login")}
  <body>
    <div class="center-screen">
      <div class="card" style="width:100%;max-width:360px;text-align:center;">
        <div style="font-size:32px;margin-bottom:16px;">💪</div>
        <h3 style="margin-bottom:4px;">${safeName}</h3>
        <p class="text-muted" style="margin-bottom:24px;">Staff Login Portal</p>
        <form id="form" style="text-align:left;">
          <label>Email Address</label><input name="email" required placeholder="name@email.com">
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:14px;font-size:14px;">Sign In</button>
        </form>
        <div id="error" style="color:var(--danger);margin-top:16px;font-weight:600;font-size:13px;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;btn.innerText="Verifying...";try{const res=await fetch('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});if(res.ok){sessionStorage.removeItem('gym_view');window.location.href='/dashboard';}else{const d=await res.json();throw new Error(d.error);}}catch(err){document.getElementById('error').textContent=err.message;btn.disabled=false;btn.innerText="Sign In";}}
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// --- MAIN DASHBOARD ---

export function renderDashboard(user: any, gymName: string) {
  const safeUserName = escapeHtml(user.name || "User");
  const safeRole = escapeHtml((user.role || "staff").toUpperCase());
  // Ensure permissions is a valid JSON array string, or default to empty array
  let safePerms = '[]';
  try {
    if (user.permissions && typeof user.permissions === 'string') {
        // Validate it's parseable
        JSON.parse(user.permissions);
        safePerms = user.permissions;
    }
  } catch (e) { safePerms = '[]'; }
  
  const safeGymName = escapeHtml(gymName || "Gym OS");

  const html = `${baseHead("Dashboard")}
  <body>
    <div id="toast-container"></div>
    
    <!-- Floating Action Button (Mobile Only) -->
    <div class="fab" onclick="app.modals.checkin.open()">${getIcon('zap')}</div>

    <div class="app-layout">
      
      <!-- DESKTOP SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand-icon">💪</div>
          <div>
             <div style="font-weight:700;font-size:15px;line-height:1.2;">${safeGymName}</div>
             <div style="font-size:11px;color:var(--text-sec);">Management</div>
          </div>
        </div>
        
        <div class="nav" id="desktop-nav"></div>
        
        <div style="padding:16px;margin-top:auto;">
          <div style="background:var(--bg-body);padding:12px;border-radius:12px;border:1px solid var(--border);">
            <div style="font-weight:600;font-size:13px;">${safeUserName}</div>
            <div style="font-size:11px;color:var(--text-sec);margin-bottom:8px;">${safeRole}</div>
            <a href="/api/logout" style="color:#ef4444;font-size:12px;text-decoration:none;display:flex;align-items:center;gap:6px;font-weight:600;">${getIcon('logout')} Sign Out</a>
          </div>
        </div>
      </aside>

      <!-- MOBILE BOTTOM NAV -->
      <nav class="bottom-nav" id="mobile-nav"></nav>

      <!-- MAIN CONTENT AREA -->
      <main class="main-content">
        
        <!-- Top Bar -->
        <div class="flex-between" style="margin-bottom:24px;">
           <div>
             <h2 id="page-title">Dashboard</h2>
             <div class="text-muted text-xs" id="page-subtitle">Welcome back!</div>
           </div>
           <!-- Quick Actions (Desktop) -->
           <div class="hidden" style="display:none;" id="desktop-actions">
              <button class="btn btn-primary" onclick="app.modals.checkin.open()">${getIcon('zap')} Check In</button>
              <button class="btn btn-outline" onclick="app.modals.quickPay.open()">${getIcon('creditCard')} Pay</button>
           </div>
           <!-- Logout on Mobile Header -->
           <div style="display:block; @media(min-width:769px){display:none;}">
              <a href="/api/logout" style="color:var(--text-sec);">${getIcon('logout')}</a>
           </div>
        </div>

        <!-- VIEW: HOME -->
        <div id="view-home" class="hidden">
           <div class="stats-grid">
             <div class="stat-card">
               <div class="stat-val" id="stat-active" style="color:var(--success);">--</div>
               <div class="stat-label">Active Members</div>
             </div>
             <div class="stat-card">
               <div class="stat-val" id="stat-today" style="color:var(--warning);">--</div>
               <div class="stat-label">Visits Today</div>
             </div>
             <div class="stat-card">
               <div class="stat-val" id="stat-rev" style="color:var(--primary);">--</div>
               <div class="stat-label">Revenue</div>
             </div>
             <div class="stat-card">
               <div class="stat-val" id="stat-due" style="color:var(--danger);">--</div>
               <div class="stat-label">Due Members</div>
             </div>
           </div>
           
           <div class="flex-between" style="align-items:start; flex-wrap:wrap; gap:20px;">
              <div class="card" style="flex:2; min-width:300px;">
                 <h4 style="margin-bottom:16px;">Dues Overview</h4>
                 <div style="height:200px; width:100%; position:relative;"><canvas id="chart-dues"></canvas></div>
              </div>
              <div class="card" style="flex:1; min-width:280px;">
                 <h4 style="margin-bottom:12px;">Recent Check-ins</h4>
                 <div class="mobile-list" id="list-recent-home" style="display:flex;"></div>
                 <button class="btn btn-outline w-full mt-4" onclick="app.nav('attendance')">View All</button>
              </div>
           </div>
        </div>

        <!-- VIEW: MEMBERS -->
        <div id="view-members" class="hidden">
           <div class="card" style="padding:12px; display:flex; gap:8px; flex-wrap:wrap;">
              <div class="flex" style="flex:1; background:var(--bg-body); padding:0 12px; border-radius:var(--radius-md); border:1px solid var(--border);">
                 <div style="opacity:0.5;">${getIcon('search')}</div>
                 <input id="search" placeholder="Search ID, Name or Phone..." style="border:none; background:transparent; margin:0; box-shadow:none; padding:12px 0;" onkeyup="app.renderMembersTable()">
              </div>
              <select id="member-filter" onchange="app.renderMembersTable()" style="width:auto; margin:0; background:var(--bg-body); border-color:var(--border);">
                 <option value="all">All Status</option>
                 <option value="active">Active</option>
                 <option value="due">Due</option>
                 <option value="inactive">Inactive</option>
              </select>
              <button class="btn btn-primary" onclick="app.modals.add.open()">${getIcon('plus')} Add</button>
           </div>
           
           <!-- Desktop Table -->
           <div class="card desktop-table" style="padding:0; overflow:hidden;">
              <div class="table-responsive">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Plan</th><th>Expiry</th><th>Status</th><th style="text-align:right">Action</th></tr></thead>
                  <tbody id="tbl-members"></tbody>
                </table>
              </div>
           </div>
           <!-- Mobile Cards -->
           <div class="mobile-list" id="list-members"></div>
        </div>

        <!-- VIEW: ATTENDANCE -->
        <div id="view-attendance" class="hidden">
           <div class="card">
             <h4 style="margin-bottom:16px;">Today's Activity</h4>
             <div class="desktop-table">
                <table class="table-responsive"><thead><tr><th>Time</th><th>Name</th><th>Status</th></tr></thead><tbody id="tbl-attendance-today"></tbody></table>
             </div>
             <div class="mobile-list" id="list-attendance-today"></div>
           </div>
        </div>

        <!-- VIEW: HISTORY -->
        <div id="view-history" class="hidden">
           <div class="card">
             <div class="flex-between" style="margin-bottom:16px;">
               <h4>Activity Log</h4>
               <div class="flex">
                 <input type="date" id="history-date" style="margin:0; width:auto;">
                 <button class="btn btn-outline btn-sm" onclick="app.applyHistoryFilter()">Filter</button>
               </div>
             </div>
             <div class="desktop-table">
               <table><thead><tr><th>Date</th><th>Time</th><th>Name</th></tr></thead><tbody id="tbl-attendance-history"></tbody></table>
             </div>
             <div class="mobile-list" id="list-attendance-history"></div>
           </div>
        </div>

        <!-- VIEW: PAYMENTS -->
        <div id="view-payments" class="hidden">
           <div class="flex" style="gap:16px; margin-bottom:20px; flex-wrap:wrap;">
              <div class="card" style="flex:1; margin:0; background:#fff1f2; border-color:#fecaca;">
                 <div style="font-size:11px; font-weight:700; color:#9f1239; text-transform:uppercase;">Outstanding</div>
                 <div id="total-outstanding-amount" style="font-size:28px; font-weight:800; color:#be123c;">0</div>
              </div>
              <div style="display:flex; gap:8px;">
                 <button class="btn btn-outline" onclick="app.openPaymentHistory()">${getIcon('history')} History</button>
                 <button class="btn btn-outline" onclick="window.open('/dues/print','_blank')">${getIcon('print')} Print</button>
              </div>
           </div>

           <div class="card">
              <div class="flex-between" style="margin-bottom:16px;">
                 <h4 class="text-muted" style="font-size:12px; text-transform:uppercase;">Collection List</h4>
                 <select id="pay-filter" onchange="app.renderPaymentsTable()" style="width:auto; margin:0; font-size:12px;">
                    <option value="due">Due Only</option>
                    <option value="all">Everyone</option>
                 </select>
              </div>
              <div style="position:relative; margin-bottom:16px;">
                 <input id="pay-search" placeholder="Type Name or ID to collect..." style="margin:0; padding-left:36px;" onkeyup="app.onPaymentSearchInput(event)">
                 <div style="position:absolute; left:12px; top:11px; opacity:0.4; width:16px;">${getIcon('search')}</div>
                 <div id="pay-search-results" style="display:none; position:absolute; top:100%; left:0; right:0; background:white; border:1px solid var(--border); border-radius:8px; box-shadow:var(--shadow-lg); z-index:20; max-height:200px; overflow-y:auto;"></div>
              </div>
              
              <div class="desktop-table">
                 <table><thead><tr><th>ID</th><th>Name</th><th>Status</th><th>Due / Adv</th><th>Amount</th><th style="text-align:right">Action</th></tr></thead><tbody id="tbl-payment-list"></tbody></table>
              </div>
              <div class="mobile-list" id="list-payment-list"></div>
           </div>
        </div>

        <!-- VIEW: SETTINGS -->
        <div id="view-settings" class="hidden">
           <div class="card">
              <h4 style="margin-bottom:20px;">System Settings</h4>
              <form id="settings-form" onsubmit="app.saveSettings(event)">
                <div class="flex" style="flex-wrap:wrap;">
                   <div class="w-full"><label>Currency</label><input name="currency" type="text" placeholder="BDT"></div>
                   <div class="w-full"><label>Language</label><select name="lang"><option value="en">English</option><option value="bn">Bangla</option></select></div>
                </div>
                <div class="flex" style="flex-wrap:wrap;">
                   <div class="w-full"><label>Min. Attendance (Days)</label><input name="attendanceThreshold" type="number" min="1" max="31" required></div>
                   <div class="w-full"><label>Inactive after (Months)</label><input name="inactiveAfterMonths" type="number" min="1" max="36" required></div>
                </div>
                <div class="w-full"><label>Renewal Fee</label><input name="renewalFee" type="number" min="0" required></div>
                
                <div style="background:var(--bg-body); padding:16px; border-radius:12px; margin:20px 0;">
                    <label style="color:var(--primary);">Membership Plans</label>
                    <div id="plans-container" style="margin-bottom:12px;"></div>
                    <button type="button" class="btn btn-outline w-full btn-sm" onclick="app.addPlanRow()">+ Add Plan</button>
                </div>
                
                <div style="border-top:1px solid var(--border); padding-top:20px; margin-top:20px;">
                  <button type="submit" class="btn btn-primary" id="btn-save-set">Save Changes</button>
                  <button onclick="app.resetDB()" class="btn btn-danger" type="button" id="btn-reset-db" style="float:right;">Factory Reset</button>
                </div>
              </form>
           </div>
        </div>

        <!-- VIEW: USERS -->
        <div id="view-users" class="hidden">
           <div class="card">
               <div class="flex-between" style="margin-bottom:16px;">
                 <h4>User Access</h4>
                 <button class="btn btn-primary btn-sm" onclick="app.openAddUser()">+ Add User</button>
               </div>
               <div class="desktop-table">
                 <table><thead><tr><th>Name</th><th>Role</th><th style="text-align:right">Action</th></tr></thead><tbody id="tbl-users"></tbody></table>
               </div>
               <div class="mobile-list" id="list-users"></div>
           </div>
        </div>

      </main>
    </div>

    <!-- MODALS -->
    
    <!-- CHECK-IN MODAL -->
    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content text-center">
        <h3 style="margin-bottom:16px;">Daily Check-In</h3>
        <input id="checkin-id" type="number" placeholder="Enter Member ID..." style="font-size:24px; text-align:center; font-weight:700; padding:20px;" autofocus onkeyup="app.onCheckinInput(event)">
        <div id="checkin-suggestions" style="text-align:left; max-height:150px; overflow-y:auto; margin-bottom:10px; border:1px solid var(--border); border-radius:8px; display:none;"></div>
        <button class="btn btn-primary w-full" onclick="app.checkIn()" id="btn-sub-chk" style="padding:16px; font-size:16px;">Check In</button>
        <div id="checkin-res" style="margin-top:20px; font-weight:600; min-height:24px;"></div>
        <button class="btn btn-outline w-full mt-4" style="border:none;" onclick="app.modals.checkin.close()">Cancel</button>
      </div>
    </div>
   
    <!-- QUICK PAY MODAL -->
    <div id="modal-quick-pay" class="modal-backdrop">
      <div class="modal-content text-center">
        <h3 style="margin-bottom:16px;">Quick Pay</h3>
        <input id="qp-search" type="text" placeholder="Name or ID..." style="padding:16px;" onkeyup="app.onQuickPayInput(event)">
        <div id="qp-results" style="text-align:left; max-height:200px; overflow-y:auto; margin-top:8px; display:none; border:1px solid var(--border); border-radius:8px;"></div>
        <button class="btn btn-outline w-full mt-4" onclick="app.modals.quickPay.close()">Close</button>
      </div>
    </div>

    <!-- ADD MEMBER MODAL -->
    <div id="modal-add" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="margin-bottom:20px;">New Member</h3>
        
        <div style="display:flex; background:var(--bg-body); padding:4px; border-radius:8px; margin-bottom:20px;">
           <div id="tab-new" style="flex:1; text-align:center; padding:8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; background:white; shadow:var(--shadow-sm);" onclick="app.switchAddTab('new')">New</div>
           <div id="tab-mig" style="flex:1; text-align:center; padding:8px; border-radius:6px; cursor:pointer; font-weight:600; font-size:13px; color:var(--text-sec);" onclick="app.switchAddTab('mig')">Migrate</div>
        </div>

        <form onsubmit="app.addMember(event)">
          <input type="hidden" name="migrationMode" id="add-mig-mode" value="false">
          <div class="flex" style="gap:10px;">
             <div class="w-full"><label>Name</label><input name="name" required placeholder="Full Name"></div>
             <div class="w-full"><label>Phone</label><input name="phone" required placeholder="01XXX..."></div>
          </div>
          <label>Plan</label><select name="plan" id="plan-select" onchange="app.updateAddMemberFees()"></select>
          
          <div style="background:var(--bg-body); padding:16px; border-radius:12px; margin-bottom:20px; border:1px solid var(--border);">
             <div id="sec-new-fees">
                 <div class="flex" style="align-items:flex-end; gap:10px;">
                    <div style="flex:1;"><label>Adm. Fee</label><input name="admissionFee" id="new-adm-fee" type="number" min="0" style="margin:0;"></div>
                    <label style="display:flex; align-items:center; gap:6px; margin-bottom:10px; cursor:pointer;"><input type="checkbox" name="admissionFeePaid" value="yes" checked style="width:auto; margin:0;"> Paid</label>
                 </div>
                 <div class="w-full mt-4"><label>Initial Payment</label><input name="initialPayment" id="new-init-pay" type="number" min="0" required placeholder="Amount" style="margin:0;"></div>
             </div>
             <div id="sec-mig-fees" style="display:none;">
                 <div class="w-full"><label>Legacy Dues (Months)</label><input name="legacyDues" id="mig-legacy-dues" type="number" min="0" value="0"></div>
                 <div class="w-full"><label>Payment Now</label><input name="initialPayment" id="mig-init-pay" type="number" min="0" value="0"></div>
             </div>
          </div>
          <div class="flex" style="justify-content:flex-end;">
            <button type="button" class="btn btn-outline" onclick="app.modals.add.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>

    <!-- PAY MODAL -->
    <div id="modal-pay" class="modal-backdrop">
      <div class="modal-content">
        <h3 style="margin-bottom:8px;">Receive Payment</h3>
        <p id="pay-name" style="color:var(--primary); margin-bottom:20px; font-weight:700; font-size:16px;"></p>
        
        <div id="pay-status-warning" style="display:none; background:#fee2e2; color:#b91c1c; padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px; font-weight:600;">⚠️ Inactive. Re-admission required.</div>
        
        <form onsubmit="app.pay(event)">
          <input type="hidden" name="memberId" id="pay-id">
          <div id="pay-renewal-section" style="display:none; background:var(--bg-body); padding:12px; border-radius:8px; margin-bottom:16px;">
             <label>Renewal Fee</label><input name="renewalFee" id="pay-ren-fee" type="number" readonly style="background:#e2e8f0;">
          </div>
          
          <label id="pay-standard-label">Amount</label>
          <input name="amount" id="pay-amount" type="number" required placeholder="0.00" style="font-size:20px; font-weight:700; color:var(--primary);">
          
          <div style="font-size:12px; color:var(--text-sec); margin-top:8px; background:var(--bg-body); padding:12px; border-radius:8px;">
             <div class="flex-between"><span>Plan Price:</span> <span id="pay-plan-price" style="font-weight:700;">-</span></div>
             <div class="flex-between" style="margin-top:4px;"><span>Wallet:</span> <span id="pay-wallet-bal" style="font-weight:700;">0</span></div>
          </div>
          
          <div class="flex" style="justify-content:flex-end; margin-top:20px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.pay.close()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="pay-submit-btn">Confirm</button>
          </div>
        </form>
      </div>
    </div>

    <!-- USER MODAL -->
    <div id="modal-user" class="modal-backdrop">
      <div class="modal-content">
        <h3>User Access</h3>
        <form id="user-form" onsubmit="app.saveUser(event)" style="margin-top:20px;">
          <input type="hidden" name="id" id="u-id">
          <label>Name</label><input name="name" id="u-name" required>
          <label>Email</label><input name="email" id="u-email" type="email" required>
          <label>Password</label><input name="password" id="u-password" type="password">
          <label>Role</label>
          <select name="role" id="u-role" onchange="app.togglePerms(this.value)">
             <option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
          <div id="u-perms-container">
             <label class="mt-4">Permissions</label>
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <label style="display:flex;align-items:center;gap:6px;font-weight:500;cursor:pointer;"><input type="checkbox" name="permissions" value="home" style="width:auto;margin:0;"> Home</label>
                <label style="display:flex;align-items:center;gap:6px;font-weight:500;cursor:pointer;"><input type="checkbox" name="permissions" value="members" style="width:auto;margin:0;"> Members</label>
                <label style="display:flex;align-items:center;gap:6px;font-weight:500;cursor:pointer;"><input type="checkbox" name="permissions" value="attendance" style="width:auto;margin:0;"> Attendance</label>
                <label style="display:flex;align-items:center;gap:6px;font-weight:500;cursor:pointer;"><input type="checkbox" name="permissions" value="payments" style="width:auto;margin:0;"> Payments</label>
             </div>
          </div>
          <div class="flex" style="justify-content:flex-end; margin-top:20px;">
            <button type="button" class="btn btn-outline" onclick="app.modals.user.close()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- HISTORY LIST MODAL -->
    <div id="modal-payment-history" class="modal-backdrop">
      <div class="modal-content" style="max-width:500px;">
         <div class="flex-between" style="margin-bottom:16px;">
            <h3>Transaction History</h3>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('modal-payment-history').style.display='none'">Close</button>
         </div>
         <div class="flex" style="margin-bottom:12px;">
            <input type="date" id="trans-date" style="margin:0;" onchange="app.renderTransactionHistory()">
         </div>
         <div class="table-responsive" style="max-height:300px;">
            <table><thead><tr><th>Date</th><th>Member</th><th>Amount</th></tr></thead><tbody id="tbl-transaction-history"></tbody></table>
         </div>
      </div>
    </div>
    
    <!-- MEMBER HISTORY MODAL -->
    <div id="modal-member-history" class="modal-backdrop">
       <div class="modal-content" style="max-width:400px; text-align:center;">
          <h3 id="mh-title" style="margin-bottom:16px;">History</h3>
          <div id="calendar-container" style="max-height:400px; overflow-y:auto;"></div>
          <button class="btn btn-outline w-full mt-4" onclick="document.getElementById('modal-member-history').style.display='none'">Close</button>
       </div>
    </div>

    <!-- MAIN SCRIPT -->
    <script>
      const currentUser={role:"${safeRole}",permissions:${safePerms}};
      if (!Array.isArray(currentUser.permissions)) currentUser.permissions = [];
      
      // --- ROBUST TIME FORMATTER (Fixes Phone Bug) ---
      function formatTime(iso) {
          if (!iso) return '-';
          try {
             const d = new Date(iso);
             if (isNaN(d.getTime())) return '-';
             return d.toLocaleTimeString('en-US', {
               hour: '2-digit', minute: '2-digit', hour12: true
             });
          } catch(e) { return '-'; }
      }
      function formatDate(iso) {
          if (!iso) return '-';
          try {
             const d = new Date(iso);
             if (isNaN(d.getTime())) return '-';
             return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          } catch (e) { return '-'; }
      }
      function escapeHtml(text){if(!text)return"";return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}

      const app={
        data:null, searchTimeout:null, payingMemberId:null, isRenewalMode:false,
        
        toast(msg,type='success'){
           const c=document.getElementById('toast-container');
           const d=document.createElement('div');
           d.className='toast '+type;
           d.innerHTML=type==='success'?'<span>✅ '+msg+'</span>':'<span>⚠️ '+msg+'</span>';
           c.appendChild(d);
           setTimeout(()=>d.remove(),3000);
        },
        
        async init(){
          try{
             const res=await fetch('/api/bootstrap');
             if(!res.ok){if(res.status===401)window.location.href='/';return;}
             this.data=await res.json();
             
             // Initial Render
             try {
                this.render();
             } catch(e) { console.error(e); this.toast('Render Error: ' + e.message, 'error'); }

             this.applySettingsUI();
             
             if(currentUser.role==='admin')this.loadUsers();
             
             // Restore last view safely
             const last=sessionStorage.getItem('gym_view')||'home';
             this.nav(this.can(last)?last:'home');
             
             // Setup Desktop Actions
             if(window.innerWidth > 768) {
               const da = document.getElementById('desktop-actions');
               if(da) da.style.display='flex';
             }
          }catch(e){console.error(e);this.toast('Failed to load data (Network)','error');}
        },
        
        can(perm){
           if (!currentUser.permissions || !Array.isArray(currentUser.permissions)) return false;
           return currentUser.role==='admin'||currentUser.permissions.includes(perm);
        },
        
        nav(v){
          if(v==='users'&&currentUser.role!=='admin')return;
          sessionStorage.setItem('gym_view',v);
          
          // Render Desktop Nav
          const dNav=document.getElementById('desktop-nav');
          const mNav=document.getElementById('mobile-nav');
          const pages=['home','members','attendance','history','payments','settings'];
          if(currentUser.role==='admin') pages.push('users');
          
          let dHtml='', mHtml='';
          const labels={home:'Home',members:'Members',attendance:'Activity',history:'Logs',payments:'Payments',settings:'Settings',users:'Users'};
          const icons={home:'home',members:'users',attendance:'clock',history:'history',payments:'creditCard',settings:'settings',users:'users'};

          pages.filter(p=>this.can(p)).forEach(p=>{
             const isActive = p===v ? 'active' : '';
             const icon = getIcon(icons[p]);
             dHtml+=\`<div class="nav-item \${isActive}" onclick="app.nav('\${p}')">\${icon} \${labels[p]}</div>\`;
             mHtml+=\`<div class="b-nav-item \${isActive}" onclick="app.nav('\${p}')">\${icon} <span>\${labels[p]}</span></div>\`;
          });
          
          if(dNav) dNav.innerHTML=dHtml;
          if(mNav) mNav.innerHTML=mHtml;

          // Hide all views, show current
          document.querySelectorAll('[id^="view-"]').forEach(el=>el.classList.add('hidden'));
          const target = document.getElementById('view-'+v);
          if (target) target.classList.remove('hidden');
          
          // Update Headers
          const titles={home:'Dashboard',members:'Member Database',attendance:'Daily Attendance',history:'System Logs',payments:'Payments & Dues',settings:'Configuration',users:'User Management'};
          const pgTitle = document.getElementById('page-title');
          if(pgTitle) pgTitle.innerText=titles[v] || 'Dashboard';
          const pgSub = document.getElementById('page-subtitle');
          if(pgSub) pgSub.innerText=v==='home'?'Overview & Stats':(labels[v]||'');
          
          if(v==='home') this.renderCharts();
        },
        
        getPlanPrice(planName){
            if (!this.data || !this.data.settings) return 0;
            const p=(this.data.settings.membershipPlans||[]).find(x=>x.name===planName);
            return p?Number(p.price):0;
        },
        getPlanAdmFee(planName){
            if (!this.data || !this.data.settings) return 0;
            const p=(this.data.settings.membershipPlans||[]).find(x=>x.name===planName);
            return p?Number(p.admissionFee||0):0;
        },

        render(){
          if (!this.data) return;
          const cur=this.data.settings.currency||'';
          
          // Stats
          if(document.getElementById('stat-active') && this.data.stats){
             document.getElementById('stat-active').innerText=this.data.stats.active;
             document.getElementById('stat-today').innerText=this.data.stats.today;
             document.getElementById('stat-rev').innerText=cur+' '+this.data.stats.revenue;
             document.getElementById('stat-due').innerText=this.data.stats.dueMembers;
             document.getElementById('total-outstanding-amount').innerText=cur+' '+this.data.stats.totalOutstanding;
          }
          
          // Render Main Tables
          this.renderMembersTable();
          this.renderPaymentsTable();
          
          // Attendance (Desktop & Mobile)
          const attList = this.data.attendanceToday || [];
          const attRows=attList.map(a=>{
             const time=formatTime(a.check_in_time);
             const badge=a.status==='success'?'<span class="badge bg-green"><span class="badge-dot"></span>IN</span>':'<span class="badge bg-red"><span class="badge-dot"></span>EXP</span>';
             return {
               row: \`<tr><td>\${time}</td><td>\${escapeHtml(a.name)}</td><td>\${badge}</td></tr>\`,
               card: \`<div class="m-card"><div class="m-info"><div class="m-title">\${escapeHtml(a.name)}</div><div class="m-sub">\${time}</div></div>\${badge}</div>\`
             };
          });
          const tblAtt = document.getElementById('tbl-attendance-today');
          if(tblAtt) tblAtt.innerHTML=attRows.map(x=>x.row).join('')||'<tr><td colspan="3" class="text-center text-muted">No check-ins today</td></tr>';
          const listAtt = document.getElementById('list-attendance-today');
          if(listAtt) listAtt.innerHTML=attRows.map(x=>x.card).join('')||'<div class="text-center text-muted p-4">No check-ins today</div>';
          
          const listRecent = document.getElementById('list-recent-home');
          if(listRecent) listRecent.innerHTML=attRows.slice(0,5).map(x=>x.card).join('')||'<div class="text-center text-muted">Quiet day so far...</div>';

          // History Log
          this.renderHistoryTable();
        },
        
        renderMembersTable(){
           const searchEl = document.getElementById('search');
           const filterEl = document.getElementById('member-filter');
           if (!searchEl || !filterEl) return;

           const q=searchEl.value.toLowerCase();
           const filter=filterEl.value;
           
           let list=(this.data.members||[]).filter(m=>{
              const matchQ=m.name.toLowerCase().includes(q)||m.phone.includes(q)||String(m.id).startsWith(q);
              if(!matchQ)return false;
              if(filter==='active') return (!m.dueMonths||m.dueMonths===0) && m.status!=='inactive';
              if(filter==='due') return m.dueMonths>0;
              if(filter==='inactive') return m.status==='inactive';
              return true;
           });
           
           const rows=list.map(m=>{
              let badge='<span class="badge bg-green"><span class="badge-dot"></span>Active</span>';
              if(m.dueMonths>0) {
                 const dueTxt=m.dueMonthLabels && m.dueMonthLabels.length ? m.dueMonthLabels[0] : (m.dueMonths+' Mo Due');
                 badge=\`<span class="badge bg-amber"><span class="badge-dot"></span>\${dueTxt}</span>\`;
              }
              if(m.status==='inactive') badge='<span class="badge bg-red"><span class="badge-dot"></span>Inactive</span>';
              
              const date=formatDate(m.expiry_date);
              
              const actions=\`<div style="display:flex;gap:4px;justify-content:flex-end;">
                  <button class="btn btn-outline btn-sm" onclick="app.showHistory(\${m.id})">Log</button>
                  <button class="btn btn-primary btn-sm" onclick="app.modals.pay.open(\${m.id})">Pay</button>
                  <button class="btn btn-danger btn-sm" onclick="app.del(\${m.id})">X</button>
              </div>\`;

              return {
                 row: \`<tr><td>#\${m.id}</td><td><div style="font-weight:600;">\${escapeHtml(m.name)}</div><div class="text-xs text-muted">\${escapeHtml(m.phone)}</div></td><td>\${escapeHtml(m.plan)}</td><td>\${date}</td><td>\${badge}</td><td>\${actions}</td></tr>\`,
                 card: \`<div class="m-card">
                    <div class="m-info" onclick="app.modals.pay.open(\${m.id})">
                       <div class="m-title">\${escapeHtml(m.name)} <span class="text-muted text-xs">#\${m.id}</span></div>
                       <div class="m-sub">\${badge} <span style="margin:0 4px;">•</span> \${date}</div>
                    </div>
                    <div class="m-actions">
                       <button class="btn btn-outline btn-sm" onclick="app.showHistory(\${m.id})">Log</button>
                    </div>
                 </div>\`
              };
           });
           
           const tbl = document.getElementById('tbl-members');
           if(tbl) tbl.innerHTML=rows.map(x=>x.row).join('')||'<tr><td colspan="6" class="text-center text-muted p-4">No members found</td></tr>';
           const lst = document.getElementById('list-members');
           if(lst) lst.innerHTML=rows.map(x=>x.card).join('')||'<div class="text-center text-muted p-4">No members found</div>';
        },

        renderPaymentsTable(){
           const filterEl = document.getElementById('pay-filter');
           if(!filterEl) return;
           const filter=filterEl.value;
           const cur=this.data.settings.currency||'';
           let list=(this.data.members||[]).slice();
           if(filter==='due') list=list.filter(m=>m.dueMonths>0);
           list.sort((a,b)=>(b.dueMonths||0)-(a.dueMonths||0));
           
           const rows=list.map(m=>{
              const price=this.getPlanPrice(m.plan);
              const dueAmt=(m.dueMonths||0)*price - (m.balance||0);
              const displayAmt = dueAmt > 0 ? dueAmt : 0;
              
              let status='<span class="badge bg-green">OK</span>';
              if(m.dueMonths>0) status=\`<span class="badge bg-amber">\${m.dueMonths} Mo Due</span>\`;
              if(m.status==='inactive') status='<span class="badge bg-red">Inactive</span>';
              
              const btn=\`<button class="btn btn-primary btn-sm" onclick="app.modals.pay.open(\${m.id})">Collect</button>\`;
              
              return {
                 row: \`<tr><td>#\${m.id}</td><td>\${escapeHtml(m.name)}</td><td>\${status}</td><td>\${m.dueMonths>0?m.dueMonths+' Mo':'-'}</td><td style="font-weight:700;">\${cur} \${displayAmt}</td><td style="text-align:right">\${btn}</td></tr>\`,
                 card: \`<div class="m-card">
                    <div class="m-info">
                       <div class="m-title">\${escapeHtml(m.name)}</div>
                       <div class="m-sub">\${status} • \${cur} \${displayAmt}</div>
                    </div>
                    \${btn}
                 </div>\`
              };
           });
           const tbl = document.getElementById('tbl-payment-list');
           if(tbl) tbl.innerHTML=rows.map(x=>x.row).join('')||'<tr><td colspan="6" class="text-center text-muted p-4">All paid up!</td></tr>';
           const lst = document.getElementById('list-payment-list');
           if(lst) lst.innerHTML=rows.map(x=>x.card).join('')||'<div class="text-center text-muted p-4">All paid up!</div>';
        },
        
        renderHistoryTable(data=null){
           const list=data||this.data.attendanceHistory||[];
           const rows=list.map(a=>{
             return {
               row: \`<tr><td>\${formatDate(a.check_in_time)}</td><td>\${formatTime(a.check_in_time)}</td><td>\${escapeHtml(a.name)}</td></tr>\`,
               card: \`<div class="m-card" style="padding:10px;"><div class="m-info"><div class="m-title">\${escapeHtml(a.name)}</div><div class="m-sub">\${formatDate(a.check_in_time)} • \${formatTime(a.check_in_time)}</div></div></div>\`
             };
           });
           const tbl=document.getElementById('tbl-attendance-history');
           if(tbl) tbl.innerHTML=rows.map(x=>x.row).join('');
           const lst=document.getElementById('list-attendance-history');
           if(lst) lst.innerHTML=rows.map(x=>x.card).join('');
        },
        
        async applyHistoryFilter(){
           const date=document.getElementById('history-date').value;
           const res=await fetch('/api/history/list',{method:'POST',body:JSON.stringify({date})});
           const d=await res.json();
           this.renderHistoryTable(d.history);
        },
        
        async showHistory(id){
           const res=await fetch('/api/members/history',{method:'POST',body:JSON.stringify({memberId:id})});
           const d=await res.json();
           const visits=d.history.length;
           const html=\`<div style="text-align:center;margin-bottom:20px;">
              <div style="font-size:32px;font-weight:800;color:var(--primary);">\${visits}</div>
              <div class="text-muted text-xs">Total Visits</div>
           </div>
           <div class="mobile-list">\` + (d.history.map(h=>\`<div class="m-card" style="padding:8px 12px;"><div class="m-sub">\${formatDate(h.check_in_time)}</div><div style="font-weight:600;">\${formatTime(h.check_in_time)}</div></div>\`).join('')) + '</div>';
           document.getElementById('calendar-container').innerHTML=html;
           document.getElementById('modal-member-history').style.display='flex';
        },

        // --- ACTIONS ---
        async checkIn(){
           const id=document.getElementById('checkin-id').value;
           if(!id) return;
           const btn=document.getElementById('btn-sub-chk');
           btn.disabled=true; btn.innerText="Checking...";
           try {
              const res=await fetch('/api/checkin',{method:'POST',body:JSON.stringify({memberId:id})});
              const d=await res.json();
              if(d.success){
                 document.getElementById('checkin-res').innerHTML=\`<span style="color:var(--success)">✅ Welcome, \${d.name}!</span>\`;
                 this.toast('Welcome '+d.name);
                 setTimeout(()=>window.location.reload(),800);
              } else {
                 document.getElementById('checkin-res').innerHTML=\`<span style="color:var(--danger)">⛔ \${d.error}</span>\`;
                 btn.disabled=false; btn.innerText="Check In";
              }
           } catch(e) { btn.disabled=false; }
        },
        
        async pay(e){
           e.preventDefault();
           const btn=document.getElementById('pay-submit-btn');
           btn.disabled=true; btn.innerText="Processing...";
           const endpoint=this.isRenewalMode?'/api/members/renew':'/api/payment';
           try {
              await fetch(endpoint,{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
              this.toast('Payment Recorded');
              setTimeout(()=>window.location.reload(),500);
           } catch(e){ btn.disabled=false; }
        },
        
        async addMember(e){
           e.preventDefault();
           const btn=e.target.querySelector('button[type="submit"]');
           btn.disabled=true;
           try{
             await fetch('/api/members/add',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
             this.toast('Member Added');
             window.location.reload();
           } catch(e){ btn.disabled=false; }
        },
        
        async del(id){
           if(confirm('Delete member permanently?')) {
              await fetch('/api/members/delete',{method:'POST',body:JSON.stringify({id})});
              window.location.reload();
           }
        },
        
        // --- SEARCH INPUTS ---
        onCheckinInput(e){
           if(e.key==='Enter'){ this.checkIn(); return; }
           this.doSearch(e.target.value, (res)=>{
              const div=document.getElementById('checkin-suggestions');
              div.style.display=res.length?'block':'none';
              div.innerHTML=res.map(m=>\`<div style="padding:10px;border-bottom:1px solid #eee;cursor:pointer;" onclick="document.getElementById('checkin-id').value='\${m.id}';document.getElementById('checkin-suggestions').style.display='none';"><b>#\${m.id} \${escapeHtml(m.name)}</b></div>\`).join('');
           });
        },
        
        onQuickPayInput(e){
           this.doSearch(e.target.value, (res)=>{
              const div=document.getElementById('qp-results');
              div.style.display=res.length?'block':'none';
              div.innerHTML=res.map(m=>\`<div style="padding:12px;border-bottom:1px solid #eee;cursor:pointer;" onclick="app.modals.quickPay.close();app.modals.pay.open(\${m.id})"><b>#\${m.id} \${escapeHtml(m.name)}</b> <span class="text-xs text-muted">(\${m.status})</span></div>\`).join('');
           });
        },
        
        onPaymentSearchInput(e){
           this.doSearch(e.target.value, (res)=>{
              const div=document.getElementById('pay-search-results');
              div.style.display=res.length?'block':'none';
              div.innerHTML=res.map(m=>\`<div style="padding:12px;border-bottom:1px solid #eee;cursor:pointer;" onclick="app.modals.pay.open(\${m.id})"><b>#\${m.id} \${escapeHtml(m.name)}</b> <span class="badge bg-amber">\${m.dueMonths||0} Mo Due</span></div>\`).join('');
           });
        },
        
        doSearch(q, cb){
           if(this.searchTimeout) clearTimeout(this.searchTimeout);
           this.searchTimeout=setTimeout(async()=>{
              if(!q.trim()){ cb([]); return; }
              const res=await fetch('/api/members/search',{method:'POST',body:JSON.stringify({query:q})});
              const d=await res.json();
              cb(d.results);
           }, 300);
        },

        // --- HELPERS & SETTINGS ---
        switchAddTab(t){
           const isMig=t==='mig';
           document.getElementById('tab-new').style.background=isMig?'transparent':'white';
           document.getElementById('tab-mig').style.background=isMig?'white':'transparent';
           document.getElementById('tab-mig').style.color=isMig?'var(--text-main)':'var(--text-sec)';
           document.getElementById('sec-new-fees').style.display=isMig?'none':'block';
           document.getElementById('sec-mig-fees').style.display=isMig?'block':'none';
           document.getElementById('add-mig-mode').value=isMig;
           document.getElementById('new-init-pay').required=!isMig;
           this.updateAddMemberFees();
        },
        updateAddMemberFees(){
           const p=document.getElementById('plan-select').value;
           document.getElementById('new-adm-fee').value=this.getPlanAdmFee(p);
        },
        
        applySettingsUI(){
           if(!this.data || !this.data.settings) return;
           const s=this.data.settings;
           const form=document.getElementById('settings-form');
           if(!form) return;
           // Fill form fields
           const curEl = form.querySelector('[name="currency"]'); if(curEl) curEl.value=s.currency;
           const langEl = form.querySelector('[name="lang"]'); if(langEl) langEl.value=s.lang;
           const attEl = form.querySelector('[name="attendanceThreshold"]'); if(attEl) attEl.value=s.attendanceThreshold;
           const inactEl = form.querySelector('[name="inactiveAfterMonths"]'); if(inactEl) inactEl.value=s.inactiveAfterMonths;
           const renEl = form.querySelector('[name="renewalFee"]'); if(renEl) renEl.value=s.renewalFee;
           // Render plans
           const container=document.getElementById('plans-container');
           if(container) container.innerHTML=s.membershipPlans.map((p,i)=>\`<div class="flex plan-row" id="p-\${i}"><input placeholder="Name" value="\${escapeHtml(p.name)}" class="p-name"><input type="number" placeholder="Price" value="\${p.price}" class="p-price"><input type="number" placeholder="Adm.Fee" value="\${p.admissionFee||0}" class="p-adm"><button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">X</button></div>\`).join('');
           
           // Fill plan select dropdowns elsewhere
           const opts=s.membershipPlans.map(p=>\`<option value="\${escapeHtml(p.name)}">\${escapeHtml(p.name)}</option>\`).join('');
           const sel=document.getElementById('plan-select');
           if(sel) sel.innerHTML=opts;
        },
        
        addPlanRow(){
           const div=document.createElement('div');
           div.className='flex plan-row';
           div.innerHTML=\`<input placeholder="Name" class="p-name"><input type="number" placeholder="Price" class="p-price"><input type="number" placeholder="Adm.Fee" class="p-adm" value="0"><button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">X</button>\`;
           document.getElementById('plans-container').appendChild(div);
        },
        
        async saveSettings(e){
           e.preventDefault();
           const plans=[];
           document.querySelectorAll('.plan-row').forEach(r=>{
              const n=r.querySelector('.p-name').value;
              const p=r.querySelector('.p-price').value;
              const a=r.querySelector('.p-adm').value;
              if(n&&p) plans.push({name:n, price:Number(p), admissionFee:Number(a)});
           });
           const fd=new FormData(e.target);
           const data=Object.fromEntries(fd);
           data.membershipPlans=plans;
           await fetch('/api/settings',{method:'POST',body:JSON.stringify(data)});
           this.toast('Settings Saved');
           setTimeout(()=>window.location.reload(),800);
        },
        
        async resetDB(){ if(confirm('Factory Reset?')) { await fetch('/api/nuke'); window.location.reload(); } },

        // --- USER MANAGEMENT ---
        openAddUser(){ document.getElementById('modal-user').style.display='flex'; document.getElementById('user-form').reset(); },
        async loadUsers(){
           const res=await fetch('/api/users/list');
           const d=await res.json();
           const rows=d.users.map(u=>\`<tr><td>\${escapeHtml(u.name)}</td><td><span class="badge bg-blue">\${u.role}</span></td><td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="app.deleteUser(\${u.id})">X</button></td></tr>\`).join('');
           document.getElementById('tbl-users').innerHTML=rows;
           document.getElementById('list-users').innerHTML=d.users.map(u=>\`<div class="m-card"><div class="m-info"><div class="m-title">\${escapeHtml(u.name)}</div><div class="m-sub">\${u.role}</div></div><button class="btn btn-danger btn-sm" onclick="app.deleteUser(\${u.id})">X</button></div>\`).join('');
        },
        async saveUser(e){
           e.preventDefault();
           const fd=new FormData(e.target);
           const data=Object.fromEntries(fd);
           data.permissions=Array.from(document.querySelectorAll('input[name="permissions"]:checked')).map(c=>c.value);
           await fetch(data.id?'/api/users/update':'/api/users/add',{method:'POST',body:JSON.stringify(data)});
           document.getElementById('modal-user').style.display='none';
           this.loadUsers();
        },
        async deleteUser(id){ if(confirm('Remove user?')) { await fetch('/api/users/delete',{method:'POST',body:JSON.stringify({id})}); this.loadUsers(); } },
        togglePerms(role){ document.getElementById('u-perms-container').style.display=role==='admin'?'none':'block'; },
        
        renderCharts(){
          if(typeof Chart==='undefined' || !document.getElementById('chart-dues')) return;
          const ctx=document.getElementById('chart-dues').getContext('2d');
          if(window.myChart) window.myChart.destroy();
          const mem=(this.data && this.data.members)||[];
          window.myChart=new Chart(ctx,{
            type:'bar',
            data:{
               labels:['Paid', '1 Mo', '2+ Mo', 'Inactive'],
               datasets:[{
                  data:[
                     mem.filter(m=>(!m.dueMonths||m.dueMonths<=0)&&m.status!=='inactive').length,
                     mem.filter(m=>m.dueMonths===1).length,
                     mem.filter(m=>m.dueMonths>=2&&m.status!=='inactive').length,
                     mem.filter(m=>m.status==='inactive').length
                  ],
                  backgroundColor:['#10b981', '#f59e0b', '#ef4444', '#cbd5e1'],
                  borderRadius:6
               }]
            },
            options:{
               responsive:true, maintainAspectRatio:false,
               plugins:{legend:{display:false}},
               scales:{y:{beginAtZero:true, grid:{display:false}}, x:{grid:{display:false}}}
            }
          });
        },
        
        // Modals
        modals:{
           checkin:{open:()=>{document.getElementById('modal-checkin').style.display='flex';document.getElementById('checkin-id').focus();},close:()=>{document.getElementById('modal-checkin').style.display='none';document.getElementById('checkin-res').innerHTML='';}},
           quickPay:{open:()=>{document.getElementById('modal-quick-pay').style.display='flex';document.getElementById('qp-search').focus();},close:()=>document.getElementById('modal-quick-pay').style.display='none'},
           add:{open:()=>{app.switchAddTab('new');document.getElementById('modal-add').style.display='flex';},close:()=>document.getElementById('modal-add').style.display='none'},
           pay:{open:(id)=>{
              app.payingMemberId=id;
              const m=app.data.members.find(x=>x.id===id);
              document.getElementById('pay-id').value=id;
              document.getElementById('pay-name').innerText=m?m.name:'Member';
              document.getElementById('pay-amount').value='';
              document.getElementById('pay-status-warning').style.display='none';
              document.getElementById('pay-renewal-section').style.display='none';
              document.getElementById('pay-standard-label').innerText='Amount';
              const btn=document.getElementById('pay-submit-btn');
              btn.innerText='Confirm';
              app.isRenewalMode=false;
              if(m && m.status==='inactive'){
                 app.isRenewalMode=true;
                 document.getElementById('pay-status-warning').style.display='block';
                 document.getElementById('pay-renewal-section').style.display='block';
                 document.getElementById('pay-standard-label').innerText='Plus Plan Payment (Optional)';
                 document.getElementById('pay-ren-fee').value=app.data.settings.renewalFee||0;
                 btn.innerText='Re-admit';
              }
              const planPrice=app.getPlanPrice(m?m.plan:'');
              document.getElementById('pay-plan-price').innerText=planPrice;
              document.getElementById('pay-wallet-bal').innerText=m?m.balance:0;
              document.getElementById('modal-pay').style.display='flex';
           }, close:()=>{document.getElementById('modal-pay').style.display='none';}},
           user:{close:()=>document.getElementById('modal-user').style.display='none'}
        },
        
        openPaymentHistory(){
           document.getElementById('modal-payment-history').style.display='flex';
           this.renderTransactionHistory();
        },
        async renderTransactionHistory(){
           const dateEl=document.getElementById('trans-date');
           const date = dateEl ? dateEl.value : '';
           const tbl = document.getElementById('tbl-transaction-history');
           if(tbl) tbl.innerHTML='<tr><td colspan="3" class="text-center text-muted">Loading...</td></tr>';
           const res=await fetch('/api/payments/history',{method:'POST',body:JSON.stringify({date})});
           const d=await res.json();
           const cur=(this.data && this.data.settings && this.data.settings.currency)||'';
           const rows=(d.transactions||[]).map(t=>\`<tr><td>\${formatTime(t.date)}</td><td>\${escapeHtml(t.name||'-')}</td><td style="font-weight:700;color:var(--success);">\${cur} \${t.amount}</td></tr>\`).join('')||'<tr><td colspan="3" class="text-center text-muted">No history found</td></tr>';
           if(tbl) tbl.innerHTML=rows;
        }
      };

      // Close modals on Escape
      document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-backdrop').forEach(el=>el.style.display='none')});

      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
