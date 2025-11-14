import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Panel,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import BrotherDetailModal from './BrotherDetailModal';
import { getThemeStyles } from '../themes';
import { hexToRgba } from '../utils/color';
import { FAMILY_PRESENTATION } from '../constants/familyPresentation';
import { statusLabelForBrother, getNodePalette } from '../utils/nodeRenderer';
import { calculateTreeLayout } from '../utils/treeLayout';
import { useTreeData } from '../hooks/useTreeData';
import { useLineageHighlight } from '../hooks/useLineageHighlight';

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
  const [viewportBeforeModal, setViewportBeforeModal] = useState(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [toast, setToast] = useState(null);
  const [highlightBrotherId, setHighlightBrotherId] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const initialViewportRef = useRef(null);
  const treeBoundsRef = useRef({ width: 0, height: 0 });
  const toastTimeoutRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  const hasFitRef = useRef(false);
  const reactFlowPaneRef = useRef(null);
  const reactFlowInstance = useReactFlow();

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
        backgroundGrid: themeResult.backgroundGrid || '#2a3a5c',
        backgroundTexture: themeResult.backgroundTexture || undefined,
        nodeStudying: themeResult.nodeStudying || '#f7faff',
        nodeGraduated: themeResult.nodeGraduated || '#f7faff',
        nodeBorder: themeResult.nodeBorder || '#d6e4ff',
        nodeText: themeResult.nodeText || '#1e2c45',
        edgeColor: themeResult.edgeColor || '#f0f6ff',
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
  
  // Define presentation and flags after theme is initialized (before early return)
  // These must be defined even if family is undefined, to maintain hook order
  // Use stable computed values to avoid uninitialized variable errors
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
  
  // Compute boolean flags using stable values (no hooks, just computed values)
  const isEmpire = safeFamilyTheme === 'empire';
  const isPower = safeFamilyTheme === 'power';
  const isGreed = safeFamilyTheme === 'greed';
  const isPride = safeFamilyTheme === 'pride';
  const isWolfpack = safeFamilyTheme === 'wolfpack';
  
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

  const defaultViewport = useMemo(() => {
    if (isEmpire) return { x: 0, y: 0, zoom: 0.45 };
    if (isPower) return { x: 0, y: 0, zoom: 0.5 };
    if (isGreed) return { x: 0, y: 0, zoom: 0.52 };
    if (isPride) return { x: 0, y: 0, zoom: 0.53 };
    if (isWolfpack) return { x: 0, y: 0, zoom: 0.54 };
    return { x: 0, y: 0, zoom: 0.55 };
  }, [isEmpire, isPower, isGreed, isPride, isWolfpack]);
  
  const minZoom = isEmpire ? 0.12 : 0.18;
  const maxZoom = isEmpire ? 1.4 : 2;
  
  const composedBackground = useMemo(() => {
    try {
      const layers = [];
      // Access properties directly without optional chaining in dependency array
      const bgLayers = presentation && presentation.backgroundLayers;
      if (bgLayers && Array.isArray(bgLayers) && bgLayers.length > 0) {
        layers.push(...bgLayers);
      }
      const bgTexture = theme && theme.backgroundTexture;
      if (bgTexture) {
        layers.push(bgTexture);
      }
      return layers.length > 0 ? layers.join(', ') : undefined;
    } catch (error) {
      console.warn('Error composing background:', error);
      const bgTexture = theme && theme.backgroundTexture;
      return bgTexture || undefined;
    }
  }, [presentation, theme]);
  
  const containerStyle = useMemo(() => {
    // Safety checks: ensure theme is fully initialized
    if (!theme || typeof theme !== 'object' || !theme.background) {
      return {
        width: '100%',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden',
      };
    }
    
    try {
      const sizeValue = isEmpire
        ? theme.backgroundTexture
          ? '100% 100%, 100% 100%, 280px 280px'
          : '100% 100%, 100% 100%'
        : theme.backgroundTexture
          ? '280px 280px'
          : undefined;

      // Header height for calculating tree container height
      // New unified glass header: top panel (~68px) + bottom panel (~50px) + outer padding (~24px) = ~142px
      const HEADER_HEIGHT = 136;
      // Bottom buffer to prevent content cutoff (extra padding beyond safe area)
      const BOTTOM_BUFFER = 4; // Reduced by 80% (from 20 to 4) for minimal spacing
      // Use calc to account for header, safe area insets, and bottom buffer
      // Safe area insets prevent content from being cut off on devices with notches/home indicators
      // env(safe-area-inset-top) for top notch, env(safe-area-inset-bottom) for bottom home indicator
      const treeHeight = `calc(100vh - ${HEADER_HEIGHT}px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - ${BOTTOM_BUFFER}px)`;
      const headerTop = `env(safe-area-inset-top, 0px)`;
      
      return {
        width: '100%',
        height: '100vh',
        minHeight: '100vh',
        backgroundColor: theme.background || '#f5f5f5', // Base background color extends behind header
        backgroundImage: composedBackground || undefined,
        backgroundSize: sizeValue,
        backgroundPosition: 'center',
        pointerEvents: 'auto',
        opacity: isTreeReady ? 1 : 0,
        transform: isTreeReady ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingTop: `calc(${HEADER_HEIGHT}px + ${headerTop})`, // Push content below fixed header + safe area
        paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${BOTTOM_BUFFER}px)`, // Add padding for bottom safe area + buffer
      };
    } catch (error) {
      console.warn('Error computing container style:', error);
      return {
        width: '100%',
        height: '100vh',
        backgroundColor: (theme && theme.background) || '#f5f5f5',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden',
      };
    }
  }, [theme, composedBackground, isEmpire, isTreeReady]);
  const layoutSettings = useMemo(() => {
    const base = {
      horizontalSpacing: 260, // Increased from 235 for more horizontal breathing room
      baseVerticalSpacing: 165, // Increased from 150 for more vertical spacing
      pledgeVerticalSpacing: 145, // Increased from 130 for more spacing between pledge levels
      multiChildCompression: 0.92, // Increased from 0.9 - less compression means more spacing
      siblingPadding: 44, // Increased from 36 for more space between siblings
      prongDropFactor: 1.12,
    };

    if (isEmpire) {
      return {
        ...base,
        horizontalSpacing: 240, // Increased from 220
        multiChildCompression: 0.88, // Increased from 0.86 - less compression
        siblingPadding: 36, // Increased from 30
      };
      }

    if (isPower) {
      return {
        ...base,
        horizontalSpacing: 240, // Increased from 220
        multiChildCompression: 0.88, // Increased from 0.86
        siblingPadding: 36, // Increased from 30
      };
    }

    if (isGreed) {
      return {
        ...base,
        horizontalSpacing: 240, // Increased from 220
        multiChildCompression: 0.88, // Increased from 0.86
        siblingPadding: 36, // Increased from 30
      };
    }

    if (isPride) {
      return {
        ...base,
        horizontalSpacing: 240, // Increased from 220
        multiChildCompression: 0.88, // Increased from 0.86
        siblingPadding: 36, // Increased from 30
      };
    }

    if (isWolfpack) {
      return {
        ...base,
        horizontalSpacing: 250, // Increased from 220 - extra spacing for Wolfpack
        multiChildCompression: 0.88, // Increased from 0.86
        siblingPadding: 40, // Increased from 30 - extra padding for Wolfpack
      };
    }

    return base;
  }, [isEmpire, isPower, isGreed, isPride, isWolfpack]);


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
      const classLabel = brother.graduation_year ? `Class of ${brother.graduation_year}` : null;
      const isPlaceholder = !brother.name || /^unassigned/i.test(brother.name.trim());
      const isTransfer = brother.is_transfer === 1 && palette.supportsTransfer;
      const placeholderText = 'Awaiting lineage assignment';
      const effectiveName = brother.name || 'Unassigned';

      return (
            <div 
              style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 190,
            whiteSpace: 'normal',
            color: palette.bodyColor,
              }}
            >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
              <div 
                style={{ 
                  fontSize: '9px',
                letterSpacing: '0.9px',
                textTransform: 'uppercase',
                padding: '4px 12px',
                borderRadius: 999,
                background: palette.badgeBg,
                color: palette.badgeColor,
                fontWeight: 600,
                }}
              >
              {pledgeLabel}
              </div>
            {isTransfer && (
            <div 
              style={{ 
                fontSize: '9px',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: palette.transferColor,
              }}
            >
                Transfer
            </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div 
                style={{ 
                fontFamily: themeToUse.titleFont,
                fontSize: palette.nameSize || '12px',
                letterSpacing: palette.nameTracking || '0.5px',
                lineHeight: 1.32,
                color: palette.nameColor,
                }}
              >
              {effectiveName}
              </div>
              <div 
                style={{ 
                fontSize: '10px',
                color: palette.statusColor,
                fontWeight: 500,
                letterSpacing: '0.3px',
                lineHeight: 1.4,
                }}
              >
              {statusLabel}
              </div>
            {classLabel && (
              <div
              style={{ 
                  fontSize: '10px',
                  color: palette.classColor,
                  letterSpacing: '0.2px',
                  lineHeight: 1.4,
              }}
            >
                {classLabel}
            </div>
            )}
            {isPlaceholder && (
              <div 
                style={{ 
                  fontSize: '10px',
                  color: palette.placeholderColor || palette.statusColor,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}
              >
                {placeholderText}
              </div>
            )}
          </div>
          </div>
        );
    } catch (error) {
      console.warn('Error rendering node content:', error);
      return <div style={{ color: '#333' }}>{brother.name || 'Unassigned'}</div>;
    }
  }, [theme, familyKey]);
  
  // Safely destructure ReactFlow methods
  const setCenter = reactFlowInstance?.setCenter;
  const getViewport = reactFlowInstance?.getViewport;
  const flowToScreenPosition = reactFlowInstance?.flowToScreenPosition; // New React Flow API (replaces deprecated project)

  const pledgeSummary = useMemo(() => {
    const classes = new Set();
    let placeholderCount = 0;
    brothers.forEach((brother) => {
      if (!brother?.name || /^unassigned/i.test(brother.name.trim())) {
        placeholderCount += 1;
      }
      if (brother?.pledge_class) {
        classes.add(brother.pledge_class.trim().toUpperCase());
      }
    });
    return {
      totalBrothers: brothers.length,
      uniquePledgeClasses: classes.size,
      placeholderCount,
    };
  }, [brothers]);

  // Calculate pledge class markers for left-side vertical stripes (Empire only)
  const pledgeClassMarkers = useMemo(() => {
    if (!isEmpire || !isTreeReady || !nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return [];
    }
    
    try {
      // Group nodes by their Y position (generation level)
      // Each level is spaced by pledgeVerticalSpacing
      const levelMap = new Map(); // level -> { y, nodes, pledgeClasses }
      const pledgeVerticalSpacing = layoutSettings.pledgeVerticalSpacing || 145;
      
      nodes.forEach((node) => {
        if (!node || !node.position || typeof node.position.y !== 'number') return;
        if (!node.data || !node.data.brother) return;
        
        const y = node.position.y;
        // Calculate which level this node belongs to (rounded to nearest pledgeVerticalSpacing)
        const level = Math.round(y / pledgeVerticalSpacing);
        
        if (!levelMap.has(level)) {
          levelMap.set(level, {
            level,
            y: level * pledgeVerticalSpacing, // Actual Y position for this level
            nodes: [],
            pledgeClasses: new Set(),
          });
        }
        
        const levelData = levelMap.get(level);
        levelData.nodes.push(node);
        if (node.data.brother.pledge_class) {
          levelData.pledgeClasses.add(node.data.brother.pledge_class.trim().toUpperCase());
        }
      });
      
      // Convert to array and sort by level
      const markers = Array.from(levelMap.values())
        .filter((levelData) => levelData.nodes.length > 0)
        .sort((a, b) => a.level - b.level)
        .map((levelData) => {
          // Get the most common pledge class name for this level, or combine them
          const pledgeClasses = Array.from(levelData.pledgeClasses);
          let label = '';
          if (pledgeClasses.length === 1) {
            label = pledgeClasses[0];
          } else if (pledgeClasses.length > 1) {
            // Multiple pledge classes at this level - use a combined label
            label = pledgeClasses.join(' / ');
          } else {
            label = 'Level ' + (levelData.level + 1);
          }
          
          // Get optional year from nodes if available
          const years = levelData.nodes
            .map((n) => n.data?.brother?.graduation_year)
            .filter((y) => y && typeof y === 'number')
            .sort((a, b) => b - a); // Most recent first
          const yearLabel = years.length > 0 ? `Class of ${years[0]}` : '';
          
          return {
            level: levelData.level,
            y: levelData.y,
            label,
            yearLabel,
            nodeIds: levelData.nodes.map((n) => n.id),
            pledgeClasses: pledgeClasses,
          };
        });
      
      return markers;
    } catch (error) {
      console.warn('Error calculating pledge class markers:', error);
      return [];
    }
  }, [isEmpire, isTreeReady, nodes, layoutSettings]);
  
  // State for highlighting nodes when marker is clicked
  const [highlightedPledgeClass, setHighlightedPledgeClass] = useState(null);
  const [hoveredMarkerLevel, setHoveredMarkerLevel] = useState(null);
  const [activeMajor, setActiveMajor] = useState(null);
  const [majorResults, setMajorResults] = useState([]);
  // Ref to track current highlight state and prevent infinite loops
  const lastHighlightStateRef = useRef({ highlighted: null, hovered: null });

  /**
   * Calculates tree layout and creates React Flow nodes/edges
   * 
   * Uses the extracted calculateTreeLayout utility function
   * 
   * @effect
   * @dependencies {Array} brothers - List of all brothers
   * @dependencies {Array} relationships - Parent-child relationships
   * @dependencies {Object} theme - Theme configuration for styling
   */
  useEffect(() => {
    // Don't clear nodes/edges if loading - wait for data
    if (!loading && brothers.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    if (brothers.length === 0) {
      return; // Still loading, don't process yet
    }

    // CRITICAL: Ensure theme and familyKey are fully initialized before proceeding
    // This prevents "Cannot access uninitialized variable" errors in production
    if (!theme || typeof theme !== 'object') {
      console.warn('Theme not initialized, skipping layout calculation');
      return;
    }
    
    if (!theme.nodeStudying || typeof theme.nodeStudying === 'undefined') {
      console.warn('Theme missing nodeStudying, skipping layout calculation');
      return;
    }
    
    if (!theme.nodeGraduated || typeof theme.nodeGraduated === 'undefined') {
      console.warn('Theme missing nodeGraduated, skipping layout calculation');
      return;
    }
    
    if (!familyKey || typeof familyKey !== 'string') {
      console.warn('FamilyKey not initialized, skipping layout calculation');
      return;
    }
    
    // Ensure renderNodeContent is a valid function
    if (!renderNodeContent || typeof renderNodeContent !== 'function') {
      console.warn('renderNodeContent is not a function, skipping layout calculation');
      return;
    }

    try {
      // Use extracted layout calculation utility
      const layoutResult = calculateTreeLayout({
        brothers,
        relationships,
        familyKey,
        theme,
        layoutSettings,
      highlightBrotherId,
      lineageHighlightSet: lineageHighlightSet,
      renderNodeContent,
      isEmpire,
        onTreeBounds: (bounds) => {
          if (bounds && typeof bounds === 'object') {
            treeBoundsRef.current = bounds;
          }
        },
        });

      // Validate layout result before setting
      if (layoutResult && layoutResult.nodes && layoutResult.edges) {
        if (Array.isArray(layoutResult.nodes) && Array.isArray(layoutResult.edges)) {
          setNodes(layoutResult.nodes);
          setEdges(layoutResult.edges);
        } else {
          console.warn('Layout result invalid, nodes or edges are not arrays');
        }
      } else {
        console.warn('Layout result missing nodes or edges');
      }
    } catch (error) {
      console.error('Error calculating tree layout:', error);
      // Set empty arrays on error to prevent rendering issues
      setNodes([]);
      setEdges([]);
    }
  }, [
    brothers,
    relationships,
    familyKey,
    layoutSettings,
    highlightBrotherId,
    lineageHighlightSet,
    theme,
    renderNodeContent,
    loading,
    isEmpire,
  ]);

  // Separate effect to apply pledge class marker highlighting (Empire only)
  // This runs after nodes are set, avoiding infinite loops
  useEffect(() => {
    if (!isEmpire || !nodes || nodes.length === 0 || pledgeClassMarkers.length === 0) {
      return;
    }

    // Check both highlighted (clicked) and hovered states
    const activeMarkerLevel = highlightedPledgeClass !== null ? highlightedPledgeClass : hoveredMarkerLevel;
    
    // Prevent unnecessary updates if state hasn't changed
    const currentState = { highlighted: highlightedPledgeClass, hovered: hoveredMarkerLevel };
    if (
      lastHighlightStateRef.current.highlighted === currentState.highlighted &&
      lastHighlightStateRef.current.hovered === currentState.hovered
    ) {
      return; // State hasn't changed, skip update
    }
    lastHighlightStateRef.current = currentState;
    
    if (activeMarkerLevel === null) {
      // No active marker - ensure nodes are reset to default styles
      setNodes((currentNodes) => {
        let hasChanges = false;
        const updatedNodes = currentNodes.map((node) => {
          // Check if node has highlight styles
          const hasHighlight = node.style?.filter?.includes('brightness') || 
                               node.style?.boxShadow?.includes('rgba(201, 168, 87');
          if (!hasHighlight) {
            return node; // No changes needed
          }
          hasChanges = true;
          
          // Reset any previous highlighting
          const baseStyle = { ...node.style };
          delete baseStyle.filter;
          // Remove highlight glow from boxShadow if present
          if (baseStyle.boxShadow && baseStyle.boxShadow.includes('rgba(201, 168, 87')) {
            const shadows = baseStyle.boxShadow.split(', ');
            const filteredShadows = shadows.filter(s => !s.includes('rgba(201, 168, 87'));
            baseStyle.boxShadow = filteredShadows.join(', ') || '0 4px 12px rgba(0,0,0,0.08)';
          }
          return { ...node, style: baseStyle };
        });
        return hasChanges ? updatedNodes : currentNodes;
      });
      return;
    }

    const activeMarker = pledgeClassMarkers.find(m => m.level === activeMarkerLevel);
    if (!activeMarker || !activeMarker.nodeIds) {
      return;
    }

    const activeNodeIds = new Set(activeMarker.nodeIds);
    setNodes((currentNodes) => {
      let hasChanges = false;
      const updatedNodes = currentNodes.map((node) => {
        const isHighlighted = activeNodeIds.has(node.id);
        const expectedGlowOpacity = highlightedPledgeClass !== null ? 0.4 : 0.2;
        const expectedBrightness = highlightedPledgeClass !== null ? 1.1 : 1.05;
        
        // Check if node already has correct highlight styles
        const currentGlowOpacity = node.style?.boxShadow?.match(/rgba\(201, 168, 87, ([\d.]+)\)/)?.[1];
        const currentBrightness = node.style?.filter?.match(/brightness\(([\d.]+)\)/)?.[1];
        const hasCorrectHighlight = 
          isHighlighted &&
          currentGlowOpacity === String(expectedGlowOpacity) &&
          currentBrightness === String(expectedBrightness);
        
        if (hasCorrectHighlight) {
          return node; // Already has correct highlight, no changes needed
        }
        
        hasChanges = true;
        
        if (!isHighlighted) {
          // Reset non-highlighted nodes
          const baseStyle = { ...node.style };
          delete baseStyle.filter;
          if (baseStyle.boxShadow && baseStyle.boxShadow.includes('rgba(201, 168, 87')) {
            const shadows = baseStyle.boxShadow.split(', ');
            const filteredShadows = shadows.filter(s => !s.includes('rgba(201, 168, 87'));
            baseStyle.boxShadow = filteredShadows.join(', ') || '0 4px 12px rgba(0,0,0,0.08)';
          }
          return { ...node, style: baseStyle };
        }

        // Apply highlight style to nodes in this pledge class level
        const existingShadow = node.style?.boxShadow?.split(', ').find(s => !s.includes('rgba(201, 168, 87')) || '0 4px 12px rgba(0,0,0,0.08)';
        const newStyle = {
          ...node.style,
          boxShadow: `${existingShadow}, 0 0 0 3px rgba(201, 168, 87, ${expectedGlowOpacity})`,
          filter: `brightness(${expectedBrightness})`,
          transition: 'filter 0.3s ease, box-shadow 0.3s ease',
        };
        return { ...node, style: newStyle };
      });
      return hasChanges ? updatedNodes : currentNodes;
    });
  }, [isEmpire, highlightedPledgeClass, hoveredMarkerLevel, pledgeClassMarkers, nodes.length]);

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
    
    // Save current viewport before opening modal
    try {
      if (getViewport) {
        const currentViewport = getViewport();
        setViewportBeforeModal(currentViewport);
      }
    } catch (e) {
      // If viewport not available, that's okay
      console.warn('Failed to get viewport:', e);
    }
    
    setSelectedBrother(node.data.brother);
    setSelectedBrotherId(String(node.data.brother.id));
    setActiveMajor(null);
    setMajorResults([]);
    setIsModalOpen(true);
    
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
  }, [setCenter, getViewport]);

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

  // Define fitPaddingForBounds and fitTreeView BEFORE they're used in other callbacks
  // This prevents "Can't find variable" errors
  const fitPaddingForBounds = useCallback(() => {
    const { width, height } = treeBoundsRef.current;
    const longestSide = Math.max(width, height);
    if (!longestSide || !Number.isFinite(longestSide)) {
      return 0.25;
    }

    if (longestSide < 600) return 0.42;
    if (longestSide < 1200) return 0.28;
    if (longestSide < 2000) return 0.22;
    return 0.18;
  }, []);

  const fitTreeView = useCallback(
    (paddingOverride, duration = 500) => {
      try {
        if (reactFlowInstance && reactFlowInstance.fitView) {
          reactFlowInstance.fitView({
            padding: paddingOverride ?? fitPaddingForBounds(),
            duration,
          });
        }
      } catch (err) {
        console.warn('fitView failed:', err);
      }
    },
    [fitPaddingForBounds, reactFlowInstance],
  );
  
  // Ensure fitTreeView is always a function
  const safeFitTreeView = fitTreeView && typeof fitTreeView === 'function' ? fitTreeView : () => {};

  const closeProfile = useCallback(
    (restoreViewport = true) => {
      if (restoreViewport) {
        const targetViewport = viewportBeforeModal || initialViewportRef.current;
        try {
          if (targetViewport && reactFlowInstance?.setViewport) {
            reactFlowInstance.setViewport(targetViewport, { duration: 300 });
          } else if (safeFitTreeView) {
            safeFitTreeView(isEmpire ? 0.15 : undefined, 400);
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
    },
    [
      viewportBeforeModal,
      reactFlowInstance,
      isEmpire,
      restorePointerEvents,
      safeFitTreeView,
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

  // Auto-center and fit tree when family changes
  useEffect(() => {
    if (!isTreeReady || !nodes || nodes.length === 0) {
      return;
    }
    
    // Small delay to ensure ReactFlow is ready
    const timer = setTimeout(() => {
      try {
        if (safeFitTreeView && typeof safeFitTreeView === 'function') {
          safeFitTreeView(undefined, 400);
        } else if (reactFlowInstance?.fitView) {
          reactFlowInstance.fitView({
            padding: 50,
            duration: 400,
          });
        }
      } catch (e) {
        console.warn('Failed to fit view on family change:', e);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [safeFamily?.id, isTreeReady, nodes.length, safeFitTreeView, reactFlowInstance]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isEmpire) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        safeFitTreeView(isEmpire ? 0.15 : undefined, 450);
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
  }, [isEmpire, reactFlowInstance, minZoom, maxZoom, safeFitTreeView]);

  useEffect(() => {
    if (!isTreeReady || nodes.length === 0 || hasFitRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      try {
        safeFitTreeView();
        hasFitRef.current = true;
      } catch (err) {
        console.warn('Failed to fit view:', err);
      }
    });
  }, [isTreeReady, nodes, reactFlowInstance, isEmpire, safeFitTreeView]);

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
    showToast('Preparing export…');
    
    try {
      // Fit view to show entire tree
      fitTreeView();
      
      // Wait for view to settle
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Add print-specific class to body for print styles
      document.body.classList.add('printing-tree');
      
      // Trigger print dialog
      window.print();
      
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('printing-tree');
        setIsPreparingExport(false);
        showToast('Export ready. Use browser print dialog to save as PDF.');
      }, 100);
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed. Please try again.');
      setIsPreparingExport(false);
    }
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
      try {
        if (getViewport) {
          const currentViewport = getViewport();
          setViewportBeforeModal(currentViewport);
        }
      } catch (error) {
        console.warn('Failed to capture viewport before opening profile:', error);
      }
      focusBrotherNode(brotherId);
      setActiveMajor(null);
      setMajorResults([]);
      setSelectedBrother(target);
      setSelectedBrotherId(String(target.id));
      setIsModalOpen(true);
    },
    [brothers, focusBrotherNode, getViewport, showToast],
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
        {/* Add functionality removed - site is read-only */}
      </>
    );
  }

  // Header height constant - single combined bar
  // Combined bar with family tabs, search, and controls in one row
  // Updated header height for unified glass panel design
  const HEADER_HEIGHT = 136;

  // Handle null family case after all hooks
  if (!safeFamily || !safeFamily.theme) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>Family data not available. Please select a family.</p>
        </div>
      </div>
    );
  }

  // Render combined header if provided by parent
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

  return (
    <>
      {/* Combined header rendered by parent */}
      {renderCombinedHeader && headerProps && renderCombinedHeader(headerProps)}
      <div className="w-full relative" style={{ ...containerStyle, position: 'relative' }}>

      {toast && (
        <div
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
      {/* Add functionality removed - site is read-only. Use admin.html for adding brothers. */}
    <div
      style={{
          position: 'absolute',
          top: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: presentation.header.textColor,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          padding: '10px 24px 14px',
          background: presentation.header.panelBg,
          borderRadius: 18,
          boxShadow: presentation.header.shadow,
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: presentation.header.crestBg,
            color: presentation.header.crestColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: theme.titleFont,
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            border: `1px solid ${hexToRgba(presentation.accent, 0.4)}`,
          }}
        >
          {presentation.crestLetter}
        </span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8 }}>
            {presentation.subtitle}
          </div>
          <div
            style={{
              fontFamily: theme.titleFont,
              fontSize: '18px',
              letterSpacing: '0.25em',
              marginTop: 4,
            }}
          >
            {presentation.title}
          </div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          background: presentation.legend.panelBg,
          border: presentation.legend.border,
          color: presentation.legend.textColor,
          fontSize: '10px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          padding: '12px 16px',
          borderRadius: 12,
          pointerEvents: 'none',
          boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {presentation.legend.title}
        </div>
        {presentation.legend.lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div
          style={{
            borderTop: `1px solid ${hexToRgba(presentation.legend.textColor, 0.25)}`,
            margin: '8px 0',
            opacity: 0.6,
          }}
        />
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Tree Summary</div>
        <div>{`${pledgeSummary.totalBrothers} brothers`}</div>
        <div>{`${pledgeSummary.uniquePledgeClasses} pledge classes`}</div>
        {pledgeSummary.placeholderCount > 0 && (
          <div>{`${pledgeSummary.placeholderCount} awaiting assignment`}</div>
        )}
        {selectedBrother && (
          <div
            style={{
              marginTop: 6,
              paddingTop: 6,
              borderTop: `1px solid ${hexToRgba(presentation.legend.textColor, 0.18)}`,
              textTransform: 'none',
              letterSpacing: '0.02em',
      }}
    >
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Selected</div>
            <div>{selectedBrother.name}</div>
            <div style={{ opacity: 0.7 }}>
              {selectedBrother.pledge_class || 'Unassigned'}
            </div>
          </div>
        )}
      </div>
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
      >
        <Background color={theme.backgroundGrid} variant={theme.backgroundVariant || 'dots'} />
        <Controls />
        <MiniMap 
          nodeColor={theme.minimapNode}
          style={{ backgroundColor: theme.minimapBg }}
        />
      </ReactFlow>

      {/* Left-side Pledge Class Markers (Empire only) */}
      {isEmpire && pledgeClassMarkers.length > 0 && (
        <div
          key={`pledge-markers-${viewport.x}-${viewport.y}-${viewport.zoom}`} // Force re-render on viewport change
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '80px', // Fixed width for marker area
            height: '100%',
            pointerEvents: 'auto',
            zIndex: 2, // Above background, below nodes
            paddingTop: `calc(136px + env(safe-area-inset-top, 0px))`, // HEADER_HEIGHT = 136
            paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 4px)`, // BOTTOM_BUFFER = 4
          }}
        >
          {pledgeClassMarkers.map((marker, idx) => {
            // Use ReactFlow's flowToScreenPosition() to convert flow coordinates to screen coordinates
            // (Replaces deprecated project() method)
            let screenY;
            try {
              if (flowToScreenPosition && typeof flowToScreenPosition === 'function') {
                const screenPos = flowToScreenPosition({ x: 0, y: marker.y });
                screenY = screenPos.y;
              } else {
                // Fallback to manual calculation
                const currentViewport = viewport || defaultViewport || { x: 0, y: 0, zoom: 1 };
                screenY = (marker.y * currentViewport.zoom) + currentViewport.y;
              }
            } catch (error) {
              console.warn('Failed to convert flow to screen position:', error);
              const currentViewport = viewport || defaultViewport || { x: 0, y: 0, zoom: 1 };
              screenY = (marker.y * currentViewport.zoom) + currentViewport.y;
            }
            
            const isHighlighted = highlightedPledgeClass === marker.level;
            const isHovered = hoveredMarkerLevel === marker.level;
            
            return (
              <div
                key={`pledge-marker-${marker.level}-${idx}`}
                style={{
                  position: 'absolute',
                  left: '0',
                  top: `${screenY}px`,
                  width: '100%',
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'auto',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={() => setHoveredMarkerLevel(marker.level)}
                onMouseLeave={() => setHoveredMarkerLevel(null)}
                onClick={() => {
                  // Toggle highlight - click again to clear
                  setHighlightedPledgeClass(isHighlighted ? null : marker.level);
                }}
              >
                {/* Vertical bar */}
                <div
                  style={{
                    width: '4px',
                    height: '24px',
                    background: isHovered || isHighlighted
                      ? 'linear-gradient(to bottom, #e5c98f, #c5a666)' // Brighter on hover
                      : 'linear-gradient(to bottom, #d9b87b, #be9d5b)', // Default gradient
                    borderRadius: '2px',
                    transition: 'all 0.2s ease',
                    opacity: isHovered || isHighlighted ? 1 : 0.9,
                    cursor: 'pointer',
                  }}
                />
                
                {/* Label card */}
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    background: 'rgba(255, 255, 255, 0.35)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.55)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    color: '#3d3526',
                    fontSize: '10px',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'all 0.2s ease',
                    opacity: isHovered || isHighlighted ? 1 : 0.85,
                    transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {marker.label.length > 15 ? marker.label.substring(0, 15) + '...' : marker.label}
                  </div>
                  {marker.yearLabel && (
                    <div style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px' }}>
                      {marker.yearLabel}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
        />
      )}
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

