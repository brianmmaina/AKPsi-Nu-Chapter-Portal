import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
const statusLabelForBrother = (brother) => {
  const normalized = (brother.status || '').toLowerCase().trim();
  const gradYear = brother.graduation_year;

  if (normalized === 'graduated' || normalized === 'alumni') {
    return gradYear ? `Graduated · ${gradYear}` : 'Graduated';
  }

  if (normalized === 'studying' || normalized === 'active' || normalized === 'current') {
    return 'Currently Studying';
  }

  if (normalized === 'prospective') {
    return 'Prospective Member';
  }

  if (gradYear) {
    return `Class of ${gradYear}`;
  }

  return brother.status || 'Status Pending';
};

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
  const initialViewportRef = useRef(null);
  const hasFitRef = useRef(false);
  const reactFlowInstance = useReactFlow();

  // Memoize theme to prevent infinite re-renders
  const theme = useMemo(() => getThemeStyles(family.theme), [family.theme]);
  const familyKey = family.theme;
  const isEmpire = familyKey === 'empire';
  const defaultViewport = useMemo(
    () => (isEmpire ? { x: 0, y: 0, zoom: 0.6 } : { x: 0, y: 0, zoom: 0.75 }),
    [isEmpire],
  );
  const minZoom = isEmpire ? 0.12 : 0.2;
  const maxZoom = isEmpire ? 1.4 : 2;
  const composedBackground = useMemo(() => {
    const layers = [];
    if (isEmpire) {
      layers.push(
        'radial-gradient(circle at 50% -10%, rgba(201,168,87,0.18) 0%, rgba(248,247,243,0) 55%)',
      );
      layers.push(
        'linear-gradient(135deg, rgba(160,130,62,0.12) 0%, rgba(248,247,243,0) 60%)',
      );
    }
    if (theme.backgroundTexture) {
      layers.push(theme.backgroundTexture);
    }
    return layers.join(', ');
  }, [isEmpire, theme.backgroundTexture]);

  const containerStyle = useMemo(() => {
    const sizeValue = isEmpire
      ? theme.backgroundTexture
        ? '100% 100%, 100% 100%, 280px 280px'
        : '100% 100%, 100% 100%'
      : theme.backgroundTexture
        ? '280px 280px'
        : undefined;

    return {
      width: '100%',
      height: '100vh',
      backgroundColor: theme.background,
      backgroundImage: composedBackground || undefined,
      backgroundSize: sizeValue,
      backgroundPosition: 'center',
      pointerEvents: 'auto',
      opacity: isTreeReady ? 1 : 0,
      transform: isTreeReady ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity var(--motion-med) var(--ease-standard), transform var(--motion-med) var(--ease-standard)',
      position: 'relative',
      overflow: 'hidden',
    };
  }, [theme.background, composedBackground, isEmpire, isTreeReady, theme.backgroundTexture]);
  const renderEmpireNodeContent = (brother) => {
    const pledgeLabel = brother.pledge_class
      ? brother.pledge_class.toUpperCase()
      : 'UNDECLARED';

    const statusLabel = statusLabelForBrother(brother);
    const classLabel = brother.graduation_year ? `Class of ${brother.graduation_year}` : null;

    return (
      <div
        title={`Pledge Class ${pledgeLabel}${statusLabel ? ` · ${statusLabel}` : ''}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <div
            style={{
              fontSize: '9px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(201,168,87,0.18)',
              color: '#6d5122',
              fontWeight: 600,
            }}
          >
            {pledgeLabel}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: theme.titleFont,
              fontSize: '13px',
              letterSpacing: '0.4px',
              color: '#3b2b16',
              marginBottom: 4,
            }}
          >
            {brother.name}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(59, 43, 22, 0.72)',
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}
          >
            {statusLabel}
          </div>
          {classLabel && (
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(59, 43, 22, 0.62)',
                letterSpacing: '0.2px',
              }}
            >
              {classLabel}
            </div>
          )}
        </div>
      </div>
    );
  };
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
    const horizontalSpacing = isEmpire ? 220 : 260;
    const baseVerticalSpacing = isEmpire ? 150 : 160;
    const pledgeVerticalSpacing = isEmpire ? 130 : 140;

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
        positionNode(childId, childX, y + baseVerticalSpacing);
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
          nodePositions.set(nodeId, { x: startX + index * spacing, y: level * baseVerticalSpacing });
        });
      });
    }
    if (isEmpire) {
      brothers.forEach((brother) => {
        const children = childrenMap.get(brother.id) || [];
        if (children.length === 0) {
          return;
        }
        const childXs = children
          .map((childId) => nodePositions.get(childId))
          .filter(Boolean)
          .map((pos) => pos.x);
        if (childXs.length === 0) {
          return;
        }
        const avgX = childXs.reduce((sum, x) => sum + x, 0) / childXs.length;
        const currentPos = nodePositions.get(brother.id);
        if (currentPos) {
          nodePositions.set(brother.id, { ...currentPos, x: avgX });
        }
      });
    }

    const pledgeOrder = [
      'alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega',
      'alpha alpha','alpha beta','alpha gamma','alpha delta','alpha epsilon','alpha zeta','alpha eta','alpha theta','alpha iota','alpha kappa','alpha lambda','alpha mu','alpha nu','alpha xi','alpha omicron','alpha pi','alpha rho','alpha sigma','alpha tau','alpha upsilon','alpha phi','alpha chi','alpha psi','alpha omega',
    ];
    const pledgeIndex = new Map(pledgeOrder.map((pledge, idx) => [pledge, idx]));
    const pledgeSynonyms = {
      'alphabeta': 'alpha beta',
      'alpha beta': 'alpha beta',
      'alpha-beta': 'alpha beta',
      'alpha gamma': 'alpha gamma',
      'alphagamma': 'alpha gamma',
      'alphazeta': 'alpha zeta',
      'alpha zeta': 'alpha zeta',
      'alphatheta': 'alpha theta',
      'alpha theta': 'alpha theta',
      'alpha eta': 'alpha eta',
      'alphaeta': 'alpha eta',
      'alpha iota': 'alpha iota',
      'alphaiota': 'alpha iota',
      'alpha lambda': 'alpha lambda',
      'alphalambda': 'alpha lambda',
      'alpha mu': 'alpha mu',
      'alphamu': 'alpha mu',
      'alpha nu': 'alpha nu',
      'alphan u': 'alpha nu',
      'alpha xi': 'alpha xi',
      'alphaxi': 'alpha xi',
      'alpha omicron': 'alpha omicron',
      'alphaomicron': 'alpha omicron',
      'alpha pi': 'alpha pi',
      'alphapi': 'alpha pi',
      'alpha rho': 'alpha rho',
      'alpharho': 'alpha rho',
      'alpha sigma': 'alpha sigma',
      'alphasigma': 'alpha sigma',
      'alpha tau': 'alpha tau',
      'alphatau': 'alpha tau',
      'alpha upsilon': 'alpha upsilon',
      'alphaupsilon': 'alpha upsilon',
      'alpha phi': 'alpha phi',
      'alphaphi': 'alpha phi',
      'alpha chi': 'alpha chi',
      'alphachi': 'alpha chi',
      'alpha psi': 'alpha psi',
      'alphapsi': 'alpha psi',
      'alpha omega': 'alpha omega',
      'alphaomega': 'alpha omega',
    };

    const letterToGreek = {
      a: 'alpha',
      b: 'beta',
      g: 'gamma',
      d: 'delta',
      e: 'epsilon',
      z: 'zeta',
      h: 'eta',
      t: 'theta',
      i: 'iota',
      k: 'kappa',
      l: 'lambda',
      m: 'mu',
      n: 'nu',
      x: 'xi',
      o: 'omicron',
      p: 'pi',
      r: 'rho',
      s: 'sigma',
      u: 'upsilon',
      f: 'phi',
      c: 'chi',
      y: 'psi',
      w: 'omega',
    };

    const normalizePledge = (value) =>
      value
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const expandDoubleLetter = (normalized) => {
      const compact = normalized.replace(/\s+/g, '');
      if (compact.length === 2) {
        const first = letterToGreek[compact[0]];
        const second = letterToGreek[compact[1]];
        if (first && second) {
          return `${first} ${second}`;
        }
      }
      return null;
    };

    const getPledgeLevel = (pledgeClass, fallback) => {
      if (!pledgeClass || typeof pledgeClass !== 'string') return fallback;
      const normalized = normalizePledge(pledgeClass);
      if (!normalized) return fallback;

      const synonym = pledgeSynonyms[normalized];
      const canonical = synonym || normalized;

      if (pledgeIndex.has(canonical)) {
        return pledgeIndex.get(canonical);
      }

      const expanded = expandDoubleLetter(canonical);
      if (expanded && pledgeIndex.has(expanded)) {
        return pledgeIndex.get(expanded);
      }

      return fallback;
    };

    const adjustedPositions = new Map();
    const queue = [];
    brothers.forEach((brother) => {
      const pos = nodePositions.get(brother.id);
      if (pos) {
        const depthLevel = Math.floor(pos.y / baseVerticalSpacing);
        const pledgeLevel = getPledgeLevel(brother.pledge_class, depthLevel);
        adjustedPositions.set(brother.id, {
          ...pos,
          depthLevel,
          pledgeLevel,
        });
      }
    });

    const enforceHierarchy = (nodeId) => {
      const current = adjustedPositions.get(nodeId);
      if (!current) return;
      const children = childrenMap.get(nodeId) || [];
      children.forEach((childId) => {
        const childPos = adjustedPositions.get(childId);
        if (!childPos) return;
        if (childPos.pledgeLevel <= current.pledgeLevel) {
          childPos.pledgeLevel = current.pledgeLevel + 1;
        }
        enforceHierarchy(childId);
      });
    };

    brothers.forEach((brother) => {
      if (!relationshipsMap.get(brother.id)) {
        enforceHierarchy(brother.id);
      }
    });

    const levelRemap = new Map();
    Array.from(new Set(Array.from(adjustedPositions.values()).map(({ pledgeLevel }) => pledgeLevel)))
      .sort((a, b) => a - b)
      .forEach((level, idx) => levelRemap.set(level, idx));

    brothers.forEach((brother) => {
      const info = adjustedPositions.get(brother.id);
      if (!info) return;
      const remappedLevel = levelRemap.get(info.pledgeLevel) ?? info.pledgeLevel;
      nodePositions.set(brother.id, {
        x: info.x,
        y: remappedLevel * pledgeVerticalSpacing,
      });
    });

    // Create React Flow nodes
    brothers.forEach(brother => {
      let position = nodePositions.get(brother.id);
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
      if (familyKey === 'empire') {
        nodeStyle.background = '#fff4dd';
        nodeStyle.border = '1px solid rgba(163, 124, 51, 0.4)';
        nodeStyle.color = '#3b2b16';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '14px 16px 14px 26px';
        nodeStyle.minHeight = '108px';
        nodeStyle.boxShadow = '0 12px 28px rgba(58, 33, 3, 0.18), 0 6px 14px rgba(201, 168, 87, 0.18)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(201,168,87,0.6) 0px, rgba(201,168,87,0.6) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(201,168,87,0.22), transparent 55%)';
        nodeStyle.backgroundSize = '9px 100%, 100% 100%';
        nodeStyle.backgroundRepeat = 'no-repeat, no-repeat';
        nodeStyle.backgroundPosition = 'left top, center';
      } else if (familyKey === 'power') {
        nodeStyle.background = '#0f2031';
        nodeStyle.border = `1.5px solid ${theme.accent}`;
        nodeStyle.color = '#ffffff';
        nodeStyle.borderRadius = '6px';
        nodeStyle.padding = '14px 18px 14px 26px';
        nodeStyle.minHeight = '108px';
        nodeStyle.boxShadow = '0 14px 28px rgba(8, 16, 24, 0.45), 0 4px 10px rgba(235, 210, 144, 0.25)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(235,210,144,0.55) 0px, rgba(235,210,144,0.55) 9px, transparent 9px)';
        nodeStyle.backgroundSize = '9px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      } else if (familyKey === 'greed') {
        nodeStyle.background = '#ffffff';
        nodeStyle.border = `1px solid ${theme.nodeBorder}`;
        nodeStyle.color = '#1f3326';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '12px 16px 12px 24px';
        nodeStyle.minHeight = '104px';
        nodeStyle.boxShadow = '0 10px 24px rgba(9,53,32,0.18), 0 4px 10px rgba(244, 217, 97, 0.15)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(244,217,97,0.35) 0px, rgba(244,217,97,0.35) 8px, transparent 8px)';
        nodeStyle.backgroundSize = '8px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      } else if (familyKey === 'wolfpack') {
        nodeStyle.background = '#ffffff';
        nodeStyle.border = '1px solid rgba(61, 83, 115, 0.35)';
        nodeStyle.color = '#2c3f5f';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '13px 16px 13px 24px';
        nodeStyle.minHeight = '106px';
        nodeStyle.boxShadow = '0 12px 26px rgba(54, 76, 115, 0.22), 0 4px 12px rgba(61, 83, 115, 0.18)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(61,83,115,0.45) 0px, rgba(61,83,115,0.45) 9px, transparent 9px)';
        nodeStyle.backgroundSize = '9px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      } else if (familyKey === 'pride') {
        nodeStyle.background = '#231d17';
        nodeStyle.border = `1.5px solid rgba(212,175,126,0.65)`;
        nodeStyle.color = '#f8f5ef';
        nodeStyle.borderRadius = '4px';
        nodeStyle.padding = '14px 18px 14px 28px';
        nodeStyle.minHeight = '110px';
        nodeStyle.boxShadow = '0 14px 30px rgba(0,0,0,0.45), 0 6px 16px rgba(212,175,126,0.28)';
        nodeStyle.backgroundImage = 'linear-gradient(90deg, rgba(212,175,126,0.55) 0px, rgba(212,175,126,0.55) 10px, transparent 10px)';
        nodeStyle.backgroundSize = '10px 100%';
        nodeStyle.backgroundRepeat = 'no-repeat';
      }

      // Build node label based on family theme
      let nodeLabel;
      
      const statusLabel = statusLabelForBrother(brother);

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
            {/* Status */}
              <div 
                style={{ 
                fontSize: '10px',
                color: 'rgba(248, 245, 239, 0.75)',
              }}
            >
              {statusLabel}
              </div>
            {brother.graduation_year && (
              <div
                style={{
                  fontSize: '10px',
                  color: 'rgba(248, 245, 239, 0.6)',
                  letterSpacing: '0.3px',
                }}
              >
                {`Class of ${brother.graduation_year}`}
              </div>
            )}
          </div>
        );
      } else if (familyKey === 'empire') {
        nodeLabel = renderEmpireNodeContent(brother);
      } else {
        // Other families: simpler node design
        nodeLabel = (
          <div className="text-center" style={{ fontFamily: theme.bodyFont, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
            {brother.pledge_class && (
              <div 
                style={{ 
                  fontSize: '10px',
                  letterSpacing: '0.4px',
                  color: theme.nodeText,
                  opacity: 0.7,
                }}
              >
                {brother.pledge_class}
              </div>
            )}
            <div
              style={{
                fontSize: '10px',
                color:
                  familyKey === 'power'
                    ? 'rgba(247, 235, 206, 0.75)'
                    : familyKey === 'greed'
                      ? 'rgba(235, 245, 235, 0.75)'
                      : familyKey === 'wolfpack'
                        ? 'rgba(44, 63, 95, 0.7)'
                        : 'rgba(59, 43, 22, 0.7)',
                fontWeight: 500,
              }}
            >
              {statusLabel}
            </div>
            {brother.graduation_year && (
              <div
                style={{
                  fontSize: '10px',
                  color:
                    familyKey === 'power'
                      ? 'rgba(247, 235, 206, 0.68)'
                      : familyKey === 'greed'
                        ? 'rgba(235, 245, 235, 0.68)'
                        : familyKey === 'wolfpack'
                          ? 'rgba(44, 63, 95, 0.6)'
                          : 'rgba(59, 43, 22, 0.6)',
                  letterSpacing: '0.2px',
                }}
              >
                {`Class of ${brother.graduation_year}`}
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
              strokeWidth: edgeStrokeWidth + 1,
              opacity: 0.97,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
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

  const handleAddNodeClick = useCallback((event, node) => {
    if (event) event.stopPropagation();
    const brother = node?.data?.brother || node;
    setAddFormParent(brother);
    setShowAddForm(true);
  }, []);

  const handleNodeUpdate = useCallback(() => {
    loadTreeData();
    setSelectedBrother(null);
    setIsModalOpen(false);
    restorePointerEvents();
  }, [loadTreeData, restorePointerEvents]);

  useEffect(() => {
    if (nodes.length === 0) return;
    if (initialViewportRef.current) return;
    try {
      initialViewportRef.current = reactFlowInstance.getViewport();
    } catch (e) {
      initialViewportRef.current = null;
    }
  }, [nodes, reactFlowInstance]);

  useEffect(() => {
    initialViewportRef.current = null;
    hasFitRef.current = false;
  }, [family.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isEmpire) return;
      if (event.target instanceof HTMLElement && event.target.closest('input, textarea, [contenteditable="true"]')) {
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        try {
          reactFlowInstance.fitView({
            padding: 0.15,
            duration: 450,
          });
        } catch {
          // ignore
        }
        return;
      }

      const adjustZoom = (direction) => {
        try {
          const currentViewport = reactFlowInstance.getViewport();
          const nextZoom = Math.max(
            minZoom,
            Math.min(maxZoom, currentViewport.zoom * direction),
          );
          reactFlowInstance.zoomTo(nextZoom, 200);
        } catch {
          // ignore
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
  }, [isEmpire, reactFlowInstance, minZoom, maxZoom]);

  useEffect(() => {
    if (!isTreeReady || nodes.length === 0 || hasFitRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      try {
        reactFlowInstance.fitView({
          padding: isEmpire ? 0.15 : 0.25,
          duration: 500,
        });
        hasFitRef.current = true;
      } catch (err) {
        console.warn('Failed to fit view:', err);
      }
    });
  }, [isTreeReady, nodes, reactFlowInstance, isEmpire]);

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
    <div className="w-full relative" style={containerStyle}>
      {/* Add functionality removed - site is read-only. Use admin.html for adding brothers. */}
      {isEmpire && (
    <div
      style={{
            position: 'absolute',
            top: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: 'rgba(59, 43, 22, 0.72)',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600 }}>
            Alpha Kappa Psi · Nu Chapter
          </div>
          <div
            style={{
              fontFamily: theme.titleFont,
              fontSize: '18px',
              letterSpacing: '0.25em',
              marginTop: 6,
            }}
          >
            Empire Archives
          </div>
        </div>
      )}
      {isEmpire && (
        <div
          style={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            background: 'rgba(201,168,87,0.12)',
            border: '1px solid rgba(201,168,87,0.45)',
            color: 'rgba(59,43,22,0.75)',
            fontSize: '10px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '12px 16px',
            borderRadius: 12,
            pointerEvents: 'none',
            boxShadow: '0 10px 24px rgba(58,33,3,0.22)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Navigation</div>
          <div>0 reset view</div>
          <div>+ zoom in · - zoom out</div>
        </div>
      )}
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
            const targetViewport = viewportBeforeModal || initialViewportRef.current;
            try {
              if (targetViewport) {
                reactFlowInstance.setViewport(targetViewport, { duration: 300 });
              } else {
                reactFlowInstance.fitView({ padding: isEmpire ? 0.15 : 0.25, duration: 400 });
              }
            } catch (e) {
              // If viewport restore fails, continue anyway
            }
            restorePointerEvents();
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

