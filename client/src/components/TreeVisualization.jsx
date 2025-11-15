import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import ReactFlow, {
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BrotherDetailModal from './BrotherDetailModal';
import PledgeClassMarkers from './PledgeClassMarkers';
import { getThemeStyles } from '../themes';
import { hexToRgba } from '../utils/color';
import { FAMILY_PRESENTATION } from '../constants/familyPresentation';
import { statusLabelForBrother, getNodePalette } from '../utils/nodeRenderer';
import { useTreeData } from '../hooks/useTreeData';
import { useLineageHighlight } from '../hooks/useLineageHighlight';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { useTreeViewport } from '../hooks/useTreeViewport';
import {
  FAMILY_LAYOUT_RULES,
  LEFT_TREE_GUTTER,
  RIGHT_TREE_GUTTER,
} from '../utils/constants';
import { toPng } from 'html-to-image';

/**
 * TreeVisualizationInner Component
 * 
 * Renders an interactive family tree visualization using React Flow.
 * Handles tree layout, node interactions, and data loading.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.family - Family object with id, name, and theme
 * @param {Function} props.onToast - Callback function to show toast notifications
 * @param {Function} props.onChangeFamily - Callback to change the selected family
 * @returns {JSX.Element} React Flow tree visualization
 */

const CurvedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style = {},
}) => {
  const midY = (sourceY + targetY) / 2;
  const path = `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`;

  return (
    <path
      id={id}
      className="tree-edge"
      d={path}
      style={style}
      markerEnd={markerEnd}
    />
  );
};

const TREE_LAYER_CSS = `
.tree-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
}
.tree-root__body {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.tree-pledge-markers {
  pointer-events: none;
  z-index: 20;
}
.tree-pledge-markers .marker-interactive {
  pointer-events: auto;
}
.tree-node-card {
  will-change: transform, box-shadow, filter;
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  border-radius: inherit !important;
}
.tree-node-card:hover,
.tree-node-card:focus-within {
  transform: translateY(-4px) scale(1.015);
  box-shadow: var(--node-hover-shadow, 0 18px 36px rgba(0,0,0,0.22)) !important;
  filter: brightness(var(--node-hover-brightness, 1.02));
}
.tree-controls-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 18px;
  padding: 10px;
  z-index: 30;
}
.tree-controls-panel .react-flow__controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent !important;
}
.tree-controls-panel .react-flow__controls-button {
  position: relative;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin: 0;
}
.tree-controls-panel .react-flow__controls-button svg {
  width: 18px;
  height: 18px;
}
.tree-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tree-controls button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.tree-controls button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.tree-edge {
  fill: none;
  stroke-width: 3px;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
  stroke-linejoin: round;
}
@media print {
  .tree-pledge-markers {
    opacity: 0.35;
  }
}
body.tree-exporting .tree-controls-panel,
body.tree-exporting .tree-summary-card,
body.tree-exporting .tree-toast {
  opacity: 0 !important;
  pointer-events: none !important;
}
`;

const BOTTOM_BUFFER = 4;
const CARD_WIDTH = 280;
const CARD_MIN_HEIGHT = 110;
const CARD_CONTENT_MAX_WIDTH = CARD_WIDTH - 32;
const CARD_TOKENS = {
  badgeFont: 10,
  metaLabel: 9,
  metaValue: 12,
  nameSize: 16,
  gap: 8,
};
const BASE_VERTICAL_SPACING = CARD_MIN_HEIGHT + 40;
const BASE_PLEDGE_SPACING = CARD_MIN_HEIGHT + 25;

