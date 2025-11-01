const Header = () => {
  return (
    <header className="w-full flex justify-center fade-zoom" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)', background: 'transparent' }}>
      <div className="container text-center">
        <h1
          className="font-bold"
          style={{
            fontSize: 'var(--text-3xl)',
            fontFamily: 'var(--font-display)',
            color: 'var(--primary)',
            letterSpacing: 'var(--tracking-wide)',
          }}
        >
          Alpha Kappa Psi
        </h1>
      </div>
    </header>
  );
};

export default Header;


