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
      <TreeVisualization 
        family={selectedFamily} 
        onToast={onToast} 
        onChangeFamily={onChangeFamily}
        renderCombinedHeader={(headerProps) => (
          <div 
            style={{
              position: 'fixed',
              top: 'env(safe-area-inset-top, 0px)',
              left: 0,
              right: 0,
              height: '38px',
              zIndex: 21,
              backgroundColor: '#f5f5f0',
              backdropFilter: 'blur(12px) saturate(180%)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              borderBottom: `1px solid ${hexToRgba('#c9a857', 0.15)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              gap: '16px',
            }}
          >
            {/* Family tabs on the left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              {families.map((family) => {
                const isActive = selectedFamily.id === family.id;
                const familyTheme = getThemeStyles(family.theme);
                const familyPrimary = familyTheme?.accent || '#c9a857';
                
                const activeBgColor = isActive ? hexToRgba('#c9a857', 0.3) : 'transparent';
                const textColor = isActive ? familyPrimary : '#4a4a4a';
                
                return (
                  <button
                    key={family.id}
                    onClick={() => setSelectedFamily(family)}
                    style={{
                      position: 'relative',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      backgroundColor: activeBgColor,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = hexToRgba('#c9a857', 0.12);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    aria-label={`Switch to ${family.name} family`}
                    aria-current={isActive ? 'true' : 'false'}
                  >
                    <span 
                      style={{
                        fontSize: '12px',
                        fontFamily: 'Russo One, sans-serif',
                        fontWeight: 700,
                        color: textColor,
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                        transition: 'color 200ms ease',
                      }}
                    >
                      {family.name}
                    </span>
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          left: '0',
                          right: '0',
                          height: '1.5px',
                          backgroundColor: familyPrimary,
                          borderRadius: '999px',
                          opacity: 0.6,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search and controls in the middle */}
            {headerProps && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', justifyContent: 'center', maxWidth: '600px' }}>
                {/* Search form */}
                <form
                  onSubmit={headerProps.handleSearchSubmit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: headerProps.searchPalette.background,
                    border: `1px solid ${headerProps.searchPalette.border}`,
                    borderRadius: 999,
                    padding: '6px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
                      width: 180,
                      color: headerProps.searchPalette.inputColor,
                      fontSize: '14px',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={headerProps.isSearching || !headerProps.searchTerm.trim()}
                    style={{
                      background: headerProps.searchPalette.buttonBg,
                      color: headerProps.searchPalette.buttonText,
                      border: 'none',
                      borderRadius: 999,
                      padding: '6px 12px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: headerProps.isSearching ? 'wait' : 'pointer',
                      opacity: headerProps.isSearching ? 0.65 : 1,
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    {headerProps.isSearching ? 'Searching…' : 'Search'}
                  </button>
                </form>

                {/* Controls */}
                <select
                  value={headerProps.safeLineageHighlight.lineageHighlightMode}
                  onChange={(event) => headerProps.safeLineageHighlight.setLineageHighlightMode(event.target.value)}
                  style={{
                    background: headerProps.searchPalette.background,
                    color: headerProps.searchPalette.inputColor,
                    border: `1px solid ${headerProps.searchPalette.border}`,
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    appearance: 'none',
                  }}
                >
                  <option value="off">Highlight: Off</option>
                  <option value="ancestors">Highlight: Ancestors</option>
                  <option value="descendants">Highlight: Descendants</option>
                  <option value="both">Highlight: Lineage</option>
                </select>
                <button
                  type="button"
                  onClick={headerProps.handleExportTree}
                  disabled={headerProps.isPreparingExport}
                  style={{
                    background: headerProps.theme.accent || '#c9a857',
                    color: headerProps.familyKey === 'power' || headerProps.familyKey === 'pride' ? '#1f1f1f' : '#2b2314',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: 999,
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: headerProps.isPreparingExport ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    opacity: headerProps.isPreparingExport ? 0.65 : 1,
                  }}
                >
                  {headerProps.isPreparingExport ? 'Preparing…' : 'Export / Print'}
                </button>
              </div>
            )}

            {/* Back button on the right */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={onChangeFamily}
                style={{
                  padding: '4px 12px',
                  fontSize: '12px',
                  borderRadius: '999px',
                  backgroundColor: hexToRgba('#c9a857', 0.2),
                  border: 'none',
                  color: '#c9a857',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color 200ms ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba('#c9a857', 0.3);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = hexToRgba('#c9a857', 0.2);
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default FamilyTreeView;
