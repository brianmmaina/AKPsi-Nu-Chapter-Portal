import { useState, useEffect } from 'react';
import { getThemeStyles } from '../themes';
import TreeVisualization from './TreeVisualization';

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const FamilyTreeView = ({ families, selectedFamily: initialSelectedFamily, onChangeFamily, onToast }) => {
  const [selectedFamily, setSelectedFamily] = useState(initialSelectedFamily || families[0] || null);

  useEffect(() => {
    if (initialSelectedFamily) {
      setSelectedFamily(initialSelectedFamily);
    }
  }, [initialSelectedFamily]);

  if (!selectedFamily) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div>No families found. Please initialize the database.</div>
      </div>
    );
  }

  const selectedTheme = getThemeStyles(selectedFamily.theme);
  const themeBackground = selectedTheme?.background || '#003366';
  const themeAccent = selectedTheme?.accent || '#D3AF37';

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        backgroundColor: themeBackground,
        transition: 'background-color 400ms var(--ease-standard)',
      }}
    >
      {/* Minimalist Header - Themed */}
      <div 
        className="sticky top-0 z-sticky border-b"
        style={{
          backgroundColor: hexToRgba(themeBackground, 0.95),
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderBottomColor: hexToRgba(themeAccent, 0.2),
          transition: 'background-color 400ms var(--ease-standard), border-bottom-color 400ms var(--ease-standard)',
        }}
      >
        <div className="container">
          <div className="flex items-center justify-between" style={{ paddingTop: 'var(--space-2)', paddingBottom: 'var(--space-2)' }}>
            {/* Left: Compact family name */}
            <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
              <div 
                className="family-crest active"
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '14px',
                  borderColor: hexToRgba(themeAccent, 0.4),
                  color: themeAccent,
                  transition: 'all 400ms var(--ease-standard)',
                }}
              >
                {selectedFamily.name.charAt(0)}
              </div>
              <h1
                className="font-bold"
                style={{
                  fontSize: 'var(--text-base)',
                  fontFamily: 'var(--font-display)',
                  color: themeAccent,
                  letterSpacing: 'var(--tracking-wide)',
                  margin: 0,
                  transition: 'color 400ms var(--ease-standard)',
                }}
              >
                {selectedFamily.name}
              </h1>
            </div>

            {/* Center: Compact Family Tabs - Using corrected theme colors */}
            <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
              {families.map((family) => {
                const isActive = selectedFamily.id === family.id;
                const familyTheme = getThemeStyles(family.theme);
                // Use primary/accent color from corrected theme specs
                const familyPrimary = familyTheme?.accent || '#D3AF37';
                // Special handling for inactive tabs to ensure visibility
                const inactiveColor = family.theme === 'empire' 
                  ? '#666666' // Gray for cream background
                  : family.theme === 'wolfpack'
                  ? 'rgba(255, 255, 255, 0.6)' // Semi-transparent white on blue
                  : 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white for dark backgrounds
                
                return (
                  <button
                    key={family.id}
                    onClick={() => setSelectedFamily(family)}
                    className="relative group"
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive 
                        ? hexToRgba(familyPrimary, 0.2) 
                        : 'transparent',
                      border: isActive 
                        ? `1px solid ${hexToRgba(familyPrimary, 0.3)}` 
                        : '1px solid transparent',
                      transition: 'all var(--motion-fast) var(--ease-standard)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = hexToRgba(familyPrimary, 0.1);
                        e.currentTarget.style.borderColor = hexToRgba(familyPrimary, 0.2);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                    aria-label={`Switch to ${family.name} family`}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    <span 
                      className="whitespace-nowrap relative z-10"
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: isActive ? 'var(--weight-bold)' : 'var(--weight-medium)',
                        color: isActive ? familyPrimary : inactiveColor,
                        letterSpacing: '0.5px',
                        transition: 'color var(--motion-fast) var(--ease-standard)',
                      }}
                    >
                      {family.name}
                    </span>
                    {isActive && (
                      <span
                        className="absolute rounded-full"
                        style={{
                          bottom: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          height: '2px',
                          width: '60%',
                          backgroundColor: familyPrimary,
                          boxShadow: `0 0 4px ${hexToRgba(familyPrimary, 0.5)}`,
                          animation: 'slideIn 200ms var(--ease-standard)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Back button */}
            <button
              onClick={onChangeFamily}
              className="btn"
              style={{
                padding: 'var(--space-1) var(--space-3)',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: hexToRgba(themeAccent, 0.15),
                borderColor: hexToRgba(themeAccent, 0.3),
                color: themeAccent,
                transition: 'all 400ms var(--ease-standard)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hexToRgba(themeAccent, 0.25);
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = hexToRgba(themeAccent, 0.15);
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
      <TreeVisualization family={selectedFamily} onToast={onToast} onChangeFamily={onChangeFamily} />
    </div>
  );
};

export default FamilyTreeView;

