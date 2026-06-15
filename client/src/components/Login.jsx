const Login = ({ password, setPassword, handleLogin }) => {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      background: '#080e16',
    }}>

      {/* Background photo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/images/home-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.22) saturate(0.5)',
        zIndex: 0,
      }} aria-hidden />

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.05) 0%, rgba(4,8,14,0.70) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} aria-hidden />

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: 'min(380px, calc(100vw - 32px))',
        padding: '56px 44px 48px',
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '4px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.28)',
      }}>


        {/* Crest */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <img
            src="/akpsi-crest.png"
            alt="Alpha Kappa Psi"
            style={{ width: '80px', height: '80px', objectFit: 'contain', opacity: 1, clipPath: 'inset(0 5px 0 0)' }}
            loading="eager"
          />
        </div>

        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          margin: '0 0 6px',
          fontSize: '1.1rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 700,
          color: '#0a0a0a',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Alpha Kappa Psi
        </h1>

        <p style={{
          textAlign: 'center',
          margin: '0 0 36px',
          fontSize: '0.72rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.18em',
          color: 'rgba(10,10,10,0.42)',
          textTransform: 'uppercase',
        }}>
          Nu Chapter
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            style={{
              display: 'block',
              width: '100%',
              height: '48px',
              padding: '0 14px',
              fontSize: '14px',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: '#0a0a0a',
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#0a0a0a';
              e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)';
              e.target.style.background = '#ffffff';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.boxShadow = 'none';
              e.target.style.background = '#f5f5f5';
            }}
            placeholder="Chapter password"
            required
            autoFocus
          />

          <button
            type="submit"
            style={{
              width: '100%',
              height: '48px',
              fontSize: '0.72rem',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.12s, box-shadow 0.15s',
              boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2a2a2a';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.28)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#0a0a0a';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.20)';
            }}
          >
            Enter
          </button>
        </form>
      </div>

      <style>{`
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #f5f5f5 inset !important;
          -webkit-text-fill-color: #0a0a0a !important;
          border-color: #e0e0e0 !important;
        }
      `}</style>
    </div>
  );
};

export default Login;
