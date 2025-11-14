const MajorResultsPanel = ({
  major,
  results = [],
  onSelectBrother,
  onClear,
}) => {
  if (!major) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 260,
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: 16,
        padding: '10px 14px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
        color: '#000000',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '13px' }}>Major: {major}</div>
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#000000',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
      {results.length === 0 ? (
        <div style={{ fontSize: '12px', opacity: 0.7 }}>No brothers found for this major.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' }}>
          {results.map((brother) => (
            <button
              key={brother.id}
              type="button"
              onClick={() => onSelectBrother?.(brother.id)}
              style={{
                textAlign: 'left',
                border: 'none',
                background: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 10,
                padding: '8px 10px',
                cursor: 'pointer',
                color: '#000000',
              }}
            >
              <div style={{ fontWeight: 600 }}>{brother.name}</div>
              <div style={{ fontSize: '11px', opacity: 0.75 }}>
                {[brother.pledgeClass, brother.gradYear ? `Class of ${brother.gradYear}` : null]
                  .filter(Boolean)
                  .join(' • ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MajorResultsPanel;

