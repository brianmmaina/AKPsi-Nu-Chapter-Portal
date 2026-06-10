import { getThemeStyles } from '../themes';

const NAV_TABS = [
  { id: 'TREE', label: 'Family Tree' },
  { id: 'POINTS', label: 'Points' },
  { id: 'INFO', label: 'Information Hub' },
];

const DARK_THEMES = ['power', 'pride', 'wolfpack', 'greed'];

const AppTopBar = ({ activeView, onChangeView, selectedFamily, onChangeFamily }) => {
  const theme = getThemeStyles(selectedFamily?.theme);
  const accent = theme?.accent || '#D3AF37';
  const labelFont = theme?.titleFont || 'var(--font-display)';
  const isDark = DARK_THEMES.includes(selectedFamily?.theme);
  const background = isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.55)';
  const textColor = isDark ? 'var(--text-on-dark)' : '#1f2937';

  return (
    <div
      className="app-top-bar"
      style={{
        background,
        color: textColor,
        borderColor: isDark ? `${accent}33` : 'rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="app-top-bar__family">
        <div>
          <p className="eyebrow" style={{ color: textColor }}>
            Viewing
          </p>
          <h3 style={{ fontFamily: labelFont }}>{selectedFamily?.name || 'Nu Chapter'}</h3>
        </div>
        <button
          type="button"
          className="app-top-bar__switch"
          onClick={onChangeFamily}
          aria-label="Choose another family"
        >
          Switch family
        </button>
      </div>
      <nav className="app-top-bar__tabs" role="tablist" aria-label="Primary navigation">
        {NAV_TABS.map((tab) => {
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`app-top-bar__tab ${isActive ? 'is-active' : ''}`}
              style={{
                '--tab-accent': accent,
                color: isActive ? textColor : `${textColor}cc`,
              }}
              onClick={() => onChangeView(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default AppTopBar;

