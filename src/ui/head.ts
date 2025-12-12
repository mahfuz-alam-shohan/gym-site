import { escapeHtml } from "../utils";

export function getIcon(name: string): string {
  const icons: Record<string, string> = {
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    history: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
    creditCard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
  };
  return icons[name] || '';
}

/* ========================================================================
   1. UI SYSTEM
   ======================================================================== */

export function baseHead(title: string): string {
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
