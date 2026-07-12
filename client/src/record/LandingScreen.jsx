// Full-bleed paper hero shown before the password gate.

const LANDING_STATS = [
  { fig: '1916', label: 'Established' },
  { fig: '80+', label: 'Brothers' },
  { fig: '9', label: 'Pledge Classes' },
  { fig: '5', label: 'Families' },
];

const LANDING_HOLDS = [
  { no: '01', title: 'Family Lineage', desc: 'Trace nine pledge classes and every mentorship tie across five families.', color: '#9a7327' },
  { no: '02', title: 'Life Points & Family Cup', desc: 'Standings, streak bonuses, and the running competition between families.', color: '#6f2b26' },
  { no: '03', title: 'Alumni Network', desc: 'A directory of alumni and the chapter mentorship program.', color: '#5f6f86' },
  { no: '04', title: 'Resources & Records', desc: 'Calendars, newsletters, officer contacts, and chapter deadlines.', color: '#6b6f3a' },
];

const label = (extra) => ({
  fontFamily: 'var(--ncr-ui)',
  textTransform: 'uppercase',
  ...extra,
});

export default function LandingScreen({ onEnter }) {
  const year = new Date().getFullYear();
  return (
    <div style={{ position: 'relative', zIndex: 5 }}>
      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '22px 40px 0' }}>
        <div className="ncr-band ncr-band--framed" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, padding: '10px 14px' }}>
          <span style={label({ fontSize: 11, fontWeight: 500, letterSpacing: '.26em', color: 'var(--ncr-ink-mid)' })}>
            Alpha Kappa Psi · Nu Chapter
          </span>
          <button
            onClick={onEnter}
            className="ncr-link-btn ncr-link-btn--crimson"
            style={{ fontSize: 12, letterSpacing: '.2em' }}
          >
            Enter the Archive →
          </button>
        </div>
        <div className="ncr-rule-double" style={{ marginTop: 16 }} />
      </div>

      <div className="ncr-hero ncr-hero--center" style={{ maxWidth: 1340, margin: '18px auto 0', padding: '60px 40px 52px' }}>
        <img
          src="/akpsi-crest.png"
          alt="Alpha Kappa Psi crest"
          style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto 30px', display: 'block' }}
        />
        <div style={label({ fontSize: 11, letterSpacing: '.42em', color: 'var(--ncr-gold)', marginBottom: 22 })}>
          The Professional Fraternity · Boston University · MCMXVI
        </div>
        <h1
          className="ncr-landing-title"
          style={{
            fontFamily: 'var(--ncr-display)',
            fontWeight: 400,
            fontSize: 108,
            lineHeight: 0.92,
            margin: 0,
            color: 'var(--ncr-ink)',
            letterSpacing: '.005em',
          }}
        >
          The Nu&nbsp;Chapter
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, margin: '30px 0 6px' }}>
          <span style={{ width: 60, height: 1, background: 'var(--ncr-ink)', opacity: 0.4 }} />
          <span className="ncr-italic" style={{ fontSize: 20 }}>A standing record of the brotherhood since 1916</span>
          <span style={{ width: 60, height: 1, background: 'var(--ncr-ink)', opacity: 0.4 }} />
        </div>
        <p style={{ fontFamily: 'var(--ncr-ui)', fontSize: 16, lineHeight: 1.6, color: 'var(--ncr-ink-mid)', maxWidth: 520, margin: '26px auto 0' }}>
          Lineage and pledge classes, the Life Points ledger and Family Cup, the alumni network, and the
          working papers of the chapter — preserved in one place.
        </p>
        <button className="ncr-btn" onClick={onEnter} style={{ marginTop: 36, height: 52, padding: '0 34px', letterSpacing: '.26em' }}>
          Enter the Archive
        </button>
      </div>

      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 40px' }}>
        <div
          className="ncr-snapshot-grid ncr-band ncr-band--framed"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
          }}
        >
          {LANDING_STATS.map((s) => (
            <div key={s.label} style={{ padding: '22px 16px 18px', borderRight: '1px solid rgba(43,35,24,.14)', textAlign: 'center' }}>
              <div className="ncr-fig" style={{ fontFamily: 'var(--ncr-display)', fontSize: 46, lineHeight: 1, color: 'var(--ncr-ink)' }}>{s.fig}</div>
              <div style={label({ fontSize: 10.5, letterSpacing: '.2em', color: 'var(--ncr-muted)', marginTop: 10 })}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1340, margin: '0 auto', padding: '64px 40px 0' }}>
        <div className="ncr-band ncr-band--framed" style={{ padding: '30px 28px 8px' }}>
        <div style={label({ fontSize: 11, letterSpacing: '.3em', color: 'var(--ncr-gold)', textAlign: 'center', marginBottom: 34 })}>
          What the Archive Holds
        </div>
        <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
          {LANDING_HOLDS.map((h) => (
            <button
              key={h.no}
              className="ncr-row-btn"
              onClick={onEnter}
              style={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: '74px 1fr auto',
                alignItems: 'center',
                gap: 24,
                borderBottom: '1px solid rgba(43,35,24,.16)',
                padding: '24px 8px',
              }}
            >
              <div className="ncr-fig" style={{ fontFamily: 'var(--ncr-display)', fontSize: 28, color: h.color }}>{h.no}</div>
              <div>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 23, fontWeight: 700, color: 'var(--ncr-ink)', marginBottom: 5 }}>{h.title}</div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 14, color: 'var(--ncr-ink-mid)', lineHeight: 1.5, maxWidth: 560 }}>{h.desc}</div>
              </div>
              <span style={{ fontFamily: 'var(--ncr-serif)', fontSize: 22, color: 'var(--ncr-ink)' }}>→</span>
            </button>
          ))}
        </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 40px' }}>
        <div className="ncr-band ncr-band--framed" style={{ padding: '38px 34px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--ncr-display)', fontSize: 34, lineHeight: 1.32, color: 'var(--ncr-ink)' }}>
          “Brotherhood, scholarship, and service — kept in the record so that every class may answer to the last.”
        </div>
        <div style={label({ fontSize: 11, letterSpacing: '.24em', color: 'var(--ncr-muted)', marginTop: 26 })}>
          The Founding Charter · 1916
        </div>
        </div>
      </div>

      <div className="ncr-band" style={{ borderTop: '1px solid var(--ncr-ink)' }}>
        <div style={{ maxWidth: 1340, margin: '0 auto', padding: '30px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/akpsi-seal.png" alt="" style={{ width: 46, height: 46, objectFit: 'contain', opacity: 0.85 }} />
            <div style={label({ fontSize: 11, letterSpacing: '.16em', color: 'var(--ncr-muted)', lineHeight: 1.8 })}>
              Alpha Kappa Psi · Nu Chapter
              <br />
              Boston University · Est. 1916
            </div>
          </div>
          <div style={label({ fontSize: 10, letterSpacing: '.22em', color: 'var(--ncr-faint)' })}>© {year} · Members Only</div>
        </div>
      </div>
    </div>
  );
}
