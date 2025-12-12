import { escapeHtml } from "../utils";

export function getIcon(name: string): string {
  // Slightly friendlier, rounded stroke icons
  const icons: Record<string, string> = {
    home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    users: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    clock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    history: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path></svg>',
    creditCard: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
    settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
    logout: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    menu: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
    check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
    trash: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
  };
  return icons[name] || '';
}

/* ========================================================================
   1. UI SYSTEM - FRIENDLY & PLAYFUL
   ======================================================================== */

export function baseHead(title: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(title)}</title>
  
  <!-- Fonts: Nunito is rounded and friendly -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    :root {
      /* Palette: Fun & Vibrant */
      --primary: #8b5cf6;       /* Violet */
      --primary-dark: #7c3aed;
      --primary-light: #ddd6fe;
      
      --accent: #f472b6;        /* Pink */
      --accent-pop: #ec4899;
      
      --bg-body: #fdf4ff;       /* Very light warm background */
      --bg-card: #ffffff;
      --bg-sidebar: #ffffff;
      
      --text-heading: #4c1d95;  /* Deep Purple */
      --text-body: #4b5563;     /* Gray */
      --text-muted: #9ca3af;
      
      --success: #10b981; 
      --success-bg: #d1fae5;
      --danger: #ef4444; 
      --danger-bg: #fee2e2;
      --warning: #f59e0b;
      --warning-bg: #fef3c7;
      
      --radius: 24px;           /* Super rounded */
      --radius-sm: 12px;
      
      /* Fun Shadow */
      --shadow: 0 8px 20px -4px rgba(139, 92, 246, 0.15), 0 4px 8px -4px rgba(0,0,0,0.05);
      --shadow-pop: 0 10px 25px -5px rgba(124, 58, 237, 0.25);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body { 
      margin: 0; 
      font-family: 'Nunito', sans-serif; 
      background: var(--bg-body); 
      color: var(--text-body); 
      height: 100vh; 
      display: flex; 
      overflow: hidden; 
      font-size: 15px; 
      line-height: 1.6; 
      background-image: radial-gradient(#e9d5ff 1px, transparent 1px);
      background-size: 32px 32px;
    }

    /* Layout */
    .app-layout { display: flex; height: 100%; width: 100%; }
    
    /* Sidebar: Floating Dock Style */
    .sidebar { 
      width: 270px; 
      background: var(--bg-sidebar); 
      margin: 16px 0 16px 16px;
      border-radius: var(--radius);
      display: flex; 
      flex-direction: column; 
      flex-shrink: 0; 
      z-index: 50; 
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); 
      box-shadow: var(--shadow);
      border: 2px solid white;
    }

    .main-content { 
      flex: 1; 
      overflow-y: auto; 
      display: flex; 
      flex-direction: column; 
      position: relative; 
      scroll-behavior: smooth; 
      padding: 10px;
    }
    
    /* Headings */
    h1, h2, h3 { color: var(--text-heading); font-weight: 800; letter-spacing: -0.5px; }
    
    /* Card Component */
    .card { 
      background: var(--bg-card); 
      padding: 28px; 
      border-radius: var(--radius); 
      box-shadow: var(--shadow); 
      border: 1px solid #f3e8ff; 
      margin-bottom: 24px; 
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover { transform: translateY(-3px); box-shadow: var(--shadow-pop); }
    
    /* Buttons: Bouncy & Pill Shaped */
    .btn { 
      padding: 12px 20px; 
      border-radius: 999px; /* Pill */
      border: none;
      font-weight: 800; 
      cursor: pointer; 
      transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); 
      font-size: 14px; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center; 
      gap: 10px; 
      white-space: nowrap; 
      user-select: none; 
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .btn:active { transform: scale(0.92); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; filter: grayscale(1); }
    
    .btn-primary { 
      background: linear-gradient(135deg, var(--primary), var(--primary-dark)); 
      color: white; 
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); 
    }
    .btn-primary:hover { box-shadow: 0 6px 16px rgba(139, 92, 246, 0.6); transform: translateY(-2px); }
    
    .btn-accent { 
      background: linear-gradient(135deg, var(--accent), var(--accent-pop)); 
      color: white; 
      box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4); 
    }
    .btn-accent:hover { transform: translateY(-2px); }

    .btn-outline { 
      background: white; 
      border: 2px solid #e5e7eb; 
      color: var(--text-heading); 
    }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); background: #f5f3ff; }
    
    .btn-danger { background: #fee2e2; color: #b91c1c; }
    .btn-danger:hover { background: #fecaca; }
    
    .w-full { width: 100%; }
    
    /* Inputs */
    input, select { 
      width: 100%; 
      padding: 14px 18px; 
      margin-bottom: 20px; 
      border: 2px solid #e5e7eb; 
      border-radius: 16px; 
      font-size: 15px; 
      outline: none; 
      transition: all 0.2s; 
      background: #f9fafb; 
      color: var(--text-heading); 
      font-family: inherit;
      font-weight: 600;
    }
    input:focus, select:focus { 
      border-color: var(--primary); 
      background: white; 
      box-shadow: 0 0 0 4px var(--primary-light); 
    }
    label { 
      display: block; 
      margin-bottom: 8px; 
      font-size: 13px; 
      font-weight: 800; 
      color: var(--text-muted); 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      margin-left: 4px;
    }
    
    /* Stats Grid - Cards */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card { 
      background: white; 
      padding: 24px; 
      border-radius: var(--radius); 
      display: flex; 
      flex-direction: column; 
      align-items: center;
      text-align: center;
      box-shadow: var(--shadow);
      position: relative;
      overflow: hidden;
      border: 2px solid transparent;
      transition: 0.2s;
    }
    .stat-card:hover { border-color: var(--primary-light); transform: scale(1.03); }
    .stat-val { font-size: 32px; font-weight: 900; color: var(--text-heading); margin-top: 4px; line-height: 1; }
    .stat-label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: 8px; }
    .stat-icon { font-size: 24px; margin-bottom: 8px; background: var(--bg-body); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    /* Tables: Bubble Rows */
    .table-container { overflow-x: auto; background: transparent; box-shadow: none; border: none; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 10px; white-space: nowrap; }
    thead tr th { border: none; padding: 0 20px 10px 20px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; }
    tbody tr { background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.03); transition: transform 0.2s; }
    tbody tr:hover { transform: scale(1.01); box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
    tbody td { padding: 18px 20px; border: none; vertical-align: middle; color: var(--text-heading); font-weight: 600; }
    tbody tr td:first-child { border-top-left-radius: 16px; border-bottom-left-radius: 16px; }
    tbody tr td:last-child { border-top-right-radius: 16px; border-bottom-right-radius: 16px; }
    
    /* Badges */
    .badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; }
    .bg-green { background: var(--success-bg); color: #047857; }
    .bg-red { background: var(--danger-bg); color: #b91c1c; }
    .bg-amber { background: var(--warning-bg); color: #b45309; }
    .bg-blue { background: #dbeafe; color: #1e40af; }

    /* Navigation */
    .nav { padding: 20px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .nav-item { 
      padding: 14px 20px; 
      border-radius: 16px; 
      color: var(--text-body); 
      cursor: pointer; 
      font-weight: 700; 
      font-size: 15px; 
      display: flex; 
      align-items: center; 
      gap: 16px; 
      transition: all 0.2s; 
    }
    .nav-item svg { opacity: 0.6; transition: 0.2s; }
    .nav-item:hover { background: #f3f4f6; color: var(--primary); }
    .nav-item.active { background: #f5f3ff; color: var(--primary); box-shadow: inset 4px 0 0 var(--primary); }
    .nav-item.active svg { opacity: 1; stroke-width: 3; }
    
    /* Helper classes */
    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 12px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
    .center-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); padding: 20px; text-align: center; }
    
    /* Modals: Bouncy Popups */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(76, 29, 149, 0.4); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(8px); animation: fadeIn 0.3s ease-out; }
    .modal-content { background: white; width: 100%; max-width: 500px; padding: 40px; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 4px solid #f5f3ff; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes popIn { from { transform: scale(0.8) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }

    /* Search Results */
    .checkin-results { margin-top: 10px; max-height: 240px; overflow-y: auto; border-radius: 16px; border: 2px solid #e5e7eb; background: white; }
    .checkin-item { padding: 14px 20px; font-size: 14px; cursor: pointer; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
    .checkin-item:hover { background: #f9fafb; color: var(--primary); }

    /* Toast */
    #toast-container { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 200; display: flex; flex-direction: column; gap: 12px; width: 90%; max-width: 400px; }
    .toast { background: #1e293b; color: white; padding: 16px 24px; border-radius: 99px; font-size: 14px; font-weight: 700; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; gap: 10px; animation: slideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .toast.error { background: var(--danger); }
    .toast.success { background: var(--success); }
    @keyframes slideDown { from { transform: translate(0, -50px); opacity: 0; } to { transform: translate(0, 0); opacity: 1; } }

    /* Mobile */
    .mobile-header { display: none; }
    @media (max-width: 860px) {
      body { overflow: auto; background: var(--bg-body); }
      .app-layout { flex-direction: column; height: auto; }
      .sidebar { 
        position: fixed; inset: 0 auto 0 0; height: 100%; margin: 0; border-radius: 0; border: none;
        transform: translateX(-100%); 
        width: 280px;
      }
      .sidebar.open { transform: translateX(0); }
      .main-content { padding: 16px; }
      
      .mobile-header { display: flex; justify-content: space-between; padding: 16px 20px; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.05); align-items: center; position: sticky; top: 0; z-index: 40; }
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; display: none; backdrop-filter: blur(4px); }
      .overlay.open { display: block; }
      
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
      .stat-card { padding: 16px; }
      .stat-val { font-size: 24px; }
      
      input, select { font-size: 16px; } 
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}
