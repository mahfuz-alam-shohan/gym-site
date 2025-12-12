import { escapeHtml } from "../utils";

export function getIcon(name: string): string {
  // Modern, clean SVG icons (Feather/Lucide style)
  const icons: Record<string, string> = {
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    history: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>',
    creditCard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    logout: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>'
  };
  return icons[name] || '';
}

/* ========================================================================
   1. UI SYSTEM - LIGHT, LIVELY, COMPACT & RESPONSIVE
   ======================================================================== */

export function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  
  <!-- Font: Inter for a clean, professional look -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      /* Palette: Luminous Light (Teal/Indigo) */
      --primary: #4f46e5;       /* Indigo 600 */
      --primary-hover: #4338ca;
      --primary-light: #e0e7ff;
      
      --accent: #0ea5e9;        /* Sky 500 */
      
      --bg-body: #f8fafc;       /* Slate 50 */
      --bg-surface: #ffffff;
      
      --text-main: #0f172a;     /* Slate 900 */
      --text-sec: #64748b;      /* Slate 500 */
      --text-light: #94a3b8;
      
      --border: #e2e8f0;
      
      --success: #10b981; 
      --success-bg: #d1fae5;
      --danger: #ef4444; 
      --danger-bg: #fee2e2;
      --warning: #f59e0b;
      --warning-bg: #fef3c7;
      
      --radius-lg: 16px;
      --radius-md: 10px;
      --radius-sm: 6px;
      
      /* Subtle, professional shadow */
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body { 
      margin: 0; 
      font-family: 'Inter', system-ui, sans-serif; 
      background: var(--bg-body); 
      color: var(--text-main); 
      height: 100vh; 
      display: flex; 
      font-size: 14px; 
      line-height: 1.5; 
      overflow: hidden; /* App-like feel */
    }

    /* --- LAYOUT --- */
    .app-layout { display: flex; height: 100%; width: 100%; }
    
    /* Desktop Sidebar */
    .sidebar { 
      width: 250px; 
      background: var(--bg-surface); 
      border-right: 1px solid var(--border);
      display: flex; 
      flex-direction: column; 
      flex-shrink: 0; 
      z-index: 50; 
    }
    .sidebar-header { padding: 24px; display: flex; align-items: center; gap: 12px; }
    .brand-icon { width: 36px; height: 36px; background: var(--primary); border-radius: var(--radius-md); color: white; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    
    .nav { padding: 0 12px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { 
      padding: 10px 16px; 
      border-radius: var(--radius-md); 
      color: var(--text-sec); 
      cursor: pointer; 
      font-weight: 500; 
      font-size: 14px; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      transition: all 0.15s; 
    }
    .nav-item:hover { background: var(--bg-body); color: var(--text-main); }
    .nav-item.active { background: var(--primary-light); color: var(--primary); font-weight: 600; }
    
    .main-content { 
      flex: 1; 
      overflow-y: auto; 
      display: flex; 
      flex-direction: column; 
      position: relative; 
      scroll-behavior: smooth; 
      padding: 24px;
      padding-bottom: 100px; /* Safe area for scrolling */
    }

    /* Mobile Bottom Nav */
    .bottom-nav { display: none; } /* Hidden on desktop */

    /* --- COMPONENTS --- */
    
    /* Cards */
    .card { 
      background: var(--bg-surface); 
      padding: 20px; 
      border-radius: var(--radius-lg); 
      box-shadow: var(--shadow-sm); 
      border: 1px solid var(--border); 
      margin-bottom: 20px; 
    }
    
    /* Typography */
    h1, h2, h3, h4 { margin: 0; color: var(--text-main); font-weight: 700; letter-spacing: -0.025em; }
    .text-muted { color: var(--text-sec); }
    .text-xs { font-size: 12px; }
    
    /* Buttons */
    .btn { 
      padding: 10px 18px; 
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      font-weight: 600; 
      cursor: pointer; 
      transition: all 0.15s; 
      font-size: 13px; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      gap: 8px; 
      white-space: nowrap; 
      user-select: none; 
      outline: none;
    }
    .btn:active { transform: scale(0.98); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-primary { background: var(--primary); color: white; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .btn-primary:hover { background: var(--primary-hover); }
    
    .btn-outline { background: white; border-color: var(--border); color: var(--text-main); }
    .btn-outline:hover { background: var(--bg-body); border-color: #cbd5e1; }
    
    .btn-danger { background: white; border-color: #fecaca; color: #dc2626; }
    .btn-danger:hover { background: #fef2f2; }

    .btn-sm { padding: 6px 12px; font-size: 12px; }

    /* Inputs */
    input, select { 
      width: 100%; 
      padding: 10px 14px; 
      margin-bottom: 16px; 
      border: 1px solid var(--border); 
      border-radius: var(--radius-md); 
      font-size: 14px; 
      outline: none; 
      transition: all 0.15s; 
      background: white; 
      color: var(--text-main);
      font-family: inherit;
    }
    input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-light); }
    label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600; color: var(--text-sec); text-transform: uppercase; }
    
    /* --- DATA DISPLAY --- */
    
    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { 
      background: white; 
      padding: 16px; 
      border-radius: var(--radius-lg); 
      box-shadow: var(--shadow-sm); 
      border: 1px solid var(--border);
      display: flex; flex-direction: column;
    }
    .stat-val { font-size: 24px; font-weight: 700; color: var(--text-main); line-height: 1.2; }
    .stat-label { font-size: 12px; color: var(--text-sec); font-weight: 500; margin-top: 4px; }

    /* Table (Desktop) */
    .table-responsive { width: 100%; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; white-space: nowrap; }
    th { text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; color: var(--text-sec); border-bottom: 1px solid var(--border); background: var(--bg-body); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text-main); }
    tr:last-child td { border-bottom: none; }
    
    /* Badges */
    .badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; line-height: 1; }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
    .bg-green { background: #ecfdf5; color: #047857; } .bg-green .badge-dot { background: #10b981; }
    .bg-red { background: #fef2f2; color: #b91c1c; } .bg-red .badge-dot { background: #ef4444; }
    .bg-amber { background: #fffbeb; color: #b45309; } .bg-amber .badge-dot { background: #f59e0b; }
    .bg-blue { background: #eff6ff; color: #1d4ed8; } .bg-blue .badge-dot { background: #3b82f6; }

    /* --- MOBILE OPTIMIZATIONS --- */
    
    /* Mobile Card List (Instead of Table) */
    .mobile-list { display: none; flex-direction: column; gap: 12px; }
    .m-card { 
      background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; 
      display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);
    }
    .m-info { flex: 1; min-width: 0; margin-right: 12px; }
    .m-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .m-sub { font-size: 12px; color: var(--text-sec); display: flex; align-items: center; gap: 6px; }
    .m-actions { display: flex; gap: 8px; }

    /* Modals */
    .modal-backdrop { 
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 100; 
      display: none; align-items: center; justify-content: center; 
      backdrop-filter: blur(2px); 
      padding: 16px;
    }
    .modal-content { 
      background: white; width: 100%; max-width: 440px; padding: 24px; 
      border-radius: 24px; box-shadow: var(--shadow-lg); 
      max-height: 90vh; overflow-y: auto; 
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

    /* Floating Action Button (FAB) */
    .fab {
      position: fixed; bottom: 80px; right: 20px;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--primary); color: white;
      display: none; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      z-index: 80; cursor: pointer; transition: transform 0.2s;
    }
    .fab:active { transform: scale(0.9); }

    /* --- RESPONSIVE MEDIA QUERIES --- */
    @media (max-width: 768px) {
      .sidebar { display: none; } /* Hide sidebar on mobile */
      
      .main-content { padding: 16px; padding-bottom: 90px; }
      
      .bottom-nav { 
        display: flex; position: fixed; bottom: 0; left: 0; right: 0; 
        background: white; border-top: 1px solid var(--border); 
        padding: 8px 0 20px 0; /* Extra padding for iOS home bar */
        justify-content: space-around; z-index: 90;
        box-shadow: 0 -1px 3px rgba(0,0,0,0.05);
      }
      .b-nav-item { 
        display: flex; flex-direction: column; align-items: center; 
        font-size: 10px; font-weight: 500; color: var(--text-sec); 
        padding: 4px 8px; gap: 4px; border-radius: 8px; width: 64px;
      }
      .b-nav-item.active { color: var(--primary); background: var(--primary-light); }
      .b-nav-item svg { width: 22px; height: 22px; }

      /* Switch tables to cards on mobile for "Lively" feel */
      .desktop-table { display: none; }
      .mobile-list { display: flex; }
      
      .fab { display: flex; }
      
      h2 { font-size: 20px; }
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
      .stat-card { padding: 12px; }
      .stat-val { font-size: 20px; }
    }
    
    /* Utilities */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 8px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .center-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f1f5f9; padding: 20px; }
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }

    /* Toast */
    #toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 200; display: flex; flex-direction: column; gap: 8px; width: 90%; max-width: 350px; }
    .toast { background: #1e293b; color: white; padding: 12px 16px; border-radius: 99px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .toast.success { background: #064e3b; color: #ecfdf5; }
    .toast.error { background: #7f1d1d; color: #fef2f2; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}
