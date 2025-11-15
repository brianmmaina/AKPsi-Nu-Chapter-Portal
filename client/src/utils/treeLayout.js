import { MarkerType } from 'reactflow';
import { getPledgeLevel } from './pledgeClass';
import {
  getBaseNodeStyle,
  applyPlaceholderStyle,
  applyHighlightStyle,
  applyLineageHighlightStyle,
} from './nodeStyles';
import { FAMILY_LAYOUT_RULES } from './constants';
import { hexToRgba } from './color';

const CARD_WIDTH = 280;
const CARD_MIN_HEIGHT = 110;
const MIN_NODE_GAP_X = 30;
const MIN_NODE_GAP_Y = 18;

const snapValue = (value, snap = 10) => Math.round(value / snap) * snap;

/**
 * Calculates tree layout and creates React Flow nodes and edges
 * 
 * @param {Object} params - Layout calculation parameters
 * @param {Array} params.brothers - List of all brothers
 * @param {Array} params.relationships - Parent-child relationships
 * @param {string} params.familyKey - Family key (empire, power, etc.)
 * @param {Object} params.theme - Theme configuration
 * @param {Object} params.layoutSettings - Layout settings (spacing, compression, etc.)
 * @param {string|null} params.highlightBrotherId - ID of highlighted brother
 * @param {Set} params.lineageHighlightSet - Set of IDs in lineage highlight
 * @param {Function} params.renderNodeContent - Function to render node content
 * @param {boolean} params.isEmpire - Whether this is the Empire family
 * @param {Function} params.onTreeBounds - Callback to update tree bounds
 * @returns {Object} Object with nodes and edges arrays
 */
