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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
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
      className="min-h-screen" 
      style={{ 
        backgroundColor: themeBackground,
        transition: 'background-color 400ms var(--ease-standard)',
      }}
    >
      {/* Minimalist Header - Themed */}
      <div 
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          height: '38px',
          zIndex: 21, // Above the search bar
          backgroundColor: hexToRgba(themeBackground, 0.85),
          backdropFilter: 'blur(12px) saturate(180%)',
          WebkitBackdropFilter: 'blur(12px) saturate(180%)',
          borderBottom: `1px solid ${hexToRgba(themeAccent, 0.2)}`,
          transition: 'background-color 400ms var(--ease-standard), border-bottom-color 400ms var(--ease-standard)',
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
            {/* Left: Compact family name - fixed width to prevent shifting */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px' }}>
              <div 
                className="family-crest active"
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '14px',
                  borderColor: hexToRgba(themeAccent, 0.4),
                  color: themeAccent,
                  transition: 'all 400ms var(--ease-standard)',
                  flexShrink: 0,
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
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedFamily.name}
              </h1>
            </div>

            {/* Center: Compact Family Tabs - Using corrected theme colors with more spacing */}
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
                    className="relative group"
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      // Always reserve space for border to prevent shifting
                      border: '1px solid',
                      borderColor: isActive ? activeBorderColor : 'transparent',
                      backgroundColor: isActive ? activeBgColor : 'transparent',
                      transition: 'background-color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)',
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
                      className="whitespace-nowrap relative z-10"
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: isActive ? 'var(--weight-bold)' : 'var(--weight-medium)',
                        color: isActive ? activeTextColor : inactiveColor,
                        letterSpacing: '0.5px',
                        transition: 'color var(--motion-fast) var(--ease-standard), font-weight var(--motion-fast) var(--ease-standard)',
                        // Prevent font-weight from causing shift by using consistent width
                        display: 'inline-block',
                        minWidth: 'fit-content',
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
                          backgroundColor: activeTextColor,
                          boxShadow: `0 0 4px ${hexToRgba(activeTextColor, 0.5)}`,
                          animation: 'slideIn 200ms var(--ease-standard)',
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Back button - aligned to the right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: '80px' }}>
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
                  whiteSpace: 'nowrap',
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
      {/* Spacer to push content below fixed header */}
      <div style={{ height: '38px' }} />
      <TreeVisualization family={selectedFamily} onToast={onToast} onChangeFamily={onChangeFamily} />
    </div>
  );
};

export default FamilyTreeView;

