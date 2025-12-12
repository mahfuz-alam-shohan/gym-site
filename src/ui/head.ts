import { escapeHtml } from "../utils";

export function getIcon(name: string): string {
  // Crisp, modern icons (Lucide style)
  const icons: Record<string, string> = {
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    history: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>',
    creditCard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    menu: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    check: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  };
  return icons[name] || '';
}

export function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    :root {
      /* Modern Light Theme - Lively & Professional */
      --primary: #6366f1;       /* Indigo */
      --primary-dark: #4f46e5;
      --primary-light: #e0e7ff;
      --primary-bg: #eef2ff;

      --accent: #ec4899;        /* Pink */
      --accent-pop: #db2777;

      --bg-body: #f8fafc;       /* Cool Gray/White */
      --bg-surface: #ffffff;
      
      --text-heading: #1e293b;  /* Slate 800 */
      --text-body: #334155;     /* Slate 700 */
      --text-muted: #94a3b8;    /* Slate 400 */
      
      --border: #e2e8f0;

      --success: #10b981; 
      --success-bg: #d1fae5;
      --danger: #ef4444; 
      --danger-bg: #fee2e2;
      --warning: #f59e0b;
      --warning-bg: #fef3c7;
      
      --radius-lg: 16px;
      --radius-md: 12px;
      --radius-sm: 8px;
      
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }
    
    body { 
      margin: 0; 
      font-family: 'Nunito', sans-serif; 
      background: var(--bg-body); 
      color: var(--text-body); 
      height: 100vh; 
      display: flex; 
      overflow: hidden; 
      font-size: 14px; 
    }

    /* Layout */
    .app-layout { display: flex; height: 100%; width: 100%; }
    
    /* Sidebar (Desktop) */
    .sidebar { 
      width: 260px; 
      background: var(--bg-surface); 
      border-right: 1px solid var(--border);
      display: flex; 
      flex-direction: column; 
      flex-shrink: 0; 
      z-index: 50; 
    }

    /* Main Content */
    .main-content { 
      flex: 1; 
      overflow-y: auto; 
      display: flex; 
      flex-direction: column; 
      position: relative; 
      scroll-behavior: smooth; 
      padding: 0;
    }
    
    .content-wrapper {
      padding: 20px 30px 100px 30px; /* Bottom padding for mobile nav clearance */
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    /* Headings & Typography */
    h1, h2, h3, h4 { color: var(--text-heading); font-weight: 800; margin: 0; letter-spacing: -0.025em; }
    
    /* Components */
    .card { 
      background: var(--bg-surface); 
      padding: 20px; 
      border-radius: var(--radius-lg); 
      box-shadow: var(--shadow-sm); 
      border: 1px solid var(--border); 
      margin-bottom: 20px; 
    }
    
    /* Buttons */
    .btn { 
      padding: 10px 18px; 
      border-radius: var(--radius-md);
      border: 1px solid transparent;
      font-weight: 700; 
      cursor: pointer; 
      transition: all 0.2s; 
      font-size: 13px; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      gap: 8px; 
      white-space: nowrap; 
      user-select: none; 
    }
    .btn:active { transform: scale(0.96); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-primary { 
      background: var(--primary); 
      color: white; 
      box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
    }
    .btn-primary:hover { background: var(--primary-dark); }
    
    .btn-accent { 
      background: var(--accent); 
      color: white; 
      box-shadow: 0 2px 4px rgba(236, 72, 153, 0.3);
    }
    .btn-accent:hover { background: var(--accent-pop); }

    .btn-outline { 
      background: white; 
      border-color: var(--border); 
      color: var(--text-body); 
    }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-bg); }
    
    .btn-danger { background: var(--danger-bg); color: #b91c1c; }
    .btn-danger:hover { background: #fecaca; }

    .btn-icon { padding: 8px; width: 36px; height: 36px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center; }
    
    .w-full { width: 100%; }
    
    /* Inputs */
    input, select { 
      width: 100%; 
      padding: 12px 16px; 
      margin-bottom: 16px; 
      border: 1px solid var(--border); 
      border-radius: var(--radius-md); 
      font-size: 14px; 
      background: #f8fafc; 
      color: var(--text-heading); 
      font-family: inherit;
      font-weight: 600;
      transition: all 0.2s;
    }
    input:focus, select:focus { 
      border-color: var(--primary); 
      background: white; 
      box-shadow: 0 0 0 3px var(--primary-light); 
    }
    label { 
      display: block; 
      margin-bottom: 6px; 
      font-size: 12px; 
      font-weight: 700; 
      color: var(--text-muted); 
      text-transform: uppercase; 
    }
    
    /* Stats Grid */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { 
      background: white; 
      padding: 20px; 
      border-radius: var(--radius-lg); 
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .stat-val { font-size: 28px; font-weight: 900; color: var(--text-heading); margin-top: 8px; line-height: 1; }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .stat-icon { position: absolute; top: 20px; right: 20px; color: var(--text-muted); opacity: 0.2; transform: scale(1.5); }

    /* Tables & Responsive Cards */
    .table-container { overflow-x: auto; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; white-space: nowrap; }
    th { text-align: left; padding: 12px 20px; border-bottom: 1px solid var(--border); background: #f8fafc; color: var(--text-muted); font-size: 11px; text-transform: uppercase; font-weight: 800; }
    td { padding: 12px 20px; border-bottom: 1px solid var(--border); color: var(--text-heading); font-size: 13px; font-weight: 600; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #f8fafc; }
    
    /* Badges */
    .badge { padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; display: inline-block; }
    .bg-green { background: var(--success-bg); color: #047857; }
    .bg-red { background: var(--danger-bg); color: #b91c1c; }
    .bg-amber { background: var(--warning-bg); color: #b45309; }
    .bg-blue { background: #dbeafe; color: #1e40af; }

    /* Navigation */
    .nav { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { 
      padding: 10px 16px; 
      border-radius: var(--radius-md); 
      color: var(--text-body); 
      cursor: pointer; 
      font-weight: 700; 
      font-size: 14px; 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      transition: all 0.2s; 
    }
    .nav-item:hover { background: #f1f5f9; color: var(--text-heading); }
    .nav-item.active { background: var(--primary-bg); color: var(--primary); }
    
    /* Bottom Nav (Mobile Only) */
    .bottom-nav { 
      display: none; /* Hidden on desktop */
      position: fixed; 
      bottom: 0; left: 0; right: 0; 
      background: white; 
      border-top: 1px solid var(--border); 
      padding: 8px 16px; 
      padding-bottom: max(8px, env(safe-area-inset-bottom));
      justify-content: space-around; 
      z-index: 100;
      box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);
    }
    .b-nav-item { 
      display: flex; flex-direction: column; align-items: center; justify-content: center; 
      gap: 4px; font-size: 10px; font-weight: 700; color: var(--text-muted); 
      width: 60px; height: 50px; border-radius: 8px;
    }
    .b-nav-item svg { width: 22px; height: 22px; stroke-width: 2.5; }
    .b-nav-item.active { color: var(--primary); }
    
    /* FAB (Mobile) */
    .fab {
      position: fixed; bottom: 80px; right: 20px;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--primary); color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5);
      display: none; align-items: center; justify-content: center;
      z-index: 90; cursor: pointer; transition: transform 0.2s;
    }
    .fab:active { transform: scale(0.9); }

    /* Utilities */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 10px; }
    .flex-col { display: flex; flex-direction: column; gap: 10px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .center-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f1f5f9; padding: 20px; text-align: center; }
    
    /* Modals */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px); opacity: 0; transition: opacity 0.2s; }
    .modal-backdrop.open { opacity: 1; }
    .modal-content { background: white; width: 100%; max-width: 480px; padding: 24px; border-radius: 20px; box-shadow: var(--shadow-lg); transform: translateY(20px); transition: transform 0.2s; max-height: 90vh; overflow-y: auto; }
    .modal-backdrop.open .modal-content { transform: translateY(0); }

    /* Search Results */
    .checkin-results { margin-top: 8px; max-height: 240px; overflow-y: auto; border-radius: var(--radius-md); border: 1px solid var(--border); background: white; }
    .checkin-item { padding: 12px 16px; font-size: 13px; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .checkin-item:hover { background: #f8fafc; color: var(--primary); }

    /* Toast */
    #toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 300; display: flex; flex-direction: column; gap: 8px; width: 90%; max-width: 380px; pointer-events: none; }
    .toast { background: #1e293b; color: white; padding: 12px 20px; border-radius: 99px; font-size: 13px; font-weight: 700; box-shadow: var(--shadow-lg); display: flex; align-items: center; justify-content: center; gap: 8px; animation: slideDown 0.3s; pointer-events: auto; }
    .toast.error { background: var(--danger); }
    @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* === MOBILE RESPONSIVE DESIGN === */
    @media (max-width: 768px) {
      /* Layout Changes */
      .sidebar { display: none; } /* Hide sidebar */
      .bottom-nav { display: flex; } /* Show bottom nav */
      .fab { display: flex; } /* Show FAB */
      
      .content-wrapper { padding: 16px 16px 100px 16px; }
      
      .main-header { display: none; } /* Hide top header text on mobile to save space */
      
      /* Card-Based Tables for Mobile */
      .table-container { background: transparent; border: none; overflow: visible; }
      .table-container table { display: block; }
      .table-container thead { display: none; } /* Hide table headers */
      .table-container tbody { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .table-container tr { 
        display: flex; flex-direction: column; 
        background: white; border: 1px solid var(--border); 
        border-radius: var(--radius-md); padding: 16px; 
        box-shadow: var(--shadow-sm);
        position: relative;
      }
      .table-container td { 
        padding: 4px 0; border: none; font-size: 14px; 
        display: flex; justify-content: space-between; align-items: center;
      }
      .table-container td:before { /* Label for data */
        content: attr(data-label);
        font-weight: 700; color: var(--text-muted); font-size: 11px; text-transform: uppercase;
        margin-right: 10px;
      }
      /* Special handling for Action buttons in cards */
      .table-container td:last-child { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); justify-content: flex-end; gap: 8px; }
      .table-container td:last-child:before { display: none; }
      
      /* Adjust Stats */
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .stat-card { padding: 16px; }
      .stat-val { font-size: 22px; }
      
      h2 { font-size: 20px; }
      
      .mobile-full-width { width: 100%; flex-direction: column; align-items: stretch; gap: 10px; }
      
      /* Fix Modal on Mobile */
      .modal-content { width: 95%; max-height: 85vh; padding: 20px; }
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}
