import { escapeHtml } from "../utils";

export function getIcon(name: string): string {
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
    print: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
    trophy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17"></path><path d="M14 14.66V17"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>',
    fire: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.115.385-2.256 1-3.241a4.346 4.346 0 0 1 1.5 2.741Z"></path></svg>'
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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&family=Oswald:wght@500;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary: #6366f1;       
      --primary-hover: #4f46e5;
      --accent: #06b6d4;        
      
      --bg-body: #0f172a;       /* Slate 900 */
      --bg-surface: #1e293b;    /* Slate 800 */
      --bg-card: #1e293b;
      --bg-hover: #334155;
      
      --text-main: #f8fafc;     /* Slate 50 */
      --text-sec: #94a3b8;      /* Slate 400 */
      --text-muted: #64748b;    
      
      --border: #334155;
      
      --success: #10b981;  
      --success-bg: rgba(16, 185, 129, 0.15);
      --danger: #ef4444;   
      --danger-bg: rgba(239, 68, 68, 0.15);
      --warning: #f59e0b;  
      --warning-bg: rgba(245, 158, 11, 0.15);
      --info: #3b82f6;     
      --info-bg: rgba(59, 130, 246, 0.15);
      
      --radius-lg: 16px;
      --radius-md: 10px;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body { 
      margin: 0; font-family: 'Inter', system-ui, sans-serif; 
      background: var(--bg-body); color: var(--text-main); 
      height: 100vh; display: flex; font-size: 14px; 
      overflow: hidden;
    }

    h1, h2, h3, h4, h5 { font-family: 'Oswald', sans-serif; font-weight: 500; margin: 0; text-transform: uppercase; letter-spacing: 0.03em; }
    
    .app-layout { display: flex; height: 100%; width: 100%; }
    
    .sidebar { width: 260px; background: #020617; border-right: 1px solid var(--border); display: flex; flex-direction: column; flex-shrink: 0; z-index: 50; }
    .sidebar-header { padding: 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--border); }
    .brand-icon { width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: var(--radius-md); color: white; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }
    
    .nav { padding: 16px 12px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .nav-item { padding: 12px 16px; border-radius: var(--radius-md); color: var(--text-sec); cursor: pointer; font-weight: 500; font-size: 14px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; border: 1px solid transparent; }
    .nav-item:hover { background: var(--bg-hover); color: var(--text-main); }
    .nav-item.active { background: rgba(99, 102, 241, 0.15); color: var(--primary); border-color: rgba(99, 102, 241, 0.3); }
    
    .main-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; position: relative; padding: 24px; padding-bottom: 100px; background: radial-gradient(circle at top right, #1e293b 0%, #0f172a 40%); }

    .card { background: var(--bg-card); padding: 24px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border); margin-bottom: 20px; position: relative; overflow: hidden; }
    
    .btn { padding: 10px 20px; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid transparent; outline: none; }
    .btn:active { transform: scale(0.98); }
    .btn-primary { background: linear-gradient(135deg, var(--primary), #4338ca); color: white; border: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .btn-outline { background: transparent; border-color: var(--border); color: var(--text-main); }
    .btn-outline:hover { background: var(--bg-hover); border-color: var(--text-sec); }
    .btn-danger { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; }
    .btn-sm { padding: 6px 12px; font-size: 11px; }

    input, select { width: 100%; padding: 12px 16px; margin-bottom: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); font-size: 14px; outline: none; transition: all 0.2s; background: #020617; color: white; }
    input:focus, select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2); }
    label { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 700; color: var(--text-sec); text-transform: uppercase; letter-spacing: 0.05em; }

    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-surface); padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--border); display: flex; flex-direction: column; position: relative; overflow: hidden; }
    .stat-val { font-size: 28px; font-family: 'Oswald', sans-serif; font-weight: 700; color: white; margin-bottom: 4px; }
    .stat-label { font-size: 12px; color: var(--text-sec); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }

    table { width: 100%; border-collapse: separate; border-spacing: 0; }
    th { text-align: left; padding: 16px; font-size: 11px; text-transform: uppercase; color: var(--text-sec); border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); letter-spacing: 0.05em; }
    td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 13px; color: var(--text-main); }
    tr:last-child td { border-bottom: none; }
    
    .badge { padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; letter-spacing: 0.05em; }
    .bg-green { background: var(--success-bg); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
    .bg-red { background: var(--danger-bg); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
    .bg-amber { background: var(--warning-bg); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    .bg-blue { background: var(--info-bg); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }

    .bottom-nav { display: none; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main-content { padding: 16px; padding-bottom: 90px; }
      .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(10px); border-top: 1px solid var(--border); padding: 8px 0 24px 0; justify-content: space-around; z-index: 90; }
      .b-nav-item { display: flex; flex-direction: column; align-items: center; font-size: 10px; color: var(--text-sec); padding: 6px; border-radius: 8px; width: 64px; }
      .b-nav-item.active { color: var(--primary); background: rgba(99, 102, 241, 0.1); }
      .desktop-table { display: none; }
      .mobile-list { display: flex; flex-direction: column; gap: 12px; }
      .m-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center; }
      .m-info { flex: 1; margin-right: 12px; }
      .m-title { font-weight: 600; font-size: 14px; color: white; margin-bottom: 4px; }
      .m-sub { font-size: 12px; color: var(--text-sec); }
    }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px); padding: 16px; }
    .modal-content { background: var(--bg-surface); width: 100%; max-width: 480px; padding: 24px; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); border: 1px solid var(--border); max-height: 90vh; overflow-y: auto; }

    .fab { position: fixed; bottom: 90px; right: 20px; width: 56px; height: 56px; border-radius: 50%; background: var(--primary); color: white; display: none; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(99, 102, 241, 0.5); z-index: 80; cursor: pointer; }
    @media (max-width: 768px) { .fab { display: flex; } }

    .hidden { display: none !important; }
    .flex { display: flex; align-items: center; gap: 10px; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .w-full { width: 100%; }
    .text-center { text-align: center; }
    .text-muted { color: var(--text-sec); }
    .text-xs { font-size: 11px; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    #toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 200; display: flex; flex-direction: column; gap: 8px; width: 90%; max-width: 350px; }
    .toast { background: #0f172a; color: white; padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 10px; border: 1px solid var(--border); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
    
    .progress-bar-bg { width: 100%; height: 6px; background: #334155; border-radius: 3px; overflow: hidden; margin-top: 6px; }
    .progress-bar-fill { height: 100%; background: var(--success); width: 0%; transition: width 0.3s; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>`;
}
