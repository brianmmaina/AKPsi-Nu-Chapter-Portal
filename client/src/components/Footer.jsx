const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full flex justify-center py-6 mt-12" style={{ background: 'transparent' }}>
      <div className="max-w-[1200px] w-full px-6 text-center">
        <div className="h-px w-full mb-4" style={{ backgroundColor: 'rgba(211,175,55,0.35)' }} />
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          © {year} Alpha Kappa Psi Nu Chapter
        </p>
      </div>
    </footer>
  );
};

export default Footer;


