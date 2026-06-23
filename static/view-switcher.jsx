// Tiny shared nav strip used by login.html, lawyer.html and operator.html.
// Inline-styled so it works on any page without depending on each app's CSS.

function ViewSwitcher({ current }) {
  // current: 'lawyer' | 'operator' | 'login'
  const items = [
    { id: 'lawyer',   label: 'Lawyer workbench', href: 'lawyer.html' },
    { id: 'operator', label: 'Operator monitor', href: 'operator.html' },
  ];
  const accent  = '#3F5E5A';
  const accent2 = '#E6EEEC';
  const ink     = '#1B1B19';
  const ink2    = '#6D6D66';
  const ink4    = '#B5B2A8';
  const rule    = '#E8E6DF';

  return (
    <div style={{
      height: 34, background: '#FFFFFF', borderBottom: '1px solid ' + rule,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 11.5, color: ink2, flexShrink: 0, position: 'relative', zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent,
                       boxShadow: '0 0 0 3px ' + accent2 }} />
        <b style={{ color: ink, fontWeight: 600, letterSpacing: '-0.005em', fontSize: 12 }}>
          Atrium · legal-ai
        </b>
        <span style={{ color: ink4, fontSize: 10.5, letterSpacing: '.08em',
                       textTransform: 'uppercase', fontWeight: 600 }}>
          demo
        </span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {items.map(it => (
          <a key={it.id} href={it.href} style={{
            padding: '4px 12px', borderRadius: 99, textDecoration: 'none',
            background: current === it.id ? accent2 : 'transparent',
            color: current === it.id ? '#2D4844' : ink2,
            fontWeight: current === it.id ? 600 : 500, fontSize: 11.5,
            transition: 'all .12s', display: 'inline-block',
          }}>{it.label}</a>
        ))}
        <span style={{ width: 1, height: 14, background: rule, margin: '0 6px 0 4px' }} />
        <a href="login.html" style={{
          padding: '4px 12px', borderRadius: 99, textDecoration: 'none',
          background: current === 'login' ? accent2 : 'transparent',
          color: current === 'login' ? '#2D4844' : ink2,
          fontWeight: current === 'login' ? 600 : 500, fontSize: 11.5,
          transition: 'all .12s', display: 'inline-block',
        }}>Sign-in flow</a>
      </div>
    </div>
  );
}

window.ViewSwitcher = ViewSwitcher;
