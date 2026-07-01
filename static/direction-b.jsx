// Direction B — "Lattice" (v2)
// OPERATOR MONITOR. Center of attention is the live activity log.
// All 5 artifacts (chronology, entities, people, exec memo, detailed analysis)
// are equal first-class citizens shown as compact summary cards.
// Cross-artifact signals + external augmentation kept (user liked these).

const D2 = window.LegalAIMockData;

const Lattice = {
  bg: '#F4F5F7',
  panel: '#FFFFFF',
  panelDim: '#FAFBFC',
  ink: '#0F1419',
  ink2: '#42505F',
  ink3: '#7A8794',
  ink4: '#A8B2BC',
  rule: '#E3E7EB',
  ruleSoft: '#EEF1F4',
  accent: '#2C5BE0',
  accentSoft: '#E6ECFB',
  good: '#1F7A3F',
  goodSoft: '#E0EFE4',
  goodMid: '#46A65E',
  warn: '#B5651F',
  warnSoft: '#FAEAD4',
  warnMid: '#DC9A3E',
  bad: '#B0392E',
  badSoft: '#F4DEDB',
  badMid: '#E36458',
  laneA: '#2C5BE0',
  laneB: '#7A4FE0',
  laneC: '#1F7A3F',
  sans: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace',
};

const L = Lattice;

// Shared nav context (same instance as direction-a)
window.NavContext = window.NavContext || React.createContext({ go: null, view: 'monitor', highlight: null });
const LNavContext = window.NavContext;

// Heuristic: route an activity-log row to the appropriate artifact tab.
function lActivityTarget(a) {
  if (a.type === 'ENTITY' || a.type === 'SWEEP') return { view: 'entities' };
  if (a.type === 'SYNTHESIS' || a.type === 'REVIEW') return { view: a.msg.includes('detailed') ? 'detailed' : 'exec' };
  if (a.type === 'EXT') return { view: 'entities' };
  if (a.type === 'CACHE') return null;
  if (a.type === 'CLAIM' || a.type === 'CONFLICT' || a.type === 'DECISION') {
    if (/^PERSON|people|individual/i.test(a.msg)) return { view: 'people' };
    if (/^CHRONOLOGY|date|timeline|event/i.test(a.msg)) return { view: 'chronology' };
    if (/^ENTITY|canonical|organisation|organization|company/i.test(a.msg)) return { view: 'entities' };
    if (/^AUTHORITY/i.test(a.msg)) return { view: 'chronology' };
    if (/exec memo|critic/i.test(a.msg)) return { view: 'exec' };
    if (/settlement quantum|cf01/i.test(a.msg)) return { view: 'chronology' };
    return { view: 'chronology' };
  }
  return null;
}

