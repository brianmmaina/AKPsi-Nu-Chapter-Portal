// Running header: crest wordmark, section nav with active underline,
// double rule, and the global brother/major search.

const NAV_ITEMS = [
  { key: 'index', label: 'Index' },
  { key: 'rankings', label: 'Life Points' },
  { key: 'lineage', label: 'Lineage' },
  { key: 'alumni', label: 'Network' },
  { key: 'resources', label: 'Resources' },
];

export default function Masthead({
  active,
  canBack,
  onBack,
  onNav,
  onLogout,
  searchQuery,
  onSearchChange,
  searchBrothers,
  searchMajors,
}) {
  const q = (searchQuery || '').trim();
  const showSearch = q.length > 0;
  const noResults = showSearch && !searchBrothers.length && !searchMajors.length;

  return (
    <div className="ncr-band" style={{ position: 'relative', zIndex: 30, maxWidth: 1340, margin: '0 auto', padding: '22px 40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <button
          onClick={() => onNav('index')}
          style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
        >
          <img src="/akpsi-crest.png" alt="" style={{ width: 30, height: 30, objectFit: 'contain' }} />
          <span
            style={{
              fontFamily: 'var(--ncr-ui)',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '.26em',
              textTransform: 'uppercase',
              color: 'var(--ncr-ink-mid)',
              lineHeight: 1.5,
            }}
          >
            Alpha&nbsp;Kappa&nbsp;Psi
            <br />
            Nu&nbsp;Chapter&nbsp;·&nbsp;Est.&nbsp;1916
          </span>
        </button>
        <nav style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {canBack && (
            <button className="ncr-nav-btn ncr-nav-btn--muted" onClick={onBack}>
              ← Back
            </button>
          )}
          {NAV_ITEMS.map((item) => (
            <button key={item.key} className="ncr-nav-btn" onClick={() => onNav(item.key)}>
              {item.label}
              {active === item.key && <span className="ncr-nav-underline" />}
            </button>
          ))}
          <button className="ncr-nav-btn ncr-nav-btn--muted" onClick={onLogout}>
            Sign out
          </button>
        </nav>
      </div>
      <div className="ncr-rule-double" style={{ marginTop: 16 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, position: 'relative' }}>
        <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
          <input
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search brothers or majors…"
            aria-label="Search brothers or majors"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: 36,
              padding: '0 14px',
              background: '#f2ebdb',
              border: '1px solid var(--ncr-rule)',
              borderRadius: 0,
              fontFamily: 'var(--ncr-ui)',
              fontSize: 13,
              color: 'var(--ncr-ink)',
              outline: 'none',
            }}
          />
          {showSearch && (
            <div
              style={{
                position: 'absolute',
                top: 42,
                right: 0,
                width: 340,
                background: '#f6f0e2',
                border: '1px solid var(--ncr-ink)',
                boxShadow: '0 16px 32px rgba(20,14,8,.28)',
                zIndex: 40,
                maxHeight: 380,
                overflowY: 'auto',
              }}
            >
              {searchBrothers.length > 0 && (
                <>
                  <div className="ncr-label" style={{ fontSize: 9.5, letterSpacing: '.2em', padding: '12px 14px 6px' }}>
                    Brothers
                  </div>
                  {searchBrothers.map((r) => (
                    <button
                      key={r.id}
                      className="ncr-row-btn"
                      onClick={r.onClick}
                      style={{ width: '100%', borderBottom: '1px solid rgba(43,35,24,.1)', padding: '9px 14px' }}
                    >
                      <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, color: 'var(--ncr-ink)' }}>{r.name}</div>
                      <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>{r.meta}</div>
                    </button>
                  ))}
                </>
              )}
              {searchMajors.length > 0 && (
                <>
                  <div className="ncr-label" style={{ fontSize: 9.5, letterSpacing: '.2em', padding: '12px 14px 6px' }}>
                    Majors
                  </div>
                  {searchMajors.map((m) => (
                    <button
                      key={m.major}
                      className="ncr-row-btn"
                      onClick={m.onClick}
                      style={{ width: '100%', borderBottom: '1px solid rgba(43,35,24,.1)', padding: '9px 14px' }}
                    >
                      <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 15, color: 'var(--ncr-ink)' }}>{m.major}</div>
                      <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>{m.countLabel}</div>
                    </button>
                  ))}
                </>
              )}
              {noResults && (
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 12.5, color: 'var(--ncr-muted)', padding: 14 }}>
                  No brothers or majors found.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
