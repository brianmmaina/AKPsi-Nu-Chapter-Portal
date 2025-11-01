const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full flex justify-center" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)', marginTop: 'var(--space-9)', background: 'transparent' }}>
      <div className="container text-center">
        <div className="h-px w-full" style={{ backgroundColor: 'var(--glass-border)', marginBottom: 'var(--space-4)' }} />
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          © {year} Alpha Kappa Psi Nu Chapter
        </p>
      </div>
    </footer>
  );
};

export default Footer;


