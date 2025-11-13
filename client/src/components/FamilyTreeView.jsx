import { useState, useEffect } from 'react';
import { getThemeStyles } from '../themes';
import TreeVisualization from './TreeVisualization';
import { hexToRgba } from '../utils/color';

/**
 * FamilyTreeView Component
 * 
 * Main view for displaying and navigating family trees.
 * Provides a themed header with family tabs and tree visualization.
 * 
 * @param {Object} props - Component props
 * @param {Array<Object>} props.families - List of all available families
 * @param {Object} props.selectedFamily - Currently selected family (can be null initially)
 * @param {Function} props.onChangeFamily - Callback to return to family selection
 * @param {Function} props.onToast - Callback to show toast notifications
 * @returns {JSX.Element} Family tree view with themed header and visualization
 */
const FamilyTreeView = ({ families, selectedFamily: initialSelectedFamily, onChangeFamily, onToast }) => {
  const [selectedFamily, setSelectedFamily] = useState(initialSelectedFamily || families[0] || null);

  /**
   * Syncs selectedFamily state when initialSelectedFamily prop changes
   * 
   * @effect
   * @dependencies {Object} initialSelectedFamily - Initial family selection prop
   */
  useEffect(() => {
    if (initialSelectedFamily) {
      setSelectedFamily(initialSelectedFamily);
    }
  }, [initialSelectedFamily]);

  if (!selectedFamily) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        <div>No families found. Please initialize the database.</div>
      </div>
    );
  }

  // Memoize theme calculations for performance
  const selectedTheme = getThemeStyles(selectedFamily.theme);
  const themeBackground = selectedTheme?.background || '#003366';
  const themeAccent = selectedTheme?.accent || '#D3AF37';

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        backgroundColor: themeBackground,
        transition: 'background-color 400ms ease',
      }}
    >
      <div 
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          height: '38px',
          zIndex: 21,
          backgroundColor: hexToRgba(themeBackground, 0.85),
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderBottom: `1px solid ${hexToRgba(themeAccent, 0.2)}`,
          transition: 'background-color 400ms ease, border-bottom-color 400ms ease',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
              <div 
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `1px solid ${hexToRgba(themeAccent, 0.4)}`,
                  backgroundColor: hexToRgba(themeAccent, 0.15),
                  color: themeAccent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 400ms ease',
                }}
              >
                {selectedFamily.name.charAt(0)}
              </div>
              <h1
                style={{
                  fontSize: '16px',
                  fontFamily: 'Russo One, sans-serif',
                  fontWeight: 700,
                  color: themeAccent,
                  letterSpacing: '0.5px',
                  margin: 0,
                  transition: 'color 400ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFamily.name}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              {families.map((family) => {
                const isActive = selectedFamily.id === family.id;
                const familyTheme = getThemeStyles(family.theme);
                // Use primary/accent color from corrected theme specs
                const familyPrimary = familyTheme?.accent || '#D3AF37';
                
                // Determine inactive tab color based on CURRENTLY SELECTED family's background
                // This ensures proper contrast when light backgrounds (like EMPIRE) are selected
                let inactiveColor;
                if (!isActive) {
                  if (selectedFamily.theme === 'empire') {
                    // When EMPIRE (light cream) is selected, use dark color for all inactive tabs
                    inactiveColor = '#4a4a4a'; // Dark gray for good contrast on light background
                  } else if (family.theme === 'empire') {
                    // When EMPIRE tab is inactive on dark background, use lighter variant
                    inactiveColor = '#999999'; // Medium gray
                  } else if (family.theme === 'wolfpack') {
                    // WOLFPACK tab should always be white when inactive
                    inactiveColor = '#ffffff'; // Full white for WOLFPACK
                  } else {
                    // Default: semi-transparent white for dark backgrounds
                    inactiveColor = 'rgba(255, 255, 255, 0.5)';
                  }
                }
                
                // For active tabs: WOLFPACK always uses white text, others use accent
                const activeTextColor = family.theme === 'wolfpack' ? '#ffffff' : familyPrimary;
                const activeBgColor = family.theme === 'wolfpack' 
                  ? hexToRgba('#3d5373', 0.3) // Dark blue-gray background for white text
                  : hexToRgba(familyPrimary, 0.2);
                const activeBorderColor = family.theme === 'wolfpack'
                  ? hexToRgba('#3d5373', 0.4)
                  : hexToRgba(familyPrimary, 0.3);
                
                return (
                  <button
                    key={family.id}
                    onClick={() => setSelectedFamily(family)}
                    style={{
                      position: 'relative',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      // Always reserve space for border to prevent shifting
                      border: '1px solid',
                      borderColor: isActive ? activeBorderColor : 'transparent',
                      backgroundColor: isActive ? activeBgColor : 'transparent',
                      transition: 'background-color 200ms ease, border-color 200ms ease',
                      cursor: 'pointer',
                      // Reserve space for underline to prevent shifting
                      paddingBottom: isActive ? '10px' : '4px',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        // Ensure hover state is visible - use family's accent with appropriate opacity
                        const hoverBg = selectedFamily.theme === 'empire' 
                          ? hexToRgba(familyPrimary, 0.15) // More visible on light background
                          : hexToRgba(familyPrimary, 0.1);
                        const hoverBorder = hexToRgba(familyPrimary, 0.3);
                        e.currentTarget.style.backgroundColor = hoverBg;
                        e.currentTarget.style.borderColor = hoverBorder;
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
                      style={{
                        whiteSpace: 'nowrap',
                        position: 'relative',
                        zIndex: 10,
                        fontSize: '12px',
                        fontFamily: 'Russo One, sans-serif',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? activeTextColor : inactiveColor,
                        letterSpacing: '0.5px',
                        transition: 'color 200ms ease, font-weight 200ms ease',
                        display: 'inline-block',
                        minWidth: 'fit-content',
                      }}
                    >
                      {family.name}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-6px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          height: '2px',
                          width: '60%',
                          backgroundColor: activeTextColor,
                          borderRadius: '999px',
                          boxShadow: `0 0 4px ${hexToRgba(activeTextColor, 0.5)}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: '80px' }}>
              <button
                onClick={onChangeFamily}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  backgroundColor: hexToRgba(themeAccent, 0.15),
                  border: `1px solid ${hexToRgba(themeAccent, 0.3)}`,
                  color: themeAccent,
                  transition: 'all 400ms ease',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontWeight: 500,
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
      </div>
      <div style={{ height: '38px' }}></div>
      <TreeVisualization 
        family={selectedFamily} 
        onToast={onToast} 
        onChangeFamily={onChangeFamily} 
      />
    </div>
  );
};

export default FamilyTreeView;
