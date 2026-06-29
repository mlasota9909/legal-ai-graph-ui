// Lawyer view — shell, login flow, sidebar, tab strip, chat bar.
// Aesthetic carries forward from Atrium (calm, editorial, slate-teal accent).

function apiAuthHeaders(withJson) {
  const headers = {};
  if (withJson) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('legal_ai_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

const LD = window.LawyerData;
const OD = window.LegalAIMockData;  // operator-side data (chronology/people/entities)

const LawTheme = {
  bg: '#F7F6F2',
  bgDeep: '#EFEDE6',
  panel: '#FFFFFF',
  panelDim: '#FBFAF5',
  ink: '#1B1B19',
  ink2: '#4A4A45',
  ink3: '#8A8A82',
  ink4: '#B5B2A8',
  rule: '#E8E6DF',
  ruleSoft: '#F0EEE7',
  accent: '#3F5E5A',
  accentSoft: '#E6EEEC',
  accentDeep: '#2D4844',
  good: '#3F7A4D',
  goodSoft: '#E6F0E7',
  warn: '#A66A1E',
  warnSoft: '#F5ECDB',
  bad: '#A24B3A',
  badSoft: '#F2E3DE',
  serif: '"Source Serif Pro", "Tiempos Text", Georgia, serif',
  sans: '"Inter", "Söhne", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
};
const LW = LawTheme;

const lawStyle = `
  .lw-root{font-family:${LW.sans};color:${LW.ink};background:${LW.bg};width:100%;min-height:100%;
    -webkit-font-smoothing:antialiased;letter-spacing:-0.003em}
  .lw-root *{box-sizing:border-box}
  .lw-mono{font-family:${LW.mono};font-variant-numeric:tabular-nums}
  .lw-serif{font-family:${LW.serif};letter-spacing:-0.012em}

  /* ── Login ────────────────────────────────────────────── */
  .lw-login{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(ellipse at top, #FFFDF7 0%, ${LW.bg} 38%, ${LW.bgDeep} 100%);
    padding:24px;z-index:5}
  .lw-login-banner{position:absolute;top:18px;left:50%;transform:translateX(-50%);
    background:${LW.warnSoft};color:${LW.warn};font-size:11.5px;padding:6px 14px;border-radius:99px;
    border:1px solid #E8D6B5;font-weight:500;display:flex;align-items:center;gap:8px}
  .lw-login-banner b{font-weight:600}
  .lw-login-card{width:380px;background:${LW.panel};border:1px solid ${LW.rule};border-radius:14px;
    box-shadow:0 1px 0 ${LW.ruleSoft},0 30px 60px rgba(20,20,18,.08);
    padding:34px 32px 28px}
  .lw-login-mark{display:flex;align-items:center;gap:10px;font-weight:600;font-size:13.5px;margin-bottom:18px}
  .lw-login-dot{width:9px;height:9px;border-radius:50%;background:${LW.accent};box-shadow:0 0 0 4px ${LW.accentSoft}}
  .lw-login h1{font-family:${LW.serif};font-size:22px;font-weight:500;letter-spacing:-0.018em;margin:0 0 6px}
  .lw-login p.sub{font-size:13px;color:${LW.ink3};margin:0 0 22px;line-height:1.5}
  .lw-field{display:flex;flex-direction:column;gap:5px;margin-bottom:14px}
  .lw-field label{font-size:11.5px;color:${LW.ink2};font-weight:500;letter-spacing:.01em}
  .lw-field input{font:inherit;font-size:13.5px;padding:10px 12px;border:1px solid ${LW.rule};border-radius:8px;
    background:${LW.panelDim};color:${LW.ink};transition:border-color .12s,background .12s}
  .lw-field input:focus{outline:none;border-color:${LW.accent};background:${LW.panel};
    box-shadow:0 0 0 3px ${LW.accentSoft}}
  .lw-field input.error{border-color:${LW.bad};background:${LW.badSoft}}
  .lw-row{display:flex;align-items:center;justify-content:space-between;margin:-4px 0 18px;font-size:12px;color:${LW.ink2}}
  .lw-row label{display:flex;align-items:center;gap:7px;cursor:pointer}
  .lw-row a{color:${LW.accent};text-decoration:none;font-weight:500}
  .lw-row a:hover{text-decoration:underline}
  .lw-btn{font:inherit;font-size:13.5px;font-weight:600;padding:10px 14px;border-radius:8px;cursor:pointer;
    border:1px solid ${LW.rule};background:${LW.panel};color:${LW.ink};transition:all .12s;width:100%}
  .lw-btn.primary{background:${LW.accent};color:#fff;border-color:${LW.accent}}
  .lw-btn.primary:hover{background:${LW.accentDeep}}
  .lw-btn.ghost{background:transparent;border:0;color:${LW.ink3};font-weight:500;width:auto;padding:6px 0}
  .lw-btn.ghost:hover{color:${LW.accent}}
  .lw-divider{display:flex;align-items:center;gap:10px;margin:18px 0 12px;font-size:11px;
    color:${LW.ink3};letter-spacing:.08em;text-transform:uppercase}
  .lw-divider::before, .lw-divider::after{content:'';flex:1;border-top:1px solid ${LW.ruleSoft}}
  .lw-sso{display:flex;flex-direction:column;gap:8px}
  .lw-sso .lw-btn{display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px}
  .lw-foot{margin-top:22px;font-size:11px;color:${LW.ink3};text-align:center;line-height:1.5}

  /* MFA grid */
  .lw-mfa-eyebrow{display:flex;align-items:center;gap:8px;font-size:11px;color:${LW.accent};
    letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-bottom:12px}
  .lw-otp{display:flex;gap:8px;margin-bottom:14px}
  .lw-otp input{flex:1;text-align:center;font-family:${LW.mono};font-size:22px;font-weight:600;
    padding:14px 0;border:1px solid ${LW.rule};border-radius:8px;background:${LW.panelDim};color:${LW.ink};
    transition:border-color .12s,background .12s;letter-spacing:.04em}
  .lw-otp input:focus{outline:none;border-color:${LW.accent};background:${LW.panel};
    box-shadow:0 0 0 3px ${LW.accentSoft}}
  .lw-otp input.filled{border-color:${LW.accent};background:${LW.panel}}
  .lw-mfa-note{font-size:12px;color:${LW.ink3};margin:0 0 18px;line-height:1.5}
  .lw-mfa-note b{color:${LW.ink};font-weight:500}

  /* ── App shell ────────────────────────────────────────── */
  .lw-app{display:grid;grid-template-rows:48px 1fr;height:100%;min-height:0;flex:1}
  .lw-header{display:flex;align-items:stretch;border-bottom:1px solid ${LW.rule};background:${LW.panel};
    padding:0 18px 0 22px;height:48px;flex-shrink:0}
  .lw-header .brand{display:flex;align-items:center;gap:9px;font-weight:600;font-size:13px;
    padding-right:22px;border-right:1px solid ${LW.rule};margin-right:18px}
  .lw-header .brand-dot{width:9px;height:9px;border-radius:50%;background:${LW.accent};
    box-shadow:0 0 0 4px ${LW.accentSoft}}
  .lw-crumb{display:flex;align-items:center;gap:10px;font-size:12.5px;color:${LW.ink3};flex:1;min-width:0}
  .lw-crumb b{color:${LW.ink};font-weight:500}
  .lw-crumb .sep{color:${LW.ink4}}
  .lw-matter-picker{display:inline-flex;align-items:center;gap:6px;padding:4px 9px 4px 11px;border-radius:6px;
    background:${LW.bg};color:${LW.ink};font-weight:500;cursor:pointer;font-size:12.5px;transition:background .12s}
  .lw-matter-picker:hover{background:${LW.accentSoft}}
  .lw-header .meta{display:flex;align-items:center;gap:18px;font-size:12px;color:${LW.ink3}}
  .lw-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;
    border:1px solid ${LW.rule};font-size:11.5px;color:${LW.ink2};background:${LW.bg}}
  .lw-pill .dot{width:5px;height:5px;border-radius:50%;background:${LW.good}}
  .lw-user{display:flex;align-items:center;gap:8px;padding:4px 10px 4px 4px;border-radius:99px;
    background:${LW.accent};color:#fff;font-size:12px;font-weight:500;cursor:pointer;border:0;font:inherit}
  .lw-user .av{width:26px;height:26px;border-radius:50%;background:#fff;color:${LW.accent};
    display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;
    font-family:${LW.mono};letter-spacing:.02em}
  .lw-user-wrap{position:relative}
  .lw-user-menu{position:absolute;top:calc(100% + 6px);right:0;z-index:40;
    background:${LW.panel};border:1px solid ${LW.rule};border-radius:10px;
    box-shadow:0 14px 40px rgba(20,20,18,.18),0 2px 6px rgba(0,0,0,.06);padding:6px;
    width:220px;font-family:${LW.sans}}
  .lw-user-menu-hd{padding:8px 10px 10px;border-bottom:1px solid ${LW.ruleSoft};margin-bottom:4px}
  .lw-user-menu-hd .nm{font-size:13px;font-weight:600;color:${LW.ink}}
  .lw-user-menu-hd .em{font-size:11px;color:${LW.ink3};font-family:${LW.mono};margin-top:2px}
  .lw-user-menu-row{display:block;width:100%;padding:8px 10px;border:0;background:transparent;
    text-align:left;cursor:pointer;font:inherit;font-size:12.5px;color:${LW.ink2};border-radius:7px;transition:background .12s}
  .lw-user-menu-row:hover{background:${LW.bg};color:${LW.ink}}

  .lw-main{display:grid;grid-template-columns:360px minmax(0,1fr);min-height:0}
  .lw-center{display:grid;grid-template-rows:auto auto 1fr auto;grid-template-columns:minmax(0,1fr);min-height:0;min-width:0;background:${LW.bg}}

  /* ── Sidebar (calm file browser) ────────────────────── */
  .lw-side{background:${LW.bg};border-right:1px solid ${LW.rule};
    display:flex;flex-direction:column;min-height:0;overflow:hidden}

  /* Matter header */
  .lw-matter-head{padding:16px 18px 14px;border-bottom:1px solid ${LW.rule};background:${LW.panel}}
  .lw-matter-head .e{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${LW.ink3};
    font-weight:600;margin-bottom:6px}
  .lw-matter-name{font-family:${LW.serif};font-size:17px;font-weight:500;letter-spacing:-0.014em;
    color:${LW.ink};line-height:1.25;margin-bottom:6px}
  .lw-matter-meta{font-size:11.5px;color:${LW.ink3};display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .lw-matter-meta .dot{color:${LW.ink4}}
  .lw-matter-switch{font:inherit;font-size:11.5px;font-weight:500;padding:5px 10px;border-radius:6px;
    background:transparent;border:1px solid ${LW.rule};color:${LW.ink2};cursor:pointer;
    display:inline-flex;align-items:center;gap:5px;transition:all .12s;margin-top:10px}
  .lw-matter-switch:hover{border-color:${LW.accent};color:${LW.accent}}
  .lw-matter-dd{position:relative}
  .lw-matter-dd-panel{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:30;
    background:${LW.panel};border:1px solid ${LW.rule};border-radius:10px;
    box-shadow:0 12px 32px rgba(20,20,18,.12);padding:6px;max-height:340px;overflow-y:auto}
  .lw-matter-row{padding:9px 11px;border-radius:7px;cursor:pointer;transition:background .12s}
  .lw-matter-row:hover{background:${LW.bg}}
  .lw-matter-row.active{background:${LW.accentSoft}}
  .lw-matter-row .name{font-size:13px;font-weight:500;color:${LW.ink};line-height:1.3}
  .lw-matter-row .meta{font-size:11px;color:${LW.ink3};margin-top:2px}

  /* Friendly search */
  .lw-side-search{padding:12px 14px 10px;background:${LW.panel};border-bottom:1px solid ${LW.ruleSoft}}
  .lw-side-search-row{position:relative}
  .lw-side-search-row input{font:inherit;font-size:13px;padding:10px 36px 10px 34px;border:1px solid ${LW.rule};
    border-radius:8px;width:100%;background:${LW.bg};color:${LW.ink};
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238A8A82' stroke-width='1.5'><circle cx='7' cy='7' r='5'/><path d='M11 11l3 3'/></svg>");
    background-repeat:no-repeat;background-position:11px center;background-size:14px;transition:all .12s}
  .lw-side-search-row input::placeholder{color:${LW.ink3}}
  .lw-side-search-row input:focus{outline:none;border-color:${LW.accent};background:${LW.panel};
    box-shadow:0 0 0 3px ${LW.accentSoft}}
  .lw-side-search-row .clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);
    width:20px;height:20px;border:0;background:${LW.ink4};border-radius:50%;color:#fff;
    cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:0;
    padding:0;font:inherit}
  .lw-side-search-row .clear:hover{background:${LW.ink2}}

  /* Body scroll */
  .lw-side-body{flex:1;overflow-y:auto;background:${LW.bg};padding:4px 0 12px}
  .lw-side-body::-webkit-scrollbar{width:10px}
  .lw-side-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:6px;
    border:2px solid transparent;background-clip:content-box}
  .lw-side-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.22);
    background-clip:content-box;border:2px solid transparent}

  /* Smart section header */
  .lw-sect-head{display:flex;align-items:center;gap:8px;padding:14px 18px 6px;cursor:pointer;user-select:none}
  .lw-sect-head h4{margin:0;font-size:10.5px;color:${LW.ink3};letter-spacing:.1em;text-transform:uppercase;
    font-weight:600;display:flex;align-items:center;gap:7px;flex:1;min-width:0}
  .lw-sect-head h4 .ic{color:${LW.ink3};display:inline-flex}
  .lw-sect-head h4 .ic.pin{color:${LW.warn}}
  .lw-sect-head h4 .ic.attn{color:${LW.warn}}
  .lw-sect-head .c{font-size:10.5px;color:${LW.ink3};font-family:${LW.mono}}
  .lw-sect-head .chev{color:${LW.ink3};display:inline-flex;transition:transform .15s}
  .lw-sect-head .chev.open{transform:rotate(90deg)}

  /* Doc card (used across all sections) */
  .lw-doc-card{padding:9px 18px;cursor:pointer;display:grid;grid-template-columns:18px 1fr auto;gap:11px;
    transition:background .12s;position:relative;align-items:start}
  .lw-doc-card:hover{background:${LW.panel}}
  .lw-doc-card.active{background:${LW.panel}}
  .lw-doc-card.active::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:${LW.accent}}
  .lw-doc-card .ic{padding-top:3px;color:${LW.ink3};display:flex;align-items:flex-start;justify-content:center}
  .lw-doc-card.active .ic{color:${LW.accent}}
  .lw-doc-card.attn .ic{color:${LW.warn}}
  .lw-doc-card .title{font-size:13px;color:${LW.ink};font-weight:500;line-height:1.4;
    overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;margin-bottom:3px}
  .lw-doc-card.active .title{font-weight:600;color:${LW.accentDeep}}
  .lw-doc-card .meta{display:flex;align-items:center;gap:6px;font-size:11px;color:${LW.ink3};flex-wrap:wrap}
  .lw-doc-card .meta .dot{color:${LW.ink4}}
  .lw-doc-card .meta b{color:${LW.ink2};font-weight:500;font-family:${LW.mono}}
  .lw-doc-card .attn-note{font-size:11px;color:${LW.warn};margin-top:3px;display:flex;align-items:center;gap:5px}

  .lw-doc-right{display:flex;align-items:center;gap:6px;padding-top:3px}
  .lw-status-dot{width:7px;height:7px;border-radius:50%;background:${LW.good};flex-shrink:0;
    display:inline-block;position:relative}
  .lw-status-dot.processing{background:${LW.accent}}
  .lw-status-dot.queued{background:${LW.warn}}
  .lw-status-dot.processing::after{content:'';position:absolute;inset:-3px;border-radius:50%;
    border:2px solid ${LW.accentSoft};animation:lw-pulse 1.6s ease-in-out infinite}
  @keyframes lw-pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:0;transform:scale(1.6)}}
  .lw-pin-ic{color:${LW.warn};display:inline-flex}
  .lw-doc-card .actions{display:flex;align-items:center;gap:2px;opacity:0;transition:opacity .12s}
  .lw-doc-card:hover .actions{opacity:1}
  .lw-doc-card .actions button{background:transparent;border:0;padding:3px;border-radius:4px;
    cursor:pointer;color:${LW.ink3};display:flex;align-items:center;justify-content:center;line-height:0}
  .lw-doc-card .actions button:hover{background:${LW.bg};color:${LW.ink}}
  .lw-doc-card .pin-toggle{width:20px;height:20px;border:0;background:transparent;border-radius:4px;
    color:${LW.ink3};cursor:pointer;font:inherit;font-size:14px;line-height:1;display:inline-flex;
    align-items:center;justify-content:center;opacity:0;transition:opacity .12s,color .12s,background .12s}
  .lw-doc-card:hover .pin-toggle,.lw-doc-card .pin-toggle.pinned{opacity:1}
  .lw-doc-card .pin-toggle:hover{background:${LW.bg};color:${LW.warn}}
  .lw-doc-card .pin-toggle.pinned{color:${LW.warn}}

  /* Folder accordion */
  .lw-fold-head{display:flex;align-items:center;gap:9px;padding:9px 18px;cursor:pointer;
    user-select:none;transition:background .12s}
  .lw-fold-head:hover{background:${LW.panel}}
  .lw-fold-head .chev{color:${LW.ink3};display:inline-flex;transition:transform .15s}
  .lw-fold-head .chev.open{transform:rotate(90deg)}
  .lw-fold-head .ic{color:${LW.ink3};display:inline-flex}
  .lw-fold-head .nm{flex:1;min-width:0;font-size:13px;color:${LW.ink};font-weight:500}
  .lw-fold-head .c{font-size:11px;color:${LW.ink3};font-family:${LW.mono}}
  .lw-fold-head.has-flag .nm::after{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;
    background:${LW.warn};margin-left:8px;vertical-align:middle}

  .lw-fold-more{padding:6px 18px 8px 50px;font-size:11.5px;color:${LW.accent};cursor:pointer;font-weight:500;
    display:inline-flex;align-items:center;gap:5px}
  .lw-fold-more:hover{text-decoration:underline}

  /* Search results header */
  .lw-search-head{padding:12px 18px 4px;display:flex;align-items:center;justify-content:space-between}
  .lw-search-head h4{margin:0;font-size:10.5px;color:${LW.ink3};letter-spacing:.1em;text-transform:uppercase;font-weight:600}
  .lw-search-head .c{font-size:11px;color:${LW.ink3};font-family:${LW.mono}}
  .lw-search-empty{padding:28px 18px;color:${LW.ink3};font-size:12.5px;text-align:center;line-height:1.5}

  /* Footer */
  .lw-side-foot{padding:10px 14px;border-top:1px solid ${LW.rule};background:${LW.panel};
    display:flex;align-items:center;gap:8px}
  .lw-side-foot .lw-btn{flex:1;padding:9px 12px;font-size:12.5px;display:flex;align-items:center;justify-content:center;gap:6px}
  .lw-side-foot .lw-btn-icon{flex:0 0 38px;padding:9px 0;display:flex;align-items:center;justify-content:center;
    background:${LW.panel};border:1px solid ${LW.rule};border-radius:8px;color:${LW.ink3};cursor:pointer;font:inherit}
  .lw-side-foot .lw-btn-icon:hover{color:${LW.ink};border-color:${LW.ink4}}

  /* ── Main column (doc header + tabs + content + chat) ──── */
  .lw-doc-header{padding:18px 28px 14px;background:${LW.panel};border-bottom:1px solid ${LW.rule};
    display:flex;align-items:flex-start;justify-content:space-between;gap:20px;min-width:0}
  .lw-doc-header .left{min-width:0;flex:1 1 auto}
  .lw-doc-header .left .eye{font-size:10.5px;color:${LW.ink3};letter-spacing:.12em;text-transform:uppercase;font-weight:600;margin-bottom:5px}
  .lw-doc-header .left h1{font-family:${LW.serif};font-size:22px;font-weight:500;letter-spacing:-0.018em;margin:0 0 5px}
  .lw-doc-header .left .meta{font-size:12px;color:${LW.ink2};display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .lw-doc-header .left .meta b{color:${LW.ink};font-family:${LW.mono};font-weight:500}
  .lw-doc-header .right{display:flex;align-items:center;gap:10px}
  .lw-conf-pill{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 12px;background:${LW.bg};
    border:1px solid ${LW.rule};border-radius:99px;font-size:11.5px;color:${LW.ink2}}
  .lw-conf-pill b{font-family:${LW.mono};color:${LW.ink};font-weight:600}
  .lw-conf-ring{width:18px;height:18px;border-radius:50%;background:conic-gradient(${LW.good} calc(var(--p)*1%),${LW.ruleSoft} 0);
    position:relative;display:inline-block}
  .lw-conf-ring::after{content:'';position:absolute;inset:3px;border-radius:50%;background:${LW.bg}}

  .lw-tabs{display:flex;gap:0;padding:0 28px;background:${LW.panel};border-bottom:1px solid ${LW.rule};
    overflow-x:auto;white-space:nowrap;scrollbar-width:none}
  .lw-tabs::-webkit-scrollbar{display:none}
  .lw-tab{font:inherit;font-size:13px;font-weight:500;padding:11px 16px;background:transparent;
    border:0;border-bottom:2px solid transparent;color:${LW.ink2};cursor:pointer;
    display:flex;align-items:center;gap:8px;margin-bottom:-1px;transition:color .12s}
  .lw-tab:hover{color:${LW.ink}}
  .lw-tab.active{color:${LW.ink};border-bottom-color:${LW.accent};font-weight:600}
  .lw-tab .cnt{font-family:${LW.mono};font-size:10.5px;color:${LW.ink3};font-weight:400;
    padding:1.5px 6px;border-radius:99px;background:${LW.bg}}
  .lw-tab.active .cnt{background:${LW.accentSoft};color:${LW.accent}}
  .lw-tab .flag{display:inline-block;width:6px;height:6px;border-radius:50%;background:${LW.warn}}

  .lw-canvas{overflow-y:auto;padding:24px 28px 32px;min-height:0;background:${LW.bg}}

  /* ── Chat bar (bottom dock) ───────────────────────────── */
  .lw-chat{background:${LW.panel};border-top:1px solid ${LW.rule};
    display:flex;flex-direction:column;flex-shrink:0;transition:max-height .25s ease}
  .lw-chat.collapsed{max-height:88px}
  .lw-chat.expanded{max-height:380px}
  .lw-chat-conv{overflow-y:auto;padding:16px 28px 6px;flex:1;min-height:0}
  .lw-chat.collapsed .lw-chat-conv{display:none}
  .lw-chat-turn{margin-bottom:14px;display:flex;flex-direction:column;gap:4px}
  .lw-chat-turn.user{align-items:flex-end}
  .lw-chat-bubble{max-width:680px;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.55}
  .lw-chat-turn.user .lw-chat-bubble{background:${LW.accent};color:#fff}
  .lw-chat-turn.assistant .lw-chat-bubble{background:${LW.bg};color:${LW.ink}}
  .lw-chat-turn.assistant .lw-chat-bubble.loading{color:${LW.ink3};font-style:italic}
  .lw-chat-byline{font-size:10.5px;color:${LW.ink3};font-family:${LW.mono};letter-spacing:.02em}
  .lw-chat-source{margin-left:6px;text-transform:uppercase;font-size:9.5px;color:${LW.accent}}
  .lw-chat-cites{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
  .lw-chat-cite{font-family:${LW.mono};font-size:10.5px;padding:2px 8px;border-radius:99px;
    background:${LW.accentSoft};color:${LW.accent};cursor:pointer;transition:background .12s;font-weight:500}
  .lw-chat-cite:hover{background:#D7E5E2}

  .lw-chat-prompts{display:flex;gap:8px;padding:8px 28px 6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none}
  .lw-chat-prompts::-webkit-scrollbar{display:none}
  .lw-chat.expanded .lw-chat-prompts{display:none}
  .lw-prompt{font-size:11.5px;padding:6px 12px;border-radius:99px;border:1px solid ${LW.rule};
    background:${LW.bg};color:${LW.ink2};cursor:pointer;font:inherit;font-weight:500;transition:all .12s;flex-shrink:0}
  .lw-prompt:hover{border-color:${LW.accent};color:${LW.accentDeep};background:${LW.accentSoft}}

  .lw-chat-input-row{display:flex;align-items:center;gap:10px;padding:10px 28px 16px}
  .lw-chat-input{flex:1;display:flex;align-items:center;background:${LW.bg};border:1px solid ${LW.rule};
    border-radius:10px;padding:0 0 0 14px;transition:border-color .12s,background .12s}
  .lw-chat-input:focus-within{border-color:${LW.accent};background:${LW.panel};box-shadow:0 0 0 3px ${LW.accentSoft}}
  .lw-chat-input input{flex:1;font:inherit;font-size:13.5px;padding:11px 0;border:0;background:transparent;color:${LW.ink};outline:none}
  .lw-chat-input input::placeholder{color:${LW.ink4}}
  .lw-chat-toggle, .lw-chat-send{display:flex;align-items:center;justify-content:center;width:38px;height:38px;
    border:0;border-radius:8px;background:transparent;color:${LW.ink3};cursor:pointer;transition:all .12s}
  .lw-chat-toggle:hover{color:${LW.ink}}
  .lw-chat-send{background:${LW.accent};color:#fff;margin:4px}
  .lw-chat-send:hover{background:${LW.accentDeep}}
  .lw-chat-scope{font-size:11px;color:${LW.ink3};display:flex;align-items:center;gap:6px}
  .lw-chat-scope b{color:${LW.ink2};font-weight:500}

  /* ── Export popover ─────────────────────────────────── */
  .lw-exp{position:relative;display:inline-block}
  .lw-exp-pop{position:absolute;top:calc(100% + 6px);right:0;z-index:40;
    background:${LW.panel};border:1px solid ${LW.rule};border-radius:10px;
    box-shadow:0 14px 40px rgba(20,20,18,.18),0 2px 6px rgba(0,0,0,.06);padding:6px;
    width:280px;font-family:${LW.sans}}
  .lw-exp-hd{font-size:10.5px;color:${LW.ink3};letter-spacing:.08em;text-transform:uppercase;
    font-weight:600;padding:8px 10px 6px}
  .lw-exp-row{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-radius:8px;
    border:0;background:transparent;width:100%;text-align:left;cursor:pointer;font:inherit;
    transition:background .12s;color:${LW.ink}}
  .lw-exp-row:hover{background:${LW.bg}}
  .lw-exp-row[disabled]{opacity:.45;cursor:not-allowed}
  .lw-exp-row[disabled]:hover{background:transparent}
  .lw-exp-row .ic{flex-shrink:0;padding-top:1px;width:18px;height:18px;display:flex;align-items:center;justify-content:center}
  .lw-exp-row .t{font-size:13px;color:${LW.ink};font-weight:500;line-height:1.3}
  .lw-exp-row .s{font-size:11px;color:${LW.ink3};margin-top:1px;line-height:1.4}
  .lw-exp-foot{font-size:10.5px;color:${LW.ink3};padding:8px 10px 6px;border-top:1px solid ${LW.ruleSoft};line-height:1.5;margin-top:4px}
  .lw-exp-fired{display:flex;align-items:center;gap:10px;padding:14px 12px;color:${LW.accent};
    font-size:12.5px;line-height:1.5}
  .lw-exp-fired .d{width:9px;height:9px;border-radius:50%;background:${LW.accent};flex-shrink:0;animation:lw-pulse 1.4s ease-in-out infinite}

  /* ── Upload modal "steer" field ─────────────────────── */
  .lw-up-card{background:${LW.bg};border:1px solid ${LW.rule};border-radius:10px;padding:12px 14px;
    display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .lw-up-card .ic{width:34px;height:34px;border-radius:8px;background:${LW.accentSoft};color:${LW.accent};
    display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .lw-up-card .nm{font-size:13.5px;color:${LW.ink};font-weight:500;line-height:1.3}
  .lw-up-card .sub{font-size:11.5px;color:${LW.ink3};font-family:${LW.mono};margin-top:2px}

  .lw-steer{margin-bottom:14px}
  .lw-steer label{display:block;font-size:12px;color:${LW.ink2};font-weight:500;margin-bottom:4px}
  .lw-steer label .opt{color:${LW.ink3};font-weight:400;font-family:${LW.mono};font-size:11px;margin-left:6px}
  .lw-steer textarea{font:inherit;font-size:13px;line-height:1.5;padding:10px 12px;border:1px solid ${LW.rule};
    border-radius:8px;width:100%;background:${LW.panelDim};color:${LW.ink};resize:vertical;min-height:72px;
    transition:all .12s}
  .lw-steer textarea:focus{outline:none;border-color:${LW.accent};background:${LW.panel};box-shadow:0 0 0 3px ${LW.accentSoft}}
  .lw-steer .hint{font-size:11px;color:${LW.ink3};margin-top:6px;line-height:1.45}

  .lw-steer-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .lw-steer-chip{font:inherit;font-size:11.5px;padding:4px 10px;border-radius:99px;
    border:1px solid ${LW.rule};background:${LW.panel};color:${LW.ink2};cursor:pointer;font-weight:500;transition:all .12s}
  .lw-steer-chip:hover{border-color:${LW.accent};color:${LW.accentDeep}}
  .lw-steer-chip.active{background:${LW.accentSoft};border-color:${LW.accent};color:${LW.accentDeep}}
`;

function injectLawStyle() {
  if (!document.getElementById('lawyer-style')) {
    const s = document.createElement('style');
    s.id = 'lawyer-style';
    s.textContent = lawStyle;
    document.head.appendChild(s);
  }
}

function useLawyerDebugIds() {
  const [debugIds, setDebugIds] = React.useState(
    () => localStorage.getItem('lw_debug_ids') === 'true'
  );
  const toggleDebugIds = () => {
    const next = !debugIds;
    setDebugIds(next);
    localStorage.setItem('lw_debug_ids', String(next));
  };
  return [debugIds, toggleDebugIds];
}

function LawyerDebugToggle({ debugIds, onToggle }) {
  return (
    <button
      onClick={onToggle}
      title={debugIds ? 'Hide debug IDs' : 'Show debug IDs'}
      style={{
        position: 'fixed', top: 8, right: 8, zIndex: 9999,
        fontSize: 10, padding: '2px 8px', borderRadius: 4,
        background: debugIds ? '#E8F4FD' : '#F5F5F0',
        border: `1px solid ${debugIds ? '#3B82F6' : '#D0CEC8'}`,
        color: debugIds ? '#1D4ED8' : '#6B6B62',
        cursor: 'pointer', fontFamily: 'monospace',
      }}
    >
      {debugIds ? '⊖ Debug IDs' : '⊕ Debug IDs'}
    </button>
  );
}

// ─── Login ─────────────────────────────────────────────────────────────

function LoginScreen({ onSignedIn }) {
  const [stage, setStage] = React.useState('signin');  // signin | mfa
  const [email, setEmail] = React.useState('d.singh@atrium-legal.com.au');
  const [pw, setPw] = React.useState('•••••••••');
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = React.useState(false);
  const otpRefs = React.useRef([]);

  const doSignIn = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setStage('mfa'); }, 600);
  };

  const setOtpDigit = (i, v) => {
    const next = [...otp];
    next[i] = v.replace(/\D/g,'').slice(0,1);
    setOtp(next);
    if (next[i] && i < 5) otpRefs.current[i+1]?.focus();
    if (next.every(d => d !== '')) {
      setTimeout(() => { setSubmitting(true); setTimeout(onSignedIn, 600); }, 200);
    }
  };

  return (
    <div className="lw-login">
      <div className="lw-login-banner">
        <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor' }} />
        Demo only — any credentials work, or use <b>Skip → demo mode</b>
      </div>
      <div className="lw-login-card">
        <div className="lw-login-mark"><span className="lw-login-dot" /> Atrium · legal workbench</div>
        {stage === 'signin' && (
          <form onSubmit={doSignIn}>
            <h1 className="lw-serif">Sign in to your matters.</h1>
            <p className="sub">Your firm uses single-sign-on with MFA. Sessions are bound to this workstation and expire after 12 hours of inactivity.</p>
            <div className="lw-field">
              <label htmlFor="lw-email">Work email</label>
              <input id="lw-email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="lw-field">
              <label htmlFor="lw-pw">Password</label>
              <input id="lw-pw" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="lw-row">
              <label><input type="checkbox" /> Remember this device for 7 days</label>
              <a>Forgot password?</a>
            </div>
            <button type="submit" className="lw-btn primary" disabled={submitting}>
              {submitting ? 'Verifying…' : 'Continue'}
            </button>
            <div className="lw-divider">or continue with</div>
            <div className="lw-sso">
              <button type="button" className="lw-btn">
                <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#5E5E5E" d="M11 0H0v11h11V0zM24 0H13v11h11V0zM11 13H0v11h11V13zM24 13H13v11h11V13z"/></svg>
                Microsoft Entra ID
              </button>
              <button type="button" className="lw-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#4285F4"><path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"/><path fill="#FBBC05" d="M5.4 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.4l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>
                Google Workspace
              </button>
            </div>
            <div className="lw-foot">
              <button type="button" className="lw-btn ghost" style={{ marginTop: 2 }} onClick={onSignedIn}>
                Skip — demo mode →
              </button>
              <br />
              By continuing you accept the firm's acceptable use policy. Your queries and uploads are logged for matter-record purposes.
            </div>
          </form>
        )}
        {stage === 'mfa' && (
          <div>
            <div className="lw-mfa-eyebrow">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 7V5a5 5 0 0110 0v2" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/></svg>
              Multi-factor authentication
            </div>
            <h1 className="lw-serif">Enter the 6-digit code.</h1>
            <p className="lw-mfa-note">A push has been sent to your authenticator app for <b>{email}</b>. Or enter the code from your hardware key.</p>
            <div className="lw-otp">
              {otp.map((d, i) => (
                <input key={i} ref={el => (otpRefs.current[i] = el)}
                       value={d} onChange={e => setOtpDigit(i, e.target.value)}
                       onKeyDown={e => { if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus(); }}
                       inputMode="numeric" maxLength="1"
                       className={d ? 'filled' : ''} />
              ))}
            </div>
            <button type="button" className="lw-btn primary" disabled={submitting || !otp.every(d=>d)}
                    onClick={() => { setSubmitting(true); setTimeout(onSignedIn, 500); }}>
              {submitting ? 'Verifying…' : 'Verify and sign in'}
            </button>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
              <button className="lw-btn ghost" onClick={() => setStage('signin')}>← Back</button>
              <button className="lw-btn ghost">Resend code</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top header ────────────────────────────────────────────────────────

function TopHeader({ matter, doc, onPickMatter, onSignOut }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <header className="lw-header">
      <div className="brand"><span className="brand-dot" /> Atrium</div>
      <div className="lw-crumb">
        <button className="lw-matter-picker" onClick={onPickMatter}>
          {matter.shortName}
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="sep">/</span>
        <b style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc?.title}</b>
      </div>
      <div className="meta">
        <span className="lw-pill"><span className="dot" /> Air-gapped · doc text held local</span>
        <span className="lw-pill" style={{ background:'transparent', borderColor:'transparent', color:LW.ink3 }}>
          {matter.lead} · lead
        </span>
        <div className="lw-user-wrap">
          <button className="lw-user" onClick={() => setMenuOpen(o => !o)}>
            <span className="av">DS</span> Singh
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ marginRight:4 }}>
              <path d="M2 3l2.5 2.5L7 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {menuOpen && (<>
            <div onClick={() => setMenuOpen(false)} style={{ position:'fixed', inset:0, zIndex:39 }} />
            <div className="lw-user-menu">
              <div className="lw-user-menu-hd">
                <div className="nm">D. Singh</div>
                <div className="em">d.singh@atrium-legal.com.au</div>
              </div>
              <button className="lw-user-menu-row">My settings</button>
              <button className="lw-user-menu-row">Notification preferences</button>
              <button className="lw-user-menu-row">Audit log</button>
              <button className="lw-user-menu-row" onClick={() => { setMenuOpen(false); onSignOut && onSignOut(); }}>
                Sign out
              </button>
            </div>
          </>)}
        </div>
      </div>
    </header>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────

