const Login = ({ password, setPassword, handleLogin }) => {
  return (
    <div className="relative min-h-screen flex items-center justify-center royal-bg">
      {/* Large centered AKΨ watermark */}
      <div className="watermark" aria-hidden>
        <div className="watermark-inner">ΑΚΨ</div>
      </div>
      {/* Subtle repeating pattern overlay */}
      <div className="pattern-overlay" aria-hidden />
      <div
        className="rounded-md p-10 w-full max-w-md fade-zoom"
        style={{ backgroundColor: '#111633', border: '2px solid rgba(211,175,55,0.6)', boxShadow: '0 10px 24px rgba(0,0,0,0.35)' }}
      >
        {/* Fraternity Seal Placeholder */}
        <div className="flex justify-center mb-8">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: '#000042', border: '4px solid #D3AF37' }}
          >
            <div className="text-center">
              <div className="font-bold text-xs mb-1" style={{ color: '#D3AF37' }}>ΑΚΨ</div>
              <div className="text-[8px] font-semibold" style={{ color: '#D3AF37' }}>SEAL</div>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-2" style={{ fontFamily: "'PT Serif', serif", color: '#D3AF37' }}>
          Alpha Kappa Psi
        </h1>
        <h2 className="text-lg text-center mb-8 font-normal" style={{ color: '#D3AF37' }}>
          Family Trees
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#D3AF37' }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all"
            style={{ backgroundColor: '#00001f', border: '2px solid rgba(211,175,55,0.6)' }}
              placeholder="Enter password"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full font-medium py-3 px-4 rounded-sm transition duration-200 font-bold"
            style={{ backgroundColor: '#111633', color: '#D3AF37', border: '2px solid rgba(211,175,55,0.6)' }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#D3AF37'; e.currentTarget.style.color = '#000042'; e.currentTarget.style.border = '2px solid #D3AF37'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#111633'; e.currentTarget.style.color = '#D3AF37'; e.currentTarget.style.border = '2px solid rgba(211,175,55,0.6)'; }}
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

