import { useState, useEffect } from 'react';

import { getThemeStyles } from '../themes';

import TreeVisualization from './TreeVisualization';
import SearchBar from './SearchBar';
import MajorResultsPanel from './MajorResultsPanel';

const PAGE_LAYOUT_CSS = `
  .family-tree-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-height: 100vh;
  }

  .family-tree-content {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .family-tree-content > * {
    flex: 1;
    min-height: 0;
  }
`;

const TOP_BAR_CSS = `
  .akpsi-topbar {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 20px 16px;
    color: #000000;
    pointer-events: auto;
    transition: opacity 0.18s ease-out, transform 0.18s ease-out;
  }

  .akpsi-topbar.akpsi-topbar--hidden {
    opacity: 0;
    transform: translateY(-8px);
    pointer-events: none;
  }

  .akpsi-topbar-row {
    display: flex;
    width: 100%;
    align-items: center;
  }

  .akpsi-topbar-row--primary {
    gap: 16px;
  }

  .akpsi-topbar-left,
  .akpsi-topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .akpsi-topbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .akpsi-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .akpsi-topbar-row--secondary {
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }

  .akpsi-topbar-row-left {
    flex: 1;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .akpsi-search-bar {
    width: 100%;
  }

  .akpsi-topbar-row-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .akpsi-topbar * {
    color: #000000 !important;
  }
`;

import { hexToRgba } from '../utils/color';

import { FAMILY_PRESENTATION } from '../constants/familyPresentation';

const CREST_ICON_SIZE = 22;

