// Lawyer view — artifact body components.
// Reuses operator data (chronology/people/entities) and adds lawyer-only artifacts
// (doc refs, external refs, memo, detailed memo).

const LW2 = window.LawTheme;
const ExportMenu = window.ExportMenu;

function apiAuthHeaders(withJson) {
  const headers = {};
  if (withJson) headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('legal_ai_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

function registerRowsToEvents(data) {
  const rows = (data && data.rows) ? data.rows : [];
  return rows.map(row => {
    const e = row.entity || {};
    const text = e.event_description || e.description || e.label || row.id;
    return {
      id: row.id,
      text,
      title: text,
      event_date: e.event_date_iso || e.event_date || '',
      date: e.event_date_iso || e.event_date || '',
      validation_status: e.validation_status || 'real',
      salience_score: row.salience_score,
      provenance: row.provenance || [],
      data_source: 'real',
      conf: row.salience_score,
    };
  });
}

function registerRowsToPeople(data) {
  const rows = (data && data.rows) ? data.rows : [];
  return rows.map(row => {
    const e = row.entity || {};
    return {
      id: row.id,
      name: e.name || e.display_name || e.label || row.id,
      role: e.role || '',
      validation_status: e.validation_status || 'real',
      salience_score: row.salience_score,
      provenance: row.provenance || [],
      data_source: 'real',
      conf: row.salience_score,
    };
  });
}

function registerRowsToEntities(data) {
  const rows = (data && data.rows) ? data.rows : [];
  return rows.map(row => {
    const e = row.entity || {};
    const name = e.name || e.display_name || e.label || e.title || row.id;
    return {
      id: row.id,
      name,
      canonical: name,
      type: row.type || 'entity',
      validation_status: e.validation_status || 'real',
      salience_score: row.salience_score,
      provenance: row.provenance || [],
      data_source: 'real',
      conf: row.salience_score,
    };
  });
}

const artStyle = `
  /* ── Shared artifact frame ───────────────────────────── */
  .lwa-frame{background:${LW2.panel};border:1px solid ${LW2.rule};border-radius:14px;
    box-shadow:0 1px 0 ${LW2.ruleSoft};overflow:visible;margin-bottom:20px;position:relative}
  .lwa-frame-actions{position:absolute;top:14px;right:18px;z-index:5}
  .lwa-frame-h{padding:18px 24px 12px;display:flex;align-items:baseline;justify-content:space-between;
    gap:14px;border-bottom:1px solid ${LW2.ruleSoft}}
  .lwa-frame-h .left{min-width:0;flex:1}
  .lwa-eyebrow{font-size:10.5px;color:${LW2.ink3};letter-spacing:.12em;text-transform:uppercase;font-weight:600;margin-bottom:5px}
  .lwa-title{font-family:${LW2.serif};font-size:20px;font-weight:500;letter-spacing:-0.015em;margin:0;color:${LW2.ink}}
  .lwa-sub{font-size:12.5px;color:${LW2.ink2};margin-top:5px;line-height:1.5}
  .lwa-tools{display:flex;align-items:center;gap:8px;font-size:12px;color:${LW2.ink3}}
  .lwa-tools input{font:inherit;font-size:12px;padding:6px 10px 6px 28px;border:1px solid ${LW2.rule};
    border-radius:7px;width:200px;background:${LW2.bgDeep};color:${LW2.ink};
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%238A8A82' stroke-width='1.5'><circle cx='7' cy='7' r='5'/><path d='M11 11l3 3'/></svg>");
    background-repeat:no-repeat;background-position:9px center;background-size:12px}
  .lwa-tools input:focus{outline:none;border-color:${LW2.accent};background:${LW2.panel}}
  .lwa-btn{font:inherit;font-size:11.5px;font-weight:500;padding:5px 11px;border-radius:7px;cursor:pointer;
    border:1px solid ${LW2.rule};background:${LW2.panel};color:${LW2.ink};transition:all .12s}
  .lwa-btn:hover{background:${LW2.bg};border-color:${LW2.ink4}}
  .lwa-btn.active{background:${LW2.accent};color:#fff;border-color:${LW2.accent}}
  .lwa-btn:disabled{opacity:.62;cursor:default}
  .lwa-icon-btn{width:28px;height:28px;border-radius:7px;border:1px solid ${LW2.rule};background:${LW2.panel};
    color:${LW2.ink3};display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all .12s}
  .lwa-icon-btn:hover{background:${LW2.bg};color:${LW2.accent};border-color:${LW2.ink4}}
  .lwa-spin{width:14px;height:14px;border:2px solid ${LW2.rule};border-top-color:${LW2.accent};
    border-radius:50%;display:inline-block;animation:lwa-spin .8s linear infinite}
  @keyframes lwa-spin{to{transform:rotate(360deg)}}

  /* Reasoning chip (carried over from operator view, slightly lighter) */
  .lwa-why{position:relative;display:inline-flex;align-items:center;vertical-align:middle;margin-left:6px}
  .lwa-why-btn{background:transparent;border:0;padding:2px;cursor:help;color:${LW2.ink3};
    display:inline-flex;align-items:center;justify-content:center;border-radius:3px;line-height:0;transition:color .12s,background .12s}
  .lwa-why-btn:hover{color:${LW2.accent};background:${LW2.accentSoft}}
  .lwa-why-btn.pinned{color:${LW2.accent};background:${LW2.accentSoft}}
  .lwa-why-pop{position:absolute;bottom:calc(100% + 6px);right:-6px;width:300px;
    background:${LW2.panel};border:1px solid ${LW2.rule};border-radius:8px;padding:11px 13px;
    box-shadow:0 14px 36px rgba(0,0,0,.16),0 2px 6px rgba(0,0,0,.06);z-index:200;font-size:11.5px;
    line-height:1.5;color:${LW2.ink2};text-align:left;font-family:${LW2.sans};font-weight:400;white-space:normal}
  .lwa-why-pop.left{right:auto;left:-6px}
  .lwa-why-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
    margin-bottom:7px;font-family:${LW2.mono};font-size:9.5px;letter-spacing:.06em;text-transform:uppercase}
  .lwa-why-head b{color:${LW2.accent};font-weight:700}
  .lwa-why-text{color:${LW2.ink};font-size:12px;line-height:1.55;margin-bottom:8px}
  .lwa-why-diss{font-size:11px;color:${LW2.warn};padding:8px 0 0;border-top:1px solid ${LW2.ruleSoft};line-height:1.5}
  .lwa-why-diss b{font-family:${LW2.mono};font-weight:600;font-size:9.5px;letter-spacing:.06em;
    text-transform:uppercase;margin-right:4px;color:${LW2.warn}}

  /* ── Chronology timeline ─────────────────────────────── */
  .lwa-tl{padding:14px 22px 22px;position:relative}
  .lwa-tl-spine{position:absolute;left:124px;top:16px;bottom:16px;width:1px;background:${LW2.rule}}
  .lwa-tl-section{position:relative}
  .lwa-tl-section-h{display:flex;align-items:center;gap:8px;padding:11px 0 7px;margin-top:2px;
    font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${LW2.ink3};
    border-bottom:1px solid ${LW2.ruleSoft};cursor:pointer}
  .lwa-tl-section-h .count{font-family:${LW2.mono};font-size:10px;color:${LW2.ink2};letter-spacing:0;text-transform:none;font-weight:500}
  .lwa-tl-section.needs-review .lwa-tl-section-h{color:${LW2.warn}}
  .lwa-tl-section.excluded .lwa-tl-section-h{color:${LW2.ink3}}
  .lwa-tl-row{position:relative;display:grid;grid-template-columns:96px minmax(0,1fr) 34px;gap:30px;
    padding:14px 0;border-bottom:1px solid ${LW2.ruleSoft}}
  .lwa-tl-row:last-child{border-bottom:0}
  .lwa-tl-row.needs-review{background:${LW2.warnSoft};border-left:3px solid ${LW2.warn};padding-left:10px}
  .lwa-tl-row.excluded{opacity:.66;background:${LW2.panelDim}}
  .lwa-tl-date{font-family:${LW2.mono};font-size:11.5px;color:${LW2.ink2};padding-top:2px}
  .lwa-tl-date .cert{display:block;font-size:9.5px;color:${LW2.ink3};letter-spacing:.06em;
    text-transform:uppercase;margin-top:3px;font-weight:600}
  .lwa-tl-page{font-family:${LW2.mono};font-size:10.5px;color:${LW2.accent};margin-top:5px;
    cursor:pointer;font-weight:500}
  .lwa-tl-page:hover{text-decoration:underline}
  .lwa-tl-dot{position:absolute;left:120px;top:18px;width:9px;height:9px;border-radius:50%;
    background:${LW2.panel};border:2px solid ${LW2.accent};z-index:1}
  .lwa-tl-dot.good{background:${LW2.good};border-color:${LW2.good}}
  .lwa-tl-dot.warn{background:${LW2.warn};border-color:${LW2.warn}}
  .lwa-tl-dot.bad{background:${LW2.bad};border-color:${LW2.bad}}
  .lwa-tl-row.disputed .lwa-tl-dot{border-color:${LW2.warn}}
  .lwa-tl-row.review .lwa-tl-dot{background:${LW2.bad};border-color:${LW2.bad}}
  .lwa-tl-row.superseded .lwa-tl-dot{border-color:${LW2.ink3};background:${LW2.bg}}
  .lwa-tl-body{padding-left:20px;min-width:0}
  .lwa-tl-event{font-size:14.5px;color:${LW2.ink};margin-bottom:6px;line-height:1.45;font-weight:500;font-family:${LW2.serif}}
  .lwa-tl-row.superseded .lwa-tl-event{color:${LW2.ink3};text-decoration:line-through;text-decoration-color:${LW2.ink4}}
  .lwa-tl-meta{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:11.5px;color:${LW2.ink2};margin-bottom:6px}
  .lwa-tl-meta .lbl{font-family:${LW2.mono};font-size:9.5px;color:${LW2.ink3};letter-spacing:.06em;text-transform:uppercase;font-weight:600;margin-right:4px}
  .lwa-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:99px;
    font-size:11px;font-weight:500;background:${LW2.bg};border:1px solid ${LW2.rule};color:${LW2.ink2}}
  .lwa-tag.issue{background:${LW2.accentSoft};color:${LW2.accentDeep};border-color:transparent;font-weight:500}
  .lwa-tag.entity{background:${LW2.panelDim};color:${LW2.ink2}}
  .lwa-tl-note{margin-top:8px;padding:9px 12px;border-radius:8px;font-size:12px;line-height:1.5}
  .lwa-tl-note.supersede{background:${LW2.ruleSoft};color:${LW2.ink2}}
  .lwa-tl-note.dispute{background:${LW2.warnSoft};color:${LW2.warn};font-family:${LW2.mono};font-size:11.5px}
  .lwa-tl-note.review{background:${LW2.badSoft};color:${LW2.bad};font-family:${LW2.mono};font-size:11.5px}
  .lwa-quality{display:inline-flex;align-items:center;gap:6px}
  .lwa-feedback-panel{margin-top:10px;padding:10px;border:1px solid ${LW2.ruleSoft};border-radius:8px;background:${LW2.panel};
    display:grid;gap:8px;max-width:460px}
  .lwa-feedback-panel label{display:grid;gap:4px;font-size:10.5px;color:${LW2.ink3};letter-spacing:.07em;text-transform:uppercase;font-weight:600}
  .lwa-feedback-panel select,.lwa-feedback-panel input{font:inherit;font-size:12px;border:1px solid ${LW2.rule};
    border-radius:6px;padding:6px 8px;background:${LW2.bgDeep};color:${LW2.ink};letter-spacing:0;text-transform:none;font-weight:400}
  .lwa-feedback-actions{display:flex;align-items:center;gap:8px}
  .lwa-feedback-msg{font-size:12px;color:${LW2.good};font-weight:500}
  .lwa-feedback-banner{margin:14px 22px 0;padding:10px 12px;border:1px solid ${LW2.warnSoft};border-left:3px solid ${LW2.warn};
    border-radius:0 8px 8px 0;background:${LW2.warnSoft};display:flex;align-items:center;justify-content:space-between;gap:12px;
    font-size:12.5px;color:${LW2.ink2}}
  .lwa-feedback-list{margin:8px 22px 0;padding:10px 12px;border:1px solid ${LW2.ruleSoft};border-radius:8px;background:${LW2.panelDim};
    display:grid;gap:8px;font-size:12px;color:${LW2.ink2}}
  .lwa-feedback-item{border-bottom:1px solid ${LW2.ruleSoft};padding-bottom:8px}
  .lwa-feedback-item:last-child{border-bottom:0;padding-bottom:0}

  /* ── Generic table ───────────────────────────────────── */
  .lwa-tbl{width:100%;border-collapse:collapse;font-size:13px}
  .lwa-tbl thead th{font-size:10.5px;color:${LW2.ink3};letter-spacing:.08em;text-transform:uppercase;
    font-weight:600;text-align:left;padding:10px 20px 8px;background:${LW2.panelDim};border-bottom:1px solid ${LW2.rule}}
  .lwa-tbl tbody td{padding:13px 20px;border-bottom:1px solid ${LW2.ruleSoft};vertical-align:top;color:${LW2.ink}}
  .lwa-tbl tbody tr:last-child td{border-bottom:0}
  .lwa-tbl tbody tr:hover td{background:${LW2.bg}}
  .lwa-tbl .pri{font-size:13.5px;font-weight:500;color:${LW2.ink};line-height:1.4;margin-bottom:2px}
  .lwa-tbl .pri.dim{color:${LW2.ink3}}
  .lwa-tbl .sec{font-size:11.5px;color:${LW2.ink3};line-height:1.5}
  .lwa-tbl .mono{font-family:${LW2.mono};font-variant-numeric:tabular-nums}
  .lwa-tbl .ev-link{color:${LW2.accent};text-decoration:none;cursor:pointer;font-family:${LW2.mono};font-size:11px;font-weight:500}
  .lwa-tbl .ev-link:hover{text-decoration:underline}

  /* Confidence cell */
  .lwa-conf{display:flex;align-items:center;gap:8px;font-family:${LW2.mono};font-size:11.5px}
  .lwa-conf .bar{flex:1;height:4px;border-radius:99px;background:${LW2.ruleSoft};overflow:hidden;max-width:64px}
  .lwa-conf .bar i{display:block;height:100%;background:${LW2.good}}
  .lwa-conf.warn .bar i{background:${LW2.warn}}
  .lwa-conf.bad .bar i{background:${LW2.bad}}
  .lwa-conf .v{color:${LW2.ink2}}

  /* ── Entity / People filters ─────────────────────────── */
  .lwa-filterbar{display:flex;align-items:center;gap:6px;padding:10px 20px;border-bottom:1px solid ${LW2.ruleSoft};
    flex-wrap:wrap;background:${LW2.panelDim}}
  .lwa-filterbar .lbl{font-size:10.5px;color:${LW2.ink3};letter-spacing:.08em;text-transform:uppercase;font-weight:600;margin-right:4px}

  .lwa-badge{display:inline-flex;align-items:center;gap:4px;padding:1.5px 7px;border-radius:99px;
    font-family:${LW2.mono};font-size:9.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
  .lwa-badge.verified{background:${LW2.goodSoft};color:${LW2.good}}
  .lwa-badge.disputed{background:${LW2.warnSoft};color:${LW2.warn}}
  .lwa-badge.review  {background:${LW2.badSoft};color:${LW2.bad}}
  .lwa-badge.superseded{background:${LW2.ruleSoft};color:${LW2.ink3}}
  .lwa-badge.candidate{background:#F1ECFA;color:#7A4FE0}
  .lwa-badge.internal{background:${LW2.bg};color:${LW2.ink2};border:1px solid ${LW2.rule}}
  .lwa-badge.external{background:${LW2.accentSoft};color:${LW2.accent}}
  .lwa-badge.case   {background:${LW2.accentSoft};color:${LW2.accentDeep}}
  .lwa-badge.statute{background:${LW2.warnSoft};color:${LW2.warn}}
  .lwa-badge.regulation{background:${LW2.ruleSoft};color:${LW2.ink2}}
  .lwa-badge.article{background:${LW2.panelDim};color:${LW2.ink2};border:1px solid ${LW2.rule}}

  /* ── Memo ─────────────────────────────────────────────── */
  .lwa-memo{padding:6px 0 22px;max-width:760px;margin:0 auto;font-family:${LW2.serif};
    font-size:14.5px;line-height:1.7;color:${LW2.ink}}
  .lwa-memo-hd{padding:24px 32px 16px;border-bottom:1px solid ${LW2.ruleSoft};margin-bottom:14px;font-family:${LW2.sans}}
  .lwa-memo-hd .e{font-size:10.5px;color:${LW2.ink3};letter-spacing:.12em;text-transform:uppercase;font-weight:600;margin-bottom:6px}
  .lwa-memo-hd h2{font-family:${LW2.serif};font-size:26px;letter-spacing:-0.02em;font-weight:500;margin:0 0 10px}
  .lwa-memo-hd .meta{font-size:12px;color:${LW2.ink2};display:flex;flex-wrap:wrap;gap:14px}
  .lwa-memo-hd .meta b{color:${LW2.ink};font-family:${LW2.mono};font-weight:500}

  .lwa-issue{padding:14px 32px 6px;border-top:1px solid ${LW2.ruleSoft}}
  .lwa-issue:first-of-type{border-top:0}
  .lwa-issue h3{font-family:${LW2.sans};font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
    color:${LW2.ink3};margin:0 0 4px}
  .lwa-issue h4{font-family:${LW2.serif};font-size:19px;font-weight:500;letter-spacing:-0.014em;margin:0 0 14px;color:${LW2.ink}}

  .lwa-irac{display:grid;grid-template-columns:90px 1fr;column-gap:26px;row-gap:8px;margin-bottom:14px}
  .lwa-irac dt{font-family:${LW2.sans};font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
    color:${LW2.accentDeep};padding-top:6px;text-align:right}
  .lwa-irac dd{margin:0;padding:2px 0;font-size:14.5px;line-height:1.65;color:${LW2.ink}}

  .lwa-memo-cites{display:flex;flex-wrap:wrap;gap:6px;padding:10px 0 16px;border-top:1px dashed ${LW2.ruleSoft};margin-top:4px}
  .lwa-memo-cite{font-family:${LW2.mono};font-size:11px;padding:2.5px 9px;border-radius:99px;
    background:${LW2.accentSoft};color:${LW2.accent};cursor:pointer;font-weight:500;transition:background .12s}
  .lwa-memo-cite:hover{background:#D7E5E2}
  .lwa-memo-cite .a{color:${LW2.ink3};margin-right:5px;font-size:9.5px;letter-spacing:.04em;text-transform:uppercase}

  .lwa-memo-flag{margin:6px 0 14px;padding:10px 14px;border-left:3px solid ${LW2.warn};background:${LW2.warnSoft};
    border-radius:0 8px 8px 0;font-family:${LW2.sans};font-size:12px;color:${LW2.warn};line-height:1.5}
  .lwa-memo-flag b{font-weight:600;text-transform:uppercase;letter-spacing:.06em;font-size:10.5px;margin-right:6px}

  /* ── Detailed memo outline ───────────────────────────── */
  .lwa-out{padding:6px 0}
  .lwa-out-row{display:grid;grid-template-columns:38px 1fr 110px;gap:14px;padding:12px 28px;
    border-bottom:1px solid ${LW2.ruleSoft};align-items:center}
  .lwa-out-row:last-child{border-bottom:0}
  .lwa-out-row .num{font-family:${LW2.mono};color:${LW2.ink3};font-size:13px}
  .lwa-out-row .h{font-size:14px;color:${LW2.ink};font-weight:500;font-family:${LW2.serif}}
  .lwa-out-row .h .summary{display:block;font-family:${LW2.sans};font-size:11.5px;color:${LW2.ink3};margin-top:2px;line-height:1.5;font-weight:400}
  .lwa-out-row.gated .h, .lwa-out-row.queued .h, .lwa-out-row.drafting .h{color:${LW2.ink3}}
  .lwa-out-row.expandable{cursor:pointer;transition:background .12s}
  .lwa-out-row.expandable:hover{background:${LW2.bg}}

  .lwa-stat{font-family:${LW2.mono};font-size:9.5px;font-weight:600;letter-spacing:.04em;
    padding:2px 7px;border-radius:99px;justify-self:end;text-transform:uppercase}
  .lwa-stat.drafted{background:${LW2.goodSoft};color:${LW2.good}}
  .lwa-stat.drafting{background:${LW2.warnSoft};color:${LW2.warn}}
  .lwa-stat.queued{background:${LW2.ruleSoft};color:${LW2.ink3}}
  .lwa-stat.gated{background:${LW2.ruleSoft};color:${LW2.ink3}}

  .lwa-out-body{padding:6px 32px 22px;border-bottom:1px solid ${LW2.ruleSoft};background:${LW2.panelDim};
    font-family:${LW2.serif};font-size:14.5px;line-height:1.7;color:${LW2.ink}}
  .lwa-out-body p{margin:0 0 12px}
`;

function injectArtStyle() {
  if (!document.getElementById('lawyer-art-style')) {
    const s = document.createElement('style');
    s.id = 'lawyer-art-style';
    s.textContent = artStyle;
    document.head.appendChild(s);
  }
}

// ─── Reasoning popover ────────────────────────────────────────────────

function ReasonChip({ reasoning, anchor='right' }) {
  const [hover, setHover] = React.useState(false);
  const [pinned, setPinned] = React.useState(false);
  if (!reasoning) return null;
  const show = hover || pinned;
  return (
    <span className="lwa-why"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}>
      <button className={"lwa-why-btn " + (pinned ? 'pinned' : '')}
              onClick={(e) => { e.stopPropagation(); setPinned(p => !p); }}
              aria-label="why this">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 3.5h7M2.5 6h7M2.5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </button>
      {show && (
        <div className={"lwa-why-pop " + anchor} onClick={(e) => e.stopPropagation()}>
          <div className="lwa-why-head">
            <b>↳ {reasoning.method.toLowerCase().replace(/_/g,' ')}</b>
            <span>{reasoning.lanes}</span>
          </div>
          <div className="lwa-why-text">{reasoning.text}</div>
          {reasoning.dissent && reasoning.dissent !== '—' && (
            <div className="lwa-why-diss"><b>Dissent</b>{reasoning.dissent}</div>
          )}
        </div>
      )}
    </span>
  );
}

function confidenceValue(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ConfBar({ v, mode='auto' }) {
  const value = confidenceValue(v);
  const cls = mode === 'auto' ? (value < 0.6 ? 'bad' : value < 0.8 ? 'warn' : '') : mode;
  return (
    <div className={"lwa-conf " + cls}>
      <div className="bar"><i style={{ width: (value*100)+'%' }} /></div>
      <span className="v">{value.toFixed(2)}</span>
    </div>
  );
}

function tracePanelId(kind, docId) {
  return `panel:${kind}:${docId || ''}`;
}

function shortTrace(value, fallback = '') {
  const text = String(value || fallback || '');
  return text.length > 26 ? text.split('/').slice(-2).join('/') : text;
}

function claimTraceLabel(item) {
  const id = item?.claim_id || item?.id || item?.entity_id || '';
  const conf = confidenceValue(item?.confidence ?? item?.conf);
  return `#${String(id).slice(0, 8)} conf=${conf.toFixed(2)}`;
}

function TraceChip({ debugIds, panelId, artifactRef, runId }) {
  if (!debugIds) return null;
  return (
    <div style={{
      fontSize: 9, fontFamily: 'monospace', color: '#8A8A82',
      background: '#F0F0EB', border: '1px solid #E0DDD5',
      borderRadius: 4, padding: '2px 6px', margin: '10px 22px 0',
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'
    }}>
      <span title="Panel ID">📋 {panelId}</span>
      {artifactRef && (
        <span title="Artifact ref">📦 {shortTrace(artifactRef)}</span>
      )}
      {runId && (
        <span title="Run ID">🔄 {String(runId).slice(0,8)}</span>
      )}
    </div>
  );
}

const FEEDBACK_TYPES = [
  ['incorrect_claim', 'Incorrect claim'],
  ['missed_claim', 'Missed claim'],
  ['wrong_date', 'Wrong date'],
  ['wrong_person', 'Wrong person'],
  ['wrong_entity', 'Wrong entity'],
  ['wrong_relationship', 'Wrong relationship'],
  ['weak_evidence', 'Weak evidence'],
  ['missing_evidence', 'Missing evidence'],
  ['misleading_citation', 'Misleading citation'],
  ['bad_synthesis', 'Bad synthesis'],
  ['duplicate_item', 'Duplicate item'],
  ['wrongly_merged', 'Wrongly merged'],
  ['wrongly_split', 'Wrongly split'],
  ['false_contradiction', 'False contradiction'],
  ['missed_contradiction', 'Missed contradiction'],
  ['incorrect_prioritisation', 'Incorrect prioritisation'],
  ['other', 'Other'],
];

const FEEDBACK_SEVERITIES = ['critical', 'major', 'minor', 'suggestion'];

function decisionStateInfo(claim) {
  const state = claim && claim.decision_state;
  if (state === 'CLEAR_BAD' || (!state && claim && claim.status === 'rejected')) {
    return { section: 'excluded', tone: 'bad', label: state || 'REJECTED' };
  }
  if (['CONFLICTING', 'UNRESOLVED', 'NEEDS_CONTEXT'].includes(state) || (!state && claim && claim.status === 'escalated')) {
    return { section: 'needs', tone: 'warn', label: state || 'ESCALATED' };
  }
  if (state === 'CLEAR_GOOD' || (!state && claim && claim.status === 'confirmed')) {
    return { section: 'confirmed', tone: 'good', label: state || 'CONFIRMED' };
  }
  return { section: 'confirmed', tone: 'good', label: state || ((claim && claim.status) ? claim.status.toUpperCase() : 'CONFIRMED') };
}

function FeedbackForm({ docId, claim, onRecorded, onCancel }) {
  const [feedbackType, setFeedbackType] = React.useState('incorrect_claim');
  const [comment, setComment] = React.useState('');
  const [severity, setSeverity] = React.useState('major');
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!docId || !claim || saving) return;
    setSaving(true);
    setMessage('');
    const verdictMap = {
      incorrect_claim: 'reject',
      missing_context: 'needs_review',
      duplicate: 'needs_review',
      other: 'needs_review',
    };
    fetch(`/api/docs/${encodeURIComponent(docId)}/feedback`, {
      method: 'POST',
      headers: apiAuthHeaders(true),
      body: JSON.stringify({
        claim_id: claim.id,
        verdict: verdictMap[feedbackType] || 'needs_review',
        note: comment,
        adjudicator: localStorage.getItem('legal_ai_user') || 'lawyer-ui',
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Feedback request failed')))
      .then(d => {
        setMessage('Feedback recorded ✓');
        if (onRecorded) onRecorded(d);
      })
      .catch(err => setMessage(err.message || 'Feedback failed'))
      .finally(() => setSaving(false));
  };

  return (
    <form className="lwa-feedback-panel" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
      <label>
        Issue type
        <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)}>
          {FEEDBACK_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Note
        <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional note" />
      </label>
      <label>
        Severity
        <select value={severity} onChange={e => setSeverity(e.target.value)}>
          {FEEDBACK_SEVERITIES.map(value => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <div className="lwa-feedback-actions">
        <button className="lwa-btn active" type="submit" disabled={saving}>{saving ? 'Flagging...' : 'Flag issue'}</button>
        {onCancel && <button className="lwa-btn" type="button" onClick={(e) => { e.stopPropagation(); onCancel(); }}>Cancel</button>}
        {message && <span className="lwa-feedback-msg" style={{ color: message.includes('failed') ? LW2.bad : LW2.good }}>{message}</span>}
      </div>
    </form>
  );
}

// ─── Provenance Modal ──────────────────────────────────────────────────

function ProvenanceModal({ item, kind, docId, onClose }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (kind === 'chronology' && item) {
      setLoading(true);
      fetch(`/api/docs/${encodeURIComponent(docId)}/claims/${encodeURIComponent(item.id)}`, { headers: apiAuthHeaders() })
        .then(r => r.ok ? r.json() : null)
        .then(d => setData(d))
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    } else if (kind === 'entity' && item) {
      setData(item); // Entity data is already available
    }
  }, [item, kind, docId]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!item) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="lwa-provenance-overlay" onClick={handleBackdropClick}
         data-pane-id={tracePanelId('claim-review', docId)}
         data-claim-id={item.claim_id || item.id || ''}
         data-doc-id={docId || ''}
         style={{
           position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
           background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
      <div className="lwa-provenance-modal" onClick={(e) => e.stopPropagation()}
           style={{
             background: LW2.panel, borderRadius: 12, maxWidth: 600, width: '90%', maxHeight: '80vh',
             overflow: 'auto', border: `1px solid ${LW2.rule}`, boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
           }}>
        <div className="lwa-provenance-header"
             style={{
               padding: '20px 24px 16px', borderBottom: `1px solid ${LW2.ruleSoft}`,
               display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
             }}>
          <div>
            <h3 style={{
              margin: 0, fontSize: 18, fontWeight: 500, color: LW2.ink,
              fontFamily: LW2.serif
            }}>
              {kind === 'chronology' ? `${item.title} (${item.date})` : item.canonical}
            </h3>
            <div style={{ fontSize: 11, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginTop: 4 }}>
              {kind === 'chronology' ? 'Chronology Event Provenance' : 'Entity Provenance'}
            </div>
          </div>
          <button onClick={onClose}
                  style={{
                    background: 'transparent', border: 0, fontSize: 20, color: LW2.ink3,
                    cursor: 'pointer', padding: 4, lineHeight: 1
                  }}>×</button>
        </div>

        <div className="lwa-provenance-body" style={{ padding: 24 }}>
          {kind === 'chronology' && (
            <>
              {loading && (
                <div style={{ textAlign: 'center', color: LW2.ink3, fontSize: 13 }}>Loading provenance...</div>
              )}
              {!loading && !data && (
                <div style={{ color: LW2.ink3, fontSize: 13 }}>No provenance data available.</div>
              )}
              {!loading && data && (
                <>
                  <div className="lwa-prov-section" style={{ marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Agent Chain</h4>
                    <div style={{ fontSize: 13, color: LW2.ink, lineHeight: 1.5 }}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Nominated by:</strong> {data.nominated_by?.agent_type || 'Unknown'} 
                        {data.nominated_by?.lane && ` (${data.nominated_by.lane})`}
                        {data.nominated_by?.model_id && (
                          <span style={{ fontFamily: LW2.mono, fontSize: 11, color: LW2.ink3, marginLeft: 8 }}>
                            {data.nominated_by.model_id}
                          </span>
                        )}
                      </div>
                      
                      {data.challenges && data.challenges.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <strong>Challenges:</strong>
                          {data.challenges.map((challenge, idx) => (
                            <div key={idx} style={{ marginLeft: 16, marginTop: 4, fontSize: 12 }}>
                              • <em>{challenge.objection_type}:</em> {challenge.reason}
                              {challenge.resolution && (
                                <div style={{ marginLeft: 16, color: LW2.ink2, fontStyle: 'italic' }}>
                                  → {challenge.resolution}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {data.final_ruling && (
                        <div>
                          <strong>Final ruling:</strong> {data.final_ruling}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lwa-prov-section">
                    <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Confidence</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 60, height: 4, borderRadius: 2, background: LW2.ruleSoft, overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(data.confidence || 0) * 100}%`, height: '100%',
                          background: data.confidence < 0.6 ? LW2.bad : data.confidence < 0.8 ? LW2.warn : LW2.good
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: LW2.ink2, fontFamily: LW2.mono }}>
                        {((data.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {kind === 'entity' && data && (
            <>
              <div className="lwa-prov-section" style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Source Location</h4>
                <div style={{ fontSize: 13, color: LW2.ink, lineHeight: 1.5 }}>
                  {data.section_path && (
                    <div><strong>Section:</strong> {data.section_path}</div>
                  )}
                  {data.page_start && (
                    <div><strong>Page:</strong> {data.page_start}</div>
                  )}
                  {!data.section_path && !data.page_start && (
                    <div style={{ color: LW2.ink3 }}>Location not available</div>
                  )}
                </div>
              </div>

              {data.source_context && (
                <div className="lwa-prov-section" style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Context Excerpt</h4>
                  <div style={{
                    fontSize: 13, color: LW2.ink2, lineHeight: 1.5, fontStyle: 'italic',
                    background: LW2.panelDim, padding: 12, borderRadius: 6,
                    border: `1px solid ${LW2.ruleSoft}`
                  }}>
                    "{data.source_context.length > 300 ? data.source_context.substring(0, 300) + '...' : data.source_context}"
                  </div>
                </div>
              )}

              {data.alias_list && data.alias_list.length > 0 && (
                <div className="lwa-prov-section" style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Aliases</h4>
                  <div style={{ fontSize: 13, color: LW2.ink2 }}>
                    {data.alias_list.join(', ')}
                  </div>
                </div>
              )}

              <div className="lwa-prov-section">
                <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>Confidence</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 60, height: 4, borderRadius: 2, background: LW2.ruleSoft, overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(data.conf || 0) * 100}%`, height: '100%',
                      background: data.conf < 0.6 ? LW2.bad : data.conf < 0.8 ? LW2.warn : LW2.good
                    }} />
                  </div>
                  <span style={{ fontSize: 12, color: LW2.ink2, fontFamily: LW2.mono }}>
                    {((data.conf || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </>
          )}

          {kind === 'chronology' && (
            <div className="lwa-prov-section" style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${LW2.ruleSoft}` }}>
              <h4 style={{ margin: '0 0 8px', fontSize: 12, color: LW2.ink3, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
                Flag an issue with this claim
              </h4>
              <FeedbackForm
                docId={docId}
                claim={item}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 1. Chronology ─────────────────────────────────────────────────────

function ChronologyArtifact({ docId, debugIds, status }) {
  const [rows, setRows] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [provenanceItem, setProvenanceItem] = React.useState(null);
  const [feedbackClaimId, setFeedbackClaimId] = React.useState(null);
  const [toast, setToast] = React.useState('');
  const [feedback, setFeedback] = React.useState([]);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [reprocessMsg, setReprocessMsg] = React.useState('');
  const [sectionsOpen, setSectionsOpen] = React.useState({
    confirmed: true,
    needs: true,
    excluded: false,
  });

  const loadFeedback = React.useCallback(() => {
    if (!docId) return;
    fetch('/api/docs/' + encodeURIComponent(docId) + '/feedback', { headers: apiAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setFeedback((data && Array.isArray(data.adjudications)) ? data.adjudications : []))
      .catch(() => setFeedback([]));
  }, [docId]);

  React.useEffect(() => {
    if (!docId) return;
    setRows(null);
    setFeedback([]);
    setFeedbackOpen(false);
    setReprocessMsg('');
    fetch('/api/registers/' + encodeURIComponent(docId) + '?type=events&limit=1000', { headers: apiAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setRows(registerRowsToEvents(data || { rows: [] })))
      .catch(() => setRows([]));
    loadFeedback();
  }, [docId, loadFeedback]);

  const filtered = rows === null ? null : (searchQuery
    ? rows.filter(e => JSON.stringify(e).toLowerCase().includes(searchQuery.toLowerCase()))
    : rows)
      .slice()
      .sort((a, b) => String(a.event_date || a.date || '').localeCompare(String(b.event_date || b.date || '')));

  const grouped = React.useMemo(() => {
    const buckets = { confirmed: [], needs: [], excluded: [] };
    (filtered || []).forEach(e => {
      const info = decisionStateInfo(e);
      buckets[info.section].push(e);
    });
    return buckets;
  }, [filtered]);

  const recordFeedback = () => {
    setToast('Feedback recorded');
    setFeedbackClaimId(null);
    loadFeedback();
    window.setTimeout(() => setToast(''), 2200);
  };

  const requestReprocess = () => {
    setReprocessMsg('Not available in this build');
  };

  const renderRow = (e, sectionKey) => {
    const cert = (e.certainty || 'exact').toUpperCase();
    const info = decisionStateInfo(e);
    const rowClass = [
      e.status === 'disputed' ? 'disputed' : '',
      e.status === 'superseded' ? 'superseded' : '',
      sectionKey === 'needs' ? 'needs-review' : '',
      sectionKey === 'excluded' ? 'excluded' : '',
    ].filter(Boolean).join(' ');
    const issueList = (e.issues && e.issues.length > 0) ? e.issues : null;
    const confPct = Math.round(confidenceValue(e.conf) * 100);
    const chunk = e.chunk || e.evidence_chunk || (Array.isArray(e.evidence_refs) ? e.evidence_refs[0] : null) || {};
    const chunkId = chunk.chunk_id || chunk.chunkid || e.chunk_id || e.evidence_chunk_id || '';
    const pageStart = chunk.page_start || chunk.pagestart || e.page_start || e.page || '';
    const collectionName = chunk.collection_name || chunk.collectionname || e.collection_name || '';
    return (
      <div key={e.id} className={"lwa-tl-row " + rowClass}
           data-claim-id={e.claim_id || e.id || ''}
           data-confidence={e.confidence ?? e.conf ?? ''}
           data-claim-state={e.state || e.current_state || e.decision_state || e.status || ''}
           onClick={() => setProvenanceItem(e)}
           style={{ cursor: 'pointer' }}>
        <div className="lwa-tl-date">
          {e.date}
          <span className="cert">{cert.toLowerCase()}</span>
          <div className="lwa-tl-page">p. {(e.page || 0).toLocaleString()} →</div>
        </div>
        <div className={"lwa-tl-dot " + info.tone} />
        <div className="lwa-tl-body">
          <div className="lwa-tl-event">
            {e.title}
            {debugIds && (
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#A0A09A', marginLeft: 6 }}>
                {claimTraceLabel(e)}
              </span>
            )}
          </div>
          <div className="lwa-tl-meta">
            <span className="lwa-quality">
              <span className={"lwa-badge " + (info.tone === 'bad' ? 'review' : info.tone === 'warn' ? 'disputed' : 'verified')}>
                {info.label}
              </span>
              <span style={{ fontFamily: LW2.mono, color: LW2.ink3 }}>{confPct}%</span>
            </span>
          </div>
          {e.who && e.who.length > 0 && (
            <div className="lwa-tl-meta">
              <span className="lbl">Entities</span>
              {e.who.map(w => <span key={w} className="lwa-tag entity">{w}</span>)}
            </div>
          )}
          {issueList && (
            <div className="lwa-tl-meta">
              <span className="lbl">Legal issues</span>
              {issueList.map(i => <span key={i} className="lwa-tag issue">{i}</span>)}
            </div>
          )}
          <div className="lwa-tl-meta">
            <span className="lbl">Evidence</span>
            <span
              className="lwa-tag"
              style={{ fontFamily: LW2.mono }}
              data-chunk-id={chunkId}
              data-collection={collectionName}
              data-page-start={pageStart}
            >
              p.{(e.page || 0).toLocaleString()}
            </span>
            <ConfBar v={e.conf} />
            <ReasonChip reasoning={e.reasoning} anchor="left" />
          </div>
          {e.supersedeReason && (
            <div className="lwa-tl-note supersede">↳ Superseded — <i>{e.supersedeReason}</i></div>
          )}
          {e.disputeNote && <div className="lwa-tl-note dispute">⚠ {e.disputeNote}</div>}
          {e.reviewNote && <div className="lwa-tl-note review">↗ {e.reviewNote}</div>}
          {feedbackClaimId === e.id && (
            <FeedbackForm
              docId={docId}
              claim={e}
              onRecorded={recordFeedback}
              onCancel={() => setFeedbackClaimId(null)}
            />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
          <button
            className="lwa-icon-btn"
            title="Flag issue"
            aria-label="Flag issue"
            onClick={(event) => {
              event.stopPropagation();
              setFeedbackClaimId(current => current === e.id ? null : e.id);
            }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 2.5v11M3.5 3h7.7l-.9 2 1.2 2.2h-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (key, title, items) => {
    if (!items || items.length === 0) return null;
    const open = sectionsOpen[key];
    return (
      <div className={"lwa-tl-section " + (key === 'needs' ? 'needs-review' : key === 'excluded' ? 'excluded' : '')}>
        <div className="lwa-tl-section-h" onClick={() => setSectionsOpen(s => ({ ...s, [key]: !s[key] }))}>
          <span>{open ? '▾' : '▸'}</span>
          <span>{title}</span>
          <span className="count">({items.length.toLocaleString()} events)</span>
        </div>
        {open && items.map(e => renderRow(e, key))}
      </div>
    );
  };

  return (
    <div
      id="panel-chronology"
      className="lwa-frame"
      data-panel-id={tracePanelId('chronology', docId)}
      data-pane-id={tracePanelId('chronology-timeline', docId)}
      data-artifact-id={status?.chronology_artifact_ref || status?.chronology_proof_artifact_ref || ''}
      data-run-id={status?.chronology_agent_run_id || status?.chronology_backend_id || ''}
      data-doc-id={docId || ''}
    >
      <div className="lwa-frame-h">
        <div className="left">
          <div className="lwa-eyebrow">Artifact 1 of 7 · list</div>
          <h2 className="lwa-title">Legal chronology</h2>
          <div className="lwa-sub">
            {rows === null ? 'Loading…' : rows.length.toLocaleString() + ' adjudicated events. Dates suppressed from cited authorities (see External references).'}
          </div>
        </div>
        <div className="lwa-tools">
          <input placeholder="Search events, dates, entities…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <ExportMenu scope="chronology" />
        </div>
      </div>
      {feedback.length > 0 && (
        <>
          <div className="lwa-feedback-banner">
            <span>{feedback.length.toLocaleString()} issue{feedback.length === 1 ? '' : 's'} flagged</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="lwa-btn" onClick={() => setFeedbackOpen(open => !open)}>View feedback</button>
              <button className="lwa-btn" onClick={requestReprocess}>Request reprocess</button>
              {reprocessMsg && <span className="lwa-feedback-msg">{reprocessMsg}</span>}
            </span>
          </div>
          {feedbackOpen && (
            <div className="lwa-feedback-list">
              {feedback.map((item, idx) => (
                <div key={item.claim_id || item.id || idx} className="lwa-feedback-item">
                  <div>
                    <span className="lwa-badge disputed">{item.verdict || item.feedback_type || item.issue_type || 'issue'}</span>
                    <span style={{ marginLeft: 8, fontFamily: LW2.mono, color: LW2.ink3 }}>{item.severity || 'major'}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>{item.note || item.reviewer_comment || item.comment || 'No note'}</div>
                  {(item.claim_id || item.artifact_type) && (
                    <div style={{ marginTop: 3, fontFamily: LW2.mono, fontSize: 10.5, color: LW2.ink3 }}>
                      {item.artifact_type || 'chronology'} {item.claim_id ? '· ' + item.claim_id : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {toast && (
        <div style={{
          position: 'absolute', top: 62, right: 22, zIndex: 20, padding: '7px 10px',
          borderRadius: 7, background: LW2.goodSoft, color: LW2.good, fontSize: 12, fontWeight: 600
        }}>
          {toast}
        </div>
      )}
      <TraceChip
        debugIds={debugIds}
        panelId={tracePanelId('chronology-timeline', docId)}
        artifactRef={status?.chronology_artifact_ref || status?.chronology_proof_artifact_ref}
        runId={status?.chronology_agent_run_id || status?.chronology_backend_id}
      />
      {filtered === null && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>Loading…</div>}
      {filtered !== null && filtered.length === 0 && !searchQuery && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>No chronology events found for this document.</div>}
      {filtered !== null && filtered.length === 0 && searchQuery && <div style={{ padding: '20px', color: '#6B7280' }}>No events match "{searchQuery}"</div>}
      {filtered !== null && filtered.length > 0 && <div className="lwa-tl">
        <div className="lwa-tl-spine" />
        {renderSection('confirmed', 'Confirmed', grouped.confirmed)}
        {renderSection('needs', 'Needs review', grouped.needs)}
        {renderSection('excluded', 'Excluded / rejected', grouped.excluded)}
      </div>}
      {provenanceItem && (
        <ProvenanceModal 
          item={provenanceItem} 
          kind='chronology' 
          docId={docId} 
          onClose={() => setProvenanceItem(null)} 
        />
      )}
    </div>
  );
}

// ─── 2. People register ────────────────────────────────────────────────

function artifactStatus(item) {
  const raw = String(item?.status || '').toLowerCase();
  if (raw === 'disputed' || item?.disputed || item?.review) return 'disputed';
  if (raw === 'superseded' || raw === 'merged' || raw === 'split') return 'superseded';
  return 'accepted';
}

function statusCounts(items) {
  return (items || []).reduce((acc, item) => {
    const status = artifactStatus(item);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { accepted: 0, disputed: 0, superseded: 0 });
}

function PeopleArtifact({ docId, debugIds, status }) {
  const [rows, setRows] = React.useState(null);
  const [statusFilter, setStatusFilter] = React.useState(null);
  React.useEffect(() => {
    if (!docId) return;
    setRows(null);
    setStatusFilter(null);
    fetch('/api/registers/' + encodeURIComponent(docId) + '?type=people&limit=500', { headers: apiAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setRows(registerRowsToPeople(data || { rows: [] })))
      .catch(() => setRows([]));
  }, [docId]);
  const counts = statusCounts(rows || []);
  const filteredRows = rows === null ? null : (statusFilter ? rows.filter(p => artifactStatus(p) === statusFilter) : rows);

  return (
    <div
      id="panel-people"
      className="lwa-frame"
      data-panel-id={tracePanelId('people', docId)}
      data-pane-id={tracePanelId('people-register', docId)}
      data-artifact-id={status?.people_mentioned_artifact_ref || status?.people_artifact_ref || status?.individuals_artifact_ref || ''}
      data-run-id={status?.people_mentioned_curation_backend_id || status?.people_curation_backend_id || status?.people_backend_id || ''}
      data-doc-id={docId || ''}
    >
      <div className="lwa-frame-h">
        <div className="left">
          <div className="lwa-eyebrow">Artifact 2 of 7 · list</div>
          <h2 className="lwa-title">People register</h2>
          <div className="lwa-sub">
            {rows === null ? 'Loading…' : rows.length + ' natural persons identified. Government departments and entities appear in the Entity registry. Names canonicalised; aliases are merged via the canonical UUID.'}
          </div>
        </div>
        <div className="lwa-tools">
          <input placeholder="Search people, roles…" />
          <ExportMenu scope="people" />
        </div>
      </div>
      <div className="lwa-filterbar">
        <span className="lbl">Status</span>
        {['accepted', 'disputed', 'superseded'].map(status => (
          <button key={status} className={"lwa-btn " + (statusFilter === status ? 'active' : '')}
                  onClick={() => setStatusFilter(current => current === status ? null : status)}>
            {(counts[status] || 0).toLocaleString()} {status}
          </button>
        ))}
      </div>
      <TraceChip
        debugIds={debugIds}
        panelId={tracePanelId('people-register', docId)}
        artifactRef={status?.people_mentioned_artifact_ref || status?.people_artifact_ref || status?.individuals_artifact_ref}
        runId={status?.people_mentioned_curation_backend_id || status?.people_curation_backend_id || status?.people_backend_id}
      />
      {filteredRows === null && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>Loading…</div>}
      {filteredRows !== null && filteredRows.length === 0 && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>No people identified for this document.</div>}
      {filteredRows !== null && filteredRows.length > 0 && <table className="lwa-tbl">
        <thead><tr>
          <th style={{ width: 280 }}>Name</th>
          <th style={{ width: 240 }}>Role / qualifications</th>
          <th>Evidence</th>
          <th style={{ width: 130 }}>Confidence</th>
        </tr></thead>
        <tbody>
          {filteredRows.map(p => (
            <tr
              key={p.id}
              data-claim-id={p.claim_id || p.id || ''}
              data-confidence={p.confidence ?? p.conf ?? ''}
              data-claim-state={p.state || p.current_state || p.status || artifactStatus(p)}
            >
              <td>
                <div className={"pri " + (p.disputed && p.conf < 0.6 ? 'dim' : '')}>
                  {p.name}
                  {debugIds && (
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#A0A09A', marginLeft: 6 }}>
                      {claimTraceLabel(p)}
                    </span>
                  )}
                </div>
                <div className="sec">
                  {p.disputed && <span className="lwa-badge disputed">disputed</span>}
                  {artifactStatus(p) === 'superseded' && <span className="lwa-badge superseded">superseded</span>}
                </div>
              </td>
              <td>
                <div className="pri" style={{ fontSize: 13 }}>{p.role}</div>
                <div className="sec mono">{p.mentions} mentions</div>
              </td>
              <td>
                <a
                  className="ev-link"
                  data-chunk-id={p.chunk_id || p.evidence_chunk_id || ''}
                  data-collection={p.collection_name || ''}
                  data-page-start={p.page_start || p.page || ''}
                >{p.source}</a>
                <div className="sec mono">{p.lastSeen}</div>
              </td>
              <td>
                <ConfBar v={p.conf} />
                <div style={{ marginTop: 4 }}><ReasonChip reasoning={p.reasoning} anchor="left" /></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
  );
}

// ─── 3. Entity registry ────────────────────────────────────────────────

function EntityArtifact({ docId, debugIds, status }) {
  const [filter, setFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [entities, setEntities] = React.useState(null);
  const [provenanceItem, setProvenanceItem] = React.useState(null);
  const filters = [
    { id: 'all',          label: 'All' },
    { id: 'REGULATOR',    label: 'Regulators' },
    { id: 'DEPT_CWLTH',   label: 'Govt depts' },
    { id: 'COMPANY',      label: 'Companies' },
    { id: 'BRANDING',     label: 'Branding' },
    { id: 'CANDIDATE',    label: 'Unresolved' },
  ];
  React.useEffect(() => {
    if (!docId) return;
    setEntities(null);
    setStatusFilter(null);
    Promise.all([
      fetch(`/api/registers/${encodeURIComponent(docId)}?type=organisation&limit=500`, { headers: apiAuthHeaders() }).then(r => r.ok ? r.json() : { rows: [] }),
      fetch(`/api/registers/${encodeURIComponent(docId)}?type=legislation&limit=500`, { headers: apiAuthHeaders() }).then(r => r.ok ? r.json() : { rows: [] }),
      fetch(`/api/registers/${encodeURIComponent(docId)}?type=authority&limit=500`, { headers: apiAuthHeaders() }).then(r => r.ok ? r.json() : { rows: [] }),
    ]).then(([org, leg, auth]) => {
      const combined = [...(org.rows || []), ...(leg.rows || []), ...(auth.rows || [])];
      setEntities(registerRowsToEntities({ rows: combined }));
    }).catch(() => setEntities([]));
  }, [docId]);
  const statusTally = statusCounts(entities || []);
  const statusFiltered = entities === null ? null : (statusFilter ? entities.filter(e => artifactStatus(e) === statusFilter) : entities);
  const typeFiltered = statusFiltered === null ? null : (filter === 'all' ? statusFiltered : statusFiltered.filter(e => e.type === filter));
  const rows = typeFiltered === null ? null : (searchQuery
    ? typeFiltered.filter(e => JSON.stringify(e).toLowerCase().includes(searchQuery.toLowerCase()))
    : typeFiltered);
  return (
    <div
      id="panel-entities"
      className="lwa-frame"
      data-panel-id={tracePanelId('entities', docId)}
      data-pane-id={tracePanelId('entity-registry', docId)}
      data-artifact-id={status?.mentioned_entities_artifact_ref || status?.people_artifact_ref || ''}
      data-run-id={status?.mentioned_entities_curation_backend_id || status?.people_curation_backend_id || status?.people_backend_id || ''}
      data-doc-id={docId || ''}
    >
      <div className="lwa-frame-h">
        <div className="left">
          <div className="lwa-eyebrow">Artifact 3 of 7 · list</div>
          <h2 className="lwa-title">Entity registry</h2>
          <div className="lwa-sub">
            Organisations, regulators, companies and trusts. Companies are verified against ASIC where available.
            Natural persons live in the People register.
          </div>
        </div>
        <div className="lwa-tools">
          <input placeholder="Search entities…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <ExportMenu scope="entities" />
        </div>
      </div>
      <div className="lwa-filterbar">
        <span className="lbl">Status</span>
        {['accepted', 'disputed', 'superseded'].map(status => (
          <button key={status} className={"lwa-btn " + (statusFilter === status ? 'active' : '')}
                  onClick={() => setStatusFilter(current => current === status ? null : status)}>
            {(statusTally[status] || 0).toLocaleString()} {status}
          </button>
        ))}
      </div>
      <TraceChip
        debugIds={debugIds}
        panelId={tracePanelId('entity-registry', docId)}
        artifactRef={status?.mentioned_entities_artifact_ref || status?.people_artifact_ref}
        runId={status?.mentioned_entities_curation_backend_id || status?.people_curation_backend_id || status?.people_backend_id}
      />
      <div className="lwa-filterbar">
        <span className="lbl">Type</span>
        {filters.map(f => (
          <button key={f.id} className={"lwa-btn " + (filter === f.id ? 'active' : '')} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {rows === null && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>Loading…</div>}
      {rows !== null && rows.length === 0 && !searchQuery && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>No entities found for this document.</div>}
      {rows !== null && rows.length === 0 && searchQuery && <div style={{padding:'20px', color:'#6B7280'}}>No entities match "{searchQuery}"</div>}
      {rows !== null && rows.length > 0 && <table className="lwa-tbl">
        <thead><tr>
          <th style={{ width: 320 }}>Canonical name</th>
          <th style={{ width: 170 }}>Type</th>
          <th>Role / context in the document</th>
          <th style={{ width: 130 }}>Evidence</th>
          <th style={{ width: 130 }}>Confidence</th>
        </tr></thead>
        <tbody>
          {rows.map(e => (
            <tr
              key={e.id}
              data-claim-id={e.claim_id || e.id || ''}
              data-confidence={e.confidence ?? e.conf ?? ''}
              data-claim-state={e.state || e.current_state || e.status || artifactStatus(e)}
              onClick={() => setProvenanceItem(e)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <div className={"pri " + (e.candidate ? 'dim' : '')}>
                  {e.canonical}
                  {debugIds && (
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#A0A09A', marginLeft: 6 }}>
                      {claimTraceLabel(e)}
                    </span>
                  )}
                </div>
                <div className="sec">
                  {e.candidate && <span className="lwa-badge candidate">candidate</span>}
                  {!e.candidate && e.asic && e.asic !== 'n/a' && e.asic !== '—' && (
                    <span className="lwa-badge verified">ASIC ✓</span>
                  )}
                  {artifactStatus(e) === 'disputed' && <span className="lwa-badge disputed">disputed</span>}
                  {artifactStatus(e) === 'superseded' && <span className="lwa-badge superseded">superseded</span>}
                  <span className="sec" style={{ marginLeft: 8 }}>{e.aliases} alias{e.aliases===1?'':'es'}</span>
                </div>
              </td>
              <td>
                <div className="pri mono" style={{ fontSize: 12 }}>{e.type.replace('_',' ').toLowerCase()}</div>
                <div className="sec mono">{e.mentions} mentions</div>
              </td>
              <td><div className="sec" style={{ fontSize: 12.5, color: LW2.ink2 }}>{(e.reasoning && e.reasoning.text) || '—'}</div></td>
              <td>
                <a
                  className="ev-link"
                  data-chunk-id={e.chunk_id || e.evidence_chunk_id || ''}
                  data-collection={e.collection_name || ''}
                  data-page-start={e.page_start || e.page || ''}
                >{e.lastSeen}</a>
                <div className="sec mono">{e.asic !== 'n/a' && e.asic !== '—' ? e.asic : ''}</div>
              </td>
              <td>
                <ConfBar v={e.conf} />
                <div style={{ marginTop: 4 }}><ReasonChip reasoning={e.reasoning} anchor="left" /></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>}
      {provenanceItem && (
        <ProvenanceModal 
          item={provenanceItem} 
          kind='entity' 
          docId={docId} 
          onClose={() => setProvenanceItem(null)} 
        />
      )}
    </div>
  );
}

// ─── 4. Document references ────────────────────────────────────────────

function DocRefsArtifact({ docId }) {
  const [refs, setRefs] = React.useState(null);
  React.useEffect(() => {
    if (!docId) return;
    setRefs(null);
    fetch('/api/registers/' + encodeURIComponent(docId) + '?type=document&limit=500', { headers: apiAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const rows = registerRowsToEntities(data || { rows: [] });
        setRefs(rows.map(r => ({ ...r, title: r.name || r.canonical || r.id })));
      })
      .catch(() => { setRefs([]); });
  }, [docId]);
  return (
    <div className="lwa-frame">
      <div className="lwa-frame-h">
        <div className="left">
          <div className="lwa-eyebrow">Artifact 4 of 7 · list</div>
          <h2 className="lwa-title">Document references</h2>
          <div className="lwa-sub">
            Internal cross-references extracted from this document — annexures, schedules, and cited submissions.
          </div>
        </div>
        <div className="lwa-tools">
          <input placeholder="Search references…" />
          <ExportMenu scope="docrefs" />
        </div>
      </div>
      {refs === null && (
        <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>Loading…</div>
      )}
      {refs !== null && refs.length === 0 && (
        <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>
          No internal document references found for this document.
          <div style={{ marginTop: 8, fontSize: 12 }}>External authorities and legislation are in the <b>External authority</b> tab.</div>
        </div>
      )}
      {refs !== null && refs.length > 0 && (
        <table className="lwa-tbl">
          <thead><tr>
            <th style={{ width: 360 }}>Document</th>
            <th style={{ width: 100 }}>Scope</th>
            <th>Relevance</th>
            <th style={{ width: 160 }}>Citation</th>
            <th style={{ width: 110 }}>Confidence</th>
          </tr></thead>
          <tbody>
            {refs.map(d => (
              <tr key={d.id}>
                <td>
                  <div className={"pri " + (d.status === 'superseded' ? 'dim' : '')}>{d.title}</div>
                  <div className="sec">
                    {d.status === 'superseded' && <span className="lwa-badge superseded">superseded</span>}
                    {d.status === 'disputed' && <span className="lwa-badge disputed">disputed</span>}
                    {d.url && !d.status && <span className="lwa-badge verified">linked</span>}
                  </div>
                </td>
                <td><span className={"lwa-badge " + d.type}>{d.type}</span></td>
                <td><div className="sec" style={{ fontSize: 12.5, color: LW2.ink2 }}>{d.relevance}</div></td>
                <td>
                  <a className="ev-link">{d.cite}</a>
                  {d.url && <div className="sec mono" style={{ marginTop: 2 }}>{d.url.replace(/^https?:\/\//,'').slice(0,28)}…</div>}
                </td>
                <td><ConfBar v={d.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── 5. External authorities ───────────────────────────────────────────

function ExtRefsArtifact({ docId }) {
  const [filter, setFilter] = React.useState('all');
  const [extrefs, setExtrefs] = React.useState(null);
  const filters = [
    { id: 'all',        label: 'All' },
    { id: 'case',       label: 'Cases' },
    { id: 'statute',    label: 'Statutes' },
    { id: 'regulation', label: 'Regulations' },
    { id: 'article',    label: 'Articles' },
  ];
  React.useEffect(() => {
    if (!docId) return;
    setExtrefs([]);
  }, [docId]);
  const rows = extrefs === null ? null : (filter === 'all' ? extrefs : extrefs.filter(r => r.kind === filter));
  return (
    <div className="lwa-frame">
      <div className="lwa-frame-h">
        <div className="left">
          <div className="lwa-eyebrow">Artifact 5 of 7 · list</div>
          <h2 className="lwa-title">External references</h2>
          <div className="lwa-sub">
            Cases, statutes, regulations and commentary cited in the document. All AustLII / legislation.gov.au links
            are verified at ingest; only canonical citations are sent externally (air-gap rule).
          </div>
        </div>
        <div className="lwa-tools">
          <input placeholder="Search authorities, statutes…" />
          <ExportMenu scope="extrefs" />
        </div>
      </div>
      <div className="lwa-filterbar">
        <span className="lbl">Kind</span>
        {filters.map(f => (
          <button key={f.id} className={"lwa-btn " + (filter === f.id ? 'active' : '')} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {rows === null && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>Loading…</div>}
      {rows !== null && rows.length === 0 && <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>External references are not available in this build.</div>}
      {rows !== null && rows.length > 0 && <table className="lwa-tbl">
        <thead><tr>
          <th style={{ width: 360 }}>Citation</th>
          <th style={{ width: 100 }}>Kind</th>
          <th>Bearing on the matter</th>
          <th style={{ width: 180 }}>Verified source</th>
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>
                <div className="pri lwa-serif" style={{ fontSize: 14, lineHeight: 1.4 }}>{r.title}</div>
                <div className="sec mono" style={{ marginTop: 2 }}>{r.citation}</div>
              </td>
              <td>
                <span className={"lwa-badge " + r.kind}>{r.kind}</span>
                {r.verified && <div style={{ marginTop: 4 }}><span className="lwa-badge verified">verified</span></div>}
                {(r.jurisdiction || r.court) && <div className="sec mono" style={{ marginTop: 4 }}>{r.jurisdiction || r.court}</div>}
              </td>
              <td><div className="sec" style={{ fontSize: 12.5, color: LW2.ink2 }}>{r.bearing}</div></td>
              <td>
                <a className="ev-link" href={r.url}>{r.url ? r.url.replace(/^https?:\/\//,'') : '—'}</a>
                <div className="sec mono" style={{ marginTop: 2 }}>{r.year ? '↗ '+r.year : ''}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
  );
}

// ─── 6. Synthesis ─────────────────────────────────────────────────────

function SynthesisArtifact({ docId, debugIds, status }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [running, setRunning] = React.useState(false);
  const [message, setMessage] = React.useState('Synthesis is not available in this build (mock).');

  const load = React.useCallback(() => {
    if (!docId) return;
    setLoading(true);
    setData(null);
    setMessage('Synthesis is not available in this build (mock).');
    setLoading(false);
  }, [docId]);

  React.useEffect(() => {
    setData(null);
    setMessage('Synthesis is not available in this build (mock).');
    load();
  }, [load]);

  const run = async () => {
    setMessage('Synthesis is not available in this build (mock).');
  };

  const sections = data && Array.isArray(data.sections) ? data.sections : [];
  const synthesisText = (section) => {
    if (!section) return '';
    if (section.narrative || section.body || section.content) return section.narrative || section.body || section.content;
    if (Array.isArray(section.claims)) {
      return section.claims.map(c => c.description || c.summary || c.title || '').filter(Boolean).join('\n\n');
    }
    if (Array.isArray(section.entities)) {
      return section.entities.map(e => {
        const name = e.name || e.canonical_name || '';
        const role = e.role || e.description || '';
        return name && role ? `${name}: ${role}` : (name || role);
      }).filter(Boolean).join('\n');
    }
    return '';
  };
  const narrativeSections = sections.filter(s => synthesisText(s));
  const chronology = sections.find(s => s.section_type === 'chronology') || {};
  const people = sections.find(s => s.section_type === 'people') || {};
  const claims = Array.isArray(chronology.claims) ? chronology.claims : [];
  const entities = Array.isArray(people.entities) ? people.entities : [];

  return (
    <div
      id="panel-synthesis"
      className="lwa-frame"
      data-panel-id={tracePanelId('synthesis', docId)}
      data-pane-id={tracePanelId('synthesis-narrative', docId)}
      data-artifact-id={status?.synthesis_artifact_ref || status?.synthesis_v1_artifact_ref || ''}
      data-run-id={status?.synthesis_agent_run_id || status?.synthesis_run_id || ''}
      data-doc-id={docId || ''}
    >
      <div className="lwa-frame-h">
        <div className="left">
          <div className="lwa-eyebrow">Artifact 6 of 8 · synthesis · <span className="lwa-badge candidate">mock</span></div>
          <h2 className="lwa-title">Synthesis</h2>
          <div className="lwa-sub">
            {loading ? 'Loading...' : data ? `${narrativeSections.length} narrative sections · ${claims.length} key events and ${entities.length} key persons.` : (message || 'No synthesis run yet - click Run Synthesis')}
          </div>
        </div>
        <div className="lwa-tools">
          <button className="lwa-btn active" onClick={run} disabled={running || !docId}>
            {running ? 'Running...' : 'Run Synthesis'}
          </button>
          {(running || loading) && <span className="lwa-spin" aria-label="Loading" />}
        </div>
      </div>
      <TraceChip
        debugIds={debugIds}
        panelId={tracePanelId('synthesis-narrative', docId)}
        artifactRef={status?.synthesis_artifact_ref || status?.synthesis_v1_artifact_ref}
        runId={status?.synthesis_agent_run_id || status?.synthesis_run_id}
      />
      {!data && !loading && (
        <div style={{ padding: '32px 24px', color: LW2.ink3, fontSize: 13, textAlign: 'center' }}>
          {message || 'No synthesis run yet - click Run Synthesis'}
        </div>
      )}
      {data && (
        <div style={{ padding: '18px 24px 24px', display: 'grid', gap: 18 }}>
          {narrativeSections.map((section, idx) => (
            <section key={section.section_type || section.title || idx}>
              <h3 style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: LW2.ink3 }}>
                {section.title || ('Document Summary ' + (idx + 1))}
              </h3>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: LW2.ink, whiteSpace: 'pre-wrap' }}>
                {synthesisText(section)}
              </div>
            </section>
          ))}
          <section>
            <h3 style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: LW2.ink3 }}>Key Events</h3>
            {claims.length === 0 && <div style={{ color: LW2.ink3, fontSize: 13 }}>No confirmed chronology claims in this synthesis.</div>}
            {claims.length > 0 && (
              <table className="lwa-tbl">
                <thead><tr><th style={{ width: 150 }}>Date</th><th>Label</th></tr></thead>
                <tbody>
                  {claims.slice(0, 80).map((claim, idx) => (
                    <tr
                      key={claim.claim_id || idx}
                      data-claim-id={claim.claim_id || claim.id || ''}
                      data-confidence={claim.confidence ?? claim.conf ?? ''}
                      data-claim-state={claim.state || claim.current_state || ''}
                    >
                      <td className="mono">{claim.date || 'undated'}</td>
                      <td><div className="pri">
                        {claim.description || claim.label || claim.claim_id}
                        {debugIds && (
                          <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#A0A09A', marginLeft: 6 }}>
                            {claimTraceLabel(claim)}
                          </span>
                        )}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section>
            <h3 style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', color: LW2.ink3 }}>Key Persons</h3>
            {entities.length === 0 && <div style={{ color: LW2.ink3, fontSize: 13 }}>No people entities in this synthesis.</div>}
            {entities.length > 0 && (
              <table className="lwa-tbl">
                <thead><tr><th>Name</th><th style={{ width: 180 }}>Role</th><th style={{ width: 130 }}>Claims</th></tr></thead>
                <tbody>
                  {entities.slice(0, 80).map((entity, idx) => (
                    <tr key={entity.entity_id || idx}>
                      <td><div className="pri">{entity.name || entity.entity_id}</div></td>
                      <td className="mono">{entity.role || 'unknown'}</td>
                      <td className="mono">{entity.claim_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

// ─── 7. Legal memo (IRAC per issue) ───────────────────────────────────

function CiteChip({ c, onCite }) {
  const artLabel = ({ chronology: 'Chronology', people: 'People', entities: 'Entity',
                      docrefs: 'Doc ref', extrefs: 'Authority',
                      memo: 'Issue' })[c.artifact] || c.artifact;
  return (
    <span className="lwa-memo-cite" onClick={() => onCite && onCite(c)}>
      <span className="a">{artLabel}</span>{c.label}
    </span>
  );
}

function MemoArtifact({ onCite, docId }) {
  const [summary, setSummary] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!docId) { setLoading(false); return; }
    setLoading(true);
    setSummary(null);
    fetch('/api/docs/' + encodeURIComponent(docId) + '/summary', { headers: apiAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setSummary(data || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, [docId]);

  if (loading) return <div className="lwa-frame" style={{padding:24,color:LW2.ink3,fontFamily:LW2.mono,fontSize:12}}>Loading summary…</div>;
  if (!summary) {
    return (
      <div className="lwa-frame" style={{padding:24}}>
        <div style={{color:LW2.ink3,fontFamily:LW2.mono,fontSize:12,marginBottom:8}}>Legal Memo · <span className="lwa-badge">not available</span></div>
        <div style={{color:LW2.ink2,fontSize:13}}>Summary not available for this document.</div>
      </div>
    );
  }

  const pageRefs = (provenance) => {
    const pages = [...new Set((provenance || []).map(p => p.page_start).filter(p => p != null))].sort((a, b) => a - b);
    if (pages.length === 0) return null;
    return (
      <div className="lwa-memo-cites">
        {pages.slice(0, 8).map(p => (
          <span key={p} className="lwa-memo-cite"><span className="a">p.</span>{p}</span>
        ))}
        {pages.length > 8 && <span className="lwa-memo-cite">+{pages.length - 8}</span>}
      </div>
    );
  };

  return (
    <div className="lwa-frame">
      <div style={{padding:'10px 16px 0',display:'flex',justifyContent:'flex-end'}}>
        <button
          className="lw-btn"
          style={{fontSize:11,padding:'4px 12px'}}
          onClick={() => {
            fetch('/api/docs/' + encodeURIComponent(docId) + '/export/html', { headers: apiAuthHeaders() })
              .then(r => r.ok ? r.json() : null)
              .then(data => {
                if (!data?.html) return
                const blob = new Blob([data.html], { type: 'text/html' })
                window.open(URL.createObjectURL(blob), '_blank')
              })
              .catch(() => {})
          }}
        >
          Export HTML ↗
        </button>
      </div>
      <div className="lwa-memo">
        <div className="lwa-memo-hd">
          <div className="e">Graph-grounded summary</div>
          <h2 className="lwa-serif">Document Summary</h2>
          <div className="meta">
            <span><b>{summary.sections.length}</b> sections</span>
            {summary.recommendations && <><span>·</span><span><b>{summary.recommendations.length}</b> recommendations</span></>}
            <span style={{fontFamily:LW2.mono,fontSize:10,background:'#D7E5E2',color:'#1A5C52',padding:'2px 7px',borderRadius:99,marginLeft:4}}>{summary.data_source}</span>
          </div>
        </div>
        <div className="lwa-issue">
          <h3>Overview</h3>
          <p style={{fontSize:14,lineHeight:1.65,color:LW2.ink}}>{summary.overview.text}</p>
          {pageRefs(summary.overview.provenance)}
        </div>
        {(summary.sections || []).map((section, i) => (
          <div key={i} className="lwa-issue">
            <h3>{section.title}</h3>
            <p style={{fontSize:13,lineHeight:1.65,color:LW2.ink}}>{section.text}</p>
            {pageRefs(section.provenance)}
          </div>
        ))}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="lwa-issue">
            <h3>Recommendations ({summary.recommendations.length})</h3>
            {summary.recommendations.slice(0, 5).map((rec, i) => (
              <div key={i} className="lwa-memo-flag" style={{marginBottom:8}}>
                <span>{rec.rec_text}</span>
                {rec.rec_page != null && <span style={{fontFamily:LW2.mono,fontSize:11,marginLeft:8}}>p.{rec.rec_page}</span>}
              </div>
            ))}
            {summary.recommendations.length > 5 && (
              <p style={{fontSize:11,color:LW2.ink3}}>+ {summary.recommendations.length - 5} more</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 7. Detailed memo ──────────────────────────────────────────────────

function DetailedMemoArtifact({ onCite, docId }) {
  const [expanded, setExpanded] = React.useState({ 4: true });
  if (docId) {
    return (
      <div className="lwa-frame" style={{padding:24}}>
        <div style={{color:LW2.ink3,fontFamily:LW2.mono,fontSize:12,marginBottom:8}}>Artifact 7 of 7 · Detailed legal analysis</div>
        <div style={{color:LW2.ink2,fontSize:13}}>Detailed legal analysis is not yet generated for this document.</div>
      </div>
    );
  }
  const dm = LD.detailedMemo;
  return (
    <div className="lwa-frame">
      <div className="lwa-frame-actions"><ExportMenu scope="detailed" /></div>
      <div className="lwa-memo-hd">
        <div className="e">Artifact 7 of 7 · report · estimated <b className="lw-mono">{dm.estPages}</b> pages</div>
        <h2 className="lwa-serif" style={{ fontSize: 26 }}>Detailed legal analysis — {dm.matter}</h2>
        <div className="meta">
          <span>Drafted <b>{dm.drafted}</b></span>
          <span>·</span>
          <span>Composite confidence <b>{dm.confidence.toFixed(2)}</b></span>
          <span>·</span>
          <span>{dm.sections.filter(s => s.state === 'drafted').length} of {dm.sections.length} sections drafted</span>
        </div>
      </div>
      <div className="lwa-out">
        {dm.sections.map(s => (
          <React.Fragment key={s.n}>
            <div className={"lwa-out-row " + s.state + (s.state === 'drafted' || s.body ? ' expandable' : '')}
                 onClick={() => (s.state === 'drafted' || s.body) && setExpanded(e => ({ ...e, [s.n]: !e[s.n] }))}>
              <div className="num">§{s.n}</div>
              <div className="h">
                {s.heading}
                {s.summary && <span className="summary">{s.summary}</span>}
              </div>
              <span className={"lwa-stat " + s.state}>{s.state}</span>
            </div>
            {expanded[s.n] && s.body && (
              <div className="lwa-out-body">
                <p>
                  The orthodox formulation of the formation question begins with <i>Pintarich v Deputy Commissioner of Taxation</i>
                  [2018] FCAFC 79. The Full Court there drew a line between a communication generated automatically and a
                  decision arrived at by an officer with contemporaneous mental engagement. On the OMCS facts that line
                  is on the wrong side: from the system's go-live on 4 July 2015, recovery letters were issued without
                  any contemporaneous officer consideration. The Department's prior characterisation of the internal
                  review process as "robust" has been retracted by Addendum 3 §2 and that retraction supersedes the
                  body-text characterisation.
                </p>
                <p>
                  The argument is sharpened by <i>Amato v Commonwealth</i> [2019] FCA 1990, which applied the Pintarich
                  framing to a substantially identical statutory setting. In Amato, declaratory relief issued on the
                  basis that the asserted debts had not been lawfully founded. The Commission's evidence in Volume 10
                  goes further: the systemic absence of human consideration, coupled with the volume of issuances
                  (≈170,000 in the December 2016 wave), supports a conclusion that the defect was structural rather
                  than incidental.
                </p>
                <p>
                  Two qualifications should be made. First, the Acting Secretary attribution remains unresolved on the
                  record (cf02); however, the formation defect operates at the algorithm-design level rather than at
                  the level of any individual officer's authority. The dispute is preserved for completeness only.
                  Second, while the prior internal review characterisation has been retracted, the date on which the
                  retraction took effect (10 April 2017) is the relevant anchor for any argument as to when the
                  Commonwealth ought to have been on notice.
                </p>
                <p style={{ color: LW2.ink3, fontStyle: 'italic' }}>
                  [The Critic agent has flagged two further sub-points awaiting re-pass: (i) the interaction with
                  the ADJR Act threshold and (ii) the scope of Pintarich's ratio as it applies to ministerial decisions.
                  These will be appended once accepted by the AgreementMeter.]
                </p>
                <div className="lwa-memo-cites" style={{ marginTop: 12 }}>
                  <CiteChip c={{ artifact:'extrefs', id:'er1', label:'Pintarich [2018] FCAFC 79' }} onCite={onCite} />
                  <CiteChip c={{ artifact:'extrefs', id:'er2', label:'Amato [2019] FCA 1990' }} onCite={onCite} />
                  <CiteChip c={{ artifact:'chronology', id:'e01', label:'OMCS go-live · 2015-07-04' }} onCite={onCite} />
                  <CiteChip c={{ artifact:'chronology', id:'e05', label:'Addendum 3 supersession' }} onCite={onCite} />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Mind Map ──────────────────────────────────────────────────────────

function MindMapArtifact({ docId }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    if (!docId) return;
    setLoading(false);
    setData(null);
  }, [docId]);

  const panelId = tracePanelId('mindmap', docId);
  if (loading) return <div data-panel-id={panelId} style={{ padding: 32, color: '#888' }}>Loading mind map…</div>;
  if (!data || data.status === 'not_yet_built' || !data.nodes || data.nodes.length === 0) {
    return (
      <div data-panel-id={panelId} style={{ padding: 32, color: '#888', fontStyle: 'italic' }}>
        Mind map is not available in this build.
      </div>
    );
  }

  const entities = data.nodes.filter(n => n.type === 'entity');
  const events = data.nodes.filter(n => n.type === 'event');
  const issues = data.nodes.filter(n => n.type === 'quality_issue');

  return (
    <div data-panel-id={panelId} style={{ padding: '20px 28px', maxWidth: 900 }}>
      <div style={{ marginBottom: 8, color: '#888', fontSize: 12 }}>
        {data.node_count} nodes · {data.edge_count} edges · v{data.version || 1}
      </div>
      {entities.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Entities ({entities.length})</h3>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13 }}>
            {entities.map(n => <li key={n.id}>{n.label}{n.entity_type ? ` — ${n.entity_type}` : ''}</li>)}
          </ul>
        </section>
      )}
      {events.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Events ({events.length})</h3>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13 }}>
            {events.map(n => <li key={n.id}>{n.date ? `${n.date} — ` : ''}{n.label}</li>)}
          </ul>
        </section>
      )}
      {issues.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#b55', marginBottom: 8 }}>Quality Issues ({issues.length})</h3>
          <ul style={{ margin: 0, padding: '0 0 0 18px', fontSize: 13, color: '#b55' }}>
            {issues.map(n => <li key={n.id}>{n.label}{n.claim_id ? ` (claim: ${n.claim_id})` : ''}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────

function ArtifactBody({ tab, onCite, docId, debugIds }) {
  injectArtStyle();
  const [status, setStatus] = React.useState(null);
  React.useEffect(() => {
    setStatus(null);
    if (!docId) return;
    fetch('/api/status/' + encodeURIComponent(docId), { headers: apiAuthHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setStatus(data || null))
      .catch(() => setStatus(null));
  }, [docId]);
  switch (tab) {
    case 'chronology': return <ChronologyArtifact docId={docId} debugIds={debugIds} status={status} />;
    case 'people':     return <PeopleArtifact docId={docId} debugIds={debugIds} status={status} />;
    case 'entities':   return <EntityArtifact docId={docId} debugIds={debugIds} status={status} />;
    case 'docrefs':    return <DocRefsArtifact docId={docId} />;
    case 'extrefs':    return <ExtRefsArtifact docId={docId} />;
    case 'synthesis':  return <SynthesisArtifact docId={docId} debugIds={debugIds} status={status} />;
    case 'mindmap':    return <MindMapArtifact docId={docId} />;
    case 'memo':       return <MemoArtifact onCite={onCite} docId={docId} />;
    case 'detailed':   return <DetailedMemoArtifact onCite={onCite} docId={docId} />;
    default: return null;
  }
}

window.LawyerArtifactBody = ArtifactBody;