const lStyle = `
  .l-root{font-family:${L.sans};color:${L.ink};background:${L.bg};width:100%;min-height:100%;
    -webkit-font-smoothing:antialiased;letter-spacing:-0.003em}
  .l-root *{box-sizing:border-box}
  .l-mono{font-family:${L.mono};font-variant-numeric:tabular-nums}

  /* ── KPI rail (top) ────────────────────────────────────────── */
  .l-top{display:flex;align-items:stretch;border-bottom:1px solid ${L.rule};background:${L.panel}}
  .l-brand{display:flex;align-items:center;gap:10px;padding:14px 18px;
    border-right:1px solid ${L.rule};font-weight:600;font-size:13px;min-width:208px}
  .l-brand-mark{width:22px;height:22px;border-radius:5px;background:linear-gradient(135deg,${L.accent},${L.laneB});
    display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;letter-spacing:.04em}
  .l-doc-strip{padding:10px 18px;border-right:1px solid ${L.rule};flex:1;min-width:0}
  .l-doc-strip .e{font-size:10px;color:${L.ink3};letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:2px}
  .l-doc-strip .t{font-size:13px;color:${L.ink};font-weight:600;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .l-doc-strip .s{font-size:11px;color:${L.ink3};margin-top:1px;font-family:${L.mono}}
  .l-graph-entry{border:0;border-right:1px solid ${L.rule};background:${L.panel};padding:10px 18px;
    min-width:132px;text-align:left;cursor:pointer}
  .l-graph-entry:hover{background:${L.panelDim}}
  .l-graph-entry .e{font-size:10px;color:${L.ink3};letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:2px}
  .l-graph-entry .v{font-size:13px;color:${L.accent};font-weight:600}
  .l-graph-entry .d{font-size:10.5px;color:${L.ink3};font-family:${L.mono};margin-top:1px}
  .l-kpi{padding:10px 18px;border-right:1px solid ${L.rule};display:flex;flex-direction:column;justify-content:center;min-width:122px}
  .l-kpi:last-child{border-right:0}
  .l-kpi .e{font-size:10px;color:${L.ink3};letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-bottom:2px}
  .l-kpi .v{font-size:18px;font-weight:600;color:${L.ink};font-family:${L.mono};letter-spacing:-0.01em}
  .l-kpi .v.ok{color:${L.good}} .l-kpi .v.warn{color:${L.warn}}
  .l-kpi .d{font-size:10.5px;color:${L.ink3};font-family:${L.mono};margin-top:1px}

  /* ── Generic card ─────────────────────────────────────────── */
  .l-card{background:${L.panel};border:1px solid ${L.rule};border-radius:8px;overflow:hidden}
  .l-card-h{display:flex;align-items:center;justify-content:space-between;
    padding:10px 14px;border-bottom:1px solid ${L.rule};background:${L.panelDim};gap:10px}
  .l-card-h h3{margin:0;font-size:11px;font-weight:600;letter-spacing:.06em;
    text-transform:uppercase;color:${L.ink2}}
  .l-card-h .meta{font-size:10.5px;color:${L.ink3};font-family:${L.mono};letter-spacing:.02em}
  .l-card-b{padding:12px 14px}
  .l-card-b.flush{padding:0}

  /* ── Pipelines table (compact) ───────────────────────────── */
  .l-pipe{width:100%;border-collapse:collapse;font-size:11.5px}
  .l-pipe td, .l-pipe th{padding:8px 12px;text-align:left;border-bottom:1px solid ${L.ruleSoft};vertical-align:middle}
  .l-pipe tbody tr:last-child td{border-bottom:0}
  .l-pipe th{font-size:9.5px;color:${L.ink3};letter-spacing:.08em;
    text-transform:uppercase;font-weight:600;background:${L.panelDim};padding:7px 12px}
  .l-pipe .pid{font-family:${L.mono};color:${L.ink3};width:30px}
  .l-pipe .name{color:${L.ink};font-weight:500}
  .l-pipe .pbar{position:relative;width:80px;height:5px;background:${L.ruleSoft};border-radius:99px;overflow:hidden}
  .l-pipe .pbar i{display:block;height:100%;background:${L.accent}}
  .l-pipe .pbar.done i{background:${L.good}}
  .l-pipe .pbar.queued i{background:${L.ink4}}
  .l-pipe .pbar.unavailable i{background:${L.ink4}}
  .l-pipe .ppct{font-family:${L.mono};color:${L.ink};font-weight:500;width:86px;text-align:right;white-space:nowrap}
  .l-pipe .paction{width:96px;text-align:right}
  .l-pipe .plink{border:1px solid ${L.rule};background:${L.panel};color:${L.accent};border-radius:4px;
    padding:4px 7px;font-family:${L.mono};font-size:10px;cursor:pointer}
  .l-pipe .plink:hover{background:${L.accentSoft}}
  .l-pipe .pna{font-family:${L.mono};font-size:10px;color:${L.ink3}}
  .l-pipe .st{font-family:${L.mono};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;
    padding:1.5px 6px;border-radius:3px;white-space:nowrap}
  .l-pipe .st.running{background:${L.accentSoft};color:${L.accent}}
  .l-pipe .st.done{background:${L.goodSoft};color:${L.good}}
  .l-pipe .st.queued{background:${L.ruleSoft};color:${L.ink3}}
  .l-pipe .st.unavailable{background:${L.ruleSoft};color:${L.ink3}}

  /* ── Agreement strip ──────────────────────────────────────── */
  .l-agree-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
  .l-agree-col{padding:11px 14px;border-right:1px solid ${L.ruleSoft}}
  .l-agree-col:last-child{border-right:0}
  .l-agree-col .e{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:${L.ink3};font-weight:600}
  .l-agree-col .num{display:flex;align-items:baseline;gap:8px;margin-top:4px}
  .l-agree-col .num .v{font-family:${L.mono};font-size:20px;font-weight:600;letter-spacing:-0.01em;color:${L.ink}}
  .l-agree-col .num .badge{font-family:${L.mono};font-size:9.5px;font-weight:600;letter-spacing:.04em;
    padding:1.5px 6px;border-radius:3px}
  .l-agree-col .num .badge.ok{background:${L.goodSoft};color:${L.good}}
  .l-agree-col .num .badge.warn{background:${L.warnSoft};color:${L.warn}}
  .l-agree-col .track{position:relative;height:4px;border-radius:99px;background:${L.ruleSoft};margin-top:8px}
  .l-agree-col .track .f{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:${L.accent}}
  .l-agree-col .track .g{position:absolute;top:-2px;height:8px;width:1px;background:${L.ink2}}
  .l-agree-col .breakdown{display:flex;justify-content:space-between;margin-top:6px;
    font-family:${L.mono};font-size:10px;color:${L.ink3}}

  /* ── Time budget compact ─────────────────────────────────── */
  .l-budget{padding:12px 14px;display:flex;align-items:center;gap:14px}
  .l-budget .pri{font-family:${L.mono};font-size:18px;font-weight:600;color:${L.ink}}
  .l-budget .pri span{color:${L.ink3};font-size:11px;font-weight:400;margin-left:4px}
  .l-budget .bar{flex:1;height:6px;border-radius:99px;background:${L.ruleSoft};overflow:hidden;display:flex}
  .l-budget .bar i{display:block;height:100%}
  .l-budget .est{font-family:${L.mono};font-size:11px;color:${L.ink3}}

  /* ── Activity log (the centerpiece) ───────────────────────── */
  .l-act-tabs{display:flex;gap:0;padding:6px 8px 0;border-bottom:1px solid ${L.rule};background:${L.panelDim}}
  .l-act-tab{font:inherit;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
    padding:7px 12px;background:transparent;border:0;border-bottom:2px solid transparent;
    color:${L.ink3};cursor:pointer;font-family:${L.mono};display:flex;align-items:center;gap:6px}
  .l-act-tab:hover{color:${L.ink2}}
  .l-act-tab.active{color:${L.ink};border-bottom-color:${L.accent}}
  .l-act-tab .cnt{font-size:9.5px;font-weight:500;padding:1px 5px;border-radius:3px;background:${L.ruleSoft};color:${L.ink3}}
  .l-act-tab.active .cnt{background:${L.accentSoft};color:${L.accent}}

  .l-act-list{font-family:${L.mono};font-size:11.5px;max-height:440px;overflow-y:auto;
    background:${L.panel}}
  .l-act-row{display:grid;grid-template-columns:78px 22px 110px 88px 1fr;gap:10px;
    padding:7px 14px;border-bottom:1px solid ${L.ruleSoft};align-items:start;line-height:1.4}
  .l-act-row:hover{background:${L.panelDim}}
  .l-act-row.bad{background:#FCF1EE} .l-act-row.bad:hover{background:#F8E3DE}
  .l-act-row.warn{background:#FEF8EC} .l-act-row.warn:hover{background:#FBF1D9}
  .l-act-row .t{color:${L.ink3}}
  .l-act-row .lvl{display:flex;align-items:center;justify-content:center;height:14px}
  .l-act-row .lvl i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-top:5px}
  .l-act-row.info .lvl i{background:${L.ink4}}
  .l-act-row.ok   .lvl i{background:${L.goodMid}}
  .l-act-row.warn .lvl i{background:${L.warnMid}}
  .l-act-row.bad  .lvl i{background:${L.badMid}}
  .l-act-row.clickable{cursor:pointer}
  .l-act-row .src{color:${L.ink2};font-weight:500;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .l-act-row .typ{font-size:9.5px;font-weight:600;letter-spacing:.06em;
    padding:2px 6px;border-radius:3px;text-align:center;display:inline-block;
    color:${L.ink2};background:${L.ruleSoft};line-height:1.2;margin-top:1px}
  .l-act-row .typ.claim{background:${L.accentSoft};color:${L.accent}}
  .l-act-row .typ.decision{background:#EFE5FB;color:${L.laneB}}
  .l-act-row .typ.conflict{background:${L.warnSoft};color:${L.warn}}
  .l-act-row .typ.entity{background:${L.goodSoft};color:${L.good}}
  .l-act-row .typ.synthesis{background:#FFF2E0;color:${L.warn}}
  .l-act-row .typ.ext{background:#E5F1FA;color:${L.accent}}
  .l-act-row .typ.review{background:${L.badSoft};color:${L.bad}}
  .l-act-row .msg{color:${L.ink};font-weight:400}
  .l-act-row .msg .det{display:block;color:${L.ink3};font-size:10.5px;margin-top:2px;font-weight:400}

  /* ── Artifact summary cards ──────────────────────────────── */
  .l-art-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
  .l-art{background:${L.panel};border:1px solid ${L.rule};border-radius:8px;
    display:flex;flex-direction:column;overflow:hidden;min-width:0}
  .l-art.report{background:linear-gradient(180deg,${L.panel} 0%,#FBFAF6 100%)}
  .l-art.clickable{cursor:pointer;transition:box-shadow .15s,border-color .15s,transform .15s}
  .l-art.clickable:hover{border-color:${L.ink4};box-shadow:0 6px 18px rgba(0,0,0,.06)}
  .l-art-foot a:hover{text-decoration:underline}
  .l-art-h{padding:10px 12px 8px;display:flex;align-items:flex-start;justify-content:space-between;gap:8px;
    border-bottom:1px solid ${L.ruleSoft}}
  .l-art-h .left{min-width:0;flex:1}
  .l-art-kind{font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;
    color:${L.ink3};font-family:${L.mono};margin-bottom:1px}
  .l-art-kind.report{color:${L.warn}}
  .l-art-name{font-size:13px;font-weight:600;color:${L.ink};line-height:1.25}
  .l-art-stat{font-family:${L.mono};font-size:9px;font-weight:600;letter-spacing:.04em;
    padding:1.5px 5px;border-radius:3px;white-space:nowrap;align-self:flex-start;text-transform:uppercase}
  .l-art-stat.iterating{background:${L.accentSoft};color:${L.accent}}
  .l-art-stat.drafting{background:${L.warnSoft};color:${L.warn}}
  .l-art-stat.gated{background:${L.ruleSoft};color:${L.ink3}}

  .l-art-meter{padding:8px 12px;display:flex;flex-direction:column;gap:5px;
    border-bottom:1px solid ${L.ruleSoft};background:${L.panelDim}}
  .l-art-meter .row{display:flex;align-items:baseline;justify-content:space-between;font-size:10.5px;color:${L.ink3};font-family:${L.mono}}
  .l-art-meter .row b{font-family:${L.mono};color:${L.ink};font-size:15px;font-weight:600;letter-spacing:-0.01em}
  .l-art-meter .seg{display:flex;height:5px;border-radius:99px;overflow:hidden;background:${L.ruleSoft}}
  .l-art-meter .seg i{display:block;height:100%}
  .l-art-meter .seg .acc{background:${L.good}}
  .l-art-meter .seg .dis{background:${L.warn}}
  .l-art-meter .seg .sup{background:${L.ink4}}
  .l-art-meter .breakdown{display:flex;justify-content:space-between;font-size:9.5px;color:${L.ink3};font-family:${L.mono}}
  .l-art-meter .breakdown b{color:${L.ink2}}

  .l-art-list{flex:1;padding:6px 8px 8px;font-size:11px;display:flex;flex-direction:column;gap:0;min-width:0}
  .l-art-row{display:grid;grid-template-columns:1fr auto;gap:6px;padding:6px 6px;
    border-bottom:1px dashed ${L.ruleSoft};align-items:start;min-width:0}
  .l-art-row:last-child{border-bottom:0}
  .l-art-row .lbl{min-width:0;overflow:hidden}
  .l-art-row .pri{color:${L.ink};font-weight:500;font-size:11px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .l-art-row .pri.dim{color:${L.ink3};text-decoration:line-through;text-decoration-color:${L.ink4}}
  .l-art-row .sec{display:flex;gap:6px;align-items:center;font-family:${L.mono};font-size:9.5px;color:${L.ink3};margin-top:2px}
  .l-art-row .conf{font-family:${L.mono};font-size:9.5px;color:${L.ink2};white-space:nowrap;align-self:start;padding-top:1px}
  .l-art-row .conf.warn{color:${L.warn}}
  .l-art-row .conf.bad{color:${L.bad}}
  .l-art-pill{display:inline-block;font-family:${L.mono};font-size:9px;font-weight:600;letter-spacing:.04em;
    padding:1px 4px;border-radius:3px;background:${L.ruleSoft};color:${L.ink3};text-transform:uppercase}
  .l-art-pill.disputed{background:${L.warnSoft};color:${L.warn}}
  .l-art-pill.review  {background:${L.badSoft};color:${L.bad}}
  .l-art-pill.superseded{background:${L.ruleSoft};color:${L.ink3}}
  .l-art-pill.candidate{background:#F1ECFA;color:${L.laneB}}
  .l-art-pill.recent  {background:${L.goodSoft};color:${L.good}}
  .l-art-pill.drafted {background:${L.goodSoft};color:${L.good}}
  .l-art-pill.drafting{background:${L.warnSoft};color:${L.warn}}
  .l-art-pill.queued  {background:${L.ruleSoft};color:${L.ink3}}
  .l-art-pill.gated   {background:${L.ruleSoft};color:${L.ink3}}

  .l-art-foot{padding:7px 12px;background:${L.panelDim};display:flex;justify-content:space-between;
    font-family:${L.mono};font-size:10px;color:${L.ink3};border-top:1px solid ${L.ruleSoft}}
  .l-art-foot a{color:${L.accent};text-decoration:none;font-weight:600;cursor:pointer}

  /* ── Conflict 3-lane (carry over) ─────────────────────────── */
  .l-cf-head{display:flex;align-items:center;justify-content:space-between;
    padding:8px 14px;border-bottom:1px solid ${L.ruleSoft};background:#FFF8EC;gap:10px}
  .l-cf-id{font-family:${L.mono};font-size:10px;font-weight:600;letter-spacing:.04em;color:${L.warn};
    background:${L.warnSoft};padding:1.5px 6px;border-radius:3px}
  .l-cf-subj{font-size:12px;font-weight:600;color:${L.ink};flex:1;min-width:0;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .l-cf-j{font-family:${L.mono};font-size:10.5px;color:${L.warn}}
  .l-cf-body{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid ${L.ruleSoft}}
  .l-cf-lane{padding:10px 12px;border-right:1px solid ${L.ruleSoft}}
  .l-cf-lane:last-child{border-right:0}
  .l-cf-lane .ltag{display:inline-flex;align-items:center;gap:5px;font-family:${L.mono};font-size:9.5px;
    font-weight:600;letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px}
  .l-cf-lane .ltag .swatch{width:7px;height:7px;border-radius:2px}
  .l-cf-lane.A .ltag{color:${L.laneA}} .l-cf-lane.A .swatch{background:${L.laneA}}
  .l-cf-lane.B .ltag{color:${L.laneB}} .l-cf-lane.B .swatch{background:${L.laneB}}
  .l-cf-lane.C .ltag{color:${L.laneC}} .l-cf-lane.C .swatch{background:${L.laneC}}
  .l-cf-lane .val{font-family:${L.mono};font-size:12.5px;font-weight:600;color:${L.ink};
    margin-bottom:4px;letter-spacing:-0.005em}
  .l-cf-lane .src{font-family:${L.mono};font-size:10px;color:${L.ink3};margin-bottom:6px}
  .l-cf-lane .ev{font-size:10.5px;color:${L.ink2};line-height:1.45;
    padding:6px 8px;background:${L.panelDim};border-radius:4px;border-left:2px solid currentColor}
  .l-cf-lane.A .ev{color:${L.ink2};border-color:${L.laneA}}
  .l-cf-lane.B .ev{color:${L.ink2};border-color:${L.laneB}}
  .l-cf-lane.C .ev{color:${L.ink2};border-color:${L.laneC}}
  .l-cf-lane .cbar{display:flex;align-items:center;gap:6px;margin-top:6px}
  .l-cf-lane .cbar .b{flex:1;height:3px;border-radius:99px;background:${L.ruleSoft};position:relative;overflow:hidden}
  .l-cf-lane .cbar .b i{display:block;height:100%}
  .l-cf-lane.A .cbar .b i{background:${L.laneA}}
  .l-cf-lane.B .cbar .b i{background:${L.laneB}}
  .l-cf-lane.C .cbar .b i{background:${L.laneC}}
  .l-cf-lane .cbar .v{font-family:${L.mono};font-size:10px;color:${L.ink2}}
  .l-cf-foot{padding:9px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;background:${L.panelDim}}
  .l-cf-rule{font-size:10.5px;color:${L.ink2};font-family:${L.mono};flex:1;min-width:0}
  .l-cf-rule b{color:${L.accent}}
  .l-cf-actions{display:flex;gap:6px;flex-shrink:0}
  .l-btn{font:inherit;font-size:10.5px;font-weight:600;padding:4px 9px;border-radius:5px;cursor:pointer;
    letter-spacing:.02em;border:1px solid ${L.rule};background:${L.panel};color:${L.ink2};transition:all .12s}
  .l-btn:hover{background:${L.panelDim};color:${L.ink}}
  .l-btn.primary{background:${L.accent};color:#fff;border-color:${L.accent}}
  .l-btn.primary:hover{background:#1F49B8}
  .l-btn.danger{color:${L.bad};border-color:${L.badSoft}}
  .l-btn.danger:hover{background:${L.badSoft}}

  /* ── Signals · external · hardware (row 5) ─────────────────── */
  .l-sig{padding:0}
  .l-sig-row{display:grid;grid-template-columns:48px 1fr;gap:10px;padding:10px 14px;
    border-bottom:1px solid ${L.ruleSoft};font-size:11.5px;line-height:1.45}
  .l-sig-row:last-child{border-bottom:0}
  .l-sig-row .t{font-family:${L.mono};color:${L.ink3};font-size:10.5px}
  .l-sig-row .body b{font-family:${L.mono};font-size:10px;font-weight:600;letter-spacing:.06em;
    padding:1.5px 5px;border-radius:3px;background:${L.accentSoft};color:${L.accent};margin-right:6px}
  .l-sig-row .body{color:${L.ink}}
  .l-sig-row .body .impact{display:block;color:${L.ink3};font-size:10.5px;margin-top:2px;font-family:${L.mono}}

  .l-ext{padding:0}
  .l-ext-row{display:flex;justify-content:space-between;align-items:center;
    padding:9px 14px;border-bottom:1px solid ${L.ruleSoft};font-size:11.5px;color:${L.ink2}}
  .l-ext-row:last-child{border-bottom:0}
  .l-ext-row .nm{display:flex;align-items:center;gap:8px}
  .l-ext-row .nm .badge{font-family:${L.mono};font-size:9px;font-weight:600;letter-spacing:.04em;
    padding:1.5px 5px;border-radius:3px;background:${L.ruleSoft};color:${L.ink3};text-transform:uppercase}
  .l-ext-row .v{font-family:${L.mono};color:${L.ink};font-weight:600}
  .l-ext-row .v small{color:${L.ink3};font-weight:400;margin-left:3px}

  .l-hw-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0}
  .l-hw-cell{padding:10px 12px;border-right:1px solid ${L.ruleSoft};border-bottom:1px solid ${L.ruleSoft}}
  .l-hw-cell:nth-child(2n){border-right:0}
  .l-hw-cell:nth-last-child(-n+2){border-bottom:0}
  .l-hw-cell .nm{font-family:${L.mono};font-size:10px;color:${L.ink3};letter-spacing:.04em;font-weight:600;text-transform:uppercase}
  .l-hw-cell .val{display:flex;align-items:baseline;gap:6px;margin-top:3px}
  .l-hw-cell .val b{font-family:${L.mono};font-size:14px;font-weight:600;color:${L.ink}}
  .l-hw-cell .val span{font-family:${L.mono};font-size:10.5px;color:${L.ink3}}
  .l-hw-cell .b{margin-top:5px;height:3px;border-radius:99px;background:${L.ruleSoft};overflow:hidden}
  .l-hw-cell .b i{display:block;height:100%;background:${L.accent}}
`;

