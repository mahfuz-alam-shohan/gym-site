// This serves as the 'app.js' that the UI requests.
// It reconstructs the frontend logic required by ui.ts
// This fixes the "nothing loads" issue.

export const CLIENT_JS = `
const app = {
  data: { members: [], stats: {}, settings: {} },
  
  async init() {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.status === 401) { window.location.href = '/'; return; }
      const d = await res.json();
      this.data = d;
      this.renderHome();
      this.setupNav();
    } catch(e) { console.error(e); }
  },

  setupNav() {
    const nav = document.getElementById('nav-container');
    const views = ['Home', 'Members', 'Attendance', 'Payments', 'History', 'Settings'];
    nav.innerHTML = views.map(v => 
      \`<div class="nav-item" onclick="app.switchView('\${v.toLowerCase()}')" id="nav-\${v.toLowerCase()}">\${v}</div>\`
    ).join('');
    this.switchView('home');
  },

  switchView(id) {
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-'+id).classList.remove('hidden');
    document.getElementById('page-title').innerText = id.charAt(0).toUpperCase() + id.slice(1);
    if(id === 'members') this.renderMembers();
  },

  renderHome() {
    document.getElementById('stat-active').innerText = this.data.stats.active;
    document.getElementById('stat-today').innerText = this.data.stats.today;
    document.getElementById('stat-rev').innerText = this.data.stats.revenue;
    this.renderCharts();
  },

  renderCharts() {
    const ctx = document.getElementById('chart-dues');
    if(!ctx) return;
    // Simple placeholder chart
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Due', 'Inactive'],
        datasets: [{ data: [this.data.stats.active, this.data.stats.dueMembers, this.data.stats.inactiveMembers], backgroundColor:['#10b981','#f59e0b','#ef4444'] }]
      }
    });
  },

  renderMembers() {
    const tbody = document.getElementById('tbl-members');
    tbody.innerHTML = this.data.members.map(m => \`
      <tr>
        <td>#\${m.id}</td>
        <td>\${m.name}</td>
        <td>\${m.phone}</td>
        <td>\${m.plan}</td>
        <td>\${new Date(m.joined_at).toLocaleDateString()}</td>
        <td>\${new Date(m.expiry_date).toLocaleDateString()}</td>
        <td><span class="badge \${m.status === 'active' ? 'bg-green' : 'bg-red'}">\${m.status}</span></td>
        <td>\${m.dueMonths > 0 ? m.dueMonths + ' Mo' : '-'}</td>
        <td>\${m.balance}</td>
        <td><button class="btn btn-outline" onclick="app.deleteMember(\${m.id})">Del</button></td>
      </tr>
    \`).join('');
  },

  modals: {
    add: { open: () => document.getElementById('modal-add').style.display = 'flex', close: () => document.getElementById('modal-add').style.display = 'none' },
    checkin: { open: () => document.getElementById('modal-checkin').style.display = 'flex', close: () => document.getElementById('modal-checkin').style.display = 'none' },
    pay: { open: (id) => document.getElementById('modal-pay').style.display = 'flex', close: () => document.getElementById('modal-pay').style.display = 'none' },
    quickPay: { open: () => document.getElementById('modal-quick-pay').style.display = 'flex', close: () => document.getElementById('modal-quick-pay').style.display = 'none' },
    user: { open: () => document.getElementById('modal-user').style.display = 'flex', close: () => document.getElementById('modal-user').style.display = 'none' }
  },

  // Actions
  async checkIn() {
    const id = document.getElementById('checkin-id').value;
    const res = await fetch('/api/checkin', { method:'POST', body: JSON.stringify({memberId: id}) });
    const d = await res.json();
    if(d.success) alert('Checked In: ' + d.name); else alert(d.error);
  },

  async deleteMember(id) {
    if(!confirm('Delete member?')) return;
    await fetch('/api/members/delete', { method:'POST', body: JSON.stringify({id}) });
    await this.init(); // Reload
  },
  
  switchAddTab(t) {
    document.getElementById('sec-new-fees').style.display = t==='new' ? 'block' : 'none';
    document.getElementById('sec-mig-fees').style.display = t==='mig' ? 'block' : 'none';
    document.getElementById('add-mig-mode').value = t==='mig';
  },

  onCheckinInput(e) {
     // Search logic here...
  }
};

window.onload = () => app.init();
`;