// ─── Sidebar (file browser) ────────────────────────────────────────────

function docTypeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M3 1.5h7l3 3v10A.5.5 0 0112.5 15h-9A.5.5 0 013 14.5v-13A.5.5 0 013.5 1z"
            stroke="currentColor" strokeWidth="1.2"/>
      <path d="M10 1.5v3.5h3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 8h6M5 10.5h6M5 13h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

function folderIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 4a.5.5 0 01.5-.5h4l1.5 2h6.5a.5.5 0 01.5.5v7a.5.5 0 01-.5.5h-12a.5.5 0 01-.5-.5V4z"
            stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function MatterSwitcher({ current, matters, onPick }) {
  const [open, setOpen] = React.useState(false);
  const list = matters && matters.length > 0 ? matters : [];
  return (
    <div className="lw-matter-dd">
      <button className="lw-matter-switch" onClick={() => setOpen(o => !o)}>
        Switch matter
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, zIndex:29 }} />
          <div className="lw-matter-dd-panel">
            {list.map(m => (
              <div key={m.id} className={"lw-matter-row " + (m.id === current.id ? 'active' : '')}
                   onClick={() => { onPick(m.id); setOpen(false); }}>
                <div className="name">{m.name}</div>
                <div className="meta">{(m.docs||[]).length} doc{(m.docs||[]).length===1?'':'s'}</div>
              </div>
            ))}
            {list.length === 0 && <div style={{padding:'8px 12px',fontSize:12,color:'#8A8A82'}}>Loading…</div>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function relativeTime(d) {
  // We have either a "just now" / "12 min ago" preset (viewedAt) or an ISO date.
  if (!d) return '';
  if (typeof d === 'string' && !/^\d{4}-\d{2}/.test(d)) return d;  // already a friendly label
  // Anchor "today" to 2026-05-19 (the prototype clock) so the deltas read sensibly.
  const today = new Date(new Date().toLocaleString('en-AU', {timeZone: 'Australia/Melbourne'}));
  const t = new Date(d);
  const days = Math.floor((today - t) / 86400000);
  if (days < 1) return 'today';
  if (days < 2) return 'yesterday';
  if (days < 7) return days + ' days ago';
  if (days < 14) return 'last week';
  if (days < 30) return Math.floor(days / 7) + ' weeks ago';
  return t.toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne', day:'numeric', month:'short' });
}

function readableStatus(s) {
  return ({ analysed: 'Ready', processing: 'Analysing', queued: 'In queue' })[s] || s;
}

function formatDocDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', '') + ' AEST';
}

