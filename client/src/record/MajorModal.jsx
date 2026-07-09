// Major search results — brothers grouped under a searched major.

export default function MajorModal({ M, major, onClose, onOpenBrother }) {
  const results = Object.values(M.brothers).filter((b) => b.major === major);
  return (
    <div className="ncr-modal-backdrop" onClick={onClose} style={{ padding: '60px 24px' }}>
      <div className="ncr-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(460px, 100%)', padding: '34px 36px 30px' }}>
        <button className="ncr-modal-x" onClick={onClose} aria-label="Close" style={{ top: 16, right: 20 }}>×</button>
        <div className="ncr-label" style={{ letterSpacing: '.22em', marginBottom: 6 }}>Major</div>
        <h2 style={{ fontFamily: 'var(--ncr-display)', fontWeight: 400, fontSize: 30, lineHeight: 1, margin: '0 0 18px', color: 'var(--ncr-ink)' }}>
          {major}
        </h2>
        <div style={{ borderTop: '1.5px solid var(--ncr-ink)' }}>
          {results.map((b) => (
            <button
              key={b.id}
              className="ncr-row-btn"
              onClick={() => onOpenBrother(b.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', borderBottom: '1px solid var(--ncr-rule-faint)' }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  flex: 'none',
                  border: '1px solid var(--ncr-rule)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--ncr-serif)',
                  fontSize: 11,
                  color: 'var(--ncr-ink-mid)',
                }}
              >
                {b.initials}
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontFamily: 'var(--ncr-serif)', fontSize: 16, color: 'var(--ncr-ink)' }}>{b.name}</span>
                <span style={{ display: 'block', fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-muted)' }}>
                  {[b.pledgeClass, `Class of ${b.gradYear}`].join(' · ')}
                </span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--ncr-ui)', fontSize: 11, color: 'var(--ncr-ink-mid)' }}>
                <span style={{ width: 8, height: 8, background: b.accent }} />
                {b.family}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
