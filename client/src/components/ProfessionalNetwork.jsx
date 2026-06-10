const ProfessionalNetwork = ({ onBack, onBackToHome, canGoBack }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#efe6d8' }}>
      {/* Thin top bar matching site chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 20px',
        background: 'rgba(239,230,216,0.97)',
        borderBottom: '1px solid rgba(122,98,68,0.18)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {canGoBack && (
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: '1px solid rgba(122,98,68,0.28)',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(106,80,44,0.8)',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={onBackToHome}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 10px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'rgba(106,80,44,0.55)',
            cursor: 'pointer',
          }}
        >
          Home
        </button>
        <span style={{ color: 'rgba(122,98,68,0.35)', fontSize: '0.7rem' }}>/</span>
        <span style={{
          fontSize: '0.72rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(43,33,24,0.7)',
        }}>
          Professional Network
        </span>
      </div>

      {/* Portal in iframe — fills remaining height */}
      <iframe
        src="/portal/index.html"
        title="Professional Network"
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          display: 'block',
        }}
        allow="same-origin"
      />
    </div>
  );
};

export default ProfessionalNetwork;
