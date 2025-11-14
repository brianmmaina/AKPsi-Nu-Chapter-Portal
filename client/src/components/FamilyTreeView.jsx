import { useState, useEffect } from 'react';



import { getThemeStyles } from '../themes';

import TreeVisualization from './TreeVisualization';
import SearchBar from './SearchBar';
import MajorResultsPanel from './MajorResultsPanel';

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

        minHeight: '100vh',

        backgroundColor: themeBackground,

        transition: 'background-color 400ms ease',

      }}

    >

      <TreeVisualization 

        family={selectedFamily} 

        onToast={onToast} 

        onChangeFamily={onChangeFamily}

        renderCombinedHeader={(headerProps) => {

          const presentation = FAMILY_PRESENTATION[selectedFamily.theme] || FAMILY_PRESENTATION.default;
          
          // Get active theme styles for dynamic styling
          const activeTheme = getThemeStyles(selectedFamily.theme);
          const themeAccent = activeTheme?.accent || '#c9a857';
          const themeTitleFont = activeTheme?.titleFont || 'Cinzel, serif';
          const themeBodyFont = activeTheme?.bodyFont || 'Inter, system-ui, sans-serif';
          
          // Determine if theme is dark (for contrast adjustments)
          const isDarkTheme = selectedFamily.theme === 'power' || selectedFamily.theme === 'pride' || selectedFamily.theme === 'wolfpack' || selectedFamily.theme === 'greed';
          const isLightTheme = selectedFamily.theme === 'empire';
          
          // Theme-aware text colors
          const activeTabColor = themeAccent;
          
          // Theme-aware background colors for tabs
          const activeTabBg = isDarkTheme 
            ? hexToRgba(themeAccent, 0.25)
            : hexToRgba(themeAccent, 0.30);
          const inactiveTabBg = isDarkTheme
            ? hexToRgba(themeAccent, 0.12)
            : 'rgba(255, 230, 170, 0.25)';
          const inactiveTabHoverBg = isDarkTheme
            ? hexToRgba(themeAccent, 0.18)
            : 'rgba(255, 230, 170, 0.35)';
          
          // Theme-aware underline color
          const underlineColor = themeAccent;

          const {
            searchPalette,
            safeLineageHighlight: headerLineageHighlight,
            handleExportTree: headerExportTree,
            isPreparingExport: headerPreparingExport,
            brothersIndex = [],
            handleSelectBrother,
            handleSelectMajor,
            activeMajor,
            majorResults = [],
            clearActiveMajor,
            isProfileOpen,
          } = headerProps || {};

          const highlightState = headerLineageHighlight || {
            lineageHighlightMode: 'off',
            setLineageHighlightMode: () => {},
          };
          const exportHandler = headerExportTree || (() => {});
          const selectBrotherHandler = handleSelectBrother || (() => {});
          const selectMajorHandler = handleSelectMajor || (() => {});
          const clearMajorHandler = clearActiveMajor || (() => {});
          const preparingExport = Boolean(headerPreparingExport);

          const topBarVisibilityStyles = isProfileOpen
            ? { opacity: 0, transform: 'translateY(-8px)', pointerEvents: 'none' }
            : { opacity: 1, transform: 'translateY(0)', pointerEvents: 'auto' };

          return (

            <div
              style={{
                position: 'fixed',
                top: 'env(safe-area-inset-top, 0px)',
                left: 0,
                right: 0,
                zIndex: 50,
                padding: '12px 20px 12px 20px',
                pointerEvents: 'none',
              }}
            >

              {/* Unified Glass Container */}

              <div
                style={{
                  backdropFilter: 'blur(12px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  background: 'rgba(255, 255, 255, 0.45)',
                  borderRadius: '18px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.10)',
                  border: `1px solid ${hexToRgba('#c9a857', 0.15)}`,
                  pointerEvents: topBarVisibilityStyles.pointerEvents,
                  color: '#000000',
                  transition: 'opacity 0.18s ease-out, transform 0.18s ease-out',
                  opacity: topBarVisibilityStyles.opacity,
                  transform: topBarVisibilityStyles.transform,
                }}
              >

                {/* Top Panel: Family Name, Navigation Tabs, Back Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    gap: '16px',
                  }}
                >
                  {/* Family Name / Crest / Search */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                          color: '#000000',
                        }}
                      >
                        {presentation.crestLetter || 'A'}
                      </div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontFamily: themeTitleFont,
                          fontWeight: 600,
                          color: '#000000',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {selectedFamily.name}
                      </span>
                    </div>
                    <SearchBar
                      brothers={brothersIndex}
                      onSelectBrother={selectBrotherHandler}
                      onSelectMajor={selectMajorHandler}
                      palette={searchPalette}
                    />
                    {activeMajor && (
                      <MajorResultsPanel
                        major={activeMajor}
                        results={majorResults}
                        onSelectBrother={selectBrotherHandler}
                        onClear={clearMajorHandler}
                      />
                    )}
                  </div>

                  {/* Centered Navigation Tabs */}
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {families.map((family) => {
                      const isActive = selectedFamily.id === family.id;
                      const familyTheme = getThemeStyles(family.theme);
                      const familyAccent = familyTheme?.accent || '#c9a857';
                      const familyText = familyTheme?.nodeText || '#3b2b16';
                      const isFamilyDark = ['power', 'pride', 'wolfpack', 'greed'].includes(family.theme);
                      const tabActiveBg = isFamilyDark ? hexToRgba(familyAccent, 0.25) : hexToRgba(familyAccent, 0.30);
                      const tabInactiveBg = isFamilyDark ? hexToRgba(familyAccent, 0.12) : 'rgba(255, 230, 170, 0.25)';
                      const tabInactiveHoverBg = isFamilyDark ? hexToRgba(familyAccent, 0.18) : 'rgba(255, 230, 170, 0.35)';
                      const tabActiveColor = familyAccent;
                      const tabInactiveColor = isFamilyDark ? hexToRgba(familyText, 0.75) : hexToRgba(familyText, 0.65);

                      return (
                        <button
                          key={family.id}
                          onClick={() => setSelectedFamily(family)}
                          style={{
                            position: 'relative',
                            padding: '8px 20px',
                            borderRadius: '18px',
                            background: isActive ? tabActiveBg : tabInactiveBg,
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 200ms ease',
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '13px',
                            fontFamily: themeBodyFont,
                            color: '#000000',
                            letterSpacing: '0.02em',
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = tabInactiveHoverBg;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = tabInactiveBg;
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
                                backgroundColor: familyAccent,
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
                        fontFamily: themeBodyFont,
                        borderRadius: '18px',
                        background: inactiveTabBg,
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: 'none',
                        color: '#000000',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 200ms ease',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = inactiveTabHoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = inactiveTabBg;
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

                      justifyContent: 'flex-end', // Changed from 'space-between' to 'flex-end' since search is removed

                      padding: '10px 20px 12px 20px',

                      gap: '10px',

                      borderTop: `1px solid ${hexToRgba('#c9a857', 0.08)}`,

                    }}

                  >

                    {/* Search Input + Button (Left) - Deactivated */}
                    {/* Search functionality is deactivated for now - will be implemented later */}

                    {/* Controls (Right) */}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

                      {/* Highlight Toggle */}

                      <select
                        value={highlightState.lineageHighlightMode}
                        onChange={(event) => highlightState.setLineageHighlightMode(event.target.value)}

                        style={{

                          background: 'rgba(255, 255, 255, 0.65)',

                          backdropFilter: 'blur(10px)',

                          WebkitBackdropFilter: 'blur(10px)',

                          color: '#000000',
                          fontFamily: themeBodyFont,

                          border: `1px solid ${hexToRgba('#c9a857', 0.20)}`,

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

                        onClick={exportHandler}
                        disabled={preparingExport}

                        style={{

                          background: themeAccent,

                          color: '#000000',
                          fontFamily: themeBodyFont,

                          border: 'none',

                          padding: '6px 16px',

                          borderRadius: '20px',

                          fontWeight: 600,

                          fontSize: '12px',

                          cursor: preparingExport ? 'wait' : 'pointer',

                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',

                          opacity: preparingExport ? 0.65 : 1,

                          transition: 'all 200ms ease',

                          whiteSpace: 'nowrap',

                        }}

                        >
                          {preparingExport ? 'Preparing…' : 'Export / Print'}

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