// ─── Doc card (used by every sidebar section) ─────────────────────────

function DocCard({ d, active, onPick, kind, onTogglePin, debugIds }) {
  // kind: 'recent' | 'pinned' | 'attn' | 'folder'
  const showRelative = kind === 'recent';
  const showAttn     = kind === 'attn';
  return (
    <div className={"lw-doc-card " + (active ? 'active' : '') + (showAttn ? ' attn' : '')}
         data-doc-id={d.id || ''}
         onClick={() => onPick(d)}
         title={d.title}>
      <span className="ic">{docTypeIcon()}</span>
      <div style={{ minWidth: 0 }}>
        <div className="title">{d.title}</div>
        {debugIds && (
          <div style={{ fontSize: 9, fontFamily: LW.mono, color: LW.ink3, marginBottom: 2 }}>
            doc:{String(d.id || '').slice(0, 18)}
          </div>
        )}
        {d.subject && (
          <div style={{ fontSize: 11, color: LW.ink3, lineHeight: 1.35, marginBottom: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={d.subject}>
            {d.subject.length > 58 ? d.subject.slice(0, 55) + '…' : d.subject}
          </div>
        )}
        <div className="meta">
          <b>{(d.pages || 0).toLocaleString()}pp</b>
          <span className="dot">·</span>
          <span>{d.docType}</span>
          {showRelative && d.viewedAt && (<>
            <span className="dot">·</span>
            <span>{d.viewedAt}</span>
          </>)}
        </div>
        {showAttn && d.attention && (
          <div className="attn-note">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {d.attention}
          </div>
        )}
      </div>
      <div className="lw-doc-right">
        <button
          className={"pin-toggle " + (d.pinned ? 'pinned' : '')}
          title={d.pinned ? 'Unpin document' : 'Pin document'}
          aria-label={d.pinned ? 'Unpin document' : 'Pin document'}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin && onTogglePin(d.id);
          }}>
          ★
        </button>
        <span className={"lw-status-dot " + d.status}
              title={readableStatus(d.status) + (d.confidence != null ? ` · ${(d.confidence*100).toFixed(0)}% confidence` : '')} />
      </div>
    </div>
  );
}