const TreeVisualizationInner = ({ family, onToast, onChangeFamily, renderCombinedHeader }) => {
  // All hooks MUST be called in the same order every render (Rules of Hooks)
  // Cannot have conditional returns before hooks
  
  // CRITICAL: Normalize ALL props immediately to prevent uninitialized variable errors
  // This must be done BEFORE any hooks to ensure they're always available
  const safeFamily = family && typeof family === 'object' ? family : null;
  const safeOnToast = onToast && typeof onToast === 'function' ? onToast : null;
  const safeOnChangeFamily = onChangeFamily && typeof onChangeFamily === 'function' ? onChangeFamily : null;
  const familyThemeRaw = safeFamily && safeFamily.theme ? String(safeFamily.theme).toLowerCase().trim() : null;
  const validThemeKeys = ['empire', 'power', 'greed', 'pride', 'wolfpack'];
  const safeFamilyTheme = familyThemeRaw && validThemeKeys.includes(familyThemeRaw) ? familyThemeRaw : 'wolfpack';
  
  const [selectedBrother, setSelectedBrother] = useState(null);
  const [selectedBrotherId, setSelectedBrotherId] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('view');
  const [viewportBeforeModal, setViewportBeforeModal] = useState(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [toast, setToast] = useState(null);
  const [highlightBrotherId, setHighlightBrotherId] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const edgeTypes = useMemo(() => ({ curved: CurvedEdge }), []);
  const initialViewportRef = useRef(null);
  const flowWrapperRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const reactFlowInstance = useReactFlow();
  const setCenter = reactFlowInstance?.setCenter;
  const getViewport = reactFlowInstance?.getViewport;

  // Use custom hooks for data loading, search, and lineage highlighting
  // Pass safeFamily (can be null) - hooks must handle this gracefully
  // Ensure brothers and relationships are always arrays
  const { brothers: rawBrothers, relationships: rawRelationships, loading, error, isTreeReady, reloadTreeData } = useTreeData(safeFamily, safeOnToast);
  const brothers = Array.isArray(rawBrothers) ? rawBrothers : [];
  const relationships = Array.isArray(rawRelationships) ? rawRelationships : [];
  
  const showToast = useCallback((message, type = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, type, id: Date.now() });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  const lineageHighlight = useLineageHighlight(relationships, selectedBrother);
  
  // Extract lineageHighlightSet into a stable value for dependency array
  // This prevents "Cannot access uninitialized variable" errors in production
  // Access the property directly after ensuring lineageHighlight is initialized
  // Ensure lineageHighlight is always an object with required properties
  const safeLineageHighlight = lineageHighlight && typeof lineageHighlight === 'object' ? lineageHighlight : {
    lineageHighlightMode: 'off',
    setLineageHighlightMode: () => {},
    lineageSourceId: null,
    setLineageSourceId: () => {},
    lineageHighlightSet: new Set(),
    setSourceFromBrotherId: () => {},
    parentMap: new Map(),
    childMap: new Map(),
  };
  const lineageHighlightSet = (safeLineageHighlight && safeLineageHighlight.lineageHighlightSet) 
    ? safeLineageHighlight.lineageHighlightSet 
    : new Set();

  // Memoize theme IMMEDIATELY after hooks (before any other dependent code)
  // Must handle undefined family gracefully - always return a valid theme object
  const theme = useMemo(() => {
    try {
      const themeResult = getThemeStyles(safeFamilyTheme);
      
      // Validate theme has required properties - ensure all required fields exist
      if (!themeResult || typeof themeResult !== 'object') {
        console.warn('Theme result is not an object, using wolfpack fallback');
        return getThemeStyles('wolfpack');
      }
      
      // Ensure all required properties exist with fallback values
      const safeTheme = {
        background: themeResult.background || '#364c73',
        bgGradient: themeResult.bgGradient || themeResult.backgroundTexture || undefined,
        backgroundGrid: themeResult.gridColor || themeResult.backgroundGrid || '#2a3a5c',
        gridOpacity: typeof themeResult.gridOpacity === 'number' ? themeResult.gridOpacity : 0.12,
        nodeStudying: themeResult.nodeStudying || '#f7faff',
        nodeGraduated: themeResult.nodeGraduated || '#f7faff',
        nodeBorder: themeResult.nodeBorder || '#d6e4ff',
        nodeText: themeResult.nodeText || '#1e2c45',
        nodeSecondaryText: themeResult.nodeSecondaryText || 'rgba(30,33,45,0.75)',
        nodeCardBg: themeResult.nodeCardBg,
        nodeCardBorder: themeResult.nodeCardBorder,
        nodeCardShadow: themeResult.nodeCardShadow,
        nodeCardHoverShadow: themeResult.nodeCardHoverShadow,
        nodeCardAccent: themeResult.nodeCardAccent,
        edgeColor: themeResult.edgeColor || '#f0f6ff',
        edgeBaseColor: themeResult.edgeBaseColor,
        edgeGlowColor: themeResult.edgeGlowColor,
        minimapNode: themeResult.minimapNode || '#ffffff',
        minimapBg: themeResult.minimapBg || '#2a3a5c',
        modalBg: themeResult.modalBg || 'rgba(54, 76, 115, 0.95)',
        accent: themeResult.accent || '#ffffff',
        titleFont: themeResult.titleFont || 'Russo One, sans-serif',
        bodyFont: themeResult.bodyFont || 'Montserrat, system-ui, sans-serif',
        nodeRadius: themeResult.nodeRadius !== undefined ? themeResult.nodeRadius : 0,
        edgeType: themeResult.edgeType || 'smoothstep',
        edgeAnimated: themeResult.edgeAnimated !== undefined ? themeResult.edgeAnimated : false,
        backgroundVariant: themeResult.backgroundVariant || 'dots',
        pledgeMarkerAccent: themeResult.pledgeMarkerAccent,
        pledgeMarkerAccentEnd: themeResult.pledgeMarkerAccentEnd,
        pledgeMarkerText: themeResult.pledgeMarkerText,
        pledgeMarkerLabelBg: themeResult.pledgeMarkerLabelBg,
        pledgeMarkerLabelBorder: themeResult.pledgeMarkerLabelBorder,
        pledgeMarkerShadow: themeResult.pledgeMarkerShadow,
        controlsPanelBg: themeResult.controlsPanelBg,
        controlsBorder: themeResult.controlsBorder,
        controlsShadow: themeResult.controlsShadow,
        key: themeResult.key || safeFamilyTheme,
        familyKey: safeFamilyTheme,
      };
      
      return safeTheme;
    } catch (error) {
      console.error('Error loading theme, using fallback:', error);
      // Return a completely safe fallback theme
      return getThemeStyles('wolfpack');
    }
  }, [safeFamilyTheme]);
  
  // Use the safe family theme as familyKey
  const familyKey = safeFamilyTheme;
  
  // Compute boolean flags using stable values (no hooks, just computed values)
  const isEmpire = safeFamilyTheme === 'empire';
  const isPower = safeFamilyTheme === 'power';
  const isGreed = safeFamilyTheme === 'greed';
  const isPride = safeFamilyTheme === 'pride';
  const isWolfpack = safeFamilyTheme === 'wolfpack';
  
  const leftGutter =
    LEFT_TREE_GUTTER + (isGreed ? 18 : isWolfpack ? 12 : 0);
  const rightGutter = Math.max(
    50,
    RIGHT_TREE_GUTTER + (isGreed ? -12 : isWolfpack ? -6 : 0),
  );
  
  // Define presentation after theme is initialized (before early return)
  const presentation = useMemo(() => {
    try {
      // Use safeFamilyTheme directly instead of familyKey to avoid potential issues
      const keyToUse = safeFamilyTheme || 'empire';
      const presentationData = FAMILY_PRESENTATION[keyToUse];
      if (presentationData && typeof presentationData === 'object') {
        return presentationData;
      }
      // Fallback to empire if presentation doesn't exist
      console.warn(`Presentation not found for key: ${keyToUse}, using empire`);
      return FAMILY_PRESENTATION.empire || FAMILY_PRESENTATION.default || {};
    } catch (error) {
      console.warn('Error loading presentation, using empire fallback:', error);
      return FAMILY_PRESENTATION.empire || FAMILY_PRESENTATION.default || {};
    }
  }, [safeFamilyTheme]);
  
  // Define focusBrotherNode AFTER theme and familyKey are initialized
  const focusBrotherNode = useCallback(
    (brotherId) => {
      if (!brotherId || !nodes || !Array.isArray(nodes)) {
        return false;
      }
      const targetNode = nodes.find((node) => node && node.id === String(brotherId));
      if (!targetNode || !targetNode.position) {
        return false;
      }
      const estimatedWidth = targetNode.style?.width || targetNode.style?.minWidth || 200;
      const estimatedHeight = targetNode.style?.minHeight || targetNode.style?.height || 110;
      // Set highlight to show which node was found
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      setHighlightBrotherId(String(brotherId));
      highlightTimeoutRef.current = setTimeout(() => setHighlightBrotherId(null), 2600);
      
      // Set lineage highlight if enabled
      if (safeLineageHighlight && safeLineageHighlight.lineageHighlightMode !== 'off' && safeLineageHighlight.setSourceFromBrotherId) {
        safeLineageHighlight.setSourceFromBrotherId(brotherId);
      }
      
      // Center and zoom to the node
      try {
        if (reactFlowInstance && reactFlowInstance.setCenter) {
          // First zoom out slightly for better context, then zoom in smoothly
          reactFlowInstance.setCenter(
            targetNode.position.x + estimatedWidth / 2,
            targetNode.position.y + estimatedHeight / 2,
            {
              zoom: 0.8,
              duration: 400,
            },
          );
          // Then zoom in to the target
          setTimeout(() => {
            if (reactFlowInstance && reactFlowInstance.setCenter) {
              reactFlowInstance.setCenter(
                targetNode.position.x + estimatedWidth / 2,
                targetNode.position.y + estimatedHeight / 2,
                {
                  zoom: 1.2,
                  duration: 500,
                },
              );
            }
          }, 400);
          return true; // Return true to indicate success
        }
        return false; // No reactFlowInstance available
      } catch (error) {
        console.warn('Failed to center node:', error);
        return false;
      }
    },
    [nodes, reactFlowInstance, safeLineageHighlight],
  );

  const openProfileModal = useCallback(
    (brother, options = {}) => {
      if (!brother) {
        return;
      }
      const { edit = false } = options;
      try {
        if (getViewport) {
          const currentViewport = getViewport();
          setViewportBeforeModal(currentViewport);
        }
      } catch (error) {
        console.warn('Failed to capture viewport before opening profile:', error);
      }
      setSelectedBrother(brother);
      setSelectedBrotherId(String(brother.id));
      setActiveMajor(null);
      setMajorResults([]);
      setIsModalOpen(true);
      setProfileMode(edit ? 'edit' : 'view');
    },
    [getViewport],
  );

  const handleEditBrother = useCallback(
    (event, brother) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      openProfileModal(brother, { edit: true });
    },
    [openProfileModal],
  );
  
  const defaultViewport = useMemo(() => {
    if (isEmpire) return { x: 0, y: 0, zoom: 0.56 };
    if (isPower) return { x: 0, y: 0, zoom: 0.56 };
    if (isGreed) return { x: 0, y: 0, zoom: 0.58 };
    if (isPride) return { x: 0, y: 0, zoom: 0.58 };
    if (isWolfpack) return { x: 0, y: 0, zoom: 0.6 };
    return { x: 0, y: 0, zoom: 0.58 };
  }, [isEmpire, isPower, isGreed, isPride, isWolfpack]);
  
  const minZoom = 0.08;
  const maxZoom = isEmpire ? 1.4 : 2;
  
  const composedBackground = useMemo(() => {
    try {
      if (theme?.bgGradient) {
        return theme.bgGradient;
      }
      const layers = [];
      const bgLayers = presentation && presentation.backgroundLayers;
      if (bgLayers && Array.isArray(bgLayers) && bgLayers.length > 0) {
        layers.push(...bgLayers);
      }
      return layers.length > 0 ? layers.join(', ') : undefined;
    } catch (error) {
      console.warn('Error composing background:', error);
      return theme?.bgGradient || undefined;
    }
  }, [presentation, theme]);
  
  const treeRootStyle = useMemo(() => {
    const baseBackground = theme?.background || '#f5f5f5';
      return {
        width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
        position: 'relative',
      backgroundColor: baseBackground,
      backgroundImage: composedBackground || undefined,
      backgroundSize: theme?.bgGradient ? 'cover' : undefined,
      backgroundPosition: 'center',
    };
  }, [theme, composedBackground]);

  const treeBodyStyle = useMemo(() => {
      return {
      flex: 1,
        width: '100%',
      height: '100%',
      minHeight: 0,
      position: 'relative',
        pointerEvents: 'auto',
      overflow: 'hidden',
        opacity: isTreeReady ? 1 : 0,
      transform: isTreeReady ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
      paddingTop: 0,
      paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${BOTTOM_BUFFER}px)`,
        boxSizing: 'border-box',
    };
  }, [isTreeReady]);

  const layoutSettings = useMemo(() => {
    const rules = FAMILY_LAYOUT_RULES[safeFamilyTheme] || {};
    const baseRules = {
      ...FAMILY_LAYOUT_RULES.base,
      ...rules,
    };

    if (isEmpire) {
      return {
        ...baseRules,
        scaleBias: 1.0,
      };
    }

    return baseRules;
  }, [safeFamilyTheme, isEmpire]);

  const {
    treeBoundsRef,
    fitTreeView,
    handleZoom,
    handleFullscreenToggle,
    projectMarkerPosition,
  } = useTreeViewport({
    reactFlowInstance,
    flowWrapperRef,
    leftGutter,
    rightGutter,
    isEmpire,
    familyKey,
    minZoom,
    maxZoom,
    scaleBias: layoutSettings?.scaleBias || 1,
  });

  const handleTreeBounds = useCallback((bounds) => {
    if (bounds && typeof bounds === 'object') {
      treeBoundsRef.current = bounds;
    }
  }, [treeBoundsRef]);


  // Single node renderer using extracted palette utility
  // Must be defined AFTER theme and familyKey are initialized
  const renderNodeContent = useCallback((brother) => {
    // Safety check: handle null/undefined brother
    if (!brother) {
      return <div style={{ color: '#333' }}>Unassigned</div>;
    }
    
    // Safety check: ensure theme and familyKey are available
    if (!theme || !familyKey) {
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
    
    try {
      // Ensure theme object has required properties
      if (typeof theme !== 'object' || !theme.nodeStudying || !theme.nodeGraduated) {
        console.warn('Theme not fully initialized, using fallback');
        return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
      }
      
      const palette = getNodePalette(familyKey, theme);
      const themeToUse = theme;
      const rawPledge = brother.pledge_class || 'Unassigned';
      const pledgeLabel = rawPledge.toUpperCase();
      const statusLabel = statusLabelForBrother(brother);
      const isPlaceholder = !brother.name || /^unassigned/i.test(brother.name.trim());
      const isTransfer = brother.is_transfer === 1 && palette.supportsTransfer;
      const placeholderText = 'Awaiting lineage assignment';
      const effectiveName = brother.name || 'Unassigned';

      const majorLabel = brother.major ? brother.major.trim() : null;

      const renderMeta = (label, value) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontSize: CARD_TOKENS.metaLabel,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: 0.65,
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: CARD_TOKENS.metaValue,
              fontWeight: 600,
              color: palette.bodyColor,
            }}
          >
            {value}
          </div>
        </div>
      );

      const metadata = [];
      if (majorLabel) metadata.push(renderMeta('Major', majorLabel));
      if (brother.graduation_year) {
        metadata.push(renderMeta('Graduation', `Class of ${brother.graduation_year}`));
      }
      if (brother.big_brother) {
        metadata.push(renderMeta('Big', brother.big_brother));
      }

      return (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label={`Edit ${brother.name || 'brother'}`}
            onClick={(event) => handleEditBrother(event, brother)}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: 'none',
              background: palette.statusBadgeBg || 'rgba(0,0,0,0.08)',
              color: palette.statusColor || '#222',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
            }}
          >
            ✎
          </button>
            <div 
              style={{ 
            display: 'flex',
            flexDirection: 'column',
              gap: CARD_TOKENS.gap,
              paddingRight: 8,
              maxWidth: CARD_CONTENT_MAX_WIDTH,
            whiteSpace: 'normal',
            color: palette.bodyColor,
              }}
            >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                paddingRight: 20,
            }}
          >
              <div 
                style={{ 
                  fontSize: CARD_TOKENS.badgeFont,
                  letterSpacing: '0.8px',
                textTransform: 'uppercase',
                  padding: '4px 10px',
                borderRadius: 999,
                background: palette.badgeBg,
                color: palette.badgeColor,
                fontWeight: 600,
                }}
              >
              {pledgeLabel}
              </div>
              <div
                style={{
                  fontSize: CARD_TOKENS.badgeFont,
                  color: palette.statusColor,
                  letterSpacing: '0.32px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: palette.statusBadgeBg ?? 'rgba(0,0,0,0.08)',
                }}
              >
                {statusLabel}
              </div>
            {isTransfer && (
            <div 
              style={{ 
                    fontSize: CARD_TOKENS.badgeFont,
                    letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: palette.transferColor,
                    fontWeight: 600,
              }}
            >
                Transfer
            </div>
            )}
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div 
                style={{ 
                fontFamily: themeToUse.titleFont,
                  fontSize: CARD_TOKENS.nameSize,
                  letterSpacing: palette.nameTracking || '0.4px',
                  lineHeight: 1.2,
                color: palette.nameColor,
                }}
              >
              {effectiveName}
              </div>
              {majorLabel && (
              <div 
                style={{ 
                    fontSize: 11,
                  color: palette.classColor,
                    letterSpacing: '0.15px',
                    lineHeight: 1.3,
              }}
            >
                  {majorLabel}
            </div>
            )}
            {isPlaceholder && (
              <div 
                style={{ 
                    fontSize: 11,
                  color: palette.placeholderColor || palette.statusColor,
                  fontStyle: 'italic',
                    lineHeight: 1.35,
                }}
              >
                {placeholderText}
                </div>
              )}
            </div>
            {metadata.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gap: 6,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                }}
              >
                {metadata}
              </div>
            )}
          </div>
          </div>
        );
    } catch (error) {
      console.warn('Error rendering node content:', error);
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
  }, [theme, familyKey, handleEditBrother]);

  const { nodes: layoutNodes, edges: layoutEdges, stats: treeStats } = useTreeLayout({
    brothers,
    relationships,
    familyKey,
    theme,
    layoutSettings,
    highlightBrotherId,
    lineageHighlightSet,
    renderNodeContent,
    onTreeBounds: handleTreeBounds,
    leftMargin: leftGutter,
  });

  useEffect(() => {
    setNodes(layoutNodes);
  }, [layoutNodes, setNodes]);

  useEffect(() => {
    setEdges(layoutEdges);
  }, [layoutEdges, setEdges]);

  // Calculate pledge class markers for left-side vertical stripes (Empire only)
  const pledgeClassMarkers = useMemo(() => {
    if (!isTreeReady || !nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return [];
    }
    
    try {
      const levelMap = new Map(); // levelIndex -> aggregated data
      
      nodes.forEach((node) => {
        if (!node || !node.data || !node.data.brother) return;
        const levelIndex =
          typeof node.data.levelIndex === 'number'
            ? node.data.levelIndex
            : null;
        if (levelIndex === null) return;
        const layoutY =
          typeof node.data.layoutY === 'number'
            ? node.data.layoutY
            : node.position?.y ?? 0;
        
        if (!levelMap.has(levelIndex)) {
          levelMap.set(levelIndex, {
            level: levelIndex,
            sumY: 0,
            count: 0,
            nodes: [],
            pledgeClasses: new Set(),
          });
        }
        
        const levelData = levelMap.get(levelIndex);
        levelData.sumY += layoutY;
        levelData.count += 1;
        levelData.nodes.push(node);
        if (node.data.brother.pledge_class) {
          levelData.pledgeClasses.add(node.data.brother.pledge_class.trim().toUpperCase());
        }
      });
      
      const markers = Array.from(levelMap.values())
        .filter((levelData) => levelData.count > 0)
        .sort((a, b) => a.level - b.level)
        .map((levelData) => {
          const pledgeClasses = Array.from(levelData.pledgeClasses);
          let label = '';
          if (pledgeClasses.length === 1) {
            label = pledgeClasses[0];
          } else if (pledgeClasses.length > 1) {
            label = pledgeClasses.join(' / ');
          } else {
            label = 'Level ' + (levelData.level + 1);
          }
          
          const years = levelData.nodes
            .map((n) => n.data?.brother?.graduation_year)
            .filter((y) => y && typeof y === 'number')
            .sort((a, b) => b - a);
          const yearLabel = years.length > 0 ? `Class of ${years[0]}` : '';
          
          return {
            level: levelData.level,
            y: levelData.sumY / levelData.count,
            label,
            yearLabel,
            nodeIds: levelData.nodes.map((n) => n.id),
            pledgeClasses,
          };
        });
      
      return markers;
    } catch (error) {
      console.warn('Error calculating pledge class markers:', error);
      return [];
    }
  }, [isTreeReady, nodes]);
  
  // State for highlighting nodes when marker is clicked
  const [highlightedPledgeClass, setHighlightedPledgeClass] = useState(null);
  const [hoveredMarkerLevel, setHoveredMarkerLevel] = useState(null);
  const [activeMajor, setActiveMajor] = useState(null);
  const [majorResults, setMajorResults] = useState([]);
  // Ref to track current highlight state and prevent infinite loops
  const lastHighlightStateRef = useRef({ highlighted: null, hovered: null });

  // Dim non-target levels and highlight the active pledge level
  useEffect(() => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    
    const activeLevel =
      highlightedPledgeClass !== null ? highlightedPledgeClass : hoveredMarkerLevel;
    const currentState = { level: activeLevel, markerCount: pledgeClassMarkers.length };
    if (
      lastHighlightStateRef.current.level === currentState.level &&
      lastHighlightStateRef.current.markerCount === currentState.markerCount
    ) {
      return;
    }
    lastHighlightStateRef.current = currentState;

    setNodes((currentNodes) => {
      let hasChanges = false;
      const updatedNodes = currentNodes.map((node) => {
        const nodeLevel = node?.data?.levelIndex;
        const matches = activeLevel === null || nodeLevel === activeLevel;
        const style = { ...(node.style || {}) };
        const prevFilter = style.filter;
        const prevOpacity =
          style.opacity === undefined ? 1 : Number(style.opacity);
        const prevZIndex = style.zIndex ?? 1;

        let nextFilter;
        if (activeLevel === null) {
          nextFilter = undefined;
        } else if (matches) {
          nextFilter = 'drop-shadow(0 0 12px rgba(0,0,0,0.15)) brightness(1.05)';
        } else {
          nextFilter = 'saturate(0.55) brightness(0.78)';
        }
        const nextOpacity = matches || activeLevel === null ? 1 : 0.32;
        const nextZIndex = matches ? 3 : 1;

        if (
          prevFilter === nextFilter &&
          prevOpacity === nextOpacity &&
          prevZIndex === nextZIndex
        ) {
          return node;
        }

        if (nextFilter) {
          style.filter = nextFilter;
        } else {
          delete style.filter;
        }
        if (nextOpacity !== 1) {
          style.opacity = nextOpacity;
      } else {
          delete style.opacity;
        }
        style.zIndex = nextZIndex;
        style.transition = 'filter 0.25s ease, opacity 0.25s ease';
        hasChanges = true;
        return { ...node, style };
      });

      return hasChanges ? updatedNodes : currentNodes;
    });
  }, [
    highlightedPledgeClass,
    hoveredMarkerLevel,
    pledgeClassMarkers.length,
    nodes.length,
  ]);

  /**
   * Handles node click events - selects brother and smoothly zooms to node
   * 
   * @param {Object} event - React Flow node click event
   * @param {Object} node - React Flow node object with position and data
   * @param {Object} node.data.brother - Brother data object
   * @param {Object} node.position - Node position {x, y}
   */
  const onNodeClick = useCallback((event, node) => {
    if (!node || !node.data || !node.data.brother) {
      console.warn('Node click: Invalid node data');
      return;
    }
    
    openProfileModal(node.data.brother);
    
    // Smoothly center and zoom to the clicked node
    try {
      if (node.position && setCenter) {
    const { x, y } = node.position;
    const width = node.style?.width || 180;
    const height = node.style?.minHeight || 80;
    const zoom = 1.4; // tasteful zoom level
    setCenter(x + width / 2, y + height / 2, {
      zoom,
      duration: 500,
    });
      }
    } catch (e) {
      console.warn('Failed to center node:', e);
    }
  }, [setCenter, openProfileModal]);

  const onPaneClick = useCallback((event) => {
    if (event.target.classList.contains('react-flow__pane')) {
      setSelectedBrother(null);
      setSelectedBrotherId(null);
      setIsModalOpen(false);
      // Don't close add form on pane click - let user finish adding
    }
  }, []);

  const restorePointerEvents = useCallback(() => {
    const wrapper = document.querySelector('.react-flow');
    const pane = document.querySelector('.react-flow__pane');
    if (wrapper) {
      wrapper.style.pointerEvents = 'auto';
    }
    if (pane) {
      pane.style.pointerEvents = 'auto';
    }
  }, []);

  const closeProfile = useCallback(
    (restoreViewport = true) => {
      if (restoreViewport) {
        const targetViewport = viewportBeforeModal || initialViewportRef.current;
        try {
          if (targetViewport && reactFlowInstance?.setViewport) {
            reactFlowInstance.setViewport(targetViewport, { duration: 300 });
        } else {
          fitTreeView(400, isEmpire ? 1.1 : 1.15);
          }
        } catch (e) {
          console.warn('Failed to restore viewport:', e);
        }
      }

      restorePointerEvents();
    setSelectedBrother(null);
      setSelectedBrotherId(null);
      setIsModalOpen(false);
      setViewportBeforeModal(null);
      setActiveMajor(null);
      setMajorResults([]);
      setProfileMode('view');
    },
    [
      viewportBeforeModal,
      reactFlowInstance,
      isEmpire,
      restorePointerEvents,
      fitTreeView,
    ],
  );

  // Effect to restore ReactFlow interactions after modal closes
  useEffect(() => {
    if (!isModalOpen && !selectedBrother) {
      // Modal is closed, ensure ReactFlow is interactive
      // The viewport restoration in onClose should handle most cases,
      // but we'll ensure pointer events are correct as a fallback
      const restoreInteractions = () => {
        restorePointerEvents();
      };
      
      // Small delay to ensure modal is fully unmounted
      setTimeout(restoreInteractions, 100);
    }
  }, [isModalOpen, selectedBrother, restorePointerEvents]);

  const handleNodeUpdate = useCallback(() => {
    closeProfile(true);
    reloadTreeData();
  }, [closeProfile, reloadTreeData]);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (initialViewportRef.current) return;
    try {
      if (reactFlowInstance?.getViewport) {
        initialViewportRef.current = reactFlowInstance.getViewport();
      }
    } catch (e) {
      initialViewportRef.current = null;
      console.warn('Failed to get initial viewport:', e);
    }
  }, [nodes, reactFlowInstance]);

  useLayoutEffect(() => {
    if (!isTreeReady || nodes.length === 0) {
      return;
    }
    if (!flowWrapperRef.current) {
      return;
    }
    try {
      fitTreeView(400);
    } catch (error) {
      console.warn('Failed to fit tree after layout:', error);
    }
  }, [isTreeReady, nodes.length, safeFamily?.id, fitTreeView]);


  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isEmpire) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        fitTreeView(450, isEmpire ? 1.05 : 1.15);
        return;
      }

      const adjustZoom = (direction) => {
        try {
          if (reactFlowInstance?.getViewport && reactFlowInstance?.zoomTo) {
            const currentViewport = reactFlowInstance.getViewport();
            const nextZoom = Math.max(
              minZoom,
              Math.min(maxZoom, currentViewport.zoom * direction),
            );
            reactFlowInstance.zoomTo(nextZoom, 200);
          }
        } catch (e) {
          console.warn('Failed to adjust zoom:', e);
        }
      };

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        adjustZoom(0.9);
      } else if (event.key === '=' || event.key === '+') {
        event.preventDefault();
        adjustZoom(1.1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEmpire, reactFlowInstance, minZoom, maxZoom, fitTreeView]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Cleanup effect - must be called before any conditional returns
  useEffect(
    () => () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    },
    [],
  );

  // Search palette - must be called before any conditional returns
  const searchIsDark = ['power', 'pride', 'wolfpack'].includes(familyKey);
  const searchPalette = useMemo(
    () => ({
      background: searchIsDark ? 'rgba(20, 30, 46, 0.85)' : 'rgba(255, 255, 255, 0.92)',
      inputColor: '#000000',
      border: hexToRgba(theme.accent || '#c9a857', 0.35),
      buttonBg: theme.accent || '#c9a857',
      buttonText: '#000000',
    }),
    [familyKey, theme.accent, searchIsDark],
  );

  // Export handler - must be called before any conditional returns
  const handleExportTree = useCallback(async () => {
    setIsPreparingExport(true);

    try {
      fitTreeView(350, 0.9);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const flowWrapper = flowWrapperRef.current;
      if (!flowWrapper) {
        throw new Error('Flow wrapper not found');
      }

      document.body.classList.add('tree-exporting');
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const pixelRatio = Math.min(
        4,
        (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1) * 1.8,
      );

      const dataUrl = await toPng(flowWrapper, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: theme?.background || '#0a0f1a',
      });

      const link = document.createElement('a');
      const safeName = `${safeFamily?.name || 'family'}-tree`.replace(/\s+/g, '-').toLowerCase();
      link.download = `${safeName}.png`;
      link.href = dataUrl;
      link.click();

      showToast('Tree exported as PNG');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed. Please try again.');
    } finally {
      document.body.classList.remove('tree-exporting');
      setIsPreparingExport(false);
    }
  }, [fitTreeView, showToast, theme?.background, safeFamily?.name]);

  const handleResetView = useCallback(() => {
    fitTreeView(450);
    showToast('View reset. Drag or scroll to explore the full tree.');
  }, [fitTreeView, showToast]);

  // Build brother index for search (name + major)
  const brothersIndex = useMemo(() => {
    if (!Array.isArray(brothers)) {
      return [];
    }
    return brothers
      .filter((brother) => brother && brother.id !== undefined && brother.id !== null)
      .map((brother) => ({
        id: String(brother.id),
        name: brother.name || 'Unassigned Brother',
        major: brother.major || '',
        pledgeClass: brother.pledge_class || undefined,
        gradYear: typeof brother.graduation_year === 'number' ? brother.graduation_year : undefined,
      }));
  }, [brothers]);

  useEffect(() => {
    if (selectedBrother && selectedBrother.id !== undefined && selectedBrother.id !== null) {
      setSelectedBrotherId(String(selectedBrother.id));
    } else {
      setSelectedBrotherId(null);
    }
  }, [selectedBrother]);

  const handleSelectBrotherFromSearch = useCallback(
    (brotherId) => {
      if (!brotherId) return;
      const target = brothers.find((brother) => String(brother.id) === String(brotherId));
      if (!target) {
        showToast('Brother not found in this family.');
        return;
      }
      focusBrotherNode(brotherId);
      openProfileModal(target);
    },
    [brothers, focusBrotherNode, openProfileModal, showToast],
  );

  const handleSelectMajor = useCallback(
    (major) => {
      if (!major) {
        setActiveMajor(null);
        setMajorResults([]);
        return;
      }
      setActiveMajor(major);
      const matches = brothersIndex.filter(
        (brother) => (brother.major || '').toLowerCase() === major.toLowerCase(),
      );
      setMajorResults(matches);
    },
    [brothersIndex],
  );

  const clearActiveMajor = useCallback(() => {
    setActiveMajor(null);
    setMajorResults([]);
  }, []);

  const isProfileOpen = Boolean(selectedBrotherId);

  // Render combined header props memo (must be before any early returns)
  const headerProps = useMemo(() => {
    if (!renderCombinedHeader) return null;
    return {
      searchPalette,
      safeLineageHighlight,
      handleExportTree,
      isPreparingExport,
      theme,
      familyKey,
      brothersIndex,
      handleSelectBrother: handleSelectBrotherFromSearch,
      handleSelectMajor,
      activeMajor,
      majorResults,
      clearActiveMajor,
      isProfileOpen,
    };
  }, [
    renderCombinedHeader,
    searchPalette,
    safeLineageHighlight,
    handleExportTree,
    isPreparingExport,
    theme,
    familyKey,
    brothersIndex,
    handleSelectBrotherFromSearch,
    handleSelectMajor,
    activeMajor,
    majorResults,
    clearActiveMajor,
    isProfileOpen,
  ]);

  const controlButtonStyle = useMemo(
    () => ({
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: `1px solid ${hexToRgba(theme?.accent || '#ffffff', 0.3)}`,
      background: hexToRgba(theme?.nodeCardBg || theme?.background || '#000000', 0.35),
      color: theme?.nodeText || '#ffffff',
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: '0.04em',
    }),
    [theme],
  );

  // Remove loading state - tree will fade in instead

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: theme.background }}>
        <div className="text-center container" style={{ maxWidth: '32rem', padding: 'var(--space-6)' }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: 'var(--text-3xl)',
              fontFamily: 'var(--font-display)',
              // WOLFPACK text should always be white
              color: familyKey === 'wolfpack' ? '#ffffff' : (theme.accent || 'var(--primary)'),
              marginBottom: 'var(--space-4)',
            }}
          >
            {safeFamily?.name || 'Family Tree'}
          </h2>
          <p
            className="mb-6"
            style={{
              fontSize: 'var(--text-lg)',
              color: theme.nodeText || 'var(--text-on-dark)',
              marginBottom: 'var(--space-6)',
            }}
          >
            {error}
          </p>
          <div className="flex justify-center" style={{ gap: 'var(--space-4)' }}>
            <button onClick={reloadTreeData} className="btn btn-primary">
              Retry
            </button>
            {safeOnChangeFamily && (
              <button onClick={safeOnChangeFamily} className="btn btn-secondary">
                Back to Families
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Header height constant - single combined bar
  // Combined bar with family tabs, search, and controls in one row
  // Updated header height for unified glass panel design

  // Handle null family case after hooks to keep hook order stable
  if (!safeFamily || !safeFamily.theme) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Family data not available. Please select a family.</p>
        </div>
      </div>
    );
  }

  // Empty state - no brothers yet (only show if not loading and actually empty)
  if (!loading && brothers.length === 0) {
    return (
      <>
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: theme.background }}>
        <div className="text-center container" style={{ maxWidth: '32rem', padding: 'var(--space-6)' }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: 'var(--text-3xl)',
              fontFamily: 'var(--font-display)',
                color: familyKey === 'wolfpack' ? '#ffffff' : theme.accent || 'var(--primary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {safeFamily?.name || 'Family Tree'}
          </h2>
          <p
            className="mb-6"
            style={{
              fontSize: 'var(--text-lg)',
              color: theme.nodeText || 'var(--text-on-dark)',
              marginBottom: 'var(--space-6)',
            }}
          >
              This family tree is empty. Contact an administrator to add brothers to this family.
          </p>
          <div className="flex justify-center" style={{ gap: 'var(--space-4)' }}>
            {safeOnChangeFamily && (
            <button
                onClick={safeOnChangeFamily} 
                className="btn"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.accent,
                  borderColor: hexToRgba(theme.accent, 0.4),
                }}
              >
                Back to Families
              </button>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <style>{TREE_LAYER_CSS}</style>
      <div className="tree-root" style={treeRootStyle}>
        {/* Combined header rendered by parent */}
        {renderCombinedHeader && headerProps && renderCombinedHeader(headerProps)}
        <div
          className="tree-root__body"
          style={treeBodyStyle}
          ref={flowWrapperRef}
        >

      {toast && (
        <div
          className="tree-toast"
          key={toast.id}
          style={{
            position: 'absolute',
            bottom: 96,
            left: '50%',
            transform: 'translateX(-50%)',
            background: presentation.legend.panelBg,
            color: presentation.legend.textColor,
            border: presentation.legend.border,
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 12px 22px rgba(0,0,0,0.18)',
            zIndex: 12,
            pointerEvents: 'none',
            textTransform: 'none',
            letterSpacing: '0.02em',
            fontSize: '13px',
            fontWeight: 500,
            opacity: 0,
            animation: 'toastFadeIn 0.3s ease-out forwards, toastFadeOut 0.3s ease-in 3.7s forwards',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          {toast.message}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onMove={(event, viewport) => {
          setViewport(viewport);
        }}
        onMoveStart={(event, viewport) => {
          setViewport(viewport);
        }}
        onMoveEnd={(event, viewport) => {
          setViewport(viewport);
        }}
        style={{ 
          width: '100%', 
          height: '100%', // Fill parent container
          minHeight: '100%',
          maxHeight: '100%',
          background: theme.background, 
          fontFamily: theme.bodyFont, 
          pointerEvents: isModalOpen ? 'none' : 'auto',
          zIndex: 1,
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultViewport={defaultViewport}
        minZoom={minZoom}
        maxZoom={maxZoom}
        panOnDrag={!isModalOpen}
        zoomOnScroll={!isModalOpen}
        zoomOnPinch={!isModalOpen}
        proOptions={{ hideAttribution: true }}
        edgeTypes={edgeTypes}
      >
        <Background
          color={hexToRgba(theme.backgroundGrid || '#ffffff', theme.gridOpacity || 0.12)}
          variant={theme.backgroundVariant || 'dots'}
          gap={theme.backgroundVariant === 'lines' ? 48 : 32}
          size={theme.backgroundVariant === 'lines' ? 2 : 0.8}
        />
        <Panel
          className="tree-controls-panel"
          style={{
            position: 'absolute',
            right: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'auto',
            background: hexToRgba(theme?.controlsPanelBg || theme?.background || '#000000', 0.4),
            border: theme?.controlsBorder || `1px solid ${hexToRgba(theme?.accent || '#ffffff', 0.25)}`,
            boxShadow: theme?.controlsShadow || '0 18px 36px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '12px',
            minWidth: 64,
          }}
        >
          <div className="tree-controls">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => handleZoom('in')}
              style={controlButtonStyle}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => handleZoom('out')}
              style={controlButtonStyle}
            >
              −
            </button>
            <button
              type="button"
              aria-label="Reset view"
              onClick={handleResetView}
              style={controlButtonStyle}
            >
              ⟲
            </button>
            <button
              type="button"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={handleFullscreenToggle}
              style={controlButtonStyle}
            >
              {isFullscreen ? '▢' : '⛶'}
            </button>
            <button
              type="button"
              aria-label="Export tree"
              onClick={handleExportTree}
              disabled={isPreparingExport}
              style={
                isPreparingExport
                  ? { ...controlButtonStyle, opacity: 0.5, cursor: 'wait' }
                  : controlButtonStyle
              }
            >
              ⇩
            </button>
          </div>
        </Panel>
      </ReactFlow>

      {pledgeClassMarkers.length > 0 && (
        <PledgeClassMarkers
          key={`pledge-markers-${viewport.x}-${viewport.y}-${viewport.zoom}`}
          markers={pledgeClassMarkers}
          projectPosition={projectMarkerPosition}
          bottomBuffer={BOTTOM_BUFFER}
          highlightedLevel={highlightedPledgeClass}
          hoveredLevel={hoveredMarkerLevel}
          onHover={(level) => setHoveredMarkerLevel(level)}
          onHoverEnd={() => setHoveredMarkerLevel(null)}
          onToggle={(level) =>
            setHighlightedPledgeClass((prev) => (prev === level ? null : level))
          }
          theme={theme}
        />
      )}

      <div
        className="tree-summary-card"
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          background: hexToRgba(theme.background || '#000000', 0.92),
          border: `1px solid ${hexToRgba(theme.accent || '#ffffff', 0.4)}`,
          color: theme.nodeText || '#ffffff',
          fontSize: 11,
          letterSpacing: '0.05em',
                      textTransform: 'uppercase',
          padding: '10px 14px',
          borderRadius: 12,
                    pointerEvents: 'none',
          boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
          minWidth: 160,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Tree Summary</div>
        <div>{`${treeStats.total} Brothers`}</div>
        <div>{`${treeStats.classes} Pledge Classes`}</div>
        {treeStats.placeholders > 0 && (
          <div style={{ textTransform: 'none', fontSize: 10, marginTop: 4, opacity: 0.8 }}>
            {`${treeStats.placeholders} awaiting assignment`}
        </div>
      )}
      </div>

      {/* Show helpful message if no relationships exist */}
      {!loading && brothers.length > 0 && relationships.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '500px',
          textAlign: 'center',
          border: `2px solid ${theme.accent || '#c9a857'}`,
        }}>
          <div style={{ fontWeight: 600, marginBottom: '8px', color: '#333' }}>
            No Relationships Found
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Brothers are displayed but not connected. Use the admin panel to set "Big Brother" relationships.
          </div>
        </div>
      )}

      {selectedBrother && (
        <BrotherDetailModal
          brother={selectedBrother}
          familyId={safeFamily?.id}
          onClose={() => closeProfile(true)}
          onUpdate={handleNodeUpdate}
          theme={theme}
          onToast={onToast}
          startInEditMode={profileMode === 'edit'}
          onModeChange={setProfileMode}
        />
      )}
    </div>
      </div>
    </>
  );
};

const TreeVisualization = ({ family, onToast, onChangeFamily, renderCombinedHeader }) => {
  return (
    <ReactFlowProvider>
      <TreeVisualizationInner family={family} onToast={onToast} onChangeFamily={onChangeFamily} renderCombinedHeader={renderCombinedHeader} />
    </ReactFlowProvider>
  );
};

export default TreeVisualization;

