const Login = ({ password, setPassword, handleLogin }) => {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#e8ddd0',
      overflow: 'hidden',
    }}>

      {/* Paper grid texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: [
          'repeating-linear-gradient(0deg,  transparent, transparent 28px, rgba(100,76,48,0.035) 28px, rgba(100,76,48,0.035) 29px)',
          'repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(100,76,48,0.035) 28px, rgba(100,76,48,0.035) 29px)',
        ].join(', '),
        zIndex: 2,
        pointerEvents: 'none',
      }} aria-hidden />

      {/* Login card */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        width: 'min(390px, calc(100vw - 32px))',
        padding: '48px 38px 36px',
        background: 'rgba(255, 252, 246, 0.96)',
        border: '1px solid rgba(112, 88, 52, 0.22)',
        borderRadius: '8px',
        boxShadow: '0 14px 32px rgba(54, 40, 24, 0.16), 0 2px 6px rgba(54, 40, 24, 0.08)',
      }}>
        {/* Top rule */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          borderRadius: '8px 8px 0 0',
          background: 'linear-gradient(90deg, transparent 0%, rgba(154,118,58,0.55) 35%, rgba(154,118,58,0.55) 65%, transparent 100%)',
        }} aria-hidden />

        {/* PRIVATE ACCESS label */}
        <p style={{
          textAlign: 'center',
          marginBottom: '18px',
          fontSize: '0.62rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          letterSpacing: '0.28em',
          color: 'rgba(138, 106, 58, 0.65)',
          textTransform: 'uppercase',
        }}>
          Private Access
        </p>

        {/* Crest */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
          <img
            src="/akpsi-seal.png"
            alt="Alpha Kappa Psi Seal"
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
              opacity: 0.72,
            }}
            loading="eager"
          />
        </div>

        {/* Title */}
        <h1 style={{
          textAlign: 'center',
          margin: '0 0 6px',
          fontSize: '1.05rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: '#221608',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}>
          Alpha Kappa Psi
        </h1>

        {/* Subtitle */}
        <p style={{
          textAlign: 'center',
          margin: 0,
          fontSize: '0.72rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          letterSpacing: '0.22em',
          color: 'rgba(106, 80, 44, 0.72)',
          textTransform: 'uppercase',
        }}>
          Nu Chapter Portal
        </p>

        {/* Divider */}
        <div style={{
          width: '64px',
          height: '1px',
          background: 'rgba(154, 118, 58, 0.38)',
          margin: '16px auto 28px',
        }} aria-hidden />

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: 'rgba(106, 80, 44, 0.72)',
            }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                height: '48px',
                padding: '0 14px',
                fontSize: '14px',
                fontFamily: 'var(--font-body)',
                color: '#221608',
                background: '#fffdf8',
                border: '1px solid rgba(126, 97, 53, 0.34)',
                borderRadius: '5px',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: 'none',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(154, 118, 58, 0.72)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(126, 97, 53, 0.34)';
              }}
              placeholder="Enter password"
              required
              autoFocus
              aria-required="true"
            />
          </div>

          <button
            type="submit"
            style={{
              display: 'block',
              width: '100%',
              height: '46px',
              marginTop: '4px',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: '#d9b54b',
              color: '#21180d',
              border: '1px solid rgba(117, 88, 32, 0.25)',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background 0.15s ease, transform 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#cda43c';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#d9b54b';
              e.currentTarget.style.transform = 'none';
            }}
          >
            Enter
          </button>
        </form>

        {/* Bottom rule */}
        <div style={{
          marginTop: '28px',
          height: '1px',
          background: 'rgba(154, 118, 58, 0.18)',
        }} aria-hidden />

        <p style={{
          textAlign: 'center',
          margin: '12px 0 0',
          fontSize: '0.60rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(138, 106, 58, 0.42)',
          fontFamily: 'var(--font-body)',
        }}>
          AKΨ Nu Chapter · Member Access Only
        </p>
      </div>
    </div>
  );
};

export default Login;
