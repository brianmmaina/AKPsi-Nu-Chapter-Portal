const HomeHub = ({ onNavigate }) => {
  const cards = [
    {
      id: 'POINTS',
      title: 'Points Leaderboard',
      description: 'Family Cup rankings, streaks, and individual brother achievements.',
      pattern: 'chart',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 6-6" />
        </svg>
      ),
    },
    {
      id: 'FAMILY_TREES',
      title: 'Family Trees',
      description: 'Lineage, family histories, and member connections across generations.',
      pattern: 'tree',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="22" x2="12" y2="13" />
          <path d="M12 13 C12 13 7 11 5 7 C8 7 10 8 12 10 C14 8 16 7 19 7 C17 11 12 13 12 13Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M12 16 C12 16 6 14 4 9 C7.5 9 10 11 12 13 C14 11 16.5 9 20 9 C18 14 12 16 12 16Z" fill="currentColor" fillOpacity="0.1" />
          <path d="M12 10 C10 8 7.5 5 8 2 C10 3.5 11 6 12 7 C13 6 14 3.5 16 2 C16.5 5 14 8 12 10Z" fill="currentColor" fillOpacity="0.18" />
          <path d="M12 22 C10 21 8 21.5 7 22" />
          <path d="M12 22 C14 21 16 21.5 17 22" />
        </svg>
      ),
    },
    {
      id: 'INFO',
      title: 'Information Hub',
      description: 'Calendars, newsletters, and deadlines in one centralized archive.',
      pattern: 'archive',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16v16H4z" />
          <path d="M4 8h16" />
          <path d="M8 12h8" />
          <path d="M8 16h8" />
        </svg>
      ),
    },
    {
      id: 'NETWORK',
      title: 'Professional Network',
      description: 'Alumni directory, mentorship program, and active brothers network for career connections.',
      pattern: 'network',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="home-hub">
      {/* Background Image Layer */}
      <div className="home-hub__bg-image" aria-hidden />
      {/* Pattern Overlay on Background */}
      <div className="home-hub__bg-pattern" aria-hidden />
      {/* AKPsi Watermark */}
      <div className="akpsi-watermark" aria-hidden>
        <div className="akpsi-watermark-inner">ΑΚΨ</div>
      </div>
      {/* Pattern Overlay */}
      <div className="akpsi-pattern-overlay" aria-hidden />
      
      <header className="home-hub__header">
        <div>
          <p className="eyebrow">AKPsi Nu Chapter</p>
          <h1>Information Archive</h1>
          <p className="subtitle">Your central hub for points, family trees, and chapter resources.</p>
        </div>
      </header>
      
      {/* Decorative Divider */}
      <div className="home-hub__divider" aria-hidden />
      
      <div className="home-hub__grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`home-hub__card home-hub__card--${card.pattern}`}
            onClick={() => onNavigate(card.id)}
          >
            <div className="home-hub__card-icon">{card.icon}</div>
            <div className="home-hub__card-content">
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
          </button>
        ))}
      </div>

      <p className="home-hub__footer-micro" aria-hidden>Built for AKPsi Nu Chapter</p>
    </div>
  );
};

export default HomeHub;

