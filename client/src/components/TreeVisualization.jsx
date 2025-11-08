import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { families as familiesApi } from '../api';
import BrotherDetailModal from './BrotherDetailModal';
import AddNodeForm from './AddNodeForm';
import { getThemeStyles } from '../themes';
import { hexToRgba } from '../utils/color';

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
const TreeVisualizationInner = ({ family, onToast, onChangeFamily }) => {
  const [brothers, setBrothers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedBrother, setSelectedBrother] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormParent, setAddFormParent] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTreeReady, setIsTreeReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewportBeforeModal, setViewportBeforeModal] = useState(null);
  const reactFlowInstance = useReactFlow();

  // Memoize theme to prevent infinite re-renders
  const theme = useMemo(() => getThemeStyles(family.theme), [family.theme]);
  const familyKey = family.theme;
  const { setCenter, getViewport } = reactFlowInstance;

  /**
   * Loads family tree data (brothers and relationships) from the API
   * 
   * @async
   * @function loadTreeData
   * @throws {Error} If API request fails
   */
  const loadTreeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsTreeReady(false); // Reset fade-in state when loading new family
      const response = await familiesApi.getTree(family.id);
      setBrothers(response.data.brothers || []);
      setRelationships(response.data.relationships || []);
    } catch (error) {
      console.error('Failed to load tree data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load family tree');
      if (onToast) {
        onToast({ message: 'Failed to load family tree. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
      // Trigger fade-in animation after data is loaded
      setTimeout(() => {
        setIsTreeReady(true);
      }, 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family.id]); // Only depend on family.id to prevent infinite loops

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  /**
   * Calculates tree layout using BFS algorithm and creates React Flow nodes/edges
   * 
   * Organizes brothers into hierarchical levels based on relationships:
   * - Level 0: Root nodes (no big brother)
   * - Level N: Nodes N levels deep from root
   * 
   * Positions nodes in a grid layout with configurable spacing.
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

    // Build relationship structure: parent -> children
    const relationshipsMap = new Map(); // little_id -> big_id
    const childrenMap = new Map(); // big_id -> [little_ids]
    
    relationships.forEach(rel => {
      if (rel.big_id && rel.little_id) {
        relationshipsMap.set(rel.little_id, rel.big_id);
        if (!childrenMap.has(rel.big_id)) {
          childrenMap.set(rel.big_id, []);
        }
        childrenMap.get(rel.big_id).push(rel.little_id);
      }
    });

    // Layout algorithm: Binary tree vertical layout
    const layoutNodes = [];
    const layoutEdges = [];
    const nodePositions = new Map();
    
    // Node dimensions
    const nodeWidth = 180;
    const nodeHeight = 100;
    const horizontalSpacing = 280; // Space between siblings
    const verticalSpacing = 200; // Space between generations

    /**
     * Recursively calculates the width needed for a subtree
     * @param {number} rootId - Root of the subtree
     * @returns {number} Width needed for this subtree
     */
    const getSubtreeWidth = (rootId) => {
      const children = childrenMap.get(rootId) || [];
      if (children.length === 0) {
        return horizontalSpacing;
      }
      return children.reduce((sum, childId) => sum + getSubtreeWidth(childId), 0);
    };

    /**
     * Recursively positions nodes in a binary tree layout
     * @param {number} nodeId - ID of the node to position
     * @param {number} x - X position (center of subtree)
     * @param {number} y - Y position (generation level)
     */
    const positionNode = (nodeId, x, y) => {
      nodePositions.set(nodeId, { x, y });
      
      const children = childrenMap.get(nodeId) || [];
      if (children.length === 0) {
        return;
      }

      // Calculate positions for children
      let currentX = x;
      const totalWidth = children.reduce((sum, childId) => sum + getSubtreeWidth(childId), 0);
      const startX = x - totalWidth / 2;

      children.forEach((childId, index) => {
        const childWidth = getSubtreeWidth(childId);
        const childX = startX + (childWidth / 2) + children.slice(0, index).reduce((sum, cid) => sum + getSubtreeWidth(cid), 0);
        positionNode(childId, childX, y + verticalSpacing);
      });
    };

    // Find root nodes (nodes with no big_id)
    const rootNodes = brothers.filter(b => {
      const bigId = relationshipsMap.get(b.id);
      return !bigId || !brothers.some(br => br.id === bigId);
    });

    // Position root nodes at the top
    if (rootNodes.length > 0) {
      const totalWidth = rootNodes.reduce((sum, root) => {
        const rootId = root.id;
        const children = childrenMap.get(rootId) || [];
        return sum + (children.length > 0 ? getSubtreeWidth(rootId) : horizontalSpacing);
      }, 0);
      
      let currentX = -totalWidth / 2;
      
      rootNodes.forEach((root) => {
        const rootId = root.id;
        const children = childrenMap.get(rootId) || [];
        const subtreeWidth = children.length > 0 ? getSubtreeWidth(rootId) : horizontalSpacing;
        const rootX = currentX + subtreeWidth / 2;
        positionNode(rootId, rootX, 0);
        currentX += subtreeWidth;
      });
    } else {
      // No roots found, just position all nodes in a simple grid
      const levelMap = new Map();
      brothers.forEach(b => {
        const bigId = relationshipsMap.get(b.id);
        const level = bigId ? 1 : 0;
        if (!levelMap.has(level)) levelMap.set(level, []);
        levelMap.get(level).push(b.id);
      });
      
      levelMap.forEach((nodeIds, level) => {
        const spacing = horizontalSpacing;
        const startX = -((nodeIds.length - 1) * spacing) / 2;
        nodeIds.forEach((nodeId, index) => {
          nodePositions.set(nodeId, { x: startX + index * spacing, y: level * verticalSpacing });
        });
      });
    }

    // Create React Flow nodes
    brothers.forEach(brother => {
      const position = nodePositions.get(brother.id);
      const status = brother.status === 'studying' ? 'studying' : 'graduated';
      const isTransfer = brother.is_transfer === 1;
      
      const nodeStyle = {
        background: status === 'studying' ? theme.nodeStudying : theme.nodeGraduated,
        color: theme.nodeText,
        border: `2px solid ${theme.nodeBorder}`,
        borderRadius: `${theme.nodeRadius || 8}px`,
        padding: '10px',
        width: nodeWidth,
        minHeight: nodeHeight,
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
      };

      // Per-family refinements based on family-tree-corrected.md specifications
      if (familyKey === 'power') {
        // POWER: Hexagon shapes with transparent fill and champagne gold border
        nodeStyle.background = 'transparent';
        nodeStyle.color = '#ffffff'; // White text
        nodeStyle.border = `3px solid ${theme.nodeBorder}`; // #ebd290 gold
        nodeStyle.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        nodeStyle.borderRadius = '0px'; // Hexagons use clip-path
        nodeStyle.padding = '14px';
        nodeStyle.boxShadow = '0 4px 16px rgba(235, 210, 144, 0.3)'; // Subtle gold glow
      }

      if (familyKey === 'empire') {
        // EMPIRE: Elegant white boxes with tan borders, 2px border-radius (from spec: border-radius: 2px)
        nodeStyle.background = '#ffffff';
        nodeStyle.border = `1px solid ${theme.nodeBorder}`; // #d4c9b3 tan border
        nodeStyle.color = '#1f1f1f'; // Very dark gray/black text
        nodeStyle.borderRadius = '2px'; // From spec: border-radius: 2px
        nodeStyle.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; // Subtle shadow
        nodeStyle.padding = '10px 12px'; // Slightly more padding for richer content
        nodeStyle.minHeight = '100px'; // Taller nodes for EMPIRE to fit more info
      }

      if (familyKey === 'greed') {
        // GREED: White boxes with crisp corners, dark text (UPPERCASE style)
        nodeStyle.background = '#ffffff';
        nodeStyle.border = '1px solid #e0e0e0'; // Light gray border
        nodeStyle.color = '#333333'; // Dark text on white boxes
        nodeStyle.borderRadius = '0px'; // Crisp corners (0px from spec)
        nodeStyle.padding = '8px 12px'; // From spec
      }

      if (familyKey === 'wolfpack') {
        // WOLFPACK: White boxes with dark blue header bar
        nodeStyle.background = '#ffffff';
        nodeStyle.border = `1px solid #d0d0d0`; // Light border
        nodeStyle.color = '#3d5373'; // Dark blue text in boxes (but tabs/headers are white)
        nodeStyle.borderRadius = '0px'; // Crisp corners
        nodeStyle.padding = '10px 12px'; // From spec: padding: 10px 12px
      }

      if (familyKey === 'pride') {
        // PRIDE: Deep espresso background with muted gold border and glow
        nodeStyle.background = '#231d17';
        nodeStyle.border = `1.5px solid ${theme.accent}`; // #d4af7e muted gold
        nodeStyle.color = '#f8f5ef'; // Soft ivory text
        nodeStyle.borderRadius = '0px'; // Photo-focused, crisp corners
        nodeStyle.padding = '12px';
        nodeStyle.boxShadow = '0 10px 24px rgba(0,0,0,0.45)';
      }

      // Build node label based on family theme
      let nodeLabel;
      
      if (familyKey === 'pride') {
        nodeLabel = (
          <div
            style={{
              fontFamily: theme.bodyFont,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              textAlign: 'left',
              color: '#f8f5ef',
            }}
          >
            {/* Accent bar */}
            <div
              style={{
                height: 3,
                background: 'linear-gradient(90deg, rgba(212, 175, 126, 0.6), rgba(212, 175, 126, 0))',
                marginLeft: '-12px',
                marginRight: '-12px',
                marginTop: '-4px',
                marginBottom: 6,
              }}
            />
            {/* Name */}
            <div
              style={{
                fontFamily: theme.titleFont,
                fontSize: '12px',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: '#d4af7e',
                lineHeight: 1.2,
              }}
            >
              {brother.name}
            </div>
            {/* Pledge Class */}
            {brother.pledge_class && (
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.4px',
                  color: '#f8f5ef',
                  opacity: 0.85,
                }}
              >
                {brother.pledge_class}
              </div>
            )}
            {/* Graduation year / status */}
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(248, 245, 239, 0.75)',
              }}
            >
              {brother.graduation_year
                ? `Class of ${brother.graduation_year}`
                : brother.status === 'graduated'
                    ? 'Graduated'
                    : 'Currently Studying'}
            </div>
            {/* Major */}
            {brother.major && (
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(248, 245, 239, 0.6)',
                  fontStyle: 'italic',
                }}
              >
                {brother.major}
              </div>
            )}
            {/* Transfer indicator */}
            {isTransfer && (
              <div
                style={{
                  fontSize: '9px',
                  color: 'rgba(212, 175, 126, 0.7)',
                  fontStyle: 'italic',
                }}
              >
                (Transfer)
              </div>
            )}
          </div>
        );
      } else if (familyKey === 'empire') {
        // EMPIRE: Rich node with multiple fields per spec
        nodeLabel = (
          <div style={{ 
            fontFamily: theme.bodyFont,
            width: '100%',
            minHeight: nodeHeight,
          }}>
            {/* Gold accent bar */}
            <div style={{ 
              height: 3, 
              background: 'linear-gradient(90deg, transparent, #c9a857, transparent)', 
              marginBottom: 6,
              marginLeft: '-8px',
              marginRight: '-8px',
              borderRadius: 2,
            }} />
            
            {/* Member Name - Title Case, 10-11px, dark text */}
            <div 
              style={{ 
                fontFamily: 'Inter, Arial, sans-serif',
                fontSize: '11px',
                fontWeight: 600,
                color: '#1f1f1f',
                textTransform: 'capitalize',
                marginBottom: 4,
                lineHeight: '1.3',
              }}
            >
              {brother.name}
            </div>
            
            {/* Pledge Class - Gold, 9-10px */}
            {brother.pledge_class && (
              <div 
                style={{ 
                  fontSize: '9px',
                  color: '#c9a857',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  marginBottom: 3,
                }}
              >
                {brother.pledge_class.toUpperCase()}
              </div>
            )}
            
            {/* Graduation Year or Status - Secondary text */}
            <div 
              style={{ 
                fontSize: '9px',
                color: '#666666',
                marginBottom: brother.major ? 3 : 0,
              }}
            >
              {brother.graduation_year ? `Class of ${brother.graduation_year}` : 
               brother.status === 'graduated' ? 'Graduated' : 'Currently Studying'}
            </div>
            
            {/* Major - Smaller, tertiary text */}
            {brother.major && (
              <div 
                style={{ 
                  fontSize: '8px',
                  color: '#999999',
                  fontStyle: 'italic',
                  marginTop: 2,
                }}
              >
                {brother.major}
              </div>
            )}
            
            {/* Transfer indicator */}
            {isTransfer && (
              <div 
                style={{ 
                  fontSize: '8px',
                  color: '#999999',
                  fontStyle: 'italic',
                  marginTop: 4,
                }}
              >
                (Transfer)
              </div>
            )}
          </div>
        );
      } else {
        // Other families: simpler node design
        nodeLabel = (
          <div className="text-center" style={{ fontFamily: theme.bodyFont }}>
            {familyKey === 'wolfpack' && (
              // WOLFPACK: Dark blue header bar at top of white box
              <div style={{ 
                height: 6, 
                background: '#3d5373', 
                marginBottom: 6, 
                borderRadius: 0,
                marginLeft: '-10px',
                marginRight: '-10px',
                marginTop: '-10px',
              }} />
            )}
            <div 
              className="font-semibold" 
              style={{ 
                fontFamily: theme.titleFont,
                textTransform: familyKey === 'greed' ? 'uppercase' : 'none', // GREED uses UPPERCASE
                fontSize: familyKey === 'greed' ? '10px' : '12px', // From spec: 10-11px
                color: theme.nodeText,
              }}
            >
              {brother.name}
            </div>
            {isTransfer && (
              <div 
                className="text-xs mt-1" 
                style={{ 
                  color: familyKey === 'empire' ? '#999999' : 
                         familyKey === 'power' ? '#999999' :
                         'rgba(156, 163, 175, 1)',
                  fontStyle: 'italic', // Transfer labels in italic per spec
                }}
              >
                (Transfer)
              </div>
            )}
          </div>
        );
      }

      // Add node with position (fallback to 0,0 if not calculated)
      layoutNodes.push({
        id: String(brother.id),
        data: {
          label: nodeLabel,
          brother: brother,
        },
        position: position || { x: 0, y: 0 },
        style: nodeStyle,
      });
    });

    // Create edges - only if both nodes exist
    // Use a more visible edge color for lineage
    const edgeColor = theme.edgeColor || theme.accent || '#666666';
    // Make edges thicker and more visible for clear lineage
    const edgeStrokeWidth = 4;
    
    relationships.forEach(rel => {
      if (rel.big_id && rel.little_id) {
        // Verify both nodes exist in the brothers array
        const bigExists = brothers.some(b => b.id === rel.big_id);
        const littleExists = brothers.some(b => b.id === rel.little_id);
        
        // Only check if nodes exist - positions are guaranteed if they're in brothers array
        if (bigExists && littleExists) {
          // Use smoothstep for better lineage visualization, or respect theme
          const edgeType = theme.edgeType || 'smoothstep';
          
          const edge = {
            id: `e${rel.big_id}-${rel.little_id}`,
            source: String(rel.big_id),
            target: String(rel.little_id),
            type: edgeType,
            animated: theme.edgeAnimated !== undefined ? theme.edgeAnimated : false,
            style: { 
              stroke: edgeColor, 
              strokeWidth: edgeStrokeWidth,
              opacity: 1,
            },
            markerEnd: MarkerType.ArrowClosed,
          };
          layoutEdges.push(edge);
        }
      }
    });

    setNodes(layoutNodes);
    setEdges(layoutEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brothers, relationships, familyKey]); // Use familyKey instead of theme object to prevent loops

  /**
   * Handles node click events - selects brother and smoothly zooms to node
   * 
   * @param {Object} event - React Flow node click event
   * @param {Object} node - React Flow node object with position and data
   * @param {Object} node.data.brother - Brother data object
   * @param {Object} node.position - Node position {x, y}
   */
  const onNodeClick = useCallback((event, node) => {
    // Save current viewport before opening modal
    try {
      const currentViewport = getViewport();
      setViewportBeforeModal(currentViewport);
    } catch (e) {
      // If viewport not available, that's okay
    }
    
    setSelectedBrother(node.data.brother);
    setIsModalOpen(true);
    // Smoothly center and zoom to the clicked node
    const { x, y } = node.position;
    const width = node.style?.width || 180;
    const height = node.style?.minHeight || 80;
    const zoom = 1.4; // tasteful zoom level
    setCenter(x + width / 2, y + height / 2, {
      zoom,
      duration: 500,
    });
  }, [setCenter, getViewport]);

  const onPaneClick = useCallback((event) => {
    if (event.target.classList.contains('react-flow__pane')) {
      setSelectedBrother(null);
      setIsModalOpen(false);
      // Don't close add form on pane click - let user finish adding
    }
  }, []);

  // Effect to restore ReactFlow interactions after modal closes
  useEffect(() => {
    if (!isModalOpen && !selectedBrother) {
      // Modal is closed, ensure ReactFlow is interactive
      // The viewport restoration in onClose should handle most cases,
      // but we'll ensure pointer events are correct as a fallback
      const restoreInteractions = () => {
        const reactFlowWrapper = document.querySelector('.react-flow');
        if (reactFlowWrapper) {
          reactFlowWrapper.style.pointerEvents = 'auto';
        }
      };
      
      // Small delay to ensure modal is fully unmounted
      setTimeout(restoreInteractions, 100);
    }
  }, [isModalOpen, selectedBrother]);

  const handleAddNodeClick = useCallback((event, node) => {
    if (event) event.stopPropagation();
    const brother = node?.data?.brother || node;
    setAddFormParent(brother);
    setShowAddForm(true);
  }, []);

  const handleNodeUpdate = useCallback(() => {
    loadTreeData();
    setSelectedBrother(null);
  }, [loadTreeData]);

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
            {family.name} Family Tree
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
            <button onClick={loadTreeData} className="btn btn-primary">
              Retry
            </button>
            {onChangeFamily && (
              <button onClick={onChangeFamily} className="btn btn-secondary">
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
              {family.name} Family Tree
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
              {onChangeFamily && (
                <button 
                  onClick={onChangeFamily} 
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

  return (
    <div
      className="w-full relative"
      style={{
        width: '100%',
        height: '100vh',
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundTexture,
        backgroundSize: '280px 280px',
        backgroundPosition: 'center',
        pointerEvents: 'auto',
        opacity: isTreeReady ? 1 : 0,
        transform: isTreeReady ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
      }}
    >
      {/* Add functionality removed - site is read-only. Use admin.html for adding brothers. */}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        style={{ 
          width: '100%', 
          height: '100%', 
          background: theme.background, 
          fontFamily: theme.bodyFont, 
          pointerEvents: isModalOpen ? 'none' : 'auto',
          zIndex: 1,
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
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
          familyId={family.id}
          onClose={() => {
            // Restore viewport to state before opening modal
            if (viewportBeforeModal) {
              try {
                reactFlowInstance.setViewport(viewportBeforeModal, { duration: 300 });
              } catch (e) {
                // If viewport restore fails, continue anyway
              }
            }
            setSelectedBrother(null);
            setIsModalOpen(false);
            setViewportBeforeModal(null);
          }}
          onUpdate={handleNodeUpdate}
          theme={theme}
          onToast={onToast}
        />
      )}
    </div>
  );
};

const TreeVisualization = ({ family, onToast, onChangeFamily }) => {
  return (
    <ReactFlowProvider>
      <TreeVisualizationInner family={family} onToast={onToast} onChangeFamily={onChangeFamily} />
    </ReactFlowProvider>
  );
};

export default TreeVisualization;

