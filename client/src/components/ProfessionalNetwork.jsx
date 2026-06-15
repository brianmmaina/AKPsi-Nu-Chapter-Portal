const ProfessionalNetwork = ({ onBack, onBackToHome, canGoBack }) => {
  return (
    <div className="net-hub">
      <div className="net-hub__topbar">
        {canGoBack && (
          <button type="button" className="pd-btn" onClick={onBack}>
            ← Back
          </button>
        )}
        <button type="button" className="net-hub__home-btn" onClick={onBackToHome}>
          ← Archive Home
        </button>
        <span className="net-hub__breadcrumb">/ Professional Network</span>
      </div>
      <iframe
        src="/portal/index.html"
        title="Professional Network"
        className="net-hub__iframe"
        allow="same-origin"
      />
    </div>
  );
};

export default ProfessionalNetwork;
