// Password gate — wired to POST /api/auth via the parent's handleEnter.

export default function GateScreen({ email, onEmailChange, pw, onPwChange, onSubmit, loginError, onBackToLanding, busy }) {
  const year = new Date().getFullYear();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '96px 24px',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div
        className="ncr-band"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          borderBottom: '1px solid var(--ncr-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          padding: '16px 40px',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={onBackToLanding} className="ncr-link-btn ncr-link-btn--crimson" style={{ fontSize: 11, letterSpacing: '.2em' }}>
          About the Chapter →
        </button>
        <span className="ncr-label" style={{ fontSize: 10.5, letterSpacing: '.42em' }}>
          Members of the Brotherhood Only
        </span>
      </div>
      <div
        className="ncr-hero ncr-hero--center"
        style={{
          width: 'min(560px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '44px 36px 40px',
        }}
      >
      <img
        src="/akpsi-crest.png"
        alt="crest"
        style={{ width: 128, height: 128, objectFit: 'contain', marginBottom: 26 }}
      />
      <div className="ncr-label ncr-label--gold" style={{ letterSpacing: '.4em', marginBottom: 14 }}>
        Established 1916 · Boston University
      </div>
      <h1
        style={{
          fontFamily: 'var(--ncr-display)',
          fontWeight: 400,
          fontSize: 50,
          lineHeight: 1.05,
          margin: 0,
          maxWidth: 440,
          textAlign: 'center',
          color: 'var(--ncr-ink)',
        }}
      >
        The Nu&nbsp;Chapter Record
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '30px 0 8px' }}>
        <span style={{ width: 46, height: 1, background: 'var(--ncr-ink)', opacity: 0.4 }} />
        <span className="ncr-italic" style={{ fontSize: 16 }}>points · lineage · resources</span>
        <span style={{ width: 46, height: 1, background: 'var(--ncr-ink)', opacity: 0.4 }} />
      </div>
      <form onSubmit={onSubmit} style={{ marginTop: 30, width: 'min(360px, 100%)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="ncr-field-label" htmlFor="gate-email" style={{ marginBottom: 7 }}>
            BU Email
          </label>
          <input
            id="gate-email"
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="you@bu.edu"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            autoFocus
            className="ncr-input"
            style={{ height: 46, padding: '0 14px', fontSize: 16 }}
          />
        </div>
        <div>
          <label className="ncr-field-label" htmlFor="gate-password" style={{ marginBottom: 7 }}>
            Chapter Password
          </label>
          <input
            id="gate-password"
            type="password"
            value={pw}
            onChange={onPwChange}
            placeholder="••••••••"
            autoComplete="current-password"
            className="ncr-input"
            style={{ height: 46, padding: '0 14px', fontSize: 16 }}
          />
        </div>
        {loginError && <div className="ncr-error">{loginError}</div>}
        <button type="submit" className="ncr-btn" disabled={busy} style={{ height: 48, marginTop: 8, letterSpacing: '.26em', fontSize: 11.5 }}>
          {busy ? 'Verifying…' : 'Enter the Archive'}
        </button>
      </form>
      </div>
      <div
        className="ncr-band"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid var(--ncr-ink)', textAlign: 'center', padding: '13px 40px' }}
      >
        <span className="ncr-label" style={{ fontSize: 10, letterSpacing: '.22em', color: 'var(--ncr-faint)' }}>
          © {year} · Alpha Kappa Psi Nu Chapter
        </span>
      </div>
    </div>
  );
}