// ─── Smart section (collapsible group) ───────────────────────────────

function SmartSection({ id, label, icon, count, defaultOpen=true, children, countTone }) {
  const [open, setOpen] = React.useState(defaultOpen);
  if (count === 0) return null;
  return (
    <div className="lw-sect">
      <div className="lw-sect-head" onClick={() => setOpen(o => !o)}>
        <h4>
          <span className={"ic " + (id === 'pinned' ? 'pin' : id === 'attn' ? 'attn' : '')}>{icon}</span>
          {label}
        </h4>
        <span className="c">
          {countTone === 'warn' && count > 0 ? <span style={{ color: LW.warn, fontWeight: 600 }}>{count}</span> : count}
        </span>
        <span className={"chev " + (open ? 'open' : '')}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M3 1.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─── Folder accordion ────────────────────────────────────────────────

function FolderGroup({ folder, docs, openByDefault, doc, onPick, onTogglePin, debugIds }) {
  const [open, setOpen] = React.useState(!!openByDefault);
  const [showAll, setShowAll] = React.useState(false);
  const PREVIEW = 6;
  // sort by recency (ingested desc), then preview
  const sorted = React.useMemo(() => {
    return docs.slice().sort((a, b) => (b.ingested || '').localeCompare(a.ingested || ''));
  }, [docs]);
  const visible = showAll ? sorted : sorted.slice(0, PREVIEW);
  const hasFlag = docs.some(d => d.attention);
  return (
    <div>
      <div className={"lw-fold-head " + (hasFlag ? 'has-flag' : '')}
           onClick={() => setOpen(o => !o)}>
        <span className={"chev " + (open ? 'open' : '')}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M3 1.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="ic">{folderIcon()}</span>
        <span className="nm">{folder.name}</span>
        <span className="c">{docs.length}</span>
      </div>
      {open && (
        <div>
          {visible.map(d => (
            <DocCard key={d.id} d={d} active={d.id === doc.id} onPick={onPick} onTogglePin={onTogglePin} kind="folder" debugIds={debugIds} />
          ))}
          {sorted.length > PREVIEW && !showAll && (
            <div className="lw-fold-more" onClick={() => setShowAll(true)}>
              Show all {sorted.length} →
            </div>
          )}
          {sorted.length > PREVIEW && showAll && (
            <div className="lw-fold-more" onClick={() => setShowAll(false)}>
              Show fewer ↑
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar (main) ──────────────────────────────────────────────────

function Sidebar({ matter, matters, doc, onPickDoc, onPickMatter, onUpload, debugIds }) {
  const [search, setSearch] = React.useState('');
  const [pinnedIds, setPinnedIds] = React.useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('lw_pinned_docs') || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });
  const pinnedSet = React.useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const togglePin = React.useCallback((docId) => {
    setPinnedIds(current => {
      const next = current.includes(docId) ? current.filter(id => id !== docId) : current.concat(docId);
      localStorage.setItem('lw_pinned_docs', JSON.stringify(next));
      return next;
    });
  }, []);
  const docs    = (matter.docs || []).map(d => ({
    ...d,
    ingested: d.ingested || d.upload_ts || '',
    pinned: pinnedSet.has(d.id) || !!d.pinned,
  }));
  const folders = matter.folders || [];

  // Pinned, recent, attention slices
  const pinned = docs.filter(d => d.pinned);
  const recent = docs.filter(d => d.viewedAt && !d.pinned).slice(0, 4);
  const attn   = docs.filter(d => d.attention).slice(0, 5);

  // Search across everything (title, type, author)
  const q = search.trim().toLowerCase();
  const searching = q.length > 0;
  const searchHits = searching
    ? docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.docType || '').toLowerCase().includes(q) ||
        (d.author || '').toLowerCase().includes(q))
    : [];

  // Docs per folder (in matter order; root excluded — it's a virtual "all" pseudo-folder)
  const folderDocs = (folderId) => docs.filter(d => d.folderId === folderId);

  return (
    <aside
      id="panel-doc-list"
      className="lw-side"
      data-pane-id="panel:lawyer-doc-sidebar"
      data-doc-id={doc?.id || ''}
    >
      {/* Matter header */}
      <div className="lw-matter-head">
        <div className="e">Active matter</div>
        <div className="lw-matter-name">{matter.name}</div>
        <div className="lw-matter-meta">
          <span>{matter.client}</span>
          <span className="dot">·</span>
          <span>{matter.practice}</span>
          <span className="dot">·</span>
          <span>Lead: {matter.lead}</span>
        </div>
        <MatterSwitcher current={matter} matters={matters} onPick={onPickMatter} />
      </div>

      {/* Search */}
      <div className="lw-side-search">
        <div className="lw-side-search-row">
          <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder={`Find a document in ${docs.length} files`} />
          {search && <button className="clear" onClick={() => setSearch('')} aria-label="Clear">
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>}
        </div>
      </div>

      {/* Body */}
      <div className="lw-side-body">
        {searching && (
          <>
            <div className="lw-search-head">
              <h4>Results</h4>
              <span className="c">{searchHits.length} match{searchHits.length===1?'':'es'}</span>
            </div>
            {searchHits.length === 0 ? (
              <div className="lw-search-empty">
                Nothing matches “{search}”.<br />
                <span style={{ color: LW.ink4 }}>Try a different word, or browse the folders below.</span>
              </div>
            ) : searchHits.map(d => (
              <DocCard key={d.id} d={d} active={d.id === doc.id} onPick={onPickDoc} onTogglePin={togglePin} kind="folder" debugIds={debugIds} />
            ))}
          </>
        )}

        {!searching && (
          <>
            <SmartSection
              id="pinned" label="Pinned"
              icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M10 1L6 5H3l4 4-3 6 6-3 4 4v-3l-4-4 4-4-4 0z"/></svg>}
              count={pinned.length} defaultOpen={true}>
              {pinned.map(d => (
                <DocCard key={d.id} d={d} active={d.id === doc.id} onPick={onPickDoc} onTogglePin={togglePin} kind="pinned" debugIds={debugIds} />
              ))}
            </SmartSection>

            <SmartSection
              id="recent" label="Continue working"
              icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 4.5V8l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
              count={recent.length} defaultOpen={true}>
              {recent.map(d => (
                <DocCard key={d.id} d={d} active={d.id === doc.id} onPick={onPickDoc} onTogglePin={togglePin} kind="recent" debugIds={debugIds} />
              ))}
            </SmartSection>

            <SmartSection
              id="attn" label="Needs your attention"
              icon={<svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l6 11H2L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 6v3M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
              count={attn.length} countTone="warn" defaultOpen={true}>
              {attn.map(d => (
                <DocCard key={d.id} d={d} active={d.id === doc.id} onPick={onPickDoc} onTogglePin={togglePin} kind="attn" debugIds={debugIds} />
              ))}
            </SmartSection>

            <div className="lw-sect-head" style={{ paddingTop: 18, cursor: 'default' }}>
              <h4>All folders</h4>
              <span className="c">{folders.filter(f => f.id !== 'root').length}</span>
            </div>
            {folders.filter(f => f.id !== 'root').map(f => (
              <FolderGroup key={f.id} folder={f} docs={folderDocs(f.id)}
                           openByDefault={folderDocs(f.id).some(d => d.id === doc.id)}
                           doc={doc} onPick={onPickDoc} onTogglePin={togglePin} debugIds={debugIds} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="lw-side-foot">
        <button className="lw-btn primary" onClick={onUpload}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v8m0-8L4 5m3-3l3 3M2 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Upload a document
        </button>
        <button className="lw-btn-icon" title="New folder">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 3.5a.5.5 0 01.5-.5h3l1.5 1.5h5a.5.5 0 01.5.5v6a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5v-7.5z"
                  stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M7 7v3M5.5 8.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

// ─── Export menu ───────────────────────────────────────────────────────
// Reusable popover offering Word / PDF / Excel. Excel only appears for list
// artifacts (chronology, people, entities, doc refs, external refs).
const LIST_ARTIFACTS = ['chronology', 'people', 'entities', 'docrefs', 'extrefs', 'all-lists'];

function ExportMenu({ scope, label='Export', subtle=false }) {
  // scope: an artifact id (chronology, people, ...) or 'document' for the whole bundle
  const [open, setOpen] = React.useState(false);
  const [fired, setFired] = React.useState(null);
  const close = () => { setOpen(false); setFired(null); };
  const excelEligible = scope === 'document'
    ? true   // whole-doc export rolls all lists into an .xlsx workbook
    : LIST_ARTIFACTS.includes(scope);

  const fire = (fmt) => {
    setFired(fmt);
    setTimeout(close, 1300);
  };

  return (
    <div className="lw-exp">
      <button className={"lw-btn " + (subtle ? '' : '')}
              onClick={() => setOpen(o => !o)}
              style={{ width:'auto', display:'inline-flex', alignItems:'center', gap:6 }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v8m0-8L4 4m3-3l3 3M2 11h10v2H2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {label}
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M2 3l2.5 2.5L7 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div onClick={close} style={{ position:'fixed', inset:0, zIndex:39 }} />
          <div className="lw-exp-pop">
            {fired && (
              <div className="lw-exp-fired">
                <span className="d" />
                Preparing {fired}… we’ll notify you when it’s ready.
              </div>
            )}
            {!fired && <>
              <div className="lw-exp-hd">
                {scope === 'document' ? 'Export this document’s analysis' : 'Export this artifact'}
              </div>
              <button className="lw-exp-row" onClick={() => fire('Word')}>
                <span className="ic" style={{ color:'#2B579A' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6l1 4 1.5-3L9 10l1-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div>
                  <div className="t">Microsoft Word</div>
                  <div className="s">.docx · editable in Word or Google Docs</div>
                </div>
              </button>
              <button className="lw-exp-row" onClick={() => fire('PDF')}>
                <span className="ic" style={{ color:'#A24B3A' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5h2.5a1 1 0 010 2H5v3M9 5v5h1.5a1 1 0 001-1V6a1 1 0 00-1-1H9z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>
                </span>
                <div>
                  <div className="t">PDF document</div>
                  <div className="s">.pdf · fixed layout, citation links preserved</div>
                </div>
              </button>
              <button className="lw-exp-row"
                      disabled={!excelEligible}
                      onClick={() => excelEligible && fire('Excel')}
                      title={excelEligible ? '' : 'Spreadsheet export is for list artifacts only.'}>
                <span className="ic" style={{ color:'#1F7A3F' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5l3 3-3 3M11 5l-3 3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div>
                  <div className="t">Excel sheet</div>
                  <div className="s">{excelEligible ? '.xlsx · tables, sortable, ready for review' : '— not available for memos and prose'}</div>
                </div>
              </button>
              <div className="lw-exp-foot">Outputs include citation IDs back to the source document.</div>
            </>}
          </div>
        </>
      )}
    </div>
  );
}

window.ExportMenu = ExportMenu;

// ─── Doc header + tab strip ────────────────────────────────────────────

const LW_TABS = [
  { id: 'chronology',  label: 'Chronology',        count: null },
  { id: 'people',      label: 'People',            count: null },
  { id: 'entities',    label: 'Entities',          count: null },
  { id: 'docrefs',     label: 'Doc references',    count: null },
  { id: 'extrefs',     label: 'External authority', count: null },
  { id: 'synthesis',   label: 'Synthesis',         count: null },
  { id: 'mindmap',     label: 'Mind Map',          count: null },
  { id: 'memo',        label: 'Legal memo',        flagged: false },
  { id: 'detailed',    label: 'Detailed memo',     count: null },
];

function DocHeader({ doc, matter }) {
  return (
    <div className="lw-doc-header">
      <div className="left">
        <div className="eye">Active document · {matter.name}</div>
        <h1 className="lw-serif">{doc.title || 'Loading…'}</h1>
        {doc.subject && (
          <div style={{ fontSize: 13, color: LW.ink2, marginBottom: 5, fontStyle: 'italic' }}>
            {doc.subject}
          </div>
        )}
        <div className="meta">
          <span><b>{(doc.pages || 0).toLocaleString()}</b> pages</span>
          <span>·</span>
          <span>{doc.docType}</span>
          <span>·</span>
          <span>Ingested <b className="lw-mono">{formatDocDateTime(doc.ingested)}</b></span>
          <span>·</span>
          <span>Analysed <b className="lw-mono">{doc.analysed}</b></span>
        </div>
      </div>
      <div className="right">
        {doc.confidence != null && (
          <div className="lw-conf-pill" title="Composite confidence across all artifacts">
            <span className="lw-conf-ring" style={{ '--p': (doc.confidence*100).toFixed(0) }} />
            <span>Composite <b>{doc.confidence.toFixed(2)}</b></span>
          </div>
        )}
        <button className="lw-btn" style={{ width:'auto' }}>Open original</button>
        <ExportMenu scope="document" label="Export analysis" />
      </div>
    </div>
  );
}

function TabStrip({ active, onPick, counts }) {
  return (
    <nav className="lw-tabs">
      {LW_TABS.map(t => {
        const cnt = counts && counts[t.id] != null ? counts[t.id] : t.count;
        const isMemo = t.id === 'memo';
        const flagged = isMemo && counts && counts.memo > 0;
        return (
          <button key={t.id} className={"lw-tab " + (active === t.id ? 'active' : '')}
                  onClick={() => onPick(t.id)}>
            {t.label}
            {cnt != null && !isMemo && <span className="cnt">{typeof cnt === 'number' ? cnt.toLocaleString() : cnt}</span>}
            {flagged && <span className="flag" title="Legal memo available" />}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Chat dock ─────────────────────────────────────────────────────────

function _claimArtifact(claimId) {
  if (!claimId) return 'chronology';
  if (claimId.includes(':entity:')) return 'entities';
  if (claimId.includes(':extref:')) return 'extrefs';
  if (claimId.includes(':memo:'))   return 'memo';
  return 'chronology';
}

function queryDataSource(value, answerBasis) {
  if (value === 'real' || value === 'simulated' || value === 'mock') return value;
  if (value === 'retrieved_evidence' || answerBasis === 'retrieved_evidence') return 'real';
  return 'mock';
}

function ChatDock({ onCite, docId, currentNamespace }) {
  const [expanded, setExpanded] = React.useState(false);
  const [val, setVal] = React.useState('');
  const [history, setHistory] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef();

  React.useEffect(() => {
    if (expanded && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [expanded, history]);

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const t = new Date().toLocaleTimeString('en-AU', {timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hour12: false});
    const user = { id: 'u'+Date.now(), who: 'user', t, text };
    const placeholder = { id: '__thinking__', who: 'assistant', t, text: 'Searching artifact claims…', loading: true };
    setHistory(h => [...h, user, placeholder]);
    setVal('');
    setExpanded(true);
    setLoading(true);
    // Build query body preferring document_id, with transitional namespace fallback
    const queryBody = {
      question: text,
      document_id: docId || null,
    };
    // Transitional compatibility for Core v0.2.7: prefer document_id/pack_id when available.
    if (!docId && currentNamespace) {
      queryBody.namespace = currentNamespace;
    }
    try {
      const resp = await fetch('/api/query', {
        method: 'POST',
        headers: apiAuthHeaders(true),
        body: JSON.stringify(queryBody),
      });
      const data = resp.ok ? await resp.json() : null;
      const answer = data?.answer || 'No answer found in the available artifact claims.';
      const citations = Array.isArray(data?.citations) ? data.citations : [];
      const cites = citations.slice(0, 6).map(c => ({
        artifact: _claimArtifact(c.evidence_id || c.result_id),
        id: c.evidence_id || c.result_id || '',
        label: [c.source, c.page != null ? 'p.' + c.page : ''].filter(Boolean).join(' · ') || (c.evidence_id || '').slice(0, 70),
      }));
      const bot = { id: 'a'+Date.now(), who: 'assistant', t: new Date().toLocaleTimeString('en-AU', {timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hour12: false}), text: answer, cites, dataSource: queryDataSource(data?.data_source, data?.answer_basis) };
      setHistory(h => h.filter(m => m.id !== '__thinking__').concat(bot));
    } catch(e) {
      const err = { id: 'e'+Date.now(), who: 'assistant', t: new Date().toLocaleTimeString('en-AU', {timeZone: 'Australia/Melbourne', hour: '2-digit', minute: '2-digit', hour12: false}), text: 'Request failed — please try again.' };
      setHistory(h => h.filter(m => m.id !== '__thinking__').concat(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={"lw-chat " + (expanded ? 'expanded' : 'collapsed')}>
      <div className="lw-chat-conv" ref={scrollRef}>
        {history.map(turn => (
          <div key={turn.id} className={"lw-chat-turn " + turn.who}>
            <span className="lw-chat-byline">
              {turn.who === 'user' ? 'You' : 'Atrium'} · {turn.t}
              {turn.who === 'assistant' && turn.dataSource && <span className="lw-chat-source">{turn.dataSource}</span>}
            </span>
            <div className={"lw-chat-bubble" + (turn.loading ? ' loading' : '')}>{turn.text}</div>
            {turn.cites && (
              <div className="lw-chat-cites">
                {turn.cites.map((c, i) => (
                  <span key={i} className="lw-chat-cite" onClick={() => onCite && onCite(c)}>
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="lw-chat-prompts">
        {['What are the key legal issues?', 'Summarise relevant legislation', 'Who are the key parties?'].map((p, i) => (
          <button key={i} className="lw-prompt" onClick={() => send(p)} disabled={loading}>{p}</button>
        ))}
      </div>
      <div className="lw-chat-input-row">
        <button className="lw-chat-toggle" onClick={() => setExpanded(e => !e)}
                title={expanded ? 'Collapse' : 'Expand conversation'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d={expanded ? "M3 9l4-4 4 4" : "M3 5l4 4 4-4"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="lw-chat-input">
          <input value={val} onChange={e => setVal(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && send(val)}
                 placeholder="Ask anything about this matter — answers cite the artifacts above." />
          <button className="lw-chat-send" onClick={() => send(val)} title="Send">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l12-6-4 14-2-6-6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity=".15"/>
            </svg>
          </button>
        </div>
        <div className="lw-chat-scope">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1l6 3v4c0 4-3 6-6 7-3-1-6-3-6-7V4l6-3z" stroke="currentColor" strokeWidth="1.3"/></svg>
          Scope · <b>this matter</b>
        </div>
      </div>
    </div>
  );
}

// Export the shell pieces (artifacts file consumes these)
window.LawTheme = LawTheme;
window.LawyerLogin = LoginScreen;
window.LawyerHeader = TopHeader;
window.LawyerSidebar = Sidebar;
window.LawyerDocHeader = DocHeader;
window.LawyerTabStrip = TabStrip;
window.LawyerChatDock = ChatDock;
window.LawyerDebugToggle = LawyerDebugToggle;
window.useLawyerDebugIds = useLawyerDebugIds;
window.LW_TABS = LW_TABS;
window.injectLawStyle = injectLawStyle;