function injectLStyle() {
  if (!document.getElementById('lattice-style')) {
    const s = document.createElement('style');
    s.id = 'lattice-style';
    s.textContent = lStyle;
    document.head.appendChild(s);
  }
}

// ─── small pieces ─────────────────────────────────────────────────────────

function LKpi({ label, value, delta, tone='' }) {
  return (
    <div className="l-kpi">
      <div className="e">{label}</div>
      <div className={"v " + tone}>{value}</div>
      {delta && <div className="d">{delta}</div>}
    </div>
  );
}

function lNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function lHasNumber(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function lFormatLocalDateTime(value) {
  if (!value) return '—';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).replace(',', '');
  } catch { return String(value); }
}

function lFormatLocalTime(value, seconds = false) {
  if (!value) return '—';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return String(value);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: seconds ? '2-digit' : undefined,
      timeZoneName: 'short',
    });
  } catch { return String(value); }
}

function lIsoTitle(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : String(value);
  } catch { return String(value); }
}

function lStatusLabel(status) {
  if (status === 'queued') return 'Not started';
  if (status === 'unavailable') return 'Unavailable';
  return status || 'unknown';
}

function lPaneId(view, docId) {
  const map = {
    chronology: 'chronology-timeline',
    people: 'people-register',
    entities: 'entity-registry',
    exec: 'synthesis-narrative',
    detailed: 'synthesis-narrative',
    synthesis: 'synthesis-narrative',
  };
  const slug = map[view] || view || 'trace-debug';
  return docId ? `panel:${slug}:${docId}` : `panel:${slug}`;
}

function LTraceChip({ debugIds, panelId, artifactRef, runId }) {
  if (!debugIds) return null;
  return (
    <div style={{
      fontSize: 9, fontFamily: L.mono, color: '#8A8A82',
      background: '#F0F0EB', border: '1px solid #E0DDD5',
      borderRadius: 4, padding: '2px 6px', margin: '0 0 8px',
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
    }}>
      <span title="Panel ID">📋 {panelId}</span>
      {artifactRef && <span title="Artifact ref">📦 {String(artifactRef).split('/').slice(-2).join('/')}</span>}
      {runId && <span title="Run ID">🔄 {String(runId).slice(0,8)}</span>}
    </div>
  );
}

function lEnhancePipelineWithRawStatus(pipeline, rawStatus) {
  if (!rawStatus) return pipeline;
  const total = lNumber(rawStatus.total_chunks);
  if (total <= 0) return pipeline;

  const completed = Math.max(0, Math.min(total, lNumber(rawStatus.chunks_completed)));
  const inProgress = Math.max(0, lNumber(rawStatus.chunks_in_progress));
  const pct = Math.max(0, Math.min(100, (completed / total) * 100));
  const chunkLabel = completed + '/' + total + ' chunks';
  const detail = inProgress > 0 ? chunkLabel + ' · ' + inProgress + ' active' : chunkLabel;

  return pipeline.map((p) => {
    const isParse = p.id === 'parse' || /parse|ocr/i.test(p.name || '');
    if (!isParse) return p;
    const status = completed >= total ? 'done'
                 : completed > 0 || inProgress > 0 ? 'running'
                 : p.status;
    return { ...p, pct, status, detail, progressLabel: chunkLabel };
  });
}

function lPipelineTarget(stage) {
  if (stage && stage.target) return stage.target;
  const id = String(stage?.id || '').toLowerCase();
  if (['chronology', 'people', 'entities', 'exec', 'detailed', 'synthesis'].includes(id)) return id;
  return null;
}

function lStageKpi(stage) {
  if (!stage || stage.status === 'unavailable') return { value: '—', delta: 'pending telemetry', tone: '' };
  const label = stage.progressLabel || '';
  const match = label.match(/^\s*(\d+\s*\/\s*\d+)/);
  if (match) return { value: match[1].replace(/\s/g, ''), delta: stage.detail || lStatusLabel(stage.status), tone: stage.status === 'done' ? 'ok' : '' };
  const rawPct = stage.pct != null ? stage.pct : (stage.progress != null ? stage.progress * 100 : null);
  if (lHasNumber(rawPct)) return { value: Math.max(0, Math.min(100, Number(rawPct))).toFixed(0) + '%', delta: lStatusLabel(stage.status), tone: stage.status === 'done' ? 'ok' : '' };
  return { value: '—', delta: 'pending telemetry', tone: '' };
}

function lHostOnline(host) {
  if (!host) return null;
  if (host.ok === true || host.available === true) return true;
  if (host.ok === false || host.available === false) return false;
  const status = String(host.status || host.state || '').toLowerCase();
  if (/^(ok|up|online|healthy|ready|running|available)$/.test(status)) return true;
  if (/(down|offline|unreachable|failed|error|unavailable|degraded)/.test(status)) return false;
  return null;
}

function LPipeRow({ p, idx, onView, docId }) {
  const rawPct = p.pct != null ? p.pct : (p.progress != null ? p.progress * 100 : 0);
  const pct = Math.max(0, Math.min(100, lNumber(rawPct)));
  const progressLabel = p.progressLabel || (pct.toFixed(0) + '%');
  const target = lPipelineTarget(p);
  const canView = !!(target && onView);
  return (
    <tr>
      <td className="pid">P{idx + 1}</td>
      <td className="name">
        <div>{p.name}</div>
        {p.detail && <div style={{fontFamily:L.mono,fontSize:10,color:L.ink3,marginTop:2}}>{p.detail}</div>}
      </td>
      <td><span className={"st " + p.status}>{lStatusLabel(p.status)}</span></td>
      <td>
        <div className={"pbar " + p.status}><i style={{ width: pct.toFixed(1)+'%' }} /></div>
      </td>
      <td className="ppct">{progressLabel}</td>
      <td className="paction">
        {canView
          ? <button className="plink" onClick={() => onView({ view: target, docId })}>Open</button>
          : <span className="pna">No detail</span>}
      </td>
    </tr>
  );
}

function LAgreeCol({ name, data }) {
  const total = data.total || 0;
  const accepted = data.accepted || 0;
  const disputed = data.disputed || 0;
  const rate = total > 0 ? accepted / total : 0;
  const ok = rate >= 0.85;
  return (
    <div className="l-agree-col">
      <div className="e">{name}</div>
      <div className="num">
        <span className="v">{(rate * 100).toFixed(0)}%</span>
        <span className={"badge " + (ok ? 'ok' : 'warn')}>{ok ? 'PASS' : 'LOW'}</span>
      </div>
      <div className="track">
        <div className="f" style={{ width: (rate*100)+'%', background: ok ? L.good : L.warn }} />
        <div className="g" style={{ left: '85%' }} />
      </div>
      <div className="breakdown">
        <span>{accepted}/{total} accepted</span>
        <span>{disputed} disp</span>
      </div>
    </div>
  );
}

// ─── Activity log ────────────────────────────────────────────────────────

