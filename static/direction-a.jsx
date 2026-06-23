// Direction A — "Atrium" (v2)
// OPERATOR OUTPUT REVIEW. Calm, editorial. Same data, but the center panel
// is the artifact-under-review (switch among the 5: chronology, entities,
// people, exec memo, detailed analysis). Right rail = conflicts on this
// artifact + cross-artifact signals + external augmentation.

const D = null;

const Atrium = {
  bg: '#F7F6F2',
  panel: '#FFFFFF',
  ink: '#1B1B19',
  ink2: '#4A4A45',
  ink3: '#8A8A82',
  rule: '#E8E6DF',
  ruleSoft: '#F0EEE7',
  accent: '#3F5E5A',
  accentSoft: '#E6EEEC',
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
const A = Atrium;

// Shared nav context — created lazily so both direction files reference
// the same object regardless of load order.
window.NavContext = window.NavContext || React.createContext({ go: null, view: 'monitor', highlight: null });
const NavContext = window.NavContext;

const aStyle = `
  .a-root{font-family:${A.sans};color:${A.ink};background:${A.bg};width:100%;min-height:100%;
    -webkit-font-smoothing:antialiased;letter-spacing:-0.005em}
  .a-root *{box-sizing:border-box}
  .a-mono{font-family:${A.mono};font-variant-numeric:tabular-nums}
  .a-serif{font-family:${A.serif};letter-spacing:-0.012em}

  .a-top{display:flex;align-items:center;justify-content:space-between;
    padding:18px 32px;border-bottom:1px solid ${A.rule};background:${A.bg}}
  .a-brand{display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px}
  .a-brand-dot{width:9px;height:9px;border-radius:50%;background:${A.accent};
    box-shadow:0 0 0 4px ${A.accentSoft}}
  .a-crumb{color:${A.ink3};font-size:13px}
  .a-crumb b{color:${A.ink};font-weight:500}
  .a-top-meta{display:flex;align-items:center;gap:18px;font-size:12.5px;color:${A.ink2}}
  .a-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;
    background:${A.panel};border:1px solid ${A.rule};font-size:12px;color:${A.ink2}}
  .a-pill .a-dot{width:6px;height:6px;border-radius:50%;background:${A.good}}
  .a-pill.warn .a-dot{background:${A.warn}}

  .a-grid{display:grid;grid-template-columns:300px 1fr 320px;gap:24px;padding:24px 32px 40px}
  .a-col{display:flex;flex-direction:column;gap:18px;min-width:0}
  .a-card{background:${A.panel};border:1px solid ${A.rule};border-radius:14px;
    box-shadow:0 1px 0 ${A.ruleSoft};overflow:visible}
  .a-card-h{padding:16px 18px 10px;display:flex;align-items:baseline;justify-content:space-between;gap:12px}
  .a-card-h h3{margin:0;font-size:13.5px;font-weight:600;letter-spacing:-0.005em}
  .a-card-h .a-h-meta{font-size:11.5px;color:${A.ink3};letter-spacing:.02em;text-transform:uppercase}

  /* sidebar */
  .a-doc{padding:20px 18px}
  .a-doc-eyebrow{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${A.ink3};
    margin-bottom:8px;font-weight:600}
  .a-doc-title{font-family:${A.serif};font-size:22px;line-height:1.18;font-weight:500;
    letter-spacing:-0.018em;color:${A.ink};margin-bottom:10px}
  .a-doc-meta{display:grid;grid-template-columns:max-content 1fr;column-gap:14px;row-gap:6px;
    font-size:12px;color:${A.ink2};margin-top:10px;padding-top:14px;border-top:1px solid ${A.ruleSoft}}
  .a-doc-meta dt{color:${A.ink3};letter-spacing:.02em}
  .a-doc-meta dd{margin:0;color:${A.ink};font-variant-numeric:tabular-nums}

  .a-pipe-mini{padding:6px 16px 14px}
  .a-pipe-mini .row{display:flex;flex-direction:column;gap:5px;padding:10px 0;border-bottom:1px solid ${A.ruleSoft}}
  .a-pipe-mini .row:last-child{border-bottom:0}
  .a-pipe-mini .head{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .a-pipe-mini .name{font-size:12px;color:${A.ink};font-weight:500}
  .a-pipe-mini .num{font-family:${A.mono};font-size:10.5px;color:${A.ink3}}
  .a-pipe-mini .pct{font-family:${A.mono};font-size:11px;color:${A.ink2}}
  .a-pipe-mini .bar{height:3px;border-radius:99px;background:${A.ruleSoft};overflow:hidden}
  .a-pipe-mini .bar i{display:block;height:100%}

  .a-budget{padding:8px 18px 18px}
  .a-budget-row{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}
  .a-budget-row b{font-family:${A.mono};font-size:18px;font-weight:600;letter-spacing:-0.01em}
  .a-budget-row .a-budget-of{color:${A.ink3};font-size:12px}
  .a-budget-bar{height:6px;border-radius:99px;background:${A.ruleSoft};overflow:hidden;display:flex}
  .a-budget-bar i{display:block;height:100%}

  /* artifact switcher (top of center column) */
  .a-tabs{display:flex;gap:4px;padding:14px 18px 0;border-bottom:1px solid ${A.rule}}
  .a-tab{font:inherit;font-size:12.5px;font-weight:500;padding:9px 14px;background:transparent;
    border:0;border-bottom:2px solid transparent;color:${A.ink2};cursor:pointer;
    display:flex;align-items:center;gap:8px;margin-bottom:-1px}
  .a-tab:hover{color:${A.ink}}
  .a-tab.active{color:${A.ink};border-bottom-color:${A.accent};font-weight:600}
  .a-tab .a-tab-count{font-family:${A.mono};font-size:10.5px;color:${A.ink3};font-weight:400;
    padding:1.5px 6px;border-radius:99px;background:${A.ruleSoft}}
  .a-tab.active .a-tab-count{background:${A.accentSoft};color:${A.accent}}

  .a-art-h{padding:20px 24px 16px;border-bottom:1px solid ${A.ruleSoft}}
  .a-art-h .eye{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:${A.ink3};font-weight:600;margin-bottom:6px}
  .a-art-h .ttl{font-family:${A.serif};font-size:24px;font-weight:500;letter-spacing:-0.018em;margin:0 0 6px}
  .a-art-h .sub{font-size:12.5px;color:${A.ink2}}
  .a-art-h .meter{display:flex;gap:18px;margin-top:14px;align-items:center}
  .a-art-h .meter .item{display:flex;flex-direction:column;gap:2px;font-size:11.5px;color:${A.ink3}}
  .a-art-h .meter .item b{font-family:${A.mono};font-size:18px;font-weight:600;color:${A.ink};letter-spacing:-0.01em}
  .a-art-h .meter .item.warn b{color:${A.warn}}
  .a-art-h .meter .seg{flex:1;height:5px;border-radius:99px;background:${A.ruleSoft};overflow:hidden;display:flex}
  .a-art-h .meter .seg i{display:block;height:100%}

  /* timeline (carry over, tightened) */
  .a-tl{padding:14px 22px 20px;position:relative}
  .a-tl-spine{position:absolute;left:108px;top:18px;bottom:18px;width:1px;background:${A.rule}}
  .a-tl-item{position:relative;display:grid;grid-template-columns:80px 1fr;gap:24px;
    padding:12px 0;border-bottom:1px solid ${A.ruleSoft}}
  .a-tl-item:last-child{border-bottom:0}
  .a-tl-date{font-family:${A.mono};font-size:11.5px;color:${A.ink2};padding-top:2px}
  .a-tl-page{font-family:${A.mono};font-size:10.5px;color:${A.ink3};margin-top:2px}
  .a-tl-dot{position:absolute;left:104px;top:18px;width:9px;height:9px;border-radius:50%;
    background:${A.panel};border:2px solid ${A.accent};z-index:1}
  .a-tl-item.disputed .a-tl-dot{border-color:${A.warn}}
  .a-tl-item.review .a-tl-dot{border-color:${A.bad};background:${A.bad}}
  .a-tl-item.superseded .a-tl-dot{border-color:${A.ink3};background:${A.bg}}
  .a-tl-body{padding-left:20px;min-width:0}
  .a-tl-title{font-size:13.5px;color:${A.ink};margin-bottom:4px;line-height:1.45;font-weight:500}
  .a-tl-item.superseded .a-tl-title{color:${A.ink3};text-decoration:line-through;text-decoration-color:${A.ink3}}
  .a-tl-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:11.5px;color:${A.ink2}}
  .a-tag{display:inline-flex;align-items:center;gap:4px;padding:1.5px 7px;border-radius:99px;
    font-size:10.5px;letter-spacing:.02em;font-weight:500}
  .a-tag.lane{background:${A.ruleSoft};color:${A.ink2};font-family:${A.mono}}
  .a-tag.who{background:${A.panel};border:1px solid ${A.rule};color:${A.ink2}}
  .a-tag.conf{font-family:${A.mono};background:${A.goodSoft};color:${A.good}}
  .a-tag.conf.warn{background:${A.warnSoft};color:${A.warn}}
  .a-tag.conf.bad{background:${A.badSoft};color:${A.bad}}
  .a-supersede{margin-top:8px;display:flex;align-items:flex-start;gap:8px;padding:9px 11px;
    background:${A.ruleSoft};border-radius:8px;font-size:11.5px;color:${A.ink2};line-height:1.45}
  .a-dispute-note{margin-top:8px;display:flex;align-items:flex-start;gap:8px;padding:9px 11px;
    background:${A.warnSoft};border-radius:8px;font-size:11.5px;color:${A.warn};line-height:1.45;font-family:${A.mono}}

  /* list view (entities / people) */
  .a-list{padding:6px 0}
  .a-list-row{display:grid;grid-template-columns:1fr 90px 110px 70px;gap:14px;
    padding:14px 24px;border-bottom:1px solid ${A.ruleSoft};align-items:start}
  .a-list-row:last-child{border-bottom:0}
  .a-list-row:hover{background:${A.bg}}
  .a-list-row .pri{font-size:14px;color:${A.ink};font-weight:500;line-height:1.35}
  .a-list-row .pri.dim{color:${A.ink3}}
  .a-list-row .sec{font-size:11.5px;color:${A.ink2};margin-top:3px;display:flex;gap:8px;align-items:center}
  .a-list-row .sec .a-mono{color:${A.ink3}}
  .a-list-row .col{font-family:${A.mono};font-size:11.5px;color:${A.ink2};padding-top:3px}
  .a-list-row .col.right{text-align:right}
  .a-list-row .col.muted{color:${A.ink3}}
  .a-list-row .conf-bar{display:flex;align-items:center;gap:6px}
  .a-list-row .conf-bar .b{flex:1;height:4px;border-radius:99px;background:${A.ruleSoft};overflow:hidden}
  .a-list-row .conf-bar .b i{display:block;height:100%;background:${A.good}}
  .a-list-row .conf-bar.warn .b i{background:${A.warn}}
  .a-list-row .conf-bar.bad .b i{background:${A.bad}}
  .a-list-row .conf-bar .v{font-family:${A.mono};font-size:11px;color:${A.ink2};width:30px;text-align:right}

  /* report draft view */
  .a-rep{padding:22px 32px 28px;font-family:${A.serif};font-size:15px;line-height:1.65;color:${A.ink};max-width:680px}
  .a-rep h4{font-family:${A.sans};font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
    color:${A.ink3};margin:24px 0 8px;display:flex;align-items:center;gap:10px}
  .a-rep h4 .stat{font-family:${A.mono};font-size:9.5px;font-weight:600;letter-spacing:.04em;
    padding:1.5px 6px;border-radius:3px;background:${A.goodSoft};color:${A.good};text-transform:uppercase}
  .a-rep h4 .stat.drafting{background:${A.warnSoft};color:${A.warn}}
  .a-rep h4 .stat.queued{background:${A.ruleSoft};color:${A.ink3}}
  .a-rep h2{font-family:${A.serif};font-size:22px;letter-spacing:-0.018em;font-weight:500;margin:0 0 6px}
  .a-rep p{margin:0 0 14px}
  .a-rep .placeholder{font-family:${A.sans};color:${A.ink3};font-style:italic;background:${A.bg};
    padding:14px 16px;border-radius:8px;font-size:13px;line-height:1.55;border:1px dashed ${A.rule}}
  .a-cite{display:inline-flex;align-items:baseline;gap:3px;padding:0 5px 1px;margin:0 2px;
    background:${A.accentSoft};color:${A.accent};border-radius:4px;font-family:${A.mono};font-size:11px;
    cursor:pointer;line-height:1.35;font-weight:500;vertical-align:baseline;transition:background .12s}
  .a-cite:hover, .a-cite.pinned{background:#D7E5E2}
  .a-cite-wrap{position:relative;display:inline}

  /* outline view (detailed) */
  .a-out{padding:8px 0}
  .a-out-row{display:grid;grid-template-columns:32px 1fr 120px;gap:14px;padding:14px 24px;
    border-bottom:1px solid ${A.ruleSoft};align-items:center}
  .a-out-row:last-child{border-bottom:0}
  .a-out-row .num{font-family:${A.mono};color:${A.ink3};font-size:13px}
  .a-out-row .pri{font-size:14px;color:${A.ink};font-weight:500}
  .a-out-row.gated .pri{color:${A.ink3}}
  .a-out-row .stat{font-family:${A.mono};font-size:10.5px;font-weight:600;letter-spacing:.04em;
    padding:2px 7px;border-radius:99px;justify-self:end;text-transform:uppercase}
  .a-out-row .stat.drafted{background:${A.goodSoft};color:${A.good}}
  .a-out-row .stat.drafting{background:${A.warnSoft};color:${A.warn}}
  .a-out-row .stat.queued, .a-out-row .stat.gated{background:${A.ruleSoft};color:${A.ink3}}

  /* right rail conflict (carry over from v1) */
  .a-cf{padding:14px 16px;border-bottom:1px solid ${A.ruleSoft}}
  .a-cf:last-child{border-bottom:0}
  .a-cf-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px}
  .a-cf-subj{font-size:12.5px;font-weight:600;color:${A.ink};line-height:1.35}
  .a-cf-jaccard{font-family:${A.mono};font-size:10.5px;color:${A.warn};
    background:${A.warnSoft};padding:1.5px 6px;border-radius:99px}
  .a-cf-lane{display:grid;grid-template-columns:48px 1fr;gap:10px;padding:8px 0;
    border-top:1px dashed ${A.ruleSoft};align-items:start}
  .a-cf-lane:first-of-type{border-top:0;padding-top:4px}
  .a-cf-lane-tag{font-family:${A.mono};font-size:10px;letter-spacing:.06em;text-transform:uppercase;
    color:${A.ink3};padding-top:2px;font-weight:600;line-height:1.2}
  .a-cf-val{font-size:12.5px;color:${A.ink};font-weight:500;margin-bottom:3px;font-family:${A.mono}}
  .a-cf-src{font-size:10.5px;color:${A.ink3};font-family:${A.mono}}
  .a-cf-foot{margin-top:8px;padding:9px 11px;background:${A.accentSoft};border-radius:8px;
    font-size:11px;color:${A.accent};line-height:1.45}
  .a-cf-actions{display:flex;gap:6px;margin-top:8px}
  .a-btn{font:inherit;font-size:11.5px;font-weight:500;padding:5px 11px;border-radius:7px;cursor:pointer;
    border:1px solid ${A.rule};background:${A.panel};color:${A.ink};transition:all .12s}
  .a-btn:hover{background:${A.bg}}
  .a-btn.primary{background:${A.accent};color:#fff;border-color:${A.accent}}
  .a-btn.primary:hover{background:#34504C}

  .a-sig-row{display:grid;grid-template-columns:48px 1fr;gap:10px;padding:10px 16px;
    border-bottom:1px solid ${A.ruleSoft};font-size:11.5px;line-height:1.45}
  .a-sig-row:last-child{border-bottom:0}
  .a-sig-row .t{font-family:${A.mono};color:${A.ink3};font-size:10.5px}
  .a-sig-row .body b{font-family:${A.mono};font-size:10px;font-weight:600;letter-spacing:.06em;
    padding:1.5px 5px;border-radius:3px;background:${A.accentSoft};color:${A.accent};margin-right:6px}
  .a-sig-row .body{color:${A.ink2}}
  .a-sig-row .body .impact{display:block;color:${A.ink3};font-size:10.5px;margin-top:2px;font-family:${A.mono}}

  .a-ext-row{display:flex;justify-content:space-between;align-items:center;padding:9px 16px;
    border-bottom:1px solid ${A.ruleSoft};font-size:12px;color:${A.ink2}}
  .a-ext-row:last-child{border-bottom:0}
  .a-ext-row .v{font-family:${A.mono};color:${A.ink};font-weight:600}
  .a-ext-row .v small{color:${A.ink3};font-weight:400;margin-left:3px}

  /* Monitor pill in the tab strip */
  .a-tab.monitor{margin-right:8px;padding-right:14px;border-right:1px solid ${A.rule};color:${A.ink2};
    font-weight:500;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent}
  .a-tab.monitor:hover{color:${A.accent}}
  .a-tab.monitor svg{display:inline-block}

  /* Clickable affordances */
  .a-brand.clickable{cursor:pointer;border-radius:6px;padding:2px 4px;margin:-2px -4px;transition:background .12s}
  .a-brand.clickable:hover{background:${A.ruleSoft}}
  .a-sig-row.clickable{cursor:pointer;transition:background .12s}
  .a-sig-row.clickable:hover{background:${A.bg}}
  .a-list-row.clickable{cursor:pointer}
  .a-list-row.clickable:hover{background:${A.bg}}

  /* Highlight flash for navigated-to row */
  @keyframes a-flash{0%{background:${A.accentSoft};box-shadow:inset 3px 0 0 ${A.accent}}
    100%{background:transparent;box-shadow:inset 3px 0 0 transparent}}
  .a-flash{animation:a-flash 2.4s ease-out}

  .a-reason{position:relative;display:inline-flex;align-items:center;vertical-align:middle}
  .a-reason-btn{background:transparent;border:0;padding:2px;cursor:help;color:${A.ink3};
    display:inline-flex;align-items:center;justify-content:center;border-radius:3px;
    transition:color .12s,background .12s;line-height:0;font:inherit}
  .a-reason-btn:hover{color:${A.accent};background:${A.accentSoft}}
  .a-reason-btn.pinned{color:${A.accent};background:${A.accentSoft}}
  .a-reason-pop{position:absolute;bottom:calc(100% + 6px);width:300px;
    background:${A.panel};border:1px solid ${A.rule};border-radius:8px;padding:11px 13px;
    box-shadow:0 14px 36px rgba(0,0,0,.16),0 2px 6px rgba(0,0,0,.06);z-index:200;font-size:11.5px;
    line-height:1.5;color:${A.ink2};text-align:left;font-family:${A.sans};font-weight:400;
    white-space:normal}
  .a-reason-pop.right{right:-6px}
  .a-reason-pop.left{left:-6px}
  .a-reason-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
    margin-bottom:7px;font-family:${A.mono};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase}
  .a-reason-method{font-weight:700;color:${A.accent}}
  .a-reason-lanes{color:${A.ink3}}
  .a-reason-text{color:${A.ink};font-size:12px;line-height:1.55;margin-bottom:8px;font-weight:400}
  .a-reason-dissent{font-size:11px;color:${A.warn};padding:8px 0 0;
    border-top:1px solid ${A.ruleSoft};margin-bottom:8px;line-height:1.5}
  .a-reason-dissent b{font-family:${A.mono};font-weight:600;font-size:9.5px;letter-spacing:.06em;
    text-transform:uppercase;margin-right:4px;color:${A.warn}}
  .a-reason-link{font-family:${A.mono};font-size:10px;color:${A.accent};text-decoration:none;
    cursor:pointer;font-weight:600;letter-spacing:.04em;text-transform:uppercase;display:inline-block;
    padding-top:4px;border-top:1px solid ${A.ruleSoft};width:100%}
  .a-reason-link:hover{color:#2D4844}
`;

function injectAStyle() {
  if (!document.getElementById('atrium-style')) {
    const s = document.createElement('style');
    s.id = 'atrium-style';
    s.textContent = aStyle;
    document.head.appendChild(s);
  }
}

// ─── artifact tab list ──────────────────────────────────────────────────

const TABS = [
  { id: 'chronology', label: 'Chronology',     countKey: 'count' },
  { id: 'entities',   label: 'Entity register', countKey: 'count' },
  { id: 'people',     label: 'People register', countKey: 'count' },
  { id: 'exec',       label: 'Executive memo', countKey: 'sections' },
  { id: 'detailed',   label: 'Detailed analysis', countKey: 'sections' },
];

// ─── views ──────────────────────────────────────────────────────────────

function ArtHeader({ artifact }) {
  const isList = artifact.kind === 'list';
  const total = isList ? artifact.count : artifact.sections;
  const denom = total > 0 ? total : 1;
  return (
    <div className="a-art-h">
      <div className="eye">{artifact.kind === 'list' ? 'List artifact' : 'Report artifact'} · {artifact.lastUpdate === '—' ? 'not yet started' : 'updated ' + artifact.lastUpdate}</div>
      <h2 className="ttl">{artifact.name}</h2>
      <div className="sub">
        {isList
          ? <>Reviewing {total.toLocaleString()} adjudicated claims · agreement {artifact.agreement.toFixed(2)} · gate 0.85</>
          : <>Reviewing {artifact.sections} sections · {artifact.drafted} drafted · {artifact.critiqued} in critic loop · {artifact.sections - artifact.drafted - artifact.critiqued} queued</>}
      </div>
      <div className="meter">
        {isList ? (
          <>
            <div className="item"><b>{artifact.accepted}</b><span>accepted</span></div>
            <div className={"item " + (artifact.disputed > 0 ? 'warn' : '')}><b>{artifact.disputed}</b><span>disputed</span></div>
            <div className="item"><b>{artifact.superseded}</b><span>superseded</span></div>
            <div className="seg" style={{ marginLeft: 8 }}>
              <i style={{ width: (artifact.accepted/denom*100)+'%',  background: A.good }} />
              <i style={{ width: (artifact.disputed/denom*100)+'%', background: A.warn }} />
              <i style={{ width: (artifact.superseded/denom*100)+'%', background: A.ink3 }} />
            </div>
          </>
        ) : (
          <>
            <div className="item"><b>{artifact.drafted}/{artifact.sections}</b><span>drafted</span></div>
            <div className={"item " + (artifact.critiqued > 0 ? 'warn' : '')}><b>{artifact.critiqued}</b><span>critic revisions</span></div>
            <div className="seg" style={{ marginLeft: 8 }}>
              <i style={{ width: (artifact.drafted/artifact.sections*100)+'%',  background: A.good }} />
              <i style={{ width: (artifact.critiqued/artifact.sections*100)+'%', background: A.warn }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function aArray(value) {
  return Array.isArray(value) ? value : [];
}

function aNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function aPct(n, total) {
  const denom = total > 0 ? total : 1;
  return Math.max(0, Math.min(100, (n / denom) * 100));
}

function aFormatTs(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString('en-AU', {timeZone: 'Australia/Melbourne'}); }
  catch (e) { return String(ts); }
}

function aStatusClass(status) {
  if (status === 'failed') return 'human_review';
  if (status === 'running') return 'disputed';
  return status || '';
}

function EmptyArtifact({ label }) {
  return (
    <div style={{ padding: '18px 24px', color: A.ink3, fontFamily: A.mono, fontSize: 11.5 }}>
      No {label} data is available for this document.
    </div>
  );
}

function ChronologyView({ rows }) {
  if (!rows || rows.length === 0) return <EmptyArtifact label="chronology" />;
  return (
    <div className="a-tl">
      <div className="a-tl-spine" />
      {rows.map(e => (
        <div key={e.id} className={"a-tl-item " + (e.status === 'disputed' ? 'disputed' : e.status === 'human_review' ? 'review' : e.status === 'superseded' ? 'superseded' : '')}>
          <div className="a-tl-date">
            {e.date || '—'}
            <div className="a-tl-page">{e.page ? 'p. ' + e.page.toLocaleString() : 'page —'}</div>
          </div>
          <div className="a-tl-dot" />
          <div className="a-tl-body">
            <div className="a-tl-title">{e.title || 'Untitled chronology event'}</div>
            <div className="a-tl-meta">
              {aArray(e.who).map(w => <span key={w} className="a-tag who">{w}</span>)}
              <span className="a-tag lane">{e.lane || 'live'}</span>
              <span className={"a-tag conf " + (aNumber(e.conf) < 0.6 ? 'bad' : aNumber(e.conf) < 0.8 ? 'warn' : '')}>
                {aNumber(e.conf).toFixed(2)} conf
              </span>
              <ReasonChip reasoning={e.reasoning} anchor="left" />
            </div>
            {e.supersedeReason && (
              <div className="a-supersede">↳ Superseded by Addendum 3 — <i>{e.supersedeReason}</i></div>
            )}
            {e.disputeNote && <div className="a-dispute-note">⚠ {e.disputeNote}</div>}
            {e.reviewNote && <div className="a-dispute-note">↗ {e.reviewNote}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function EntityView({ rows }) {
  if (!rows || rows.length === 0) return <EmptyArtifact label="entity" />;
  return (
    <div className="a-list">
      {rows.map(e => {
        const conf = aNumber(e.conf);
        const confCls = conf < 0.6 ? 'bad' : conf < 0.8 ? 'warn' : '';
        return (
          <div key={e.id} className="a-list-row">
            <div>
              <div className={"pri " + (e.candidate ? 'dim' : '')}>{e.canonical || e.name || 'Unnamed entity'}</div>
              <div className="sec">
                <span className="a-mono">{String(e.type || 'entity').replace('_',' ').toLowerCase()}</span>
                <span>·</span>
                <span>{aNumber(e.aliases)} alias{aNumber(e.aliases)===1?'':'es'}</span>
                {e.candidate && <span className="a-tag conf warn">candidate</span>}
                {e.recent && <span className="a-tag conf">new</span>}
              </div>
            </div>
            <div className="col right">{aNumber(e.mentions).toLocaleString()}<div className="col muted" style={{ paddingTop:0, fontSize:10.5 }}>mentions</div></div>
            <div className="col muted">{e.asic || '—'}<div className="col" style={{ paddingTop:0, fontSize:10.5 }}>{e.lastSeen || '—'}</div></div>
            <div className={"conf-bar " + confCls}>
              <div className="b"><i style={{ width: (conf*100)+'%' }} /></div>
              <div className="v">{conf.toFixed(2)}</div>
              <ReasonChip reasoning={e.reasoning} anchor="right" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PeopleView({ rows }) {
  if (!rows || rows.length === 0) return <EmptyArtifact label="people" />;
  return (
    <div className="a-list">
      {rows.map(p => {
        const conf = aNumber(p.conf);
        const confCls = conf < 0.6 ? 'bad' : conf < 0.8 ? 'warn' : '';
        return (
          <div key={p.id} className="a-list-row">
            <div>
              <div className={"pri " + (p.disputed && conf < 0.6 ? 'dim' : '')}>{p.name || 'Unnamed person'}</div>
              <div className="sec">
                <span>{p.role || 'Role not recorded'}</span>
                {p.disputed && <span className="a-tag conf warn">disputed</span>}
                {p.review   && <span className="a-tag conf bad">human review</span>}
              </div>
            </div>
            <div className="col right">{aNumber(p.mentions)}<div className="col muted" style={{ paddingTop:0, fontSize:10.5 }}>mentions</div></div>
            <div className="col muted">{p.source || '—'}<div className="col" style={{ paddingTop:0, fontSize:10.5 }}>{p.lastSeen || '—'}</div></div>
            <div className={"conf-bar " + confCls}>
              <div className="b"><i style={{ width: (conf*100)+'%' }} /></div>
              <div className="v">{conf.toFixed(2)}</div>
              <ReasonChip reasoning={p.reasoning} anchor="right" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Cite({ children, conf=0.9, reasoning }) {
  const [hover, setHover] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  const show = (hover || pinned) && reasoning;
  return (
    <span className="a-cite-wrap"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}>
      <span className={"a-cite " + (pinned ? 'pinned' : '')}
            title={reasoning ? '' : `claim · conf ${conf.toFixed(2)}`}
            onClick={() => reasoning && setPinned(p => !p)}>
        {children}
      </span>
      {show && (
        <span className="a-reason-pop left" onClick={(e) => e.stopPropagation()}>
          <span className="a-reason-head">
            <span className="a-reason-method">↳ {reasoning.method.toLowerCase().replace(/_/g,' ')}</span>
            <span className="a-reason-lanes">{reasoning.lanes} · conf {conf.toFixed(2)}</span>
          </span>
          <span className="a-reason-text" style={{display:'block'}}>{reasoning.text}</span>
          {reasoning.dissent && reasoning.dissent !== '—' && (
            <span className="a-reason-dissent" style={{display:'block'}}><b>Dissent</b>{reasoning.dissent}</span>
          )}
          <span className="a-reason-link" style={{display:'block'}}>Open in evidence inspector →</span>
        </span>
      )}
    </span>
  );
}

function ReasonChip({ reasoning, anchor='right' }) {
  const [hover, setHover] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  if (!reasoning) return null;
  const show = hover || pinned;
  return (
    <span className="a-reason"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}>
      <button className={"a-reason-btn " + (pinned ? 'pinned' : '')}
              onClick={(e) => { e.stopPropagation(); setPinned(p => !p); }}
              aria-label="show reasoning">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 3.5h7M2.5 6h7M2.5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      {show && (
        <div className={"a-reason-pop " + anchor} onClick={(e) => e.stopPropagation()}>
          <div className="a-reason-head">
            <span className="a-reason-method">↳ {reasoning.method.toLowerCase().replace(/_/g,' ')}</span>
            <span className="a-reason-lanes">{reasoning.lanes}</span>
          </div>
          <div className="a-reason-text">{reasoning.text}</div>
          {reasoning.dissent && reasoning.dissent !== '—' && (
            <div className="a-reason-dissent"><b>Dissent</b>{reasoning.dissent}</div>
          )}
          <a className="a-reason-link">Open in evidence inspector →</a>
        </div>
      )}
    </span>
  );
}

function ReportView({ artifact, synthesis }) {
  const sections = aArray(synthesis?.sections);
  const summary = synthesis?.executive_summary || synthesis?.drafted || '';
  if (!summary && sections.length === 0) {
    return <EmptyArtifact label={artifact.name.toLowerCase()} />;
  }
  return (
    <div className="a-rep">
      {summary && (
        <>
          <h4>Generated summary <span className="stat">live</span></h4>
          <p>{summary}</p>
        </>
      )}
      {sections.map((section, i) => (
        <React.Fragment key={section.id || section.title || i}>
          <h4>§{i + 1} {section.title || section.heading || 'Section'} <span className="stat">live</span></h4>
          <p>{section.text || section.body || section.summary || 'Section content is present but has no display text.'}</p>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── main ────────────────────────────────────────────────────────────────

function AtriumDashboard({ initialTab = 'chronology' }) {
  injectAStyle();
  const nav = React.useContext(NavContext);
  const [localTab, setLocalTab] = React.useState(initialTab);
  const [live, setLive] = React.useState(null);
  const [artifacts, setArtifacts] = React.useState({});
  const [events, setEvents] = React.useState([]);
  const [selectedDocId, setSelectedDocId] = React.useState(() => {
    const hash = window.location.hash.replace('#', '');
    const hashDoc = hash.startsWith('doc=') ? decodeURIComponent(hash.slice(4)) : null;
    return hashDoc || localStorage.getItem('op_selected_doc') || null;
  });

  // Controlled when inside Workspace (nav.go present); local state otherwise.
  const tab = (nav && nav.go && nav.view && nav.view !== 'monitor') ? nav.view : localTab;
  const setTab = (t) => { if (nav && nav.go) nav.go(t); else setLocalTab(t); };
  const goMonitor = () => { if (nav && nav.go) nav.go('monitor'); };

  React.useEffect(() => {
    const url = selectedDocId
      ? '/api/operator-status?doc_id=' + encodeURIComponent(selectedDocId)
      : '/api/operator-status';
    const load = () => {
      fetch(url)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return;
          setLive(d);
          const docId = d?.doc?.id;
          if (docId && !selectedDocId) {
            localStorage.setItem('op_selected_doc', docId);
          }
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [selectedDocId]);

  const doc = live?.doc || {};
  const activeDocId = selectedDocId || doc.id || localStorage.getItem('op_selected_doc') || null;

  React.useEffect(() => {
    if (!activeDocId) return;
    let cancelled = false;
    const loadArtifact = (kind) =>
      fetch('/api/docs/' + encodeURIComponent(activeDocId) + '/artifacts/' + kind)
        .then(r => r.ok ? r.json() : { claims: [], total: 0 })
        .catch(() => ({ claims: [], total: 0 }));
    Promise.all([
      loadArtifact('chronology'),
      loadArtifact('entities'),
      loadArtifact('people'),
      loadArtifact('synthesis-v1'),
      fetch('/api/docs/' + encodeURIComponent(activeDocId) + '/activity-events?limit=100')
        .then(r => r.ok ? r.json() : { events: [] })
        .catch(() => ({ events: [] })),
    ]).then(([chronology, entities, people, synthesis, eventData]) => {
      if (cancelled) return;
      setArtifacts({ chronology, entities, people, synthesis });
      setEvents(aArray(eventData.events));
    });
    return () => { cancelled = true; };
  }, [activeDocId]);

  const pipeline = aArray(live?.pipeline);
  const counts = live?.claims || {};
  const breakdown = live?.claim_breakdown || {};
  const buildListArtifact = (id, name, source, breakdownKey) => {
    const rows = aArray(source?.claims);
    const b = breakdown[breakdownKey] || {};
    const accepted = aNumber(b.accepted || rows.filter(r => r.status === 'accepted' || r.status === 'confirmed').length);
    const disputed = aNumber(b.disputed || rows.filter(r => r.status === 'disputed').length);
    const superseded = aNumber(b.superseded || rows.filter(r => r.status === 'superseded').length);
    const count = aNumber(source?.total, rows.length);
    return {
      id, kind: 'list', name, count, accepted, disputed, superseded,
      agreement: count > 0 ? accepted / count : 0, gate: 0.85,
      lastUpdate: live ? new Date().toLocaleTimeString('en-AU', {timeZone: 'Australia/Melbourne'}) : '—',
      status: count > 0 ? 'iterating' : 'queued',
    };
  };
  const reportSections = aArray(artifacts.synthesis?.sections);
  const artifactModels = [
    buildListArtifact('chronology', 'Chronology', artifacts.chronology, 'chronology'),
    buildListArtifact('entities', 'Entity register', artifacts.entities, 'entities'),
    buildListArtifact('people', 'People register', artifacts.people, 'people'),
    {
      id: 'exec', kind: 'report', name: 'Executive memo',
      sections: Math.max(1, reportSections.length || aNumber(counts.memo, 0)),
      drafted: artifacts.synthesis && !artifacts.synthesis.claims ? (reportSections.length || (artifacts.synthesis.executive_summary ? 1 : 0)) : 0,
      critiqued: 0, agreement: null, lastUpdate: artifacts.synthesis?.generated_at ? aFormatTs(artifacts.synthesis.generated_at) : '—',
      status: artifacts.synthesis?.detail ? 'queued' : (artifacts.synthesis ? 'drafting' : 'queued'),
    },
    {
      id: 'detailed', kind: 'report', name: 'Detailed analysis',
      sections: Math.max(1, reportSections.length),
      drafted: reportSections.length, critiqued: 0, agreement: null,
      lastUpdate: artifacts.synthesis?.generated_at ? aFormatTs(artifacts.synthesis.generated_at) : '—',
      status: reportSections.length > 0 ? 'drafting' : 'gated',
    },
  ];
  const artifact = artifactModels.find(a => a.id === tab) || artifactModels[0];
  const activeRows = {
    chronology: aArray(artifacts.chronology?.claims),
    entities: aArray(artifacts.entities?.claims),
    people: aArray(artifacts.people?.claims),
  };
  const signalEvents = events.filter(e => ['ENTITY','CLAIM','DECISION','CONFLICT','PIPELINE','SYNTHESIS'].includes(String(e.type || '').toUpperCase())).slice(0, 8);
  const doneStages = pipeline.filter(p => p.status === 'done' || p.status === 'completed').length;
  const elapsedPct = pipeline.length > 0 ? aPct(doneStages, pipeline.length) : 0;

  return (
    <div className="a-root">
      <div className="a-top">
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div className={"a-brand " + (nav && nav.go ? 'clickable' : '')}
               onClick={goMonitor}
               title={nav && nav.go ? 'Back to operator monitor' : ''}>
            <span className="a-brand-dot" /> Atrium · output review
          </div>
          <div className="a-crumb">Workspace · Active document · <b>{doc.title || 'Loading…'}</b></div>
        </div>
        <div className="a-top-meta">
          <span className={"a-pill " + (doc.status === 'running' ? 'warn' : '')}><span className="a-dot" /> {doc.status || 'loading'}</span>
          <span className="a-mono" style={{ color: A.ink3 }}>{doc.id || '—'}</span>
        </div>
      </div>

      <div className="a-grid">
        {/* LEFT: doc + budget + pipelines */}
        <div className="a-col">
          <div className="a-card">
            <div className="a-doc">
              <div className="a-doc-eyebrow">Active document</div>
              <div className="a-doc-title">{doc.title || 'Loading…'}</div>
              <div style={{ fontSize:12, color: A.ink2 }}>
                {aNumber(doc.pages).toLocaleString()} pages · {String(doc.docType || 'document').replace('_',' ').toLowerCase()}
              </div>
              <dl className="a-doc-meta">
                <dt>Uploaded</dt><dd>{aFormatTs(doc.uploadTs)}</dd>
                <dt>Run id</dt><dd className="a-mono">{doc.id ? doc.id.slice(0,18) + '…' : '—'}</dd>
                <dt>Status</dt><dd>{doc.status || 'unknown'}</dd>
              </dl>
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-h"><h3>Pipeline completion</h3><div className="a-h-meta">{doneStages} of {pipeline.length}</div></div>
            <div className="a-budget">
              <div className="a-budget-row">
                <b>{doneStages}<span className="a-budget-of"> of {pipeline.length} stages</span></b>
                <span className="a-mono" style={{ fontSize:11, color: A.ink3 }}>{elapsedPct.toFixed(0)}%</span>
              </div>
              <div className="a-budget-bar">
                <i style={{ width: elapsedPct+'%', background: A.accent }} />
                <i style={{ width: (100-elapsedPct)+'%', background: A.ruleSoft }} />
              </div>
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-h"><h3>Pipelines</h3><div className="a-h-meta">{doneStages} of {pipeline.length}</div></div>
            <div className="a-pipe-mini">
              {pipeline.length === 0 && <EmptyArtifact label="pipeline" />}
              {pipeline.map((p, i) => {
                const c = p.status === 'done' ? A.good : p.status === 'queued' ? A.ink3 : A.accent;
                const pct = p.pct != null ? aNumber(p.pct) : aNumber(p.progress) * 100;
                return (
                  <div key={p.id || i} className="row">
                    <div className="head">
                      <div><span className="num">P{i + 1}</span> <span className="name">{p.name || p.id}</span></div>
                      <div className="pct">{pct.toFixed(0)}%</div>
                    </div>
                    <div className="bar"><i style={{ width: pct+'%', background: c }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER: artifact viewer */}
        <div className="a-col">
          <div className="a-card">
            <div className="a-tabs">
              {nav && nav.go && (
                <button className="a-tab monitor" onClick={goMonitor} title="Back to operator monitor">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Monitor
                </button>
              )}
              {TABS.map(t => {
                const a = artifactModels.find(x => x.id === t.id);
                const count = a.kind === 'list' ? a.count : a.sections;
                return (
                  <button key={t.id} className={"a-tab " + (tab === t.id ? 'active' : '')}
                          onClick={() => setTab(t.id)}>
                    {t.label}<span className="a-tab-count">{count}</span>
                  </button>
                );
              })}
            </div>
            <ArtHeader artifact={artifact} />
            {tab === 'chronology' && <ChronologyView rows={activeRows.chronology} />}
            {tab === 'entities'   && <EntityView rows={activeRows.entities} />}
            {tab === 'people'     && <PeopleView rows={activeRows.people} />}
            {tab === 'exec'       && <ReportView artifact={artifact} synthesis={artifacts.synthesis} />}
            {tab === 'detailed'   && <ReportView artifact={artifact} synthesis={artifacts.synthesis} />}
          </div>
        </div>

        {/* RIGHT: conflicts + signals + ext aug */}
        <div className="a-col">
          <div className="a-card">
            <div className="a-card-h"><h3>Cross-artifact signals</h3><div className="a-h-meta">{signalEvents.length}</div></div>
            <div>
              {signalEvents.length === 0 && <EmptyArtifact label="signal" />}
              {signalEvents.map((s, i) => {
                const canNav = false;
                return (
                  <div key={i} className={"a-sig-row " + (canNav ? 'clickable' : '')}
                       onClick={undefined}>
                    <span className="t">{s.ts ? new Date(s.ts).toLocaleTimeString('en-AU', {timeZone: 'Australia/Melbourne'}) : '—'}</span>
                    <div className="body"><b>{s.type || 'EVENT'}</b>{s.msg || ''}<span className="impact">↳ {s.source || 'pipeline'}</span></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="a-card">
            <div className="a-card-h"><h3>External augmentation</h3><div className="a-h-meta">live counts</div></div>
            <div>
              <div className="a-ext-row"><span>External references</span><span className="v">{aNumber(counts.external_refs)}</span></div>
              <div className="a-ext-row"><span>Internal references</span><span className="v">{aNumber(counts.internal_refs)}</span></div>
              <div className="a-ext-row"><span>Canonical entities</span><span className="v">{aNumber(counts.entities)}</span></div>
              <div className="a-ext-row"><span>Chronology claims</span><span className="v">{aNumber(counts.chronology)}</span></div>
              <div className="a-ext-row"><span>People claims</span><span className="v">{aNumber(counts.people)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.AtriumDashboard = AtriumDashboard;