export const calculateTreeLayout = ({
  brothers,
  relationships,
  familyKey,
  theme,
  layoutSettings,
  highlightBrotherId,
  lineageHighlightSet,
  renderNodeContent,
  isEmpire,
  onTreeBounds,
  leftMargin = 0,
}) => {
  // Safety check: ensure theme is initialized
  if (!theme || typeof theme.nodeStudying === 'undefined' || typeof theme.nodeGraduated === 'undefined') {
    return { nodes: [], edges: [] };
  }

  // Safety check: ensure brothers and relationships are arrays
  if (!Array.isArray(brothers)) {
    return { nodes: [], edges: [] };
  }
  if (!Array.isArray(relationships)) {
    return { nodes: [], edges: [] };
  }

  // Build relationship structure: parent -> children
  const relationshipsMap = new Map(); // little_id -> big_id
  const childrenMap = new Map(); // big_id -> [little_ids]
  
  relationships.forEach(rel => {
    if (rel && rel.big_id && rel.little_id) {
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
  const subtreeWidthCache = new Map();

  const shiftSubtree = (nodeId, deltaX = 0, deltaY = 0) => {
    const info = nodePositions.get(nodeId);
    if (!info) return;
    info.x += deltaX;
    info.y += deltaY;
    const children = childrenMap.get(nodeId) || [];
    children.forEach((childId) => shiftSubtree(childId, deltaX, deltaY));
  };
  
  // Node dimensions
  const nodeWidth = CARD_WIDTH;
  const nodeHeight = CARD_MIN_HEIGHT;
  const familyRules = FAMILY_LAYOUT_RULES[familyKey] || {};
  const mergedRules = FAMILY_LAYOUT_RULES.base
    ? { ...FAMILY_LAYOUT_RULES.base, ...familyRules }
    : familyRules;
  const {
    columnMultiplier = 2.2,
    rowHeight = CARD_MIN_HEIGHT + 32,
    minColumnGap = 38,
    minRowGap = 20,
    columnSnap = 8,
    maxTreeWidth = FAMILY_LAYOUT_RULES?.base?.maxTreeWidth || Infinity,
  } = mergedRules;

  const pairWidth = Math.max(columnMultiplier * CARD_WIDTH, CARD_WIDTH * 1.8);
  const horizontalSpacing = Math.max(pairWidth, CARD_WIDTH + minColumnGap * 2);
  const baseVerticalSpacing = Math.max(rowHeight, CARD_MIN_HEIGHT + minRowGap);
  const pledgeVerticalSpacing = baseVerticalSpacing;
  const multiChildCompression = layoutSettings?.multiChildCompression ?? 0.9;
  const siblingPadding = Math.max(minColumnGap, horizontalSpacing - CARD_WIDTH + minColumnGap * 0.4);
  const prongDropFactor = layoutSettings?.prongDropFactor ?? 1.05;

  /**
   * Recursively calculates the width needed for a subtree
   * @param {number} rootId - Root of the subtree
   * @returns {number} Width needed for this subtree
   */
  const getSubtreeWidth = (rootId) => {
    if (subtreeWidthCache.has(rootId)) {
      return subtreeWidthCache.get(rootId);
    }

    const children = childrenMap.get(rootId) || [];
    if (children.length === 0) {
      subtreeWidthCache.set(rootId, horizontalSpacing);
      return horizontalSpacing;
    }

    const childWidths = children.map((childId) => getSubtreeWidth(childId));
    const compression =
      multiChildCompression < 1 && children.length >= 3
        ? multiChildCompression
        : 1;

    let totalWidth;
    if (children.length === 3) {
      const pad = siblingPadding || horizontalSpacing * 0.25;
      const left = childWidths[0] * compression;
      const center = childWidths[1] * compression;
      const right = childWidths[2] * compression;
      totalWidth = left + center + right + pad * 2;
    } else {
      totalWidth =
        childWidths.reduce((sum, width) => sum + width, 0) * compression +
        Math.max(children.length - 1, 0) * siblingPadding;
    }
    const width = Math.max(totalWidth, horizontalSpacing);

    subtreeWidthCache.set(rootId, width);
    return width;
  };

  /**
   * Recursively positions nodes in a binary tree layout
   * @param {number} nodeId - ID of the node to position
   * @param {number} x - X position (center of subtree)
   * @param {number} y - Y position (generation level)
   */
  const depthLevelMap = new Map();

  const positionNode = (nodeId, x, y, depthLevel = 0) => {
    nodePositions.set(nodeId, { x: x + leftMargin, y, depthLevel });
    const currentDepthNodes = depthLevelMap.get(depthLevel) || [];
    currentDepthNodes.push(nodeId);
    depthLevelMap.set(depthLevel, currentDepthNodes);
    
    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      return;
    }

    // Calculate positions for children
    const childWidthsRaw = children.map((childId) => getSubtreeWidth(childId));
    const compression =
      multiChildCompression < 1 && children.length >= 3
        ? multiChildCompression
        : 1;

    if (children.length === 3) {
      const compressedWidths = childWidthsRaw.map((width) => width * compression);
      const pad = siblingPadding || horizontalSpacing * 0.25;

      const leftWidth = compressedWidths[0];
      const centerWidth = compressedWidths[1];
      const rightWidth = compressedWidths[2];

      const leftX = x - (leftWidth / 2 + centerWidth / 2 + pad);
      const rightX = x + (rightWidth / 2 + centerWidth / 2 + pad);
      const outerY = y + baseVerticalSpacing;
      const centerY = y + baseVerticalSpacing * (prongDropFactor || 1.12);

      positionNode(children[0], leftX, outerY, depthLevel + 1);
      positionNode(children[2], rightX, outerY, depthLevel + 1);
      positionNode(children[1], x, centerY, depthLevel + 1);
      return;
    }

    const totalWidth =
      childWidthsRaw.reduce((sum, width) => sum + width, 0) * compression +
      Math.max(children.length - 1, 0) * siblingPadding;
    const startX = x - totalWidth / 2;

    let accumulatedWidth = 0;
    children.forEach((childId, index) => {
      const width = childWidthsRaw[index] * compression;
      const pad = index > 0 ? siblingPadding : 0;
      accumulatedWidth += pad;
      const childX = startX + accumulatedWidth + width / 2;
      positionNode(childId, childX, y + baseVerticalSpacing, depthLevel + 1);
      accumulatedWidth += width;
    });
  };

  // Find root nodes (nodes with no big_id)
  const rootNodes = brothers.filter(b => {
    if (!b || typeof b.id === 'undefined') return false;
    const bigId = relationshipsMap.get(b.id);
    return !bigId || !brothers.some(br => br && br.id === bigId);
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
      if (!b || typeof b.id === 'undefined') return;
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

  // Empire-specific: center parents above their children
  if (isEmpire) {
    brothers.forEach((brother) => {
      if (!brother || typeof brother.id === 'undefined') return;
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

  // Adjust positions based on pledge classes
  const adjustedPositions = new Map();
  brothers.forEach((brother) => {
    if (!brother || typeof brother.id === 'undefined') return;
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
    if (!brother || typeof brother.id === 'undefined') return;
    if (!relationshipsMap.get(brother.id)) {
      enforceHierarchy(brother.id);
    }
  });

  const levelRemap = new Map();
  Array.from(new Set(Array.from(adjustedPositions.values()).map(({ pledgeLevel }) => pledgeLevel)))
    .sort((a, b) => a - b)
    .forEach((level, idx) => levelRemap.set(level, idx));

  brothers.forEach((brother) => {
    if (!brother || typeof brother.id === 'undefined') return;
    const info = adjustedPositions.get(brother.id);
    if (!info) return;
    const remappedLevel = levelRemap.get(info.pledgeLevel) ?? info.pledgeLevel;
    nodePositions.set(brother.id, {
      x: info.x,
      y: remappedLevel * pledgeVerticalSpacing,
      level: remappedLevel,
    });
  });

  const pyramidLevels = new Map();
  nodePositions.forEach((pos, id) => {
    const levelKey = pos.depthLevel ?? 0;
    if (!pyramidLevels.has(levelKey)) {
      pyramidLevels.set(levelKey, []);
    }
    pyramidLevels.get(levelKey).push(id);
  });

  const totalDepth = Math.max(...pyramidLevels.keys());
  pyramidLevels.forEach((nodeIds, level) => {
    const widthMultiplier = 1 + (totalDepth - level) * 0.35;
    const columnSpacing = horizontalSpacing * widthMultiplier;
    const startX = -((nodeIds.length - 1) * columnSpacing) / 2;

    nodeIds.sort((a, b) => {
      const posA = nodePositions.get(a);
      const posB = nodePositions.get(b);
      return (posA?.x ?? 0) - (posB?.x ?? 0);
    });

    nodeIds.forEach((nodeId, index) => {
      const pos = nodePositions.get(nodeId);
      if (!pos) return;
      const targetX = startX + index * columnSpacing;
      const snappedX = snapValue(targetX, columnSnap);
      if (snappedX !== pos.x) {
        nodePositions.set(nodeId, { ...pos, x: snappedX });
      }
    });
  });

  if (Number.isFinite(maxTreeWidth) && maxTreeWidth > 0) {
    let currentMinX = Infinity;
    let currentMaxX = -Infinity;
    nodePositions.forEach((pos) => {
      currentMinX = Math.min(currentMinX, pos.x);
      currentMaxX = Math.max(currentMaxX, pos.x + CARD_WIDTH);
    });
    const currentWidth = currentMaxX - currentMinX;
    if (currentWidth > maxTreeWidth) {
      const scale = maxTreeWidth / currentWidth;
      nodePositions.forEach((pos, id) => {
        const centeredX = (pos.x - currentMinX - currentWidth / 2) * scale;
        const clampedX = snapValue(centeredX + maxTreeWidth / 2, columnSnap);
        nodePositions.set(id, { ...pos, x: clampedX });
      });
    }
  }

  const nodeEntries = Array.from(nodePositions.entries());
  for (let i = 0; i < nodeEntries.length; i += 1) {
    for (let j = i + 1; j < nodeEntries.length; j += 1) {
      const [idA, posA] = nodeEntries[i];
      const [idB, posB] = nodeEntries[j];
      if (!posA || !posB) continue;
      const overlapX =
        Math.min(posA.x + CARD_WIDTH, posB.x + CARD_WIDTH) - Math.max(posA.x, posB.x);
      const overlapY =
        Math.min(posA.y + CARD_MIN_HEIGHT, posB.y + CARD_MIN_HEIGHT) - Math.max(posA.y, posB.y);
      if (overlapX > MIN_NODE_GAP_X && overlapY > -MIN_NODE_GAP_Y) {
        if (posA.y <= posB.y) {
          const deltaY = posA.y + CARD_MIN_HEIGHT + MIN_NODE_GAP_Y - posB.y;
          shiftSubtree(idB, 0, deltaY);
        } else {
          const deltaY = posB.y + CARD_MIN_HEIGHT + MIN_NODE_GAP_Y - posA.y;
          shiftSubtree(idA, 0, deltaY);
        }
      }
    }
  }


  // Create React Flow nodes
  brothers.forEach(brother => {
    // Safety check: skip null/undefined brothers
    if (!brother || typeof brother.id === 'undefined') {
      console.warn('Skipping invalid brother:', brother);
      return;
    }
    
    const positionInfo = nodePositions.get(brother.id);
    const position = positionInfo
      ? { x: positionInfo.x, y: positionInfo.y }
      : { x: 0, y: 0 };
    const levelIndex = positionInfo?.level ?? 0;
    const status = brother.status === 'studying' ? 'studying' : 'graduated';
    
    // Get base node style using utility (pass actual status)
    const nodeStyle = getBaseNodeStyle(familyKey, theme, nodeWidth, nodeHeight, status);

    // Apply conditional styles
    const isPlaceholderNode = !brother.name || /^unassigned/i.test(brother.name.trim());
    if (isPlaceholderNode) {
      applyPlaceholderStyle(nodeStyle, theme);
    }
    const isHighlightedNode = highlightBrotherId === String(brother.id);
    if (isHighlightedNode) {
      applyHighlightStyle(nodeStyle, theme);
    }
    if (lineageHighlightSet && lineageHighlightSet.has(String(brother.id))) {
      applyLineageHighlightStyle(nodeStyle, theme);
    }

    // Build node label using unified renderer
    const nodeLabel = renderNodeContent(brother);

    // Add node with position (fallback to 0,0 if not calculated)
    layoutNodes.push({
      id: String(brother.id),
      data: {
        label: nodeLabel,
        brother: brother,
        levelIndex,
        layoutY: position.y,
      },
      position,
      style: nodeStyle,
      className: 'tree-node-card',
    });
  });

  // Capture layout bounds for dynamic viewport
  if (layoutNodes.length && onTreeBounds) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    layoutNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
    onTreeBounds({
      width: maxX - minX,
      height: maxY - minY,
      minX,
      maxX,
      minY,
      maxY,
    });
  }

  // Create edges - only if both nodes exist
  const edgeColor = theme.edgeColor || theme.accent || '#666666';
  const edgeStrokeWidthDefault = theme.edgeStrokeWidth || 3;
  const edgeBaseColor =
    theme.edgeBaseColor || theme.edgeStrokeColor || hexToRgba(edgeColor, 1.0);
  const edgeShadow = theme.edgeShadow;
  const edgeGlowColor = theme.edgeGlowColor;
  
  relationships.forEach(rel => {
    if (!rel || !rel.big_id || !rel.little_id) return;
    
    // Verify both nodes exist in the brothers array
    const bigExists = brothers.some(b => b && b.id === rel.big_id);
    const littleExists = brothers.some(b => b && b.id === rel.little_id);
    
    if (bigExists && littleExists) {
      const isLineageEdge =
        lineageHighlightSet &&
        lineageHighlightSet.has(String(rel.big_id)) &&
        lineageHighlightSet.has(String(rel.little_id));
      
      // Lineage edges use full opacity, normal edges also use full opacity
      const edgeOpacity = isLineageEdge ? 1.0 : 1.0;
      const edgeStroke = isLineageEdge ? edgeStrokeWidthDefault + 0.6 : edgeStrokeWidthDefault;
      const edgeStrokeColor = isLineageEdge 
        ? hexToRgba(theme.accent || edgeColor, edgeOpacity)
        : edgeBaseColor;
      
      const edgeStyle = {
        stroke: edgeStrokeColor,
        strokeWidth: edgeStroke,
        opacity: edgeOpacity,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        vectorEffect: 'non-scaling-stroke',
        zIndex: 5,
        shapeRendering: 'geometricPrecision',
        filter: edgeShadow || undefined,
      };
      if (edgeGlowColor) {
        edgeStyle.paintOrder = 'stroke';
      }
      
      const edge = {
        id: `e${rel.big_id}-${rel.little_id}`,
        source: String(rel.big_id),
        target: String(rel.little_id),
        type: 'curved',
        animated: theme.edgeAnimated !== undefined ? theme.edgeAnimated : false,
        style: edgeStyle,
        markerEnd: MarkerType.ArrowClosed,
        markerEndColor: edgeStrokeColor, // Match arrow color to edge
        data: {},
      };
      layoutEdges.push(edge);
    }
  });

  return { nodes: layoutNodes, edges: layoutEdges };
};

