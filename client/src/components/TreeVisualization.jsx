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
     * @returns {number} Level (0 = root, 1+ = nested)
     */
    const getLevel = (brotherId, visited = new Set()) => {
      if (visited.has(brotherId)) return 0;
      visited.add(brotherId);
      const bigId = relationshipsMap.get(brotherId);
      if (!bigId) return 0; // Root node
      return 1 + getLevel(bigId, visited);
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

      // Per-family refinements
      if (familyKey === 'power') {
        // Hexagon-like node using clip-path; transparent fill with gold stroke
        nodeStyle.background = 'transparent';
        nodeStyle.color = '#ffffff';
        nodeStyle.border = `3px solid ${theme.nodeBorder}`;
        nodeStyle.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        nodeStyle.borderRadius = '0px';
        nodeStyle.padding = '14px';
      }

      if (familyKey === 'empire') {
        nodeStyle.background = '#ffffff';
        nodeStyle.border = `1px solid ${theme.nodeBorder}`;
        nodeStyle.color = '#1f1f1f';
        nodeStyle.borderRadius = '2px';
      }

      if (familyKey === 'greed') {
        nodeStyle.background = '#ffffff';
        nodeStyle.border = '1px solid #e0e0e0';
        nodeStyle.color = '#333333';
      }

      if (familyKey === 'pride') {
        nodeStyle.background = '#181413';
        nodeStyle.border = `1.5px solid ${theme.accent}`;
        nodeStyle.color = '#ffffff';
      }

      layoutNodes.push({
        id: String(brother.id),
        data: {
          label: (
            <div className="text-center" style={{ fontFamily: theme.bodyFont }}>
              {familyKey === 'wolfpack' && (
                <div style={{ height: 6, background: '#3d5373', marginBottom: 6, borderRadius: 2 }} />
              )}
              <div className="font-semibold" style={{ fontFamily: theme.titleFont }}>
                {brother.name}
              </div>
              {isTransfer && <div className="text-xs text-gray-400 mt-1">(Transfer)</div>}
            </div>
          ),
          brother: brother,
        },
        position: position || { x: 0, y: 0 },
        style: nodeStyle,
      });
    });

    // Create edges
    relationships.forEach(rel => {
      if (rel.big_id && rel.little_id) {
        layoutEdges.push({
          id: `e${rel.big_id}-${rel.little_id}`,
          source: String(rel.big_id),
          target: String(rel.little_id),
          type: theme.edgeType || 'smoothstep',
          animated: theme.edgeAnimated !== undefined ? theme.edgeAnimated : true,
          style: { stroke: theme.edgeColor, strokeWidth: 2 },
        });
      }
    });

    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [brothers, relationships, theme]);

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
      setShowAddForm(false);
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
              color: theme.accent || 'var(--primary)',
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
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: theme.background }}>
        <div className="text-center container" style={{ maxWidth: '32rem', padding: 'var(--space-6)' }}>
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: 'var(--text-3xl)',
              fontFamily: 'var(--font-display)',
              color: theme.accent || 'var(--primary)',
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
            This family tree is empty. Add the first brother to get started!
          </p>
          <div className="flex justify-center" style={{ gap: 'var(--space-4)' }}>
            <button
              onClick={() => {
                setShowAddForm(true);
                setAddFormParent(null);
              }}
              className="btn"
              style={{
                backgroundColor: theme.accent,
                color: theme.theme === 'empire' ? '#1f1f1f' : theme.background,
                borderColor: theme.accent,
                fontWeight: 'var(--weight-bold)',
              }}
            >
              Add First Brother
            </button>
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
    );
  }

  return (
    <div
      className="w-full"
      style={{
        minHeight: 'calc(100vh - 60px)', // Account for header height
        backgroundColor: theme.background,
        backgroundImage: theme.backgroundTexture,
        backgroundSize: '280px 280px',
        backgroundPosition: 'center',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        style={{ background: theme.background, fontFamily: theme.bodyFont }}
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
          onAddLittle={(e, node) => {
            if (selectedBrother) {
              setSelectedBrother(null);
              setAddFormParent(selectedBrother);
              setShowAddForm(true);
            }
          }}
          onToast={onToast}
        />
      )}

      {showAddForm && addFormParent && (
        <AddNodeForm
          parentBrother={addFormParent}
          familyId={family.id}
          onClose={() => {
            setShowAddForm(false);
            setAddFormParent(null);
          }}
          onSuccess={handleNodeUpdate}
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

