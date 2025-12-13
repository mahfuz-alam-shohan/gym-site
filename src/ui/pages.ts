import { escapeHtml } from "../utils";
import { baseHead, getIcon } from "./head";

// --- LOGIN & SETUP PAGES ---

export function renderLogin(gymName: string) {
  const safeName = escapeHtml(gymName);
  const html = `${baseHead("Login")}
  <body>
    <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; padding:20px;">
      <div class="card" style="width:100%; max-width:380px; text-align:center; padding:40px 30px; border-top: 4px solid var(--primary);">
        <div style="font-size:40px; margin-bottom:16px;">🔥</div>
        <h3 style="margin-bottom:8px; font-size:24px;">${safeName}</h3>
        <p class="text-muted" style="margin-bottom:32px;">Staff Access Portal</p>
        <form id="form" style="text-align:left;">
          <label>Email Access</label><input name="email" required placeholder="admin@gym.com">
          <label>Password</label><input name="password" type="password" required>
          <button type="submit" class="btn btn-primary w-full" style="padding:14px; margin-top:10px;">ENTER SYSTEM</button>
        </form>
        <div id="error" style="color:var(--danger); margin-top:20px; font-weight:700; font-size:13px;"></div>
      </div>
    </div>
    <script>
      document.getElementById('form').onsubmit=async(e)=>{e.preventDefault();const btn=e.target.querySelector('button');btn.innerText="AUTHENTICATING...";try{const res=await fetch('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});if(res.ok){window.location.href='/dashboard';}else{const d=await res.json();throw new Error(d.error);}}catch(err){document.getElementById('error').innerText=err.message;btn.innerText="ENTER SYSTEM";}}
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

export function renderSetup() { return renderLogin("Setup Needed"); }

// --- DASHBOARD ---

export function renderDashboard(user: any, gymName: string) {
  const safeUserName = escapeHtml(user.name || "User");
  const safeGymName = escapeHtml(gymName || "Gym OS");

  const html = `${baseHead("Dashboard")}
  <body>
    <div id="toast-container"></div>
    <div class="fab" onclick="app.modals.checkin.open()">${getIcon('zap')}</div>

    <div class="app-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="brand-icon">⚡</div>
          <div>
             <div style="font-weight:700; font-family:'Oswald'; font-size:16px; color:white;">${safeGymName}</div>
             <div style="font-size:10px; color:var(--text-muted); letter-spacing:0.05em;">ADMIN PANEL</div>
          </div>
        </div>
        <div class="nav" id="desktop-nav"></div>
        <div style="padding:20px; margin-top:auto;">
           <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:12px;">
              <div style="color:white; font-weight:600; font-size:13px;">${safeUserName}</div>
              <a href="/api/logout" style="color:var(--danger); font-size:11px; text-decoration:none; display:flex; align-items:center; gap:6px; margin-top:8px; font-weight:600; text-transform:uppercase;">${getIcon('logout')} Sign Out</a>
           </div>
        </div>
      </aside>

      <!-- MOBILE NAV -->
      <nav class="bottom-nav" id="mobile-nav"></nav>

      <!-- MAIN CONTENT -->
      <main class="main-content">
        <header class="flex-between" style="margin-bottom:30px;">
           <div>
             <h2 id="page-title" style="font-size:24px; color:white;">DASHBOARD</h2>
             <div class="text-muted text-xs" id="page-subtitle" style="text-transform:uppercase; letter-spacing:0.1em; margin-top:4px;">OVERVIEW</div>
           </div>
           <div class="hidden" style="display:none;" id="desktop-actions">
              <button class="btn btn-primary" onclick="app.modals.checkin.open()">${getIcon('zap')} CHECK-IN</button>
           </div>
        </header>

        <!-- VIEW: HOME -->
        <div id="view-home" class="hidden">
           <div class="stats-grid">
             <div class="stat-card">
               <div class="stat-val" id="stat-today" style="color:var(--accent);">--</div>
               <div class="stat-label">Walk-ins Today</div>
             </div>
             <div class="stat-card">
               <div class="stat-val" id="stat-active" style="color:var(--success);">--</div>
               <div class="stat-label">Active Members</div>
             </div>
             <div class="stat-card">
               <div class="stat-val" id="stat-due" style="color:var(--danger);">--</div>
               <div class="stat-label">Payments Due</div>
             </div>
             <div class="stat-card">
               <div class="stat-val" id="stat-rev" style="color:white;">--</div>
               <div class="stat-label">Outstanding</div>
             </div>
           </div>

           <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
              <!-- Leaderboard -->
              <div class="card">
                 <div class="flex-between" style="margin-bottom:16px;">
                    <div class="flex">${getIcon('trophy')} <h4>Top Grinders</h4></div>
                    <span class="badge bg-blue">This Month</span>
                 </div>
                 <div id="leaderboard-list" class="mobile-list"></div>
              </div>

              <!-- Recent Activity -->
              <div class="card">
                 <div class="flex-between" style="margin-bottom:16px;">
                    <div class="flex">${getIcon('clock')} <h4>Recent Activity</h4></div>
                    <button class="btn btn-outline btn-sm" onclick="app.nav('attendance')">View All</button>
                 </div>
                 <div id="recent-list" class="mobile-list"></div>
              </div>
           </div>
        </div>

        <!-- VIEW: MEMBERS -->
        <div id="view-members" class="hidden">
           <div class="card" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center; background:rgba(30, 41, 59, 0.7);">
              <div style="flex:1; position:relative;">
                 <input id="search" placeholder="FIND MEMBER (ID, NAME, PHONE)..." style="margin:0; padding-left:40px;" onkeyup="app.renderMembersTable()">
                 <div style="position:absolute; left:12px; top:12px; opacity:0.5;">${getIcon('search')}</div>
              </div>
              <button class="btn btn-primary" onclick="app.modals.add.open()">${getIcon('plus')} NEW MEMBER</button>
           </div>
           
           <div class="card" style="padding:0; overflow:hidden;">
              <div class="desktop-table">
                <table>
                  <thead><tr><th>ID</th><th>Details</th><th>Plan</th><th>Paid Until</th><th>Month Status</th><th style="text-align:right">Profile</th></tr></thead>
                  <tbody id="tbl-members"></tbody>
                </table>
              </div>
              <div class="mobile-list" id="list-members" style="padding:16px;"></div>
           </div>
        </div>

        <!-- VIEW: ATTENDANCE -->
        <div id="view-attendance" class="hidden">
           <div class="card">
             <h4>Today's Floor</h4>
             <div class="desktop-table" style="margin-top:16px;">
                <table><thead><tr><th>Time</th><th>Member</th><th>Status</th></tr></thead><tbody id="tbl-attendance-today"></tbody></table>
             </div>
             <div class="mobile-list" id="list-attendance-today" style="margin-top:16px;"></div>
           </div>
        </div>

        <!-- VIEW: HISTORY (RESTORED) -->
        <div id="view-history" class="hidden">
           <div class="card">
             <div class="flex-between" style="margin-bottom:20px;">
               <h4>System Logs</h4>
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
               <div class="card" style="border-left: 4px solid var(--danger); flex:1; margin-bottom:0;">
                   <div style="font-size:12px; text-transform:uppercase; color:var(--text-sec); letter-spacing:0.05em;">Total Pending</div>
                   <div id="pay-total-out" style="font-size:32px; font-weight:700; color:white; font-family:'Oswald'; margin-top:4px;">0</div>
               </div>
               <div style="display:flex; gap:10px;">
                   <button class="btn btn-outline" onclick="app.openPaymentHistory()">${getIcon('history')} History</button>
                   <button class="btn btn-outline" onclick="window.open('/dues/print','_blank')">${getIcon('print')} Print</button>
               </div>
           </div>
           
           <div class="card">
              <div class="flex-between" style="margin-bottom:20px;">
                 <h4>Dues List</h4>
                 <select id="pay-filter" onchange="app.renderPaymentsTable()" style="width:auto; margin:0;">
                    <option value="due">Show Due Only</option>
                    <option value="all">Show All</option>
                 </select>
              </div>
              <div class="desktop-table">
                 <table><thead><tr><th>Member</th><th>Current Month</th><th>Paid Until</th><th>Owed</th><th style="text-align:right">Action</th></tr></thead><tbody id="tbl-payment-list"></tbody></table>
              </div>
              <div class="mobile-list" id="list-payment-list"></div>
           </div>
        </div>

        <!-- VIEW: SETTINGS (RESTORED) -->
        <div id="view-settings" class="hidden">
           <div class="card">
              <h4 style="margin-bottom:24px;">Configuration</h4>
              <form id="settings-form" onsubmit="app.saveSettings(event)">
                <div class="flex" style="flex-wrap:wrap; margin-bottom:20px;">
                   <div class="w-full"><label>Currency Symbol</label><input name="currency" type="text" placeholder="BDT"></div>
                   <div class="w-full"><label>Language</label><select name="lang"><option value="en">English</option></select></div>
                </div>
                <div class="flex" style="flex-wrap:wrap;">
                   <div class="w-full"><label>Min. Attendance (Days/Month)</label><input name="attendanceThreshold" type="number" min="1" max="31" required></div>
                   <div class="w-full"><label>Auto-Inactive After (Months Due)</label><input name="inactiveAfterMonths" type="number" min="1" max="36" required></div>
                </div>
                <div class="w-full"><label>Renewal/Re-admission Fee</label><input name="renewalFee" type="number" min="0" required></div>
                
                <div style="background:#0f172a; padding:20px; border-radius:12px; margin:24px 0;">
                    <label style="color:var(--primary); margin-bottom:12px;">Membership Plans</label>
                    <div id="plans-container" style="margin-bottom:12px; display:flex; flex-direction:column; gap:10px;"></div>
                    <button type="button" class="btn btn-outline w-full btn-sm" onclick="app.addPlanRow()">+ Add Plan Variant</button>
                </div>
                
                <div style="border-top:1px solid var(--border); padding-top:20px; display:flex; justify-content:space-between;">
                   <button onclick="app.resetDB()" class="btn btn-danger" type="button">Factory Reset</button>
                   <button type="submit" class="btn btn-primary">Save Changes</button>
                </div>
              </form>
           </div>
        </div>

        <!-- VIEW: USERS (RESTORED) -->
        <div id="view-users" class="hidden">
           <div class="card">
               <div class="flex-between" style="margin-bottom:20px;">
                 <h4>Admin Access</h4>
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

    <!-- 1. CHECK IN -->
    <div id="modal-checkin" class="modal-backdrop">
      <div class="modal-content text-center">
        <h3 style="margin-bottom:24px; color:white;">DAILY CHECK-IN</h3>
        <input id="checkin-id" type="number" placeholder="ENTER ID" style="font-size:32px; text-align:center; font-weight:700; padding:24px; font-family:'Oswald'; letter-spacing:2px;" autofocus onkeyup="app.onCheckinInput(event)">
        <div id="checkin-suggestions" style="text-align:left; background:#0f172a; border-radius:8px; margin-bottom:16px; overflow:hidden;"></div>
        <button class="btn btn-primary w-full" onclick="app.checkIn()" id="btn-sub-chk" style="padding:16px; font-size:16px;">CONFIRM ENTRY</button>
        <div id="checkin-res" style="margin-top:24px; min-height:40px;"></div>
        <button class="btn btn-outline w-full mt-4" onclick="app.modals.checkin.close()">CANCEL</button>
      </div>
    </div>

    <!-- 2. MEMBER PROFILE (THE HUB) -->
    <div id="modal-profile" class="modal-backdrop">
       <div class="modal-content" style="max-width:600px;">
          <div class="flex-between" style="margin-bottom:20px;">
             <h3 id="prof-name" style="font-size:24px; color:white;">Member Name</h3>
             <button class="btn btn-danger btn-sm" onclick="app.modals.profile.close()">CLOSE</button>
          </div>
          
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:24px;">
             <div style="background:#0f172a; padding:16px; border-radius:12px;">
                <div class="text-xs text-muted">PLAN</div>
                <div id="prof-plan" style="font-size:16px; font-weight:600; color:white;">-</div>
             </div>
             <div style="background:#0f172a; padding:16px; border-radius:12px;">
                <div class="text-xs text-muted">STATUS</div>
                <div id="prof-status">-</div>
             </div>
          </div>

          <!-- Financials -->
          <div style="margin-bottom:24px; padding:16px; background:rgba(99,102,241,0.1); border-radius:12px; border:1px solid rgba(99,102,241,0.2);">
             <div class="flex-between">
                <div style="font-size:12px; font-weight:700; color:var(--primary); letter-spacing:0.05em;">MEMBERSHIP VALIDITY</div>
                <div id="prof-valid-badge"></div>
             </div>
             <div class="progress-bar-bg"><div id="prof-valid-bar" class="progress-bar-fill"></div></div>
             <div class="flex-between" style="margin-top:8px;">
                 <span class="text-xs text-muted">Paid Until: <span id="prof-expiry" style="color:white;">-</span></span>
                 <button class="btn btn-primary btn-sm" id="prof-btn-pay">PAY NOW</button>
             </div>
          </div>

          <!-- Physical Stats (NEW FEATURE) -->
          <h4 style="margin-bottom:12px; font-size:14px; color:var(--text-sec);">PHYSICAL STATS</h4>
          <form id="stats-form" onsubmit="app.updateStats(event)" style="background:#0f172a; padding:16px; border-radius:12px;">
             <input type="hidden" name="id" id="prof-id">
             <div class="flex" style="gap:10px;">
                <div class="w-full"><label>Weight (kg)</label><input name="weight" id="prof-weight" type="number" step="0.1"></div>
                <div class="w-full"><label>Height (cm)</label><input name="height" id="prof-height" type="number" step="0.1"></div>
             </div>
             <div class="flex" style="gap:10px;">
                 <div class="w-full"><label>Gender</label><select name="gender" id="prof-gender"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                 <div class="w-full"><label style="visibility:hidden">Save</label><button type="submit" class="btn btn-outline w-full">UPDATE STATS</button></div>
             </div>
          </form>
          
          <button class="btn btn-outline w-full mt-4" onclick="app.showHistory(document.getElementById('prof-id').value)">VIEW ENTRY LOGS</button>
          <button class="btn btn-danger w-full mt-2" onclick="app.delMember()" style="opacity:0.6;">DELETE MEMBER DATABASE RECORD</button>
       </div>
    </div>
    
    <!-- 3. MEMBER HISTORY LOG -->
    <div id="modal-member-history" class="modal-backdrop">
       <div class="modal-content" style="max-width:400px; text-align:center;">
          <h3 style="margin-bottom:16px;">Entry Logs</h3>
          <div id="calendar-container" style="max-height:400px; overflow-y:auto;"></div>
          <button class="btn btn-outline w-full mt-4" onclick="document.getElementById('modal-member-history').style.display='none'">Close</button>
       </div>
    </div>

    <!-- 4. ADD MEMBER -->
    <div id="modal-add" class="modal-backdrop">
       <div class="modal-content">
          <h3 style="margin-bottom:20px;">NEW REGISTRATION</h3>
          <form onsubmit="app.addMember(event)">
             <label>Full Name</label><input name="name" required>
             <label>Phone Number</label><input name="phone" required>
             <div class="flex">
                <div class="w-full"><label>Gender</label><select name="gender"><option value="male">Male</option><option value="female">Female</option></select></div>
                <div class="w-full"><label>Plan</label><select name="plan" id="add-plan"></select></div>
             </div>
             <label>Initial Payment</label><input name="initialPayment" type="number" required>
             <button type="submit" class="btn btn-primary w-full" style="margin-top:10px;">CREATE PROFILE</button>
             <button type="button" class="btn btn-outline w-full mt-4" onclick="app.modals.add.close()">CANCEL</button>
          </form>
       </div>
    </div>

    <!-- 5. PAYMENT CONFIRM -->
    <div id="modal-pay" class="modal-backdrop">
       <div class="modal-content">
          <h3 style="margin-bottom:8px;">RECEIVE PAYMENT</h3>
          <p id="pay-name" style="color:var(--primary); font-weight:700; margin-bottom:20px;"></p>
          <form onsubmit="app.pay(event)">
             <input type="hidden" name="memberId" id="pay-id">
             <label>Amount Recieved</label>
             <input name="amount" type="number" required style="font-size:24px; color:var(--success); font-weight:700;">
             <div class="text-xs text-muted" style="margin-bottom:20px;">Current Balance: <span id="pay-bal" style="color:white;">0</span></div>
             <button type="submit" class="btn btn-primary w-full">CONFIRM TRANSACTION</button>
             <button type="button" class="btn btn-outline w-full mt-4" onclick="app.modals.pay.close()">CANCEL</button>
          </form>
       </div>
    </div>

    <!-- 6. USER MODAL -->
    <div id="modal-user" class="modal-backdrop">
      <div class="modal-content">
        <h3>User Details</h3>
        <form id="user-form" onsubmit="app.saveUser(event)" style="margin-top:20px;">
          <input type="hidden" name="id" id="u-id">
          <label>Name</label><input name="name" id="u-name" required>
          <label>Email</label><input name="email" id="u-email" type="email" required>
          <label>Password</label><input name="password" id="u-password" type="password" placeholder="Leave empty to keep current">
          <label>Role</label>
          <select name="role" id="u-role">
             <option value="staff">Staff</option><option value="admin">Admin</option>
          </select>
          <button type="submit" class="btn btn-primary w-full mt-4">Save User</button>
          <button type="button" class="btn btn-outline w-full mt-2" onclick="app.modals.user.close()">Cancel</button>
        </form>
      </div>
    </div>
    
    <!-- 7. PAYMENT HISTORY -->
    <div id="modal-payment-history" class="modal-backdrop">
      <div class="modal-content" style="max-width:500px;">
         <div class="flex-between" style="margin-bottom:16px;">
            <h3>Transaction History</h3>
            <button class="btn btn-outline btn-sm" onclick="document.getElementById('modal-payment-history').style.display='none'">Close</button>
         </div>
         <div class="flex" style="margin-bottom:12px;">
            <input type="date" id="trans-date" style="margin:0;" onchange="app.renderTransactionHistory()">
         </div>
         <div class="desktop-table" style="max-height:300px; overflow-y:auto;">
            <table><thead><tr><th>Date</th><th>Member</th><th>Amount</th></tr></thead><tbody id="tbl-transaction-history"></tbody></table>
         </div>
      </div>
    </div>

    <script>
      const currentUser={name:"${user.name}", role:"${user.role}"};
      
      const app = {
         data: null,
         searchTimeout: null,
         
         init: async function() {
            try {
               const res = await fetch('/api/bootstrap');
               this.data = await res.json();
               this.render();
               this.applySettingsUI();
               if(currentUser.role === 'admin') this.loadUsers();
               
               const last = sessionStorage.getItem('gym_view') || 'home';
               this.nav(last);
               
               // Populate Add Plan Select
               const plans = this.data.settings.membershipPlans || [];
               document.getElementById('add-plan').innerHTML = plans.map(p => \`<option value="\${p.name}">\${p.name} (\${p.price})</option>\`).join('');
               
               if(window.innerWidth > 768) document.getElementById('desktop-actions').style.display = 'flex';
            } catch(e) { console.error(e); }
         },
         
         nav: function(page) {
            if(page === 'users' && currentUser.role !== 'admin') return;
            sessionStorage.setItem('gym_view', page);
            
            document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
            document.getElementById('view-'+page).classList.remove('hidden');
            
            const pages = ['home', 'members', 'attendance', 'payments', 'history', 'settings'];
            if(currentUser.role === 'admin') pages.push('users');
            
            const icons = {home:'home', members:'users', attendance:'clock', payments:'creditCard', history:'history', settings:'settings', users:'users'};
            const labels = {home:'Home', members:'Members', attendance:'Activity', payments:'Billing', history:'Logs', settings:'Config', users:'Users'};
            
            document.getElementById('desktop-nav').innerHTML = pages.map(p => \`
               <div class="nav-item \${p===page?'active':''}" onclick="app.nav('\${p}')">\${getIcon(icons[p])} \${labels[p]}</div>
            \`).join('');
            
            document.getElementById('mobile-nav').innerHTML = pages.map(p => \`
               <div class="b-nav-item \${p===page?'active':''}" onclick="app.nav('\${p}')">\${getIcon(icons[p])} <span>\${labels[p]}</span></div>
            \`).join('');
         },
         
         render: function() {
            if(!this.data) return;
            const cur = this.data.settings.currency || '';
            
            document.getElementById('stat-today').innerText = this.data.stats.today;
            document.getElementById('stat-active').innerText = this.data.stats.active;
            document.getElementById('stat-due').innerText = this.data.stats.dueMembers;
            document.getElementById('stat-rev').innerText = cur + ' ' + this.data.stats.totalOutstanding;
            document.getElementById('pay-total-out').innerText = cur + ' ' + this.data.stats.totalOutstanding;

            const tops = this.data.topVisitors || [];
            document.getElementById('leaderboard-list').innerHTML = tops.map((t, i) => \`
               <div class="m-card" style="padding:12px;">
                  <div style="font-weight:700; width:24px; color:var(--primary);">#\${i+1}</div>
                  <div style="flex:1; font-weight:600; color:white;">\${escapeHtml(t.name)}</div>
                  <div class="badge bg-amber">\${t.visits} Visits</div>
               </div>
            \`).join('') || '<div class="text-muted text-center p-4">No data yet</div>';

            const recent = (this.data.attendanceToday || []).slice(0, 5);
            document.getElementById('recent-list').innerHTML = recent.map(r => \`
               <div class="m-card" style="padding:12px;">
                  <div class="m-info"><div class="m-title">\${escapeHtml(r.name)}</div><div class="m-sub">\${formatTime(r.check_in_time)}</div></div>
                  <div style="color:var(--success);">Checked In</div>
               </div>
            \`).join('') || '<div class="text-muted text-center p-4">No check-ins today</div>';

            this.renderMembersTable();
            this.renderPaymentsTable();
            this.renderHistoryTable();
         },
         
         renderMembersTable: function() {
            const q = (document.getElementById('search').value || '').toLowerCase();
            const list = this.data.members.filter(m => m.name.toLowerCase().includes(q) || m.phone.includes(q) || String(m.id).includes(q));
            
            const rows = list.map(m => {
               const paidUntil = m.paidUntil ? formatDate(m.paidUntil) : '-';
               const statusBadge = m.isRunningMonthPaid 
                   ? '<span class="badge bg-green">Month Paid</span>' 
                   : '<span class="badge bg-red">Month Unpaid</span>';
               const streak = m.streak ? \`<span class="badge bg-amber" style="margin-left:6px;">\${getIcon('fire')} \${m.streak}</span>\` : '';

               return \`
               <tr onclick="app.openProfile(\${m.id})" style="cursor:pointer;">
                  <td><span style="color:var(--primary); font-weight:700;">#\${m.id}</span></td>
                  <td><div style="font-weight:600; color:white;">\${escapeHtml(m.name)}</div><div class="text-xs text-muted">\${m.phone}</div></td>
                  <td>\${m.plan}</td>
                  <td>\${paidUntil}</td>
                  <td>\${statusBadge} \${streak}</td>
                  <td style="text-align:right"><button class="btn btn-outline btn-sm">VIEW</button></td>
               </tr>\`;
            }).join('');
            
            document.getElementById('tbl-members').innerHTML = rows || '<tr><td colspan="6" class="text-center text-muted">No members found</td></tr>';
            document.getElementById('list-members').innerHTML = list.map(m => \`
               <div class="m-card" onclick="app.openProfile(\${m.id})">
                  <div class="m-info">
                     <div class="m-title">\${escapeHtml(m.name)} \${m.streak ? '🔥 '+m.streak : ''}</div>
                     <div class="m-sub">\${m.isRunningMonthPaid ? '<span style="color:var(--success)">Month Paid</span>' : '<span style="color:var(--danger)">Unpaid</span>'} • Paid till \${m.paidUntil ? formatDate(m.paidUntil) : '-'}</div>
                  </div>
               </div>
            \`).join('');
         },

         renderPaymentsTable: function() {
             const filter = document.getElementById('pay-filter').value;
             const cur = this.data.settings.currency || '';
             let list = this.data.members;
             if(filter === 'due') list = list.filter(m => !m.isRunningMonthPaid || m.dueMonths > 0);
             list.sort((a,b) => (b.dueMonths||0) - (a.dueMonths||0));

             const rows = list.map(m => {
                 const price = (this.data.settings.membershipPlans.find(p=>p.name===m.plan)||{price:0}).price;
                 const owe = Math.max(0, (m.dueMonths * price) - (m.balance||0));
                 const btn = \`<button class="btn btn-primary btn-sm" onclick="app.modals.pay.open(\${m.id}); event.stopPropagation();">PAY</button>\`;
                 
                 return \`
                 <tr>
                    <td><div style="font-weight:600; color:white;">\${escapeHtml(m.name)}</div></td>
                    <td>\${m.isRunningMonthPaid ? '<span class="badge bg-green">Active</span>' : '<span class="badge bg-red">Due</span>'}</td>
                    <td>\${m.paidUntil ? formatDate(m.paidUntil) : '-'}</td>
                    <td style="font-weight:700; color:white;">\${cur} \${owe}</td>
                    <td style="text-align:right">\${btn}</td>
                 </tr>\`;
             }).join('');
             document.getElementById('tbl-payment-list').innerHTML = rows;
             document.getElementById('list-payment-list').innerHTML = list.map(m => {
                 const price = (this.data.settings.membershipPlans.find(p=>p.name===m.plan)||{price:0}).price;
                 const owe = Math.max(0, (m.dueMonths * price) - (m.balance||0));
                 return \`<div class="m-card">
                    <div class="m-info"><div class="m-title">\${escapeHtml(m.name)}</div><div class="m-sub">Owes: \${cur} \${owe}</div></div>
                    <button class="btn btn-primary btn-sm" onclick="app.modals.pay.open(\${m.id})">PAY</button>
                 </div>\`;
             }).join('');
         },
         
         renderHistoryTable: function(data=null) {
            const list = data || this.data.attendanceHistory || [];
            const rows = list.map(a => \`<tr><td>\${formatDate(a.check_in_time)}</td><td>\${formatTime(a.check_in_time)}</td><td>\${escapeHtml(a.name)}</td></tr>\`).join('');
            document.getElementById('tbl-attendance-history').innerHTML = rows;
            document.getElementById('list-attendance-history').innerHTML = list.map(a => \`<div class="m-card" style="padding:10px;"><div class="m-info"><div class="m-title">\${escapeHtml(a.name)}</div><div class="m-sub">\${formatDate(a.check_in_time)} • \${formatTime(a.check_in_time)}</div></div></div>\`).join('');
         },
         
         applyHistoryFilter: async function() {
            const date = document.getElementById('history-date').value;
            const res = await fetch('/api/history/list',{method:'POST',body:JSON.stringify({date})});
            const d = await res.json();
            this.renderHistoryTable(d.history);
         },

         openProfile: function(id) {
             const m = this.data.members.find(x => x.id === id);
             if(!m) return;
             document.getElementById('prof-id').value = id;
             document.getElementById('prof-name').innerText = m.name;
             document.getElementById('prof-plan').innerText = m.plan;
             document.getElementById('prof-status').innerHTML = m.isRunningMonthPaid 
                 ? '<span class="badge bg-green">ACTIVE THIS MONTH</span>' 
                 : '<span class="badge bg-red">PAYMENT DUE</span>';
             document.getElementById('prof-expiry').innerText = m.paidUntil ? formatDate(m.paidUntil) : 'Never';
             
             const bar = document.getElementById('prof-valid-bar');
             if (m.isRunningMonthPaid) { bar.style.width = '100%'; bar.style.background = 'var(--success)'; } 
             else { bar.style.width = '15%'; bar.style.background = 'var(--danger)'; }

             document.getElementById('prof-btn-pay').onclick = () => { app.modals.profile.close(); app.modals.pay.open(id); };
             document.getElementById('prof-weight').value = m.weight || '';
             document.getElementById('prof-height').value = m.height || '';
             document.getElementById('prof-gender').value = m.gender || 'other';

             app.modals.profile.open();
         },
         
         showHistory: async function(id) {
            const res = await fetch('/api/members/history',{method:'POST',body:JSON.stringify({memberId:id})});
            const d = await res.json();
            const html = d.history.map(h => \`<div class="m-card" style="padding:8px 12px; margin-bottom:8px;"><div class="m-sub">\${formatDate(h.check_in_time)}</div><div style="font-weight:600; color:white;">\${formatTime(h.check_in_time)}</div></div>\`).join('');
            document.getElementById('calendar-container').innerHTML = html || '<div class="text-muted">No history found</div>';
            document.getElementById('modal-member-history').style.display = 'flex';
         },
         
         updateStats: async function(e) {
             e.preventDefault();
             const fd = new FormData(e.target);
             await fetch('/api/members/update-profile', {method:'POST', body:JSON.stringify(Object.fromEntries(fd))});
             app.toast('Stats Updated');
             setTimeout(() => window.location.reload(), 500);
         },
         
         checkIn: async function() {
             const id = document.getElementById('checkin-id').value;
             if(!id) return;
             try {
                const res = await fetch('/api/checkin', {method:'POST', body:JSON.stringify({memberId: id})});
                const d = await res.json();
                const resDiv = document.getElementById('checkin-res');
                if(d.success) {
                   resDiv.innerHTML = \`<div style="color:var(--success); font-weight:700; font-size:18px;">✅ WELCOME, \${d.name.toUpperCase()}!</div>\`;
                   if(d.streak > 1) resDiv.innerHTML += \`<div style="color:var(--warning); margin-top:4px;">🔥 \${d.streak} DAY STREAK!</div>\`;
                   setTimeout(() => { app.modals.checkin.close(); window.location.reload(); }, 1500);
                } else {
                   resDiv.innerHTML = \`<div style="color:var(--danger); font-weight:700;">⛔ \${d.error}</div>\`;
                }
             } catch(e) {}
         },
         
         addMember: async function(e) {
            e.preventDefault();
            await fetch('/api/members/add', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
            window.location.reload();
         },
         
         pay: async function(e) {
            e.preventDefault();
            await fetch('/api/payment', {method:'POST', body:JSON.stringify(Object.fromEntries(new FormData(e.target)))});
            window.location.reload();
         },
         
         delMember: async function() {
             if(confirm('PERMANENTLY DELETE MEMBER?')) {
                 await fetch('/api/members/delete', {method:'POST', body:JSON.stringify({id: document.getElementById('prof-id').value})});
                 window.location.reload();
             }
         },
         
         // --- SETTINGS & USERS ---
         applySettingsUI: function() {
            if(!this.data || !this.data.settings) return;
            const s = this.data.settings;
            const form = document.getElementById('settings-form');
            if(!form) return;
            form.querySelector('[name="currency"]').value = s.currency;
            form.querySelector('[name="lang"]').value = s.lang;
            form.querySelector('[name="attendanceThreshold"]').value = s.attendanceThreshold;
            form.querySelector('[name="inactiveAfterMonths"]').value = s.inactiveAfterMonths;
            form.querySelector('[name="renewalFee"]').value = s.renewalFee;
            
            const container = document.getElementById('plans-container');
            container.innerHTML = s.membershipPlans.map(p => \`<div class="flex plan-row" style="background:rgba(255,255,255,0.03); padding:8px; border-radius:6px;"><input value="\${escapeHtml(p.name)}" class="p-name" placeholder="Name"><input type="number" value="\${p.price}" class="p-price" placeholder="Price"><input type="number" value="\${p.admissionFee||0}" class="p-adm" placeholder="Adm Fee"><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button></div>\`).join('');
         },
         addPlanRow: function() {
            const div = document.createElement('div');
            div.className = 'flex plan-row';
            div.style.cssText = 'background:rgba(255,255,255,0.03); padding:8px; border-radius:6px;';
            div.innerHTML = \`<input class="p-name" placeholder="Name"><input type="number" class="p-price" placeholder="Price"><input type="number" class="p-adm" placeholder="Adm Fee"><button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">X</button>\`;
            document.getElementById('plans-container').appendChild(div);
         },
         saveSettings: async function(e) {
             e.preventDefault();
             const plans = [];
             document.querySelectorAll('.plan-row').forEach(r => {
                const n = r.querySelector('.p-name').value;
                const p = r.querySelector('.p-price').value;
                const a = r.querySelector('.p-adm').value;
                if(n && p) plans.push({name:n, price:Number(p), admissionFee:Number(a)});
             });
             const fd = new FormData(e.target);
             const data = Object.fromEntries(fd);
             data.membershipPlans = plans;
             await fetch('/api/settings', {method:'POST', body:JSON.stringify(data)});
             app.toast('Settings Saved');
             setTimeout(() => window.location.reload(), 800);
         },
         resetDB: async function() {
             if(confirm('FACTORY RESET: This will delete ALL data. Are you sure?')) {
                 await fetch('/api/nuke');
                 window.location.reload();
             }
         },
         loadUsers: async function() {
             const res = await fetch('/api/users/list');
             const d = await res.json();
             const rows = d.users.map(u => \`<tr><td>\${escapeHtml(u.name)}</td><td><span class="badge bg-blue">\${u.role}</span></td><td style="text-align:right"><button class="btn btn-danger btn-sm" onclick="app.deleteUser(\${u.id})">X</button></td></tr>\`).join('');
             document.getElementById('tbl-users').innerHTML = rows;
             document.getElementById('list-users').innerHTML = d.users.map(u => \`<div class="m-card"><div class="m-info"><div class="m-title">\${escapeHtml(u.name)}</div><div class="m-sub">\${u.role}</div></div><button class="btn btn-danger btn-sm" onclick="app.deleteUser(\${u.id})">X</button></div>\`).join('');
         },
         openAddUser: function() {
             document.getElementById('modal-user').style.display='flex';
             document.getElementById('user-form').reset();
             document.getElementById('u-id').value = '';
         },
         saveUser: async function(e) {
             e.preventDefault();
             const fd = new FormData(e.target);
             const endpoint = fd.get('id') ? '/api/users/update' : '/api/users/add';
             await fetch(endpoint, {method:'POST', body:JSON.stringify(Object.fromEntries(fd))});
             document.getElementById('modal-user').style.display='none';
             this.loadUsers();
         },
         deleteUser: async function(id) {
             if(confirm('Delete User?')) {
                 await fetch('/api/users/delete', {method:'POST', body:JSON.stringify({id})});
                 this.loadUsers();
             }
         },
         
         // --- SEARCH INPUTS ---
         onCheckinInput: function(e) {
            if(e.key === 'Enter') { this.checkIn(); return; }
            this.doSearch(e.target.value, (res) => {
               const div = document.getElementById('checkin-suggestions');
               div.innerHTML = res.map(m => \`<div style="padding:12px; border-bottom:1px solid #1e293b; cursor:pointer;" onclick="document.getElementById('checkin-id').value='\${m.id}'; document.getElementById('checkin-suggestions').innerHTML='';">#\${m.id} \${m.name}</div>\`).join('');
            });
         },
         doSearch: function(q, cb) {
            if(this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(async () => {
               if(!q) { cb([]); return; }
               const res = await fetch('/api/members/search', {method:'POST', body:JSON.stringify({query:q})});
               const d = await res.json();
               cb(d.results);
            }, 300);
         },
         openPaymentHistory: function() {
            document.getElementById('modal-payment-history').style.display = 'flex';
            this.renderTransactionHistory();
         },
         renderTransactionHistory: async function() {
            const date = document.getElementById('trans-date').value;
            const res = await fetch('/api/payments/history', {method:'POST', body:JSON.stringify({date})});
            const d = await res.json();
            const cur = this.data.settings.currency || '';
            document.getElementById('tbl-transaction-history').innerHTML = (d.transactions||[]).map(t => \`<tr><td>\${formatDate(t.date)}</td><td>\${escapeHtml(t.name||'-')}</td><td style="font-weight:700; color:var(--success);">\${cur} \${t.amount}</td></tr>\`).join('') || '<tr><td colspan="3" class="text-center text-muted">No transactions</td></tr>';
         },
         toast: function(msg) {
             const c = document.getElementById('toast-container');
             const d = document.createElement('div');
             d.className = 'toast';
             d.innerHTML = '✅ ' + msg;
             c.appendChild(d);
             setTimeout(() => d.remove(), 3000);
         },
         
         modals: {
            checkin: {open:()=>document.getElementById('modal-checkin').style.display='flex', close:()=>document.getElementById('modal-checkin').style.display='none'},
            profile: {open:()=>document.getElementById('modal-profile').style.display='flex', close:()=>document.getElementById('modal-profile').style.display='none'},
            add: {open:()=>document.getElementById('modal-add').style.display='flex', close:()=>document.getElementById('modal-add').style.display='none'},
            pay: {open:(id)=>{
                document.getElementById('pay-id').value = id;
                const m = app.data.members.find(x=>x.id===id);
                document.getElementById('pay-name').innerText = m ? m.name : 'Member';
                document.getElementById('pay-bal').innerText = m ? m.balance : 0;
                document.getElementById('modal-pay').style.display='flex';
            }, close:()=>document.getElementById('modal-pay').style.display='none'},
            user: {close:()=>document.getElementById('modal-user').style.display='none'}
         }
      };
      
      function getIcon(n){
          const i={home:'${getIcon("home")}',users:'${getIcon("users")}',clock:'${getIcon("clock")}',creditCard:'${getIcon("creditCard")}',trophy:'${getIcon("trophy")}',fire:'${getIcon("fire")}',history:'${getIcon("history")}',settings:'${getIcon("settings")}',print:'${getIcon("print")}'};
          return i[n]||'';
      }
      function formatTime(iso){try{return new Date(iso).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});}catch{return'-';}}
      function formatDate(iso){try{return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short'});}catch{return'-';}}
      function escapeHtml(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}

      app.init();
    </script>
  </body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
