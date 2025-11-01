import { getThemeStyles } from '../themes';

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FamilyTabs = ({ families, selectedFamily, setSelectedFamily }) => {
  const accent = getThemeStyles(selectedFamily.theme)?.accent || '#D3AF37';

  return (
    <div className="glass-panel border-t border-b" style={{ borderTopColor: 'var(--glass-border)', borderBottomColor: 'var(--glass-border)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-3)', paddingBottom: 'var(--space-3)' }}>
        <div className="flex items-center justify-center overflow-x-auto" style={{ gap: 'var(--space-6)' }}>
          {families.map((family) => {
            const isActive = selectedFamily.id === family.id;
            const familyTheme = getThemeStyles(family.theme);
            const familyAccent = familyTheme?.accent || '#D3AF37';
            
            return (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family)}
                className="relative flex flex-col items-center rounded-xl group"
                style={{
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  backgroundColor: isActive ? hexToRgba(familyAccent, 0.15) : 'transparent',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'all var(--motion-med) var(--ease-standard)',
                }}
                aria-label={`Switch to ${family.name} family`}
                aria-current={isActive ? 'true' : 'false'}
              >
                {/* Crest */}
                <div 
                  className={`family-crest ${isActive ? 'active' : ''}`}
                  style={{
                    borderColor: isActive ? hexToRgba(familyAccent, 0.8) : 'var(--glass-border)',
                    color: isActive ? hexToRgba(familyAccent, 0.9) : 'var(--text-subtle)',
                  }}
                >
                  {family.name.charAt(0)}
                </div>
                
                {/* Family Name */}
                <span 
                  className="whitespace-nowrap transition-colors"
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: isActive ? 'var(--weight-bold)' : 'var(--weight-medium)',
                    color: isActive ? familyAccent : 'var(--text-muted)',
                    transitionDuration: 'var(--motion-med)',
                  }}
                >
                  {family.name}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <span
                    className="absolute rounded-full"
                    style={{
                      bottom: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      height: '4px',
                      width: '32px',
                      backgroundColor: familyAccent,
                      boxShadow: `0 0 10px ${hexToRgba(familyAccent, 0.5)}`,
                      transition: 'all var(--motion-med) var(--ease-standard)',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FamilyTabs;

