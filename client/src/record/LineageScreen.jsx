// Family Lineage index — one card per family, opening its descent chart.

export default function LineageScreen({ M, onOpenFamily }) {
  const totalBrothers = Object.keys(M.brothers).length;
  return (
    <div className="ncr-shell">
      <div className="ncr-hero" style={{ marginBottom: 32 }}>
        <div className="ncr-folio-row">
          <span className="ncr-folio-no">No. 02</span>
          <span className="ncr-folio-line" />
          <span className="ncr-folio-note">
            {M.famOrder.length} families · {totalBrothers} brothers
          </span>
        </div>
        <h1 className="ncr-display-1" style={{ margin: '14px 0 8px' }}>Family Lineage</h1>
        <p className="ncr-italic" style={{ fontSize: 17, margin: 0, maxWidth: 560 }}>
          {M.famOrder.length} families carry the Nu Chapter line. Open a collection to trace its pledge classes
          and mentorship ties.
        </p>
      </div>
      <div className="ncr-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {M.famOrder.map((fid) => {
          const fam = M.FAM[fid];
          return (
            <button
              key={fid}
              className="ncr-lift"
              onClick={() => onOpenFamily(fid)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                textAlign: 'left',
                background: fam.soft,
                border: `1px solid ${fam.accent}`,
                padding: '22px 24px',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  width: 64,
                  height: 64,
                  flex: 'none',
                  background: fam.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--ncr-display)',
                  fontSize: 34,
                  color: '#f4ecda',
                }}
              >
                {fam.letter}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--ncr-serif)', fontSize: 25, fontWeight: 700, color: 'var(--ncr-ink)' }}>{fam.name}</div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 13, color: 'var(--ncr-ink-mid)', marginTop: 3 }}>{fam.subtitle}</div>
                <div style={{ fontFamily: 'var(--ncr-ui)', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: fam.accent, marginTop: 8 }}>
                  {fam.founded ? `${fam.founded} · ` : ''}{fam.count} brothers →
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
