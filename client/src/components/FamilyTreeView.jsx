import { useState, useEffect } from 'react';
import { getThemeStyles } from '../themes';
import TreeVisualization from './TreeVisualization';
import { hexToRgba } from '../utils/color';
import { FAMILY_PRESENTATION } from '../constants/familyPresentation';

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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        minHeight: '100vh',
        height: '100vh',
        backgroundColor: themeBackground,
        transition: 'background-color 400ms ease',
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <TreeVisualization 
        family={selectedFamily} 
        onToast={onToast} 
        onChangeFamily={onChangeFamily}
        renderCombinedHeader={(headerProps) => {
          const presentation = FAMILY_PRESENTATION[selectedFamily.theme] || FAMILY_PRESENTATION.default;
          const themeAccent = selectedTheme?.accent || '#c9a857';
          
          // Determine glass background based on theme (darker themes need darker glass, lighter themes need lighter glass)
          // Empire is the only light theme (cream), all others are dark
          const isDarkTheme = selectedFamily.theme !== 'empire';
          const glassBackground = isDarkTheme 
            ? presentation.header?.panelBg || 'rgba(16, 34, 54, 0.75)'
            : 'rgba(255, 255, 255, 0.45)';
          const glassBorder = hexToRgba(themeAccent, 0.15);
          const glassShadow = presentation.header?.shadow || '0 4px 12px rgba(0, 0, 0, 0.10)';
          
          return (
            <div
              style={{
                position: 'fixed',
                top: 'env(safe-area-inset-top, 0px)',
                left: 0,
                right: 0,
                zIndex: 21,
                padding: '12px 20px 12px 20px',
                pointerEvents: 'none', // Allow clicks to pass through container
              }}
            >
              {/* Unified Glass Container */}
              <div
                style={{
                  backdropFilter: 'blur(12px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  background: glassBackground,
                  borderRadius: '18px',
                  boxShadow: glassShadow,
                  border: `1px solid ${glassBorder}`,
                  pointerEvents: 'auto', // Re-enable clicks on container
                }}
              >
                {/* Top Panel: Family Name, Navigation Tabs, Back Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    minHeight: '44px',
                  }}
                >
                  {/* Family Name / Crest (Left) */}
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: presentation.header?.crestBg || 'rgba(201, 168, 87, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: presentation.header?.crestColor || '#5a3d16',
                      }}
                    >
                      {presentation.crestLetter || 'A'}
                    </div>
                    <span
                      style={{
                        fontSize: '14px',
                        fontFamily: 'Cinzel, serif',
                        fontWeight: 600,
                        color: isDarkTheme 
                          ? presentation.header?.textColor || 'rgba(248, 235, 206, 0.95)' 
                          : presentation.header?.textColor || 'rgba(59, 43, 22, 0.92)', // Darker for better contrast
                        letterSpacing: '0.03em',
                      }}
                    >
                      {selectedFamily.name}
                    </span>
                  </div>

                  {/* Centered Navigation Tabs */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    flex: '1', 
                    justifyContent: 'center',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}>
                    {families.map((family) => {
                      const isActive = selectedFamily.id === family.id;
                      const familyTheme = getThemeStyles(family.theme);
                      const familyPrimary = familyTheme?.accent || '#c9a857';
                      const familyPresentation = FAMILY_PRESENTATION[family.theme] || FAMILY_PRESENTATION.default;
                      const isFamilyDark = family.theme !== 'empire';
                      
                      // Theme-aware tab colors
                      const activeTabBg = isFamilyDark 
                        ? hexToRgba(familyPrimary, 0.25)
                        : hexToRgba(familyPrimary, 0.30);
                      const inactiveTabBg = isFamilyDark
                        ? hexToRgba(familyPrimary, 0.15)
                        : 'rgba(255, 230, 170, 0.25)';
                      const inactiveTabHoverBg = isFamilyDark
                        ? hexToRgba(familyPrimary, 0.20)
                        : 'rgba(255, 230, 170, 0.35)';
                      const tabTextColor = isActive 
                        ? familyPrimary 
                        : (isFamilyDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(59, 43, 22, 0.95)'); // Dark text for better contrast
                      
                      return (
                        <button
                          key={family.id}
                          onClick={() => setSelectedFamily(family)}
                          style={{
                            position: 'relative',
                            padding: '8px 20px',
                            borderRadius: '18px',
                            background: isActive ? activeTabBg : inactiveTabBg,
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                            fontWeight: 600,
                            fontSize: '13px',
                            color: tabTextColor,
                            letterSpacing: '0.02em',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = inactiveTabHoverBg;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = inactiveTabBg;
                            }
                          }}
                          aria-label={`Switch to ${family.name} family`}
                          aria-current={isActive ? 'true' : 'false'}
                        >
                          {family.name}
                          {isActive && (
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '60%',
                                height: '3px',
                                backgroundColor: familyPrimary,
                                borderRadius: '999px',
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Back Button (Right) */}
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      onClick={onChangeFamily}
                      style={{
                        padding: '8px 18px',
                        fontSize: '13px',
                        borderRadius: '18px',
                        background: isDarkTheme 
                          ? hexToRgba(themeAccent, 0.15)
                          : 'rgba(255, 230, 170, 0.25)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: 'none',
                        color: themeAccent,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 200ms ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDarkTheme 
                          ? hexToRgba(themeAccent, 0.20)
                          : 'rgba(255, 230, 170, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDarkTheme 
                          ? hexToRgba(themeAccent, 0.15)
                          : 'rgba(255, 230, 170, 0.25)';
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>

                {/* Bottom Panel: Search and Controls (Compacted) */}
                {headerProps && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 20px 12px 20px',
                      gap: '10px',
                      borderTop: `1px solid ${hexToRgba(themeAccent, 0.08)}`,
                    }}
                  >
                    {/* Search Input + Button (Left) */}
                    <form
                      onSubmit={headerProps.handleSearchSubmit}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: isDarkTheme 
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.65)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: `1px solid ${hexToRgba(themeAccent, 0.20)}`,
                          borderRadius: '20px',
                          padding: '6px 14px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      >
                        <input
                          type="text"
                          value={headerProps.searchTerm}
                          onChange={(event) => headerProps.setSearchTerm(event.target.value)}
                          placeholder="Search brothers"
                          aria-label="Search brothers"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            width: '160px',
                            color: headerProps.searchPalette.inputColor || (isDarkTheme ? 'rgba(255, 255, 255, 0.95)' : 'rgba(59, 43, 22, 0.95)'), // Darker for better contrast
                            fontSize: '13px',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={headerProps.isSearching || !headerProps.searchTerm.trim()}
                          style={{
                            background: headerProps.searchPalette.buttonBg || '#c9a857',
                            color: headerProps.searchPalette.buttonText || '#2b2314',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '6px 14px',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: headerProps.isSearching ? 'wait' : 'pointer',
                            opacity: headerProps.isSearching ? 0.65 : 1,
                            transition: 'all 200ms ease',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {headerProps.isSearching ? 'Searching…' : 'Search'}
                        </button>
                      </div>
                    </form>

                    {/* Controls (Right) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {/* Highlight Toggle */}
                      <select
                        value={headerProps.safeLineageHighlight.lineageHighlightMode}
                        onChange={(event) => headerProps.safeLineageHighlight.setLineageHighlightMode(event.target.value)}
                        style={{
                          background: isDarkTheme 
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.65)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          color: headerProps.searchPalette.inputColor || (isDarkTheme ? 'rgba(255, 255, 255, 0.9)' : '#3b2b16'),
                          border: `1px solid ${hexToRgba(themeAccent, 0.20)}`,
                          borderRadius: '20px',
                          padding: '6px 14px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          cursor: 'pointer',
                          appearance: 'none',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                      >
                        <option value="off">Highlight: Off</option>
                        <option value="ancestors">Highlight: Ancestors</option>
                        <option value="descendants">Highlight: Descendants</option>
                        <option value="both">Highlight: Lineage</option>
                      </select>

                      {/* Export / Print Button */}
                      <button
                        type="button"
                        onClick={headerProps.handleExportTree}
                        disabled={headerProps.isPreparingExport}
                        style={{
                          background: headerProps.theme.accent || '#c9a857',
                          color: headerProps.familyKey === 'power' || headerProps.familyKey === 'pride' ? '#1f1f1f' : '#2b2314',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '20px',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: headerProps.isPreparingExport ? 'wait' : 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                          opacity: headerProps.isPreparingExport ? 0.65 : 1,
                          transition: 'all 200ms ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {headerProps.isPreparingExport ? 'Preparing…' : 'Export / Print'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default FamilyTreeView;
