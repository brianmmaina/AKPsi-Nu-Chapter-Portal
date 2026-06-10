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
    gap: 0;
    padding: 16px 30px 18px;
    color: #2b2118;
    pointer-events: auto;
    transition: opacity 0.18s ease-out, transform 0.18s ease-out;
  }

  .akpsi-topbar.akpsi-topbar--hidden {
    opacity: 0;
    transform: translateY(-8px);
    pointer-events: none;
  }

  .akpsi-toolbar-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .akpsi-toolbar-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(122,98,68,0.12), rgba(122,98,68,0.04));
    border-radius: 999px;
    margin-bottom: 12px;
  }

  .akpsi-toolbar-bottom {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .akpsi-identity {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .akpsi-nav-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .akpsi-tab-strip {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .akpsi-tab-pill {
    display: flex;
    gap: 4px;
    align-items: center;
    height: 46px;
    background: rgba(122,98,68,0.09);
    border-radius: 12px;
    padding: 5px;
  }

  .akpsi-utilities {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  .akpsi-search-wrap {
    width: 330px;
    flex-shrink: 0;
  }

  .akpsi-toolbar-view-row {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(122,98,68,0.10);
  }

  @media (max-width: 900px) {
    .akpsi-toolbar-bottom {
      flex-direction: column;
      align-items: stretch;
    }
    .akpsi-search-wrap {
      width: 100%;
    }
    .akpsi-tab-strip {
      justify-content: flex-start;
    }
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

const FamilyTreeView = ({
  families,
  selectedFamily: initialSelectedFamily,
  onChangeFamily,
  onToast,
  onOpenPoints,
  activeView,
  onChangeView,
  onBack,
  onBackToHome,
  canGoBack,
}) => {

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
        onOpenPoints={onOpenPoints}
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
          const viewTabOptions = [
            { id: 'TREE', label: 'Family Tree' },
            { id: 'POINTS', label: 'Points' },
            { id: 'INFO', label: 'Information Hub' },
          ];
          const hasViewTabs = typeof onChangeView === 'function';

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
                padding: '12px 20px',
                pointerEvents: 'auto',
                background: 'transparent',
              }}
            >
              <style>{TOP_BAR_CSS}</style>

              <div
                className={`akpsi-topbar ${isProfileOpen ? 'akpsi-topbar--hidden' : ''}`}
                style={{
                  backdropFilter: 'blur(18px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(18px) saturate(180%)',
                  background: 'linear-gradient(145deg, rgba(255,253,248,0.92), rgba(246,235,211,0.84))',
                  borderRadius: '20px',
                  boxShadow: '0 18px 44px rgba(58,43,26,0.12), inset 0 1px 0 rgba(255,255,255,0.72)',
                  border: '1px solid rgba(122,98,68,0.18)',
                  color: '#2b2118',
                }}
              >
                {/* ── Top row: identity + nav ── */}
                <div className="akpsi-toolbar-top">
                  <div className="akpsi-identity">
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: presentation.header?.crestBg || 'rgba(201,168,87,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {crestIcon}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontFamily: themeTitleFont,
                      fontWeight: 700,
                      color: '#2b2118',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}>
                      {selectedFamily.name}
                    </span>
                  </div>

                  <div className="akpsi-nav-buttons">
                    {canGoBack && onBack && (
                      <button
                        onClick={onBack}
                        style={{
                          padding: '0 18px',
                          height: '42px',
                          fontSize: '13px',
                          fontFamily: themeBodyFont,
                          borderRadius: '12px',
                          background: 'rgba(255,253,248,0.95)',
                          border: '1px solid rgba(122,98,68,0.22)',
                          color: '#2b2118',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 200ms ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,230,216,0.95)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,253,248,0.95)'; }}
                      >
                        Back
                      </button>
                    )}
                    {onBackToHome && (
                      <button
                        onClick={onBackToHome}
                        style={{
                          padding: '0 18px',
                          height: '42px',
                          fontSize: '13px',
                          fontFamily: themeBodyFont,
                          borderRadius: '12px',
                          background: 'rgba(211,175,55,0.82)',
                          border: 'none',
                          color: '#2b1a08',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 200ms ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                      >
                        Back to Home
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Divider ── */}
                <div className="akpsi-toolbar-divider" />

                {/* ── Bottom row: search | tabs | utilities ── */}
                <div className="akpsi-toolbar-bottom">
                  {/* Search */}
                  <div className="akpsi-search-wrap">
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

                  {/* Family tabs */}
                  <div className="akpsi-tab-strip">
                    <div className="akpsi-tab-pill">
                      {families.map((family) => {
                        const isActive = selectedFamily.id === family.id;
                        return (
                          <button
                            key={family.id}
                            onClick={() => setSelectedFamily(family)}
                            style={{
                              padding: '0 18px',
                              height: '36px',
                              borderRadius: '9px',
                              background: isActive
                                ? 'linear-gradient(145deg, rgba(225,188,65,0.32), rgba(211,175,55,0.22))'
                                : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 180ms ease',
                              fontWeight: isActive ? 700 : 600,
                              fontSize: '0.78rem',
                              fontFamily: themeBodyFont,
                              color: '#2b2118',
                              letterSpacing: '0.04em',
                              boxShadow: isActive
                                ? 'inset 0 1px 4px rgba(58,43,26,0.12), 0 1px 0 rgba(255,255,255,0.5)'
                                : 'none',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'rgba(122,98,68,0.09)';
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'transparent';
                            }}
                            aria-label={`Switch to ${family.name} family`}
                            aria-current={isActive ? 'true' : 'false'}
                          >
                            {family.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Utilities */}
                  <div className="akpsi-utilities">
                    <select
                      value={highlightState.lineageHighlightMode}
                      onChange={(e) => highlightState.setLineageHighlightMode(e.target.value)}
                      style={{
                        background: 'rgba(255,253,248,0.95)',
                        color: '#2b2118',
                        fontFamily: themeBodyFont,
                        border: '1px solid rgba(122,98,68,0.20)',
                        borderRadius: '12px',
                        padding: '0 14px',
                        height: '42px',
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        appearance: 'none',
                      }}
                    >
                      <option value="off">Highlight: Off</option>
                      <option value="ancestors">Ancestors</option>
                      <option value="descendants">Descendants</option>
                      <option value="both">Lineage</option>
                    </select>
                    <button
                      type="button"
                      onClick={exportHandler}
                      disabled={preparingExport}
                      style={{
                        background: 'rgba(211,175,55,0.82)',
                        color: '#2b1a08',
                        fontFamily: themeBodyFont,
                        border: 'none',
                        padding: '0 18px',
                        height: '42px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: preparingExport ? 'wait' : 'pointer',
                        opacity: preparingExport ? 0.65 : 1,
                        transition: 'all 200ms ease',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {preparingExport ? 'Preparing…' : 'Export / Print'}
                    </button>
                  </div>
                </div>

                {/* ── Optional view tabs ── */}
                {hasViewTabs && (
                  <div className="akpsi-toolbar-view-row">
                    {viewTabOptions.map((tab) => {
                      const isActiveView = activeView === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => onChangeView?.(tab.id)}
                          style={{
                            padding: '6px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '12px',
                            letterSpacing: '0.03em',
                            cursor: 'pointer',
                            background: isActiveView ? 'rgba(211,175,55,0.28)' : 'rgba(122,98,68,0.08)',
                            color: '#2b2118',
                            transition: 'background 200ms ease',
                          }}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                )}
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