function ActivityLog({ onView, activity, docId, debugIds }) {
  const events = activity || [];

  // Map real API event fields to display shape
  const typeToSrc = {
    UPLOAD: 'ingest', INDEX: 'index', CLAIM: 'extract', DECISION: 'pipeline',
    ENTITY: 'entity', SWEEP: 'sweep', PEOPLE: 'people', SYSTEM: 'system',
    SYNTHESIS: 'synthesis', PIPELINE: 'pipeline',
  };
  const typeColor = {
    UPLOAD: L.accent, INDEX: L.ink3, CLAIM: L.goodMid, DECISION: L.good,
    ENTITY: L.warn, PEOPLE: L.laneB, SWEEP: L.warnMid, SYSTEM: L.ink3,
    SYNTHESIS: L.warn, PIPELINE: L.accent,
  };
  const mapped = events.map(a => {
    const rawT = a.ts || a.t || '';
    return {
    rawT,
    t: lFormatLocalDateTime(rawT),
    src: a.source || typeToSrc[a.type] || (a.type || '').toLowerCase(),
    type: a.type || 'CLAIM',
    msg: a.msg || '',
    docTitle: null,
  };
  });

  // Historical = doc-scoped persisted JSONL events from coordination.
  const [histTab, setHistTab] = React.useState('live');
  const [histEvents, setHistEvents] = React.useState(null);
  React.useEffect(() => {
    setHistEvents(null);
  }, [docId]);
  React.useEffect(() => {
    if (histTab !== 'historical' || histEvents !== null || !docId) return;
    fetch('/api/docs/' + encodeURIComponent(docId) + '/activity-events?limit=500')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const rows = ((d && d.events) || []).map(a => ({
          rawT: a.ts || a.t || '',
          t: lFormatLocalDateTime(a.ts || a.t || ''),
          src: a.source || typeToSrc[a.type] || (a.type || '').toLowerCase(),
          type: a.type || 'CLAIM',
          msg: a.msg || '',
          docTitle: null,
        }));
        rows.sort((a, b) => (b.rawT || '').localeCompare(a.rawT || ''));
        setHistEvents(rows);
      })
      .catch(() => setHistEvents([]));
  }, [histTab, histEvents, docId]);

  const [typeFilter, setTypeFilter] = React.useState('all');
  const sourceEvents = histTab === 'live' ? mapped : (histEvents || []);
  const typeFilters = [
    { id: 'all', label: 'All' },
    { id: 'chronology', label: 'Chronology' },
    { id: 'people', label: 'People' },
    { id: 'entities', label: 'Entities' },
    { id: 'synthesis', label: 'Synthesis' },
    { id: 'system', label: 'System' },
  ];
  const matchesArtifactFilter = (a) => {
    const type = (a.type || '').toUpperCase();
    const source = (a.src || '').toLowerCase();
    if (typeFilter === 'all') return true;
    if (typeFilter === 'chronology') return source.includes('chronology') || type === 'CLAIM';
    if (typeFilter === 'people') return source.includes('people') || type === 'PEOPLE';
    if (typeFilter === 'entities') return source.includes('entities') || type === 'ENTITY';
    if (typeFilter === 'synthesis') return source.includes('synthesis') || type.toLowerCase().includes('synthesis');
    if (typeFilter === 'system') return type === 'SYSTEM' || source === 'system' || source.startsWith('lane_');
    return true;
  };
  const rows = sourceEvents.filter(matchesArtifactFilter);

  return (
    <div
      className="l-card"
      data-pane-id={docId ? `panel:trace-debug:${docId}` : 'panel:trace-debug'}
      data-doc-id={docId || ''}
    >
      <div className="l-card-h">
        <h3>Activity log · pipeline events</h3>
        <div className="meta">{rows.length} events</div>
      </div>
      <div style={{ padding: debugIds ? '8px 14px 0' : 0 }}>
        <LTraceChip debugIds={debugIds} panelId={docId ? `panel:trace-debug:${docId}` : 'panel:trace-debug'} />
      </div>

      {/* Live / Historical top-level tabs */}
      <div style={{display:'flex',gap:0,borderBottom:'1px solid '+L.rule}}>
        {['live','historical'].map(tab => (
          <button key={tab} onClick={() => setHistTab(tab)} style={{
            padding:'7px 16px',fontSize:12,fontWeight:histTab===tab?600:400,
            color:histTab===tab?L.accent:L.ink3,background:'none',border:'none',
            borderBottom:histTab===tab?'2px solid '+L.accent:'2px solid transparent',
            cursor:'pointer',fontFamily:L.sans,textTransform:'capitalize',
          }}>
            {tab}{tab==='live' && mapped.length > 0 && (
              <span style={{marginLeft:5,background:L.accentSoft,color:L.accent,borderRadius:9,padding:'1px 5px',fontSize:10,fontWeight:600}}>
                {mapped.length}
              </span>
            )}
          </button>
        ))}
        <div style={{flex:1}} />
        <div style={{display:'flex',gap:4,padding:'4px 10px',alignItems:'center'}}>
          {typeFilters.map(f => (
            <button key={f.id} onClick={() => setTypeFilter(f.id)} style={{
              padding:'2px 8px',fontSize:10,borderRadius:10,border:'1px solid',cursor:'pointer',
              borderColor:typeFilter===f.id?L.accent:L.rule,
              background:typeFilter===f.id?L.accentSoft:'transparent',
              color:typeFilter===f.id?L.accent:L.ink3,fontFamily:L.mono,
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="l-act-list" style={{maxHeight:320,overflowY:'auto'}}>
        {histTab === 'historical' && histEvents === null && docId && (
          <div style={{padding:'18px 14px',color:L.ink3,fontFamily:L.mono,fontSize:11.5}}>Loading historical events…</div>
        )}
        {rows.length === 0 && (histTab !== 'historical' || histEvents !== null) && (
          <div style={{padding:'18px 14px',color:L.ink3,fontFamily:L.mono,fontSize:11.5}}>
            {histTab==='live' ? 'No events yet — run a document through the pipeline.' : 'No historical events found.'}
          </div>
        )}
        {rows.map((a, i) => {
          const target = lActivityTarget(a);
          const canNav = !!(onView && target);
          return (
            <div key={i} className={'l-act-row' + (canNav ? ' clickable' : '')}
                 onClick={canNav ? () => onView(target) : undefined}
                 style={{display:'grid',gridTemplateColumns:'52px 68px 60px 1fr',gap:0,
                   padding:'7px 14px',borderBottom:'1px solid '+L.ruleSoft,
                   fontSize:11.5,alignItems:'start',cursor:canNav?'pointer':'default',
                   background:'transparent'}}
                 onMouseEnter={e => { if(canNav) e.currentTarget.style.background = L.ruleSoft; }}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div
                title={lIsoTitle(a.rawT)}
                style={{fontFamily:L.mono,fontSize:10.5,color:L.ink3,paddingTop:1}}
              >
                {a.t}
              </div>
              <div style={{fontFamily:L.mono,fontSize:10,color:L.ink2,paddingTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.src}</div>
              <div>
                <span style={{
                  fontSize:9.5,fontWeight:700,letterSpacing:'.06em',padding:'2px 5px',borderRadius:4,
                  background:(typeColor[a.type]||L.ink3)+'22',
                  color:typeColor[a.type]||L.ink3,fontFamily:L.mono,
                }}>
                  {a.type}
                </span>
              </div>
              <div style={{color:L.ink,lineHeight:1.45}}>
                {a.docTitle && (
                  <span style={{fontSize:10,color:L.ink3,fontFamily:L.mono,marginRight:6,fontStyle:'italic'}}>{a.docTitle} ·</span>
                )}
                {a.msg}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Artifact summary cards ─────────────────────────────────────────────

function ArtChronoCard({ a, onView, docId, debugIds, artifactRef, runId }) {
  const confirmedCount = a.confirmedCount ?? a.count;
  const nominatedCount = a.nominatedCount ?? 0;
  return (
    <ArtFrame a={a} target={{ view: 'chronology', docId: docId }} onView={onView} docId={docId} debugIds={debugIds} artifactRef={artifactRef} runId={runId}>
      <ArtMeter accepted={a.accepted} disputed={a.disputed} superseded={a.superseded} total={a.count} />
      <div className="l-art-list">
        <div className="l-art-row" style={{padding:'10px 6px'}}>
          <div className="lbl">
            <div className="pri" style={{color:L.ink2,fontSize:11}}>
              {a.count} events extracted · {confirmedCount} confirmed · {nominatedCount} in review
            </div>
            <div className="sec">
              <span>{a.accepted} accepted</span>
              {a.disputed > 0 && <span style={{color:L.warn}}>{a.disputed} disputed</span>}
            </div>
          </div>
        </div>
      </div>
      <ArtFoot lastUpdate={a.lastUpdate} viewLabel={"View all " + confirmedCount} onView={onView} target={{ view: 'chronology', docId: docId }} />
    </ArtFrame>
  );
}

function ArtEntityCard({ a, onView, docId, debugIds, artifactRef, runId }) {
  const entityClaims = a.entityClaims || 0;
  return (
    <ArtFrame a={a} target={{ view: 'entities', docId: docId }} onView={onView} docId={docId} debugIds={debugIds} artifactRef={artifactRef} runId={runId}>
      <div className="l-art-meter">
        <div className="row"><span>Canonical entities</span><b>{a.count}</b></div>
      </div>
      <div className="l-art-list">
        <div className="l-art-row" style={{padding:'10px 6px'}}>
          <div className="lbl">
            <div className="pri" style={{color:L.ink2,fontSize:11}}>
              {a.count} canonical registry entries identified
            </div>
            <div className="sec"><span>from canonical entity registry v2</span></div>
            <div className="sec"><span>{entityClaims} adjudicated entity claims</span></div>
          </div>
        </div>
      </div>
      <ArtFoot lastUpdate={a.lastUpdate} viewLabel="View entity register →" onView={onView} target={{ view: 'entities', docId: docId }} />
    </ArtFrame>
  );
}

function ArtPeopleCard({ a, onView, docId, debugIds, artifactRef, runId }) {
  return (
    <ArtFrame a={a} target={{ view: 'people', docId: docId }} onView={onView} docId={docId} debugIds={debugIds} artifactRef={artifactRef} runId={runId}>
      <ArtMeter accepted={a.accepted} disputed={a.disputed} superseded={a.superseded} total={a.count} />
      <div className="l-art-list">
        <div className="l-art-row" style={{padding:'10px 6px'}}>
          <div className="lbl">
            <div className="pri" style={{color:L.ink2,fontSize:11}}>
              {a.count} persons named in document
            </div>
            <div className="sec">
              <span>{a.accepted} accepted</span>
              {a.disputed > 0 && <span style={{color:L.warn}}>{a.disputed} disputed</span>}
            </div>
          </div>
        </div>
      </div>
      <ArtFoot lastUpdate={a.lastUpdate} viewLabel={"View all " + a.count} onView={onView} target={{ view: 'people', docId: docId }} />
    </ArtFrame>
  );
}

function ArtReportCard({ a, onView, docId, debugIds, artifactRef, runId }) {
  const sectionCount = Math.max(1, a.sections || 0);
  const draftedPct = (a.drafted || 0) / sectionCount * 100;
  const critiquedPct = (a.critiqued || 0) / sectionCount * 100;
  return (
    <ArtFrame a={a} kind="report" target={{ view: a.id }} onView={onView} docId={docId} debugIds={debugIds} artifactRef={artifactRef} runId={runId}>
      <div className="l-art-meter">
        <div className="row">
          <span>{a.id === 'exec' ? 'Sections drafted' : 'Sections gated'}</span>
          <b>{a.drafted}/{a.sections}</b>
        </div>
        <div className="seg">
          <i className="acc" style={{ width: draftedPct+'%' }} />
          <i className="dis" style={{ width: critiquedPct+'%', background: L.warn }} />
        </div>
        <div className="breakdown">
          <span>{a.drafted} drafted</span>
          <span>{a.critiqued} in critic loop</span>
          <span>{a.sections - a.drafted - a.critiqued} Not started</span>
        </div>
      </div>
      <div className="l-art-list">
        {(!a.outline || a.outline.length === 0) && (
          <div className="l-art-row">
            <div className="lbl">
              <div className="pri" style={{color:L.ink3}}>No generated sections available</div>
            </div>
            <div><span className="l-art-pill queued">Not started</span></div>
          </div>
        )}
        {(a.outline || []).map((s, i) => (
          <div key={i} className="l-art-row">
            <div className="lbl">
              <div className={"pri " + (s.state === 'gated' || s.state === 'queued' ? 'dim' : '')}>§{i+1} {s.h}</div>
              {s.body && <div className="sec"><span>{s.body}</span></div>}
            </div>
            <div><span className={"l-art-pill " + s.state}>{lStatusLabel(s.state)}</span></div>
          </div>
        ))}
      </div>
      <ArtFoot lastUpdate={a.lastUpdate} viewLabel={a.id === 'exec' ? 'Open draft' : 'Open outline'} onView={onView} target={{ view: a.id }} />
    </ArtFrame>
  );
}

function PeopleRunHistoryCard({ runs, selectedIdx, onSelect }) {
  if (!runs || runs.length === 0) return null;
  const run = runs[selectedIdx] || runs[0];
  const fmt = ts => lFormatLocalDateTime(ts);
  return (
    <div className="l-card">
      <div className="l-card-h" style={{ alignItems: 'center', gap: 10 }}>
        <h3 style={{ flex: 1 }}>People mentioned · run history</h3>
        <select
          value={selectedIdx}
          onChange={e => onSelect(Number(e.target.value))}
          style={{
            fontSize: 11, fontFamily: L.mono, border: '1px solid ' + L.rule,
            borderRadius: 4, padding: '3px 8px', background: '#FFF', color: L.ink, cursor: 'pointer'
          }}>
          {runs.map((r, i) => (
            <option key={r.run_id} value={i}>
              {i === 0 ? '★ Latest — ' : ''}{fmt(r.timestamp)} · {r.count !== null && r.count !== undefined ? r.count : '?'} people
            </option>
          ))}
        </select>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {(!run.individuals || run.individuals.length === 0) ? (
          <div style={{ padding: '10px 14px', color: L.ink3, fontFamily: L.mono, fontSize: 11 }}>
            No individuals recorded in this run.
          </div>
        ) : run.individuals.map((ind, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'baseline', gap: 10,
            padding: '6px 14px', borderBottom: '1px solid ' + L.ruleSoft
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: L.ink }}>{ind.name}</div>
              {ind.role && <div style={{ fontSize: 11, color: L.ink3, fontFamily: L.mono, marginTop: 1 }}>{ind.role}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArtFrame({ a, kind, children, target, onView, docId, artifactRef, runId, debugIds }) {
  const isReport = kind === 'report' || a.kind === 'report';
  const clickable = !!(target && onView);
  const panelId = lPaneId(target?.view || a.id, docId);
  return (
    <div className={"l-art " + (isReport ? 'report' : '') + (clickable ? ' clickable' : '')}
         data-pane-id={panelId}
         data-artifact-id={artifactRef || ''}
         data-run-id={runId || ''}
         data-doc-id={docId || ''}
         onClick={clickable ? () => onView(target) : undefined}>
      <div className="l-art-h">
        <div className="left">
          <div className={"l-art-kind " + (isReport ? 'report' : '')}>{isReport ? 'Report' : 'List'} · {a.kind === 'list' ? (a.count + ' claims') : (a.sections + ' sections')}</div>
          <div className="l-art-name">{a.name}</div>
        </div>
        <div className={"l-art-stat " + a.status}>{lStatusLabel(a.status)}</div>
      </div>
      <div style={{ padding: debugIds ? '8px 12px 0' : 0 }}>
        <LTraceChip debugIds={debugIds} panelId={panelId} artifactRef={artifactRef} runId={runId} />
      </div>
      {children}
    </div>
  );
}

function ArtMeter({ accepted, disputed, superseded, total }) {
  const t = total || 1;
  const rate = accepted / t;
  return (
    <div className="l-art-meter">
      <div className="row">
        <span>Accepted</span>
        <b>{(rate * 100).toFixed(0)}%</b>
      </div>
      <div className="seg">
        <i className="acc" style={{ width: (accepted/t*100)+'%' }} />
        <i className="dis" style={{ width: ((disputed||0)/t*100)+'%' }} />
        <i className="sup" style={{ width: ((superseded||0)/t*100)+'%' }} />
      </div>
      <div className="breakdown">
        <span><b>{accepted}</b> accepted</span>
        <span>{disputed||0} disp</span>
        <span>{superseded||0} sup</span>
      </div>
    </div>
  );
}

function ArtFoot({ lastUpdate, viewLabel, onView, target, href }) {
  return (
    <div className="l-art-foot">
      <span>Updated {lastUpdate}</span>
      {href
        ? <a href={href} target="_blank" rel="noreferrer"
             onClick={(e) => e.stopPropagation()}>{viewLabel} →</a>
        : <a onClick={(e) => { e.stopPropagation(); onView && onView(target); }}
             style={{ cursor: onView ? 'pointer' : 'default' }}>{viewLabel} →</a>
      }
    </div>
  );
}

function lFormatIngestDateTime(value) {
  return lFormatLocalDateTime(value);
}

// ─── Conflict 3-lane ─────────────────────────────────────────────────────

function LConflict({ cf, onView }) {
  const laneMap = { structural: 'A', hybrid: 'B', table: 'C' };
  const target = cf.artifact === 'person' ? { view: 'people' } :
                 cf.artifact === 'entity' ? { view: 'entities' } : { view: 'chronology' };
  return (
    <div style={{ borderBottom: '1px solid ' + L.rule }}>
      <div className="l-cf-head">
        <div className="l-cf-id">{cf.id.toUpperCase()}</div>
        <div className="l-cf-subj">{cf.artifact.toUpperCase()} · {cf.subject}</div>
        <div className="l-cf-j">J {cf.jaccard.toFixed(2)} · {cf.status.replace('_',' ')}</div>
      </div>
      <div className="l-cf-body">
        {cf.claims.map(c => (
          <div key={c.lane} className={"l-cf-lane " + laneMap[c.lane]}>
            <div className="ltag"><span className="swatch" /> Lane {laneMap[c.lane]} · {c.lane}</div>
            <div className="val">{c.value}</div>
            <div className="src">{c.source}</div>
            <div className="ev">“{c.evidence}”</div>
            <div className="cbar">
              <div className="b"><i style={{ width: (c.conf*100)+'%' }} /></div>
              <div className="v">{c.conf.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="l-cf-foot">
        <div className="l-cf-rule">
          {cf.authority ? <>↳ <b>AUTHORITY_RULE</b> · {cf.authority}</> : '↳ no deterministic resolution · awaiting Arbiter (5090 NVFP4)'}
        </div>
        <div className="l-cf-actions">
          <button className="l-btn primary" onClick={() => onView && onView(target)}>Open in {target.view}</button>
          <button className="l-btn">Re-pass</button>
          <button className="l-btn danger">Escalate</button>
        </div>
      </div>
    </div>
  );
}

// ─── LLM Telemetry Panel ─────────────────────────────────────────────────

function LlmTelemetryPanel({ metrics, telemetry }) {
  const fast = metrics ? metrics.fast : null;
  const deep = metrics ? metrics.deep : null;
  const entries = telemetry ? (telemetry.entries || []) : null;
  const peakConc = telemetry ? (telemetry.peak_concurrency || 0) : 0;
  const avgDur   = telemetry ? (telemetry.avg_duration_ms || 0) : 0;

  const kvColor = (pct) => pct > 80 ? L.bad : pct > 50 ? L.warnMid : L.goodMid;
  const concColor = (n) => n >= 4 ? L.bad : n >= 2 ? L.warnMid : L.goodMid;
  const durColor = (ms) => ms > 30000 ? L.bad : ms > 10000 ? L.warnMid : L.goodMid;

  const shortDoc = (id) => {
    if (!id) return '—';
    const m = id.match(/ui-original_([^-]+)/);
    return m ? m[1].replace(/_/g, ' ') : id.slice(-20);
  };

  const fmtTime = (iso) => {
    if (!iso) return '—';
    return lFormatLocalTime(iso, true);
  };

  return (
    <div className="l-card" style={{ marginTop: 14 }}>
      <div className="l-card-h">
        <h3>LLM request telemetry</h3>
        <div className="meta">
          {fast ? (fast.ok ? 'alienware · online' : 'alienware · offline') : 'loading...'}
          {' · '}
          {deep ? (deep.ok ? 'gb10 · online' : 'gb10 · no metrics') : ''}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 0,
        borderBottom: '1px solid ' + L.rule, padding: '10px 14px' }}>
        <div className="l-hw-cell">
          <div className="nm">AW running</div>
          <div className="val">
            <b style={{ color: concColor(fast ? fast.requests_running : 0) }}>
              {fast ? fast.requests_running : '—'}
            </b>
            <span>req</span>
          </div>
        </div>
        <div className="l-hw-cell">
          <div className="nm">AW waiting</div>
          <div className="val">
            <b style={{ color: fast && fast.requests_waiting > 0 ? L.warnMid : L.goodMid }}>
              {fast ? fast.requests_waiting : '—'}
            </b>
            <span>queued</span>
          </div>
        </div>
        <div className="l-hw-cell">
          <div className="nm">AW KV cache</div>
          <div className="val">
            <b style={{ color: kvColor(fast ? fast.kv_cache_pct : 0) }}>
              {fast ? fast.kv_cache_pct.toFixed(1) : '—'}%
            </b>
            <span>used</span>
          </div>
        </div>
        <div className="l-hw-cell">
          <div className="nm">Prefix hit rate</div>
          <div className="val">
            <b style={{ color: L.accent }}>{fast ? (fast.prefix_cache_hit_rate * 100).toFixed(0) : '—'}%</b>
            <span>cache</span>
          </div>
        </div>
        <div className="l-hw-cell">
          <div className="nm">Gen tokens (total)</div>
          <div className="val">
            <b>{fast ? ((fast.generation_tokens_total / 1000).toFixed(0) + 'k') : '—'}</b>
            <span>AW cumul</span>
          </div>
        </div>
      </div>
      {entries !== null && entries.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          <div style={{ display: 'grid',
            gridTemplateColumns: '70px 110px 60px 80px 70px 70px 80px',
            gap: 0, padding: '4px 14px',
            fontSize: 10, color: L.ink3, fontFamily: L.mono, textTransform: 'uppercase',
            letterSpacing: '.06em', borderBottom: '1px solid ' + L.ruleSoft }}>
            <div>Time</div><div>Document</div><div>Mode</div>
            <div>Duration</div><div>Concur.</div><div>Gen tok</div><div>KV cache</div>
          </div>
          {entries.slice(0, 12).map((e, i) => (
            <div key={i} style={{ display: 'grid',
              gridTemplateColumns: '70px 110px 60px 80px 70px 70px 80px',
              gap: 0, padding: '5px 14px',
              fontSize: 11, fontFamily: L.mono,
              borderBottom: '1px solid ' + L.ruleSoft,
              background: i % 2 === 0 ? 'transparent' : L.panelDim }}>
              <div style={{ color: L.ink3 }}>{fmtTime(e.ts)}</div>
              <div style={{ color: L.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                title={e.document_id}>{shortDoc(e.document_id)}</div>
              <div>
                <span style={{ background: e.mode==='deep' ? L.laneB + '22' : L.accentSoft,
                  color: e.mode==='deep' ? L.laneB : L.accent,
                  padding:'1px 5px', borderRadius:3, fontSize:10 }}>{e.mode||'?'}</span>
              </div>
              <div style={{ color: durColor(e.duration_ms||0) }}>
                {e.duration_ms ? ((e.duration_ms/1000).toFixed(1)+'s') : '—'}
              </div>
              <div style={{ color: concColor(e.concurrency_at_start||0) }}>
                {e.concurrency_at_start != null ? e.concurrency_at_start : '—'}
                {e.concurrency_at_end != null && e.concurrency_at_end !== e.concurrency_at_start
                  ? ('→'+e.concurrency_at_end) : ''}
              </div>
              <div style={{ color: L.ink }}>{e.gen_tokens_delta != null ? e.gen_tokens_delta : '—'}</div>
              <div style={{ color: kvColor(e.kv_cache_pct||0) }}>
                {e.kv_cache_pct != null ? e.kv_cache_pct.toFixed(1)+'%' : '—'}
              </div>
            </div>
          ))}
          {telemetry && telemetry.count > 0 && (
            <div style={{ padding: '6px 14px', fontSize: 10.5, color: L.ink3, fontFamily: L.mono,
              display: 'flex', gap: 20 }}>
              <span>peak concurrency <b style={{ color: concColor(peakConc) }}>{peakConc}</b></span>
              <span>avg duration <b style={{ color: durColor(avgDur) }}>{(avgDur/1000).toFixed(1)}s</b></span>
              <span>total gen tokens <b style={{ color: L.ink }}>{(telemetry.total_gen_tokens_sampled||0).toLocaleString()}</b></span>
            </div>
          )}
        </div>
      )}
      {entries !== null && entries.length === 0 && (
        <div style={{ padding:'14px', color:L.ink3, fontFamily:L.mono, fontSize:11 }}>
          No Q&A requests recorded this session. Ask a question via the chat dock to populate this log.
        </div>
      )}
      {entries === null && (
        <div style={{ padding:'14px', color:L.ink3, fontFamily:L.mono, fontSize:11 }}>Loading…</div>
      )}
    </div>
  );
}

function HardwareThroughputCard() {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    const poll = () => {
      fetch('/api/hardware/throughput')
        .then(r => r.json())
        .then(d => { if (!cancelled) { setData(d); setError(false); } })
        .catch(() => { if (!cancelled) setError(true); });
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const row = (label, info) => {
    if (!info) return null;
    const busy = info.running + info.waiting;
    const status = !info.available ? 'offline'
                 : busy === 0      ? 'idle'
                 : info.waiting > 0 ? 'queued'
                 : 'active';
    const colour = status === 'offline' ? '#9CA3AF'
                 : status === 'idle'    ? '#10B981'
                 : status === 'queued'  ? '#F59E0B'
                 : '#3B82F6';
    return (
      <div key={label} style={{ display:'flex', alignItems:'center', gap:12, padding:'6px 0', borderBottom:'1px solid #F3F4F6' }}>
        <span style={{ width:90, fontSize:13, fontWeight:600, color:'#374151' }}>{label}</span>
        <span style={{ width:12, height:12, borderRadius:'50%', background:colour, flexShrink:0 }} />
        <span style={{ fontSize:12, color:'#6B7280', flex:1 }}>
          {!info.available ? 'unreachable'
           : `${info.running} running · ${info.waiting} waiting · cache ${info.cache_pct}%`}
        </span>
      </div>
    );
  };

  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:8, padding:'16px 20px', marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:10 }}>Inference Throughput</div>
      {error && <div style={{ fontSize:12, color:'#EF4444' }}>Could not reach coordination API</div>}
      {!error && !data && <div style={{ fontSize:12, color:'#9CA3AF' }}>Loading...</div>}
      {data && (
        <div>
          {row('Alienware', data.alienware)}
          {row('GymPC', data.gympc)}
          <div style={{ fontSize:11, color:'#9CA3AF', marginTop:6 }}>
            Updated {data.timestamp ? lFormatLocalTime(data.timestamp) : '-'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────

function LatticeDashboard() {
  injectLStyle();
  const nav = React.useContext(LNavContext);
  const onView = nav && nav.go ? (target) => nav.go(target.view, target.id, target.docId) : null;
  const [debugIds] = React.useState(() => localStorage.getItem('lw_debug_ids') === 'true');

  // ── Document picker ──────────────────────────────────────────────────
  const [selectedDocId, setSelectedDocId] = React.useState(() => {
    const hash = window.location.hash.replace('#', '');
    const hashDoc = hash.startsWith('doc=') ? decodeURIComponent(hash.slice(4)) : null;
    return hashDoc || localStorage.getItem('op_selected_doc') || null;
  });
  const [docPickerOpen, setDocPickerOpen] = React.useState(false);
  const [runStatus, setRunStatus] = React.useState(null);
  const pickDoc = (id) => {
    setSelectedDocId(id);
    if (id) {
      localStorage.setItem('op_selected_doc', id);
      window.location.hash = 'doc=' + encodeURIComponent(id);
    } else {
      localStorage.removeItem('op_selected_doc');
      window.location.hash = '';
    }
  };

  // ── Live data polling ──────────────────────────────────────────────────
  const [live, setLive] = React.useState(null);
  const [fetchTs, setFetchTs] = React.useState(null);
  const [documentCounts, setDocumentCounts] = React.useState(null);
  React.useEffect(() => {
    const url = selectedDocId
      ? '/api/operator-status?doc_id=' + encodeURIComponent(selectedDocId)
      : '/api/operator-status';
    const load = () => {
      fetch(url)
        .then(r => r.json())
        .then(d => { setLive(d); setFetchTs(new Date()); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [selectedDocId]);

  React.useEffect(() => {
    const docId = live?.doc?.id;
    setDocumentCounts(null);
    if (!docId) return;
    const load = () => {
      fetch('/api/docs/' + encodeURIComponent(docId) + '/counts')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setDocumentCounts(d); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [live?.doc?.id]);

  // ── Raw document status (30 s) — event_count / evidence_count fallback ──
  // Uses selectedDocId (state) as the dependency key; falls back to the doc id
  // received from operator-status once live data arrives.
  const [rawStatus, setRawStatus] = React.useState(null);
  const rawStatusDocId = selectedDocId || (live && live.doc && live.doc.id) || null;
  React.useEffect(() => {
    setRawStatus(null);
  }, [rawStatusDocId]);
  React.useEffect(() => {
    if (!rawStatusDocId) return;
    const load = () => {
      fetch('/api/status/' + encodeURIComponent(rawStatusDocId))
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setRawStatus(d); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [rawStatusDocId]);

  // ── LLM telemetry polling (15 s — less critical than operator-status) ──
  const [llmMetrics, setLlmMetrics] = React.useState(null);
  const [llmTelemetry, setLlmTelemetry] = React.useState(null);
  React.useEffect(() => {
    const load = () => {
      fetch('/api/llm-metrics')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setLlmMetrics(d); })
        .catch(() => {});
      fetch('/api/llm-telemetry?limit=20')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setLlmTelemetry(d); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  // ── People run history ─────────────────────────────────────────────────
  const [pmRuns, setPmRuns] = React.useState([]);
  const [selectedPmRunIdx, setSelectedPmRunIdx] = React.useState(0);
  React.useEffect(() => {
    const docId = live?.doc?.id;
    if (!docId) return;
    fetch('/api/docs/' + encodeURIComponent(docId) + '/people-mentioned/runs')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.runs) { setPmRuns(d.runs); setSelectedPmRunIdx(0); } })
      .catch(() => {});
  }, [live?.doc?.id]);

  // ── Synthesis artifact summary + confirmed chronology count ────────────
  const [synthesisArtifact, setSynthesisArtifact] = React.useState(null);
  const [convergenceData, setConvergenceData] = React.useState(null);
  React.useEffect(() => {
    const docId = live?.doc?.id;
    setSynthesisArtifact(null);
    setConvergenceData(null);
    if (!docId) return;
    Promise.all([
      fetch('/api/docs/' + encodeURIComponent(docId) + '/artifacts/synthesis-v1')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch('/api/docs/' + encodeURIComponent(docId) + '/claims/convergence')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ])
      .then(([synthesis, convergence]) => {
        if (synthesis) setSynthesisArtifact(synthesis);
        if (convergence) setConvergenceData(convergence);
      })
      .catch(() => {});
  }, [live?.doc?.id]);

  // ── Per-host token rate deltas from operator-status polling ─────────────
  const [tokenRates, setTokenRates] = React.useState({});
  const lastHardwareRef = React.useRef(null);
  React.useEffect(() => {
    if (!live?.hardware) return;
    const now = Date.now();
    const prev = lastHardwareRef.current;
    if (prev) {
      const elapsed = Math.max(1, (now - prev.ts) / 1000);
      const rates = {};
      Object.entries(live.hardware).forEach(([key, host]) => {
        const before = prev.hardware[key];
        if (!before) return;
        if (!lHasNumber(host.generation_tokens_total) || !lHasNumber(before.generation_tokens_total)) return;
        const delta = Number(host.generation_tokens_total) - Number(before.generation_tokens_total);
        if (delta >= 0) rates[key] = delta / elapsed;
      });
      setTokenRates(rates);
    }
    lastHardwareRef.current = { ts: now, hardware: live.hardware };
  }, [live?.hardware]);

  // ── Derived display state ──────────────────────────────────────────────
  const doc        = live?.doc || {};
  const pipeline   = lEnhancePipelineWithRawStatus(live?.pipeline || [], rawStatus);
  const claimsData = live?.claims || {};
  const hw         = live?.hardware || {};
  const activity   = live?.activity || [];
  const breakdown  = live?.claim_breakdown || {};
  const allDocs    = live?.all_docs || [];

  const hardwareEntries = Object.entries(hw);
  const kvValues = hardwareEntries.map(([, h]) => h.kv_cache_pct).filter(lHasNumber).map(Number);
  const runningValues = hardwareEntries.map(([, h]) => h.running).filter(lHasNumber).map(Number);
  const waitingValues = hardwareEntries.map(([, h]) => h.waiting).filter(lHasNumber).map(Number);
  const tokenValues = hardwareEntries
    .filter(([, h]) => lHostOnline(h) === true && lHasNumber(h.generation_tokens_total))
    .map(([, h]) => Number(h.generation_tokens_total));
  const fleetKvKnown = kvValues.length > 0;
  const fleetKv = fleetKvKnown ? Math.max(...kvValues) : null;
  const fleetRunningKnown = runningValues.length > 0;
  const fleetWaitingKnown = waitingValues.length > 0;
  const fleetRunning = runningValues.reduce((s, v) => s + v, 0);
  const fleetWaiting = waitingValues.reduce((s, v) => s + v, 0);
  const fleetGenKnown = tokenValues.length > 0;
  const fleetGenTotal = tokenValues.reduce((s, v) => s + v, 0);
  const fleetGenHosts = tokenValues.length === 1 ? '1 host' : `${tokenValues.length} hosts`;

  // Agreement data from breakdown
  const makeAgree = (type) => {
    const b = breakdown[type] || {};
    const accepted = b.accepted || 0;
    const disputed = b.disputed || 0;
    const total = Object.values(b).reduce((s, v) => s + v, 0);
    return { accepted, disputed, total };
  };

  const doneStages  = pipeline.filter(p => p.status === 'done').length;
  const totalClaims = claimsData.total || 0;

  // Build artifact card data
  const chronoBkd  = breakdown.chronology || {};
  const canonicalChrono = documentCounts?.chronology || {};
  const chronoAcc  = canonicalChrono.confirmed ?? chronoBkd.accepted ?? 0;
  const chronoDisp = canonicalChrono.challenged ?? chronoBkd.disputed ?? 0;
  const chronoN    = canonicalChrono.total ?? claimsData.chronology ?? rawStatus?.chronology_events_after_dedupe ?? rawStatus?.chronology_event_count ?? 0;
  const chronoConfirmed = Number.isFinite(Number(convergenceData?.confirmed)) ? Number(convergenceData.confirmed) : null;
  const chronoConfirmedCount = canonicalChrono.confirmed ?? chronoConfirmed ?? chronoN;
  const chronoNominatedCount = (canonicalChrono.nominated ?? 0) + (canonicalChrono.challenged ?? 0);

  const peopleBkd  = breakdown.people || {};
  const peopleAcc  = peopleBkd.accepted || 0;
  const peopleDisp = peopleBkd.disputed || 0;
  const peopleN    = documentCounts?.people ?? claimsData.people ?? rawStatus?.people_count ?? rawStatus?.people_mentioned_count ?? 0;

  const artChrono = {
    name: 'Chronology', kind: 'list', status: 'iterating',
    count: chronoN, confirmedCount: chronoConfirmedCount, nominatedCount: chronoNominatedCount, accepted: chronoAcc, disputed: chronoDisp, superseded: 0,
    lastUpdate: fetchTs ? lFormatLocalTime(fetchTs) : '—',
  };
  const artEntity = {
    name: 'Entities', kind: 'list', status: 'iterating',
    count: documentCounts?.entities ?? claimsData.entities ?? rawStatus?.mentioned_entities_count ?? 0,
    entityClaims: documentCounts?.entity_claims?.total ?? 0,
    lastUpdate: fetchTs ? lFormatLocalTime(fetchTs) : '—',
  };
  const artPeople = {
    name: 'People', kind: 'list', status: 'iterating',
    count: peopleN, accepted: peopleAcc, disputed: peopleDisp, superseded: 0,
    lastUpdate: fetchTs ? lFormatLocalTime(fetchTs) : '—',
  };
  const synthesisSections = Array.isArray(synthesisArtifact?.sections) ? synthesisArtifact.sections : [];
  const synthesisOutline = synthesisSections.map((section, idx) => ({
    h: section.title || section.heading || section.id || ('Section ' + (idx + 1)),
    body: String(
      section.narrative || section.body || section.content ||
      (Array.isArray(section.claims) ? section.claims.map(c => c.description || c.summary || c.title || '').filter(Boolean).join(' ') : '') ||
      (Array.isArray(section.entities) ? section.entities.map(e => e.name || e.canonical_name || e.role || '').filter(Boolean).join(', ') : '')
    ).slice(0, 180),
    state: 'drafted',
  }));
  const synthesisHasSummary = !!(synthesisArtifact?.executive_summary || synthesisArtifact?.drafted);
  const synthesisSectionCount = synthesisOutline.length || (synthesisHasSummary ? 1 : 0);
  const artMemo = {
    name: 'Legal Memo', kind: 'report', id: 'exec', status: synthesisSectionCount > 0 ? 'drafting' : 'queued',
    sections: synthesisSectionCount, drafted: synthesisSectionCount, critiqued: 0,
    outline: synthesisOutline,
    lastUpdate: synthesisArtifact?.generated_at ? lFormatLocalTime(synthesisArtifact.generated_at) : '—',
  };
  const artDetailed = {
    name: 'Detailed Analysis', kind: 'report', id: 'detailed', status: 'gated',
    sections: 0, drafted: 0, critiqued: 0,
    outline: [],
    lastUpdate: '—',
  };

  // Hardware KV colour
  const kvColor = (pct) => pct > 80 ? L.bad : pct > 50 ? L.warnMid : L.goodMid;
  const fmtTokens = (n) => {
    const v = Number(n || 0);
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'm';
    if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
    return v.toString();
  };

  const tsStr = fetchTs ? lFormatLocalTime(fetchTs) : 'loading...';
  const activeDocId = selectedDocId || localStorage.getItem('op_selected_doc') || doc.id || null;
  const graphNamespace = typeof rawStatus?.graph_namespace === 'string' && rawStatus.graph_namespace.length > 0
    ? rawStatus.graph_namespace
    : null;
  const parseStage = pipeline.find(p => p.id === 'parse' || /parse|ocr/i.test(p.name || ''));
  const indexStage = pipeline.find(p => p.id === 'index' || /chunk|index/i.test(p.name || ''));
  const parseKpi = lStageKpi(parseStage);
  const indexKpi = lStageKpi(indexStage);
  const chronologyStage = pipeline.find(p => p.id === 'chronology');
  const peopleStage = pipeline.find(p => p.id === 'people');
  const chronologyRunning = chronologyStage?.status === 'running';
  const peopleRunning = peopleStage?.status === 'running';
  const triggerDocRun = (kind) => {
    if (!activeDocId) {
      setRunStatus({ kind, state: 'error', message: 'No document selected' });
      return;
    }
    setRunStatus({ kind, state: 'running', message: 'Starting ' + kind + ' run' });
    fetch('/api/docs/' + encodeURIComponent(activeDocId) + '/' + kind + '/rerun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          const detail = data && data.detail;
          const msg = detail && detail.message ? detail.message : ('Failed to start ' + kind);
          setRunStatus({ kind, state: 'error', message: msg });
          return;
        }
        setRunStatus({ kind, state: 'running', message: (data.status || 'running') + ' · ' + activeDocId });
      })
      .catch(() => setRunStatus({ kind, state: 'error', message: 'Could not reach coordination API' }));
  };

  return (
    <div className="l-root" data-doc-id={activeDocId || ''}>
      {/* KPI rail */}
      <div className="l-top">
        <div className="l-brand">
          <div className="l-brand-mark">LA</div>
          <div>legal-ai · operator</div>
        </div>
        <div className="l-doc-strip" style={{position:'relative',cursor:'pointer',userSelect:'none'}}
             onClick={() => setDocPickerOpen(o => !o)}>
          <div className="e" style={{display:'flex',alignItems:'center',gap:4}}>
            {selectedDocId ? 'selected' : 'latest'}
            <span style={{fontSize:9,opacity:.6}}>▾</span>
          </div>
          <div className="t" style={{display:'flex',alignItems:'center',gap:6}}>
            {doc.title || 'Loading…'}
          </div>
          <div className="s">{doc.id || '—'} · {(doc.pages||0).toLocaleString()}pp · {(doc.docType||'document').toLowerCase()}</div>
          {docPickerOpen && (
            <div onClick={e => e.stopPropagation()} style={{
              position:'absolute',top:'100%',left:0,zIndex:99,
              background:'#FFF',border:'1px solid '+L.rule,borderRadius:8,
              boxShadow:'0 8px 32px rgba(0,0,0,.14)',minWidth:340,maxHeight:360,overflowY:'auto',
              fontFamily:L.sans,marginTop:4
            }}>
              <div style={{padding:'8px 12px 6px',fontSize:10,color:L.ink3,letterSpacing:'.08em',textTransform:'uppercase',borderBottom:'1px solid '+L.rule}}>
                Recent documents
              </div>
              {allDocs.length === 0 && (
                <div style={{padding:'12px 14px',color:L.ink3,fontSize:11.5}}>No documents yet</div>
              )}
              {allDocs.map((d, i) => (
                <div key={i} onClick={() => { pickDoc(d.id); setDocPickerOpen(false); }}
                     style={{
                       display:'flex',alignItems:'center',gap:10,padding:'9px 14px',
                       borderBottom:'1px solid '+L.ruleSoft,cursor:'pointer',
                       background: (selectedDocId||doc.id) === d.id ? L.accentSoft : 'transparent',
                     }}
                     onMouseEnter={e => e.currentTarget.style.background = L.accentSoft}
                     onMouseLeave={e => e.currentTarget.style.background = (selectedDocId||doc.id) === d.id ? L.accentSoft : 'transparent'}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:500,fontSize:12.5,color:L.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.title}</div>
                    <div style={{fontSize:10.5,color:L.ink3,fontFamily:L.mono,marginTop:1}}>{d.id} · {(d.pages||0).toLocaleString()}pp</div>
                    {(d.ingested || d.upload_ts) && (
                      <div style={{fontSize:10,color:L.ink3,fontFamily:L.mono,marginTop:1}}>Ingested {lFormatIngestDateTime(d.ingested || d.upload_ts)}</div>
                    )}
                  </div>
                  {d.status === 'running' && d.pct < 100
                    ? <div style={{fontFamily:L.mono,fontSize:9,color:L.warn,flexShrink:0}}>(in progress)</div>
                    : <div style={{fontFamily:L.mono,fontSize:10,color:d.pct>=100?L.good:L.warn,flexShrink:0}}>{d.pct}%</div>}
                </div>
              ))}
              <div style={{borderTop:'1px solid '+L.rule}}>
                <div onClick={() => { pickDoc(null); setDocPickerOpen(false); }}
                     style={{padding:'9px 14px',fontSize:12,color:L.accent,cursor:'pointer',fontWeight:500}}>
                  View all documents →
                </div>
                {selectedDocId && (
                  <div onClick={() => { pickDoc(null); setDocPickerOpen(false); }}
                       style={{padding:'6px 14px 9px',fontSize:11.5,color:L.ink3,cursor:'pointer'}}>
                    ← Back to latest
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button className="l-graph-entry" onClick={() => onView && onView({ view: 'evidence', docId: activeDocId })}>
          <div className="e">GraphRAG</div>
          <div className="v">Matter graph</div>
          <div className="d">{graphNamespace ? 'real graph namespace' : 'graph unavailable'}</div>
        </button>
        <LKpi label="Claims" value={totalClaims.toLocaleString()} delta={`${claimsData.chronology||0} chrono · ${claimsData.people||0} people`} />
        <LKpi label="Parse/OCR" value={parseKpi.value} tone={parseKpi.tone} delta={parseKpi.delta} />
        <LKpi label="Chunk/Index" value={indexKpi.value} tone={indexKpi.tone} delta={indexKpi.delta} />
        <LKpi label="Entities" value={(claimsData.entities||0).toString()} delta="canonical registry v2" />
        <LKpi label="References" value={((claimsData.internal_refs||0)+(claimsData.external_refs||0)).toString()} delta={`${claimsData.internal_refs||0} int · ${claimsData.external_refs||0} ext`} />
        <LKpi label="Fleet KV" value={fleetKvKnown ? fleetKv.toFixed(1)+'%' : '—'} tone={fleetKvKnown && fleetKv > 50 ? 'warn' : (fleetKvKnown ? 'ok' : '')} delta={fleetRunningKnown || fleetWaitingKnown ? `${fleetRunningKnown ? fleetRunning : '—'} running · ${fleetWaitingKnown ? fleetWaiting : '—'} waiting` : 'telemetry unavailable'} />
        <LKpi label="Gen Tokens" value={fleetGenKnown ? fmtTokens(fleetGenTotal) : '—'} delta={fleetGenKnown ? fleetGenHosts : 'token telemetry unavailable'} />
        <LKpi label="Pipeline" value={`${doneStages}/${pipeline.length}`} tone={doneStages === pipeline.length && pipeline.length > 0 ? 'ok' : ''} delta={doc.status || 'unknown'} />
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Row 1 — Pipelines | Agreement + Hardware */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
          <div
            className="l-card"
            data-pane-id={activeDocId ? `panel:operator-pipeline:${activeDocId}` : 'panel:operator-pipeline'}
            data-doc-id={activeDocId || ''}
          >
            <div className="l-card-h">
              <h3>Pipeline stages · {doneStages} of {pipeline.length} done</h3>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {runStatus && (
                  <div className="meta" style={{color:runStatus.state === 'error' ? L.bad : L.ink3}}>
                    {runStatus.message}
                  </div>
                )}
                <button className="l-btn primary" disabled={!activeDocId || chronologyRunning}
                        onClick={(e) => { e.stopPropagation(); triggerDocRun('chronology'); }}>
                  {chronologyRunning ? 'Chronology running…' : 'Run Chronology'}
                </button>
                <button className="l-btn" disabled={!activeDocId || peopleRunning}
                        onClick={(e) => { e.stopPropagation(); triggerDocRun('people'); }}>
                  {peopleRunning ? 'People running…' : 'Run People'}
                </button>
                <div className="meta">MAF @workflow · last poll {tsStr}</div>
              </div>
            </div>
            <table className="l-pipe">
              <thead><tr><th>id</th><th>name</th><th>state</th><th>progress</th><th></th><th>detail</th></tr></thead>
              <tbody>
                {pipeline.length === 0
                  ? <tr><td colSpan={6} style={{padding:'12px',color:L.ink3,fontFamily:L.mono,fontSize:11}}>No pipeline data — run a document first</td></tr>
                  : pipeline.map((p, i) => <LPipeRow key={p.id || i} p={p} idx={i} onView={onView} docId={activeDocId} />)}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="l-card">
              <div className="l-card-h">
                <h3>Claim acceptance</h3>
                <div className="meta">accepted / total · gate 85%</div>
              </div>
              <div className="l-agree-strip">
                <LAgreeCol name="Chronology" data={makeAgree('chronology')} />
                <LAgreeCol name="People" data={makeAgree('people')} />
                <LAgreeCol name="Overall" data={{ accepted: totalClaims, disputed: 0, total: totalClaims }} />
              </div>
            </div>
            <div className="l-card">
              <div className="l-card-h">
                <h3>Inference hardware</h3>
                <div className="meta">fleet telemetry · source-owned</div>
              </div>
              <div className="l-hw-grid">
                {hardwareEntries.length === 0 && (
                  <div className="l-hw-cell">
                    <div className="nm">No hardware metrics</div>
                    <div className="val"><b>—</b><span>telemetry unavailable</span></div>
                  </div>
                )}
                {hardwareEntries.map(([key, host]) => {
                  const online = lHostOnline(host);
                  const statusText = online === true ? 'online' : (online === false ? 'unreachable' : 'status unavailable');
                  const genKnown = online === true && lHasNumber(host.generation_tokens_total);
                  const genTotal = genKnown ? Number(host.generation_tokens_total) : null;
                  const tokenRate = tokenRates[key];
                  const hasRate = genKnown && tokenRate != null;
                  const runningKnown = lHasNumber(host.running);
                  const waitingKnown = lHasNumber(host.waiting);
                  return (
                    <div key={key} className="l-hw-cell">
                      <div className="nm" style={{display:'flex',alignItems:'center',gap:6}}>
                        <span style={{
                          width:7,height:7,borderRadius:'50%',
                          background:online === true ? L.goodMid : (online === false ? L.badMid : L.ink4),display:'inline-block',flexShrink:0
                        }} />
                        <span>{host.label || key} · {statusText}</span>
                      </div>
                      <div style={{fontSize:10.5,color:L.ink2,marginTop:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {host.model || 'model unavailable'}
                      </div>
                      <div style={{fontSize:10,color:L.ink3,fontFamily:L.mono,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {host.role || 'inference'}
                      </div>
                      <div className="val">
                        <b>{hasRate ? tokenRate.toFixed(1) : (genKnown ? fmtTokens(genTotal) : '—')}</b>
                        <span>{hasRate ? 'tokens/s' : (genKnown ? 'tokens total' : 'tokens unavailable')}</span>
                      </div>
                      <div style={{display:'flex',gap:12,marginTop:5,fontFamily:L.mono,fontSize:10.5,color:L.ink3}}>
                        <span><b style={{color:L.ink}}>{runningKnown ? host.running : '—'}</b> running</span>
                        <span><b style={{color:waitingKnown && Number(host.waiting) > 0 ? L.warn : L.ink}}>{waitingKnown ? host.waiting : '—'}</b> waiting</span>
                      </div>
                      {host.prefix_cache_hit_rate != null && (
                        <div style={{fontFamily:L.mono,fontSize:10,color:L.ink4,marginTop:3}}>
                          prefix hit {((host.prefix_cache_hit_rate || 0) * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 — ACTIVITY LOG (centerpiece) */}
        <ActivityLog onView={onView} activity={activity} docId={doc.id} debugIds={debugIds} />

        {/* Row 3 — 5 artifact summary cards */}
        <div className="l-art-grid">
          <ArtChronoCard a={artChrono} onView={onView} docId={activeDocId} debugIds={debugIds} artifactRef={rawStatus?.chronology_artifact_ref || rawStatus?.chronology_proof_artifact_ref} runId={rawStatus?.chronology_agent_run_id || rawStatus?.chronology_backend_id} />
          <ArtEntityCard a={artEntity} onView={onView} docId={activeDocId} debugIds={debugIds} artifactRef={rawStatus?.mentioned_entities_artifact_ref || rawStatus?.people_artifact_ref} runId={rawStatus?.mentioned_entities_curation_backend_id || rawStatus?.people_curation_backend_id || rawStatus?.people_backend_id} />
          <ArtPeopleCard a={artPeople} onView={onView} docId={activeDocId} debugIds={debugIds} artifactRef={rawStatus?.people_mentioned_artifact_ref || rawStatus?.people_artifact_ref} runId={rawStatus?.people_mentioned_curation_backend_id || rawStatus?.people_curation_backend_id || rawStatus?.people_backend_id} />
          <ArtReportCard a={artMemo} onView={onView} docId={activeDocId} debugIds={debugIds} artifactRef={rawStatus?.synthesis_artifact_ref || rawStatus?.synthesis_v1_artifact_ref} runId={rawStatus?.synthesis_agent_run_id || rawStatus?.synthesis_run_id} />
          <ArtReportCard a={artDetailed} onView={onView} docId={activeDocId} debugIds={debugIds} artifactRef={rawStatus?.synthesis_artifact_ref || rawStatus?.synthesis_v1_artifact_ref} runId={rawStatus?.synthesis_agent_run_id || rawStatus?.synthesis_run_id} />
        </div>

        {/* Row 3.5 — People run history */}
        <PeopleRunHistoryCard runs={pmRuns} selectedIdx={selectedPmRunIdx} onSelect={setSelectedPmRunIdx} />

        {/* Row 4 — External augmentation | Document strip | All docs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 14 }}>
          <div className="l-card" id="panel-doc-list" data-pane-id="panel:operator-doc-list">
            <div className="l-card-h">
              <h3>External augmentation</h3>
              <div className="meta">read-only · air-gapped source docs</div>
            </div>
            <div className="l-ext">
              <div className="l-ext-row"><div className="nm"><span className="badge">AustLII</span> statutes indexed</div><div className="v">{claimsData.external_refs||0}</div></div>
              <div className="l-ext-row"><div className="nm"><span className="badge">Internal</span> doc refs</div><div className="v">{claimsData.internal_refs||0}</div></div>
              <div className="l-ext-row"><div className="nm"><span className="badge">Entities</span> canonical names</div><div className="v">{claimsData.entities||0}</div></div>
              <div className="l-ext-row"><div className="nm"><span className="badge">ASIC</span> entities confirmed</div><div className="v">—</div></div>
              <div className="l-ext-row"><div className="nm"><span className="badge">CourtListener</span> case law</div><div className="v">—</div></div>
            </div>
          </div>

          <div className="l-card">
            <div className="l-card-h">
              <h3>Document subject</h3>
              <div className="meta">{doc.id || '—'}</div>
            </div>
            <div style={{padding:'10px 14px'}}>
              <div style={{fontSize:12,color:L.ink,fontWeight:600,marginBottom:6}}>{doc.title || '—'}</div>
              <div style={{fontSize:11,color:L.ink3,fontFamily:L.mono,lineHeight:1.6}}>
                {doc.subject || '—'}
              </div>
              <div style={{marginTop:8,display:'flex',gap:8,flexWrap:'wrap'}}>
                <span style={{fontFamily:L.mono,fontSize:10,background:L.accentSoft,color:L.accent,padding:'2px 6px',borderRadius:3}}>{(doc.docType||'').replace(/_/g,' ')}</span>
                <span style={{fontFamily:L.mono,fontSize:10,background:L.ruleSoft,color:L.ink3,padding:'2px 6px',borderRadius:3}}>{(doc.pages||0).toLocaleString()} pages</span>
                <span style={{fontFamily:L.mono,fontSize:10,background:doc.status==='complete'?L.goodSoft:L.warnSoft,color:doc.status==='complete'?L.good:L.warn,padding:'2px 6px',borderRadius:3}}>{doc.status||'unknown'}</span>
              </div>
            </div>
          </div>

          <div className="l-card">
            <div className="l-card-h">
              <h3>All documents</h3>
              <div className="meta">{allDocs.length} processed · use picker to switch</div>
            </div>
            <div style={{maxHeight:200,overflowY:'auto'}}>
              {allDocs.map((d, i) => (
                <div key={i} onClick={() => pickDoc(d.id)}
                     style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 14px',
                       borderBottom:'1px solid '+L.ruleSoft,fontSize:11.5,cursor:'pointer',
                       background:(selectedDocId||doc.id)===d.id?L.accentSoft:'transparent'}}
                     onMouseEnter={e => e.currentTarget.style.background = L.accentSoft}
                     onMouseLeave={e => e.currentTarget.style.background = (selectedDocId||doc.id)===d.id?L.accentSoft:'transparent'}>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontWeight:500,color:L.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.title}</div>
                    <div style={{fontSize:10,color:L.ink3,fontFamily:L.mono,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.id}</div>
                    {(d.ingested || d.upload_ts) && (
                      <div style={{fontSize:10,color:L.ink3,fontFamily:L.mono,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Ingested {lFormatIngestDateTime(d.ingested || d.upload_ts)}</div>
                    )}
                  </div>
                  {d.status === 'running' && d.pct < 100
                    ? <div style={{fontFamily:L.mono,fontSize:9,color:L.warn,marginLeft:8,flexShrink:0}}>(in progress)</div>
                    : <div style={{fontFamily:L.mono,fontSize:10,color:d.pct>=100?L.good:L.warn,marginLeft:8,flexShrink:0}}>{d.pct}%</div>}
                </div>
              ))}
              {allDocs.length === 0 && <div style={{padding:'12px 14px',color:L.ink3,fontFamily:L.mono,fontSize:11}}>No documents loaded</div>}
              <div onClick={() => { pickDoc(null); }}
                   style={{padding:'9px 14px',fontSize:12,color:L.accent,cursor:'pointer',fontWeight:500,borderTop:'1px solid '+L.rule}}>
                View all documents →
              </div>
            </div>
          </div>
        </div>

        {/* Row 5 — LLM request telemetry */}
        <LlmTelemetryPanel metrics={llmMetrics} telemetry={llmTelemetry} />
      </div>
    </div>
  );
}

window.LatticeDashboard = LatticeDashboard;
