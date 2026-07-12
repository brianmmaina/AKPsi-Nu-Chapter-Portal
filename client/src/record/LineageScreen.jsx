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
      <FamilyPyramid M={M} onOpenFamily={onOpenFamily} />
    </div>
  );
}

/** Family cards arranged as a centered pyramid (narrow row on top). */
function FamilyPyramid({ M, onOpenFamily }) {
  const card = (fid) => {
    const fam = M.FAM[fid];
    return (
      <button
        key={fid}
        className="ncr-lift ncr-band"
        onClick={() => onOpenFamily(fid)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          textAlign: 'left',
          backgroundImage: `linear-gradient(${fam.soft}, ${fam.soft})`,
          border: `1px solid var(--ncr-ink)`,
          padding: '22px 24px',
          cursor: 'pointer',
          overflow: 'hidden',
          width: 'min(410px, 100%)',
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
  };

  const ids = M.famOrder;
  const bottomCount = Math.ceil(ids.length / 2);
  const topRow = ids.slice(0, ids.length - bottomCount);
  const bottomRow = ids.slice(ids.length - bottomCount);

  const row = (list, key) => (
    <div key={key} style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
      {list.map(card)}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'stretch', maxWidth: 1290, margin: '0 auto' }}>
      {topRow.length > 0 && row(topRow, 'top')}
      {row(bottomRow, 'bottom')}
    </div>
  );
}
