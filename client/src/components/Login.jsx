const Login = ({ password, setPassword, handleLogin }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center akpsi-bg">
      {/* Large centered AKΨ watermark */}
      <div className="akpsi-watermark" aria-hidden>
        <div className="akpsi-watermark-inner">ΑΚΨ</div>
      </div>
      {/* Subtle repeating pattern overlay */}
      <div className="akpsi-pattern-overlay" aria-hidden />
      <div
        className="glass-panel-elevated rounded-lg p-8 w-full max-w-md fade-zoom"
        style={{
          padding: 'var(--space-8)',
        }}
      >
        {/* Fraternity Seal */}
        <div className="flex justify-center mb-6" style={{ marginBottom: 'var(--space-8)' }}>
          <img
            src="/akpsi-seal.png"
            alt="Alpha Kappa Psi Seal"
            className="w-32 h-32 object-contain"
            style={{
              width: '128px',
              height: '128px',
              aspectRatio: '1/1',
              filter: 'drop-shadow(0 4px 8px var(--akpsi-gold-subtle))',
            }}
            loading="eager"
          />
        </div>

        <h1
          className="text-center mb-2 fade-zoom"
          style={{
            fontSize: 'var(--text-4xl)',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--primary)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Alpha Kappa Psi
        </h1>
        <h2
          className="text-center mb-8 fade-zoom"
          style={{
            fontSize: 'var(--text-lg)',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-normal)',
            color: 'var(--primary)',
            marginBottom: 'var(--space-8)',
          }}
        >
          Family Trees
        </h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div>
            <label
              htmlFor="password"
              className="label"
              style={{
                color: 'var(--primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              style={{
                backgroundColor: 'var(--akpsi-navy-light)',
                borderColor: 'var(--border)',
                color: 'var(--text-on-dark)',
                padding: 'var(--space-3) var(--space-4)',
              }}
              placeholder="Enter password"
              required
              autoFocus
              aria-required="true"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{
              padding: 'var(--space-3) var(--space-4)',
              fontWeight: 'var(--weight-bold)',
              fontSize: 'var(--text-base)',
            }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