const CrestIcon = ({ themeKey, color, fallback }) => {
  const accent = color || '#c9a857';
  const normalized = (themeKey || '').toLowerCase();
  const commonSvgProps = {
    width: CREST_ICON_SIZE,
    height: CREST_ICON_SIZE,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: accent,
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (normalized === 'empire') {
    return (
      <svg {...commonSvgProps}>
        <path d="M4 16h16l-1.4-7.2-3.1 3.4-2.5-5.5-2.5 5.5-3.1-3.4z" />
        <path d="M5 19h14" />
      </svg>
    );
  }

  if (normalized === 'greed') {
    return (
      <svg {...commonSvgProps}>
        <path d="M3.5 16h17l-1.1-5.6-3 2.4-2.9-5.4-2.9 5.4-3-2.4z" />
        <path d="M12 4.2v2.6" />
        <path d="M10.4 5.4h3.2" />
        <circle cx="12" cy="3.3" r="0.8" fill={accent} stroke="none" />
      </svg>
    );
  }

  if (normalized === 'power') {
    return (
      <svg {...commonSvgProps}>
        <path
          d="M11 3 6 14h4l-1.5 7 6.5-11h-4l1.5-7z"
          fill={accent}
          stroke="none"
        />
      </svg>
    );
  }

  if (normalized === 'pride') {
    return (
      <svg {...commonSvgProps}>
        <path d="M6 9h12" />
        <path d="M7 18h10" />
        <rect x="8" y="9.5" width="8" height="6.5" rx="0.8" />
        <line x1="10" y1="9.5" x2="10" y2="16" />
        <line x1="14" y1="9.5" x2="14" y2="16" />
      </svg>
    );
  }

  if (normalized === 'wolfpack') {
    return (
      <svg {...commonSvgProps}>
        <path
          d="M5.5 17l2-6 3 2 1.5-4 2.5 2v4.5L12 20l-2-2-2 .5z"
          fill={accent}
          stroke="none"
        />
        <circle cx="17.5" cy="6.5" r="2.3" />
      </svg>
    );
  }

  return (
    <span
      style={{
        fontWeight: 700,
        fontSize: '16px',
        color: '#000000',
      }}
    >
      {fallback}
    </span>
  );
};

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

  return (
    <>
      <style>{PAGE_LAYOUT_CSS}</style>
      <div
        className="family-tree-page"
        style={{
          minHeight: '100vh',
          height: '100vh',
          backgroundColor: themeBackground,
          transition: 'background-color 400ms ease',
        }}
      >
        <div className="family-tree-content">
          <TreeVisualization 
        family={selectedFamily} 
        onToast={onToast} 
        onChangeFamily={onChangeFamily}
        renderCombinedHeader={(headerProps) => {

          const presentation =
            FAMILY_PRESENTATION[selectedFamily.theme] || FAMILY_PRESENTATION.default;
          
          // Get active theme styles for dynamic styling
          const activeTheme = getThemeStyles(selectedFamily.theme);
          const themeAccent = activeTheme?.accent || '#c9a857';
          const themeTitleFont = activeTheme?.titleFont || 'Cinzel, serif';
          const themeBodyFont = activeTheme?.bodyFont || 'Inter, system-ui, sans-serif';
          
          // Determine if theme is dark (for contrast adjustments)
          const isDarkTheme = selectedFamily.theme === 'power' || selectedFamily.theme === 'pride' || selectedFamily.theme === 'wolfpack' || selectedFamily.theme === 'greed';
          // Theme-aware background colors for tabs
          const inactiveTabBg = isDarkTheme
            ? hexToRgba(themeAccent, 0.12)
            : 'rgba(255, 230, 170, 0.25)';
          const inactiveTabHoverBg = isDarkTheme
            ? hexToRgba(themeAccent, 0.18)
            : 'rgba(255, 230, 170, 0.35)';

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

          const crestFallback =
            presentation.crestLetter || selectedFamily.name?.charAt(0) || 'A';
          const crestIcon = (
            <CrestIcon
              themeKey={selectedFamily.theme}
              color={themeAccent}
              fallback={crestFallback}
            />
          );

          return (
      <div 
        style={{
          position: 'sticky',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '12px 20px 12px 20px',
          pointerEvents: 'auto',
          background: 'transparent',
        }}
      >

              {/* Unified Glass Container */}

              <div
                className={`akpsi-topbar ${isProfileOpen ? 'akpsi-topbar--hidden' : ''}`}
                style={{
                  backdropFilter: 'blur(12px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                  background: 'rgba(255, 255, 255, 0.45)',
                  borderRadius: '18px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.10)',
                  border: `1px solid ${hexToRgba('#c9a857', 0.15)}`,
                  color: '#000000',
                }}
              >
                <style>{TOP_BAR_CSS}</style>

                <div className="akpsi-topbar-row akpsi-topbar-row--primary">
                  <div className="akpsi-topbar-left">
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
                      {crestIcon}
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
                  <div className="akpsi-topbar-center">
                    <div className="akpsi-tabs">
                      {families.map((family) => {
                        const isActive = selectedFamily.id === family.id;
                        const familyTheme = getThemeStyles(family.theme);
                        const familyAccent = familyTheme?.accent || '#c9a857';
                        const isFamilyDark = ['power', 'pride', 'wolfpack', 'greed'].includes(family.theme);
                        const tabActiveBg = isFamilyDark ? hexToRgba(familyAccent, 0.25) : hexToRgba(familyAccent, 0.30);
                        const tabInactiveBg = isFamilyDark ? hexToRgba(familyAccent, 0.12) : 'rgba(255, 230, 170, 0.25)';
                        const tabInactiveHoverBg = isFamilyDark ? hexToRgba(familyAccent, 0.18) : 'rgba(255, 230, 170, 0.35)';
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
                                  backgroundColor: familyAccent,
                                  borderRadius: '999px',
                                }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="akpsi-topbar-right">
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

                <div className="akpsi-topbar-row akpsi-topbar-row--secondary">
                  <div className="akpsi-topbar-row-left">
                    <div className="akpsi-search-bar">
                      <SearchBar
                        brothers={brothersIndex}
                        onSelectBrother={selectBrotherHandler}
                        onSelectMajor={selectMajorHandler}
                        palette={searchPalette}
                      />
                    </div>
                    {activeMajor && (
                      <MajorResultsPanel
                        major={activeMajor}
                        results={majorResults}
                        onSelectBrother={selectBrotherHandler}
                        onClear={clearMajorHandler}
                      />
                    )}
                  </div>
                  <div className="akpsi-topbar-row-right">
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
              </div>
            </div>
          );
        }}
      />
        </div>
      </div>
    </>
  );
};

export default FamilyTreeView;
