import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
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

  const theme = getThemeStyles(family.theme);
  const familyKey = family.theme;
  const { setCenter } = useReactFlow();

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
    }
  }, [family.id, onToast]);

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
    if (brothers.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const relationshipsMap = new Map();
    
    // Build relationship structure
    relationships.forEach(rel => {
      relationshipsMap.set(rel.little_id, rel.big_id);
    });

    // Layout algorithm: hierarchical with multiple roots
    const layoutNodes = [];
    const layoutEdges = [];
    const nodePositions = new Map();

    /**
     * Recursively calculates the level (depth from root) of a brother in the tree
     * 
     * @param {number} brotherId - ID of the brother to calculate level for
     * @param {Set<number>} visited - Set of visited IDs to prevent cycles
     * @param {number} depth - Current recursion depth to prevent infinite loops
     * @returns {number} Level (0 = root, 1+ = nested)
     */
    const getLevel = (brotherId, visited = new Set(), depth = 0) => {
      // Prevent infinite loops and cycles
      if (visited.has(brotherId) || depth > 100) return 0;
      visited.add(brotherId);
      const bigId = relationshipsMap.get(brotherId);
      if (!bigId) return 0; // Root node
      // Verify the big brother exists in the brothers array
      const bigExists = brothers.some(b => b.id === bigId);
      if (!bigExists) return 0; // Orphaned relationship, treat as root
      return 1 + getLevel(bigId, visited, depth + 1);
    };

    const levelMap = new Map();
    brothers.forEach(b => {
      const level = getLevel(b.id);
      if (!levelMap.has(level)) levelMap.set(level, []);
      levelMap.get(level).push(b.id);
    });

    // Calculate positions for each level
    const nodeWidth = 180;
    const nodeHeight = 80;
    const horizontalSpacing = 250;
    const verticalSpacing = 150;

    levelMap.forEach((brotherIds, level) => {
      const startX = -((brotherIds.length - 1) * horizontalSpacing) / 2;
      brotherIds.forEach((brotherId, index) => {
        const x = startX + index * horizontalSpacing;
        const y = level * verticalSpacing;
        nodePositions.set(brotherId, { x, y });
      });
    });

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
        // PRIDE: Dark background with muted gold border
        nodeStyle.background = '#181413';
        nodeStyle.border = `1.5px solid ${theme.accent}`; // #d4af7e muted gold
        nodeStyle.color = '#ffffff'; // White text
        nodeStyle.borderRadius = '0px'; // Photo-focused, crisp corners
      }

      // Build node label based on family theme
      let nodeLabel;
      
      if (familyKey === 'empire') {
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
    relationships.forEach(rel => {
      if (rel.big_id && rel.little_id) {
        // Verify both nodes exist in the brothers array and have positions
        const bigExists = brothers.some(b => b.id === rel.big_id);
        const littleExists = brothers.some(b => b.id === rel.little_id);
        const bigHasPosition = nodePositions.has(rel.big_id);
        const littleHasPosition = nodePositions.has(rel.little_id);
        
        if (bigExists && littleExists && bigHasPosition && littleHasPosition) {
          layoutEdges.push({
            id: `e${rel.big_id}-${rel.little_id}`,
            source: String(rel.big_id),
            target: String(rel.little_id),
            type: theme.edgeType || 'smoothstep',
            animated: theme.edgeAnimated !== undefined ? theme.edgeAnimated : true,
            style: { stroke: theme.edgeColor, strokeWidth: 2 },
          });
        }
      }
    });

    setNodes(layoutNodes);
    setEdges(layoutEdges);
    
    // Auto-fit view after nodes are set (with small delay to ensure React Flow is ready)
    if (layoutNodes.length > 0) {
      setTimeout(() => {
        setCenter(0, 0, { zoom: 1, duration: 0 });
      }, 100);
    }
  }, [brothers, relationships, theme, setCenter]);

  /**
   * Handles node click events - selects brother and smoothly zooms to node
   * 
   * @param {Object} event - React Flow node click event
   * @param {Object} node - React Flow node object with position and data
   * @param {Object} node.data.brother - Brother data object
   * @param {Object} node.position - Node position {x, y}
   */
  const onNodeClick = useCallback((event, node) => {
    setSelectedBrother(node.data.brother);
    // Smoothly center and zoom to the clicked node
    const { x, y } = node.position;
    const width = node.style?.width || 180;
    const height = node.style?.minHeight || 80;
    const zoom = 1.4; // tasteful zoom level
    setCenter(x + width / 2, y + height / 2, {
      zoom,
      duration: 500,
    });
  }, [setCenter]);

  const onPaneClick = useCallback((event) => {
    if (event.target.classList.contains('react-flow__pane')) {
      setSelectedBrother(null);
      // Don't close add form on pane click - let user finish adding
    }
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme.background }}>
        <div
          style={{
            fontSize: 'var(--text-xl)',
            fontFamily: 'var(--font-display)',
            color: theme.accent || 'var(--primary)',
          }}
        >
          Loading family tree...
        </div>
      </div>
    );
  }

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

  // Empty state - no brothers yet
  if (brothers.length === 0) {
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
        minHeight: 'calc(100vh - 60px)', // Account for header height
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundTexture,
        backgroundSize: '280px 280px',
        backgroundPosition: 'center',
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
        fitView
        style={{ background: theme.background, fontFamily: theme.bodyFont }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background color={theme.backgroundGrid} variant={theme.backgroundVariant || 'dots'} />
        <Controls />
        <MiniMap 
          nodeColor={theme.minimapNode}
          style={{ backgroundColor: theme.minimapBg }}
        />
      </ReactFlow>

      {selectedBrother && (
        <BrotherDetailModal
          brother={selectedBrother}
          familyId={family.id}
          onClose={() => setSelectedBrother(null)}
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

