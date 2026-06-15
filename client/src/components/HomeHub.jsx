const HomeHub = ({ onNavigate }) => {
  const cards = [
    {
      id: 'POINTS',
      label: 'Rankings',
      title: 'Points Leaderboard',
      description: 'Family Cup standings, streak bonuses, and individual brother achievements across the term.',
      cta: 'View rankings',
      pattern: 'chart',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 6-6" />
        </svg>
      ),
    },
    {
      id: 'FAMILY_TREES',
      label: 'Lineage',
      title: 'Family Trees',
      description: 'The complete Nu Chapter lineage — nine pledge classes, eighty brothers, and every connection across generations.',
      cta: 'Explore lineages',
      pattern: 'tree',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-9" />
          <path d="M12 13C10 11 7 9 5 7c3 0 5 1 7 3 2-2 4-3 7-3-2 4-7 6-7 6z" />
          <path d="M12 17C9 15 6 13 4 10c3.5 0 6 2 8 4 2-2 4.5-4 8-4-2 4-8 7-8 7z" />
        </svg>
      ),
    },
    {
      id: 'INFO',
      label: 'Resources',
      title: 'Information Hub',
      description: 'Chapter calendars, officer contacts, newsletters, and deadlines gathered in one centralized archive.',
      cta: 'Open archive',
      pattern: 'archive',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <path d="M3 8h18" />
          <path d="M7 12h10M7 16h7" />
        </svg>
      ),
    },
    {
      id: 'NETWORK',
      label: 'Alumni',
      title: 'Professional Network',
      description: 'Alumni directory, mentorship pairings, and the active brothers network for career connections.',
      cta: 'Browse network',
      pattern: 'network',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <div className="home-hub">
      <div className="home-hub__bg-image" aria-hidden />
      <div className="home-hub__bg-pattern" aria-hidden />
      <div className="akpsi-watermark" aria-hidden><div className="akpsi-watermark-inner">ΑΚΨ</div></div>
      <div className="akpsi-pattern-overlay" aria-hidden />

      <header className="home-hub__header">
        <div>
          <p className="eyebrow">AKPsi Nu Chapter</p>
          <h1>Information Archive</h1>
          <p className="subtitle">Your central hub for points, family trees, and chapter resources.</p>
        </div>
      </header>

      <div className="home-hub__divider" aria-hidden />

      <div className="home-hub__grid">
        {cards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`home-hub__card home-hub__card--${card.pattern}`}
            onClick={() => onNavigate(card.id)}
          >
            {/* Header row: label left, icon right */}
            <div className="home-hub__card-header">
              <span className="home-hub__card-label">{card.label}</span>
              <div className="home-hub__card-icon">{card.icon}</div>
            </div>

            {/* Body: text only */}
            <div className="home-hub__card-body">
              <div className="home-hub__card-content">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
              </div>
            </div>

            {/* Footer: CTA */}
            <div className="home-hub__card-footer">
              <span className="home-hub__card-cta">
                {card.cta} <span className="home-hub__card-cta-arrow">→</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="home-hub__footer-micro" aria-hidden>Built for AKPsi Nu Chapter</p>
    </div>
  );
};

export default HomeHub;
