import { hexToRgba } from './color';

/**
 * Node Styling Utilities
 * 
 * Generates node styles based on family theme and node state
 */

const NODE_PALETTES = {
  empire: {
    background: '#fff6e8',
    border: '1.6px solid rgba(145, 104, 29, 0.75)',
    color: '#24170b',
    borderRadius: '4px',
    padding: '14px 16px 14px 26px',
    minHeight: '108px',
    boxShadow: '0 20px 36px rgba(58, 33, 3, 0.22), 0 8px 18px rgba(201, 168, 87, 0.26)',
    backgroundImage: 'linear-gradient(90deg, rgba(201,168,87,0.68) 0px, rgba(201,168,87,0.68) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(201,168,87,0.24), transparent 55%)',
    backgroundSize: '9px 100%, 100% 100%',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'left top, center',
  },
  power: {
    // Use theme colors but apply Empire format: left border accent, padding, shadows
    background: undefined, // Will use theme.nodeStudying/nodeGraduated
    border: '1.6px solid rgba(243, 220, 166, 0.75)',
    color: '#fdf5dc',
    borderRadius: '4px',
    padding: '14px 16px 14px 26px',
    minHeight: '108px',
    boxShadow: '0 20px 36px rgba(8, 16, 24, 0.22), 0 8px 18px rgba(235, 210, 144, 0.26)',
    backgroundImage: 'linear-gradient(90deg, rgba(243,220,166,0.68) 0px, rgba(243,220,166,0.68) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(235,210,144,0.24), transparent 55%)',
    backgroundSize: '9px 100%, 100% 100%',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'left top, center',
  },
  greed: {
    // Use theme colors but apply Empire format: left border accent, padding, shadows
    background: undefined, // Will use theme.nodeStudying/nodeGraduated
    border: '1.6px solid rgba(216, 242, 168, 0.75)',
    color: '#0a2316',
    borderRadius: '4px',
    padding: '14px 16px 14px 26px',
    minHeight: '108px',
    boxShadow: '0 20px 36px rgba(6, 71, 41, 0.22), 0 8px 18px rgba(244, 217, 97, 0.26)',
    backgroundImage: 'linear-gradient(90deg, rgba(244,217,97,0.68) 0px, rgba(244,217,97,0.68) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(244,217,97,0.24), transparent 55%)',
    backgroundSize: '9px 100%, 100% 100%',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'left top, center',
  },
  wolfpack: {
    // Use theme colors but apply Empire format: left border accent, padding, shadows
    background: undefined, // Will use theme.nodeStudying/nodeGraduated
    border: '1.6px solid rgba(214, 228, 255, 0.75)',
    color: '#1e2c45',
    borderRadius: '4px',
    padding: '14px 16px 14px 26px',
    minHeight: '108px',
    boxShadow: '0 20px 36px rgba(54, 76, 115, 0.22), 0 8px 18px rgba(156, 184, 234, 0.26)',
    backgroundImage: 'linear-gradient(90deg, rgba(156,184,234,0.68) 0px, rgba(156,184,234,0.68) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(156,184,234,0.24), transparent 55%)',
    backgroundSize: '9px 100%, 100% 100%',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'left top, center',
  },
  pride: {
    // Use theme colors but apply Empire format: left border accent, padding, shadows
    background: undefined, // Will use theme.nodeStudying/nodeGraduated
    border: '1.6px solid rgba(212, 175, 126, 0.75)',
    color: '#fbf7ee',
    borderRadius: '4px',
    padding: '14px 16px 14px 26px',
    minHeight: '108px',
    boxShadow: '0 20px 36px rgba(24, 20, 19, 0.22), 0 8px 18px rgba(212, 175, 126, 0.26)',
    backgroundImage: 'linear-gradient(90deg, rgba(212,175,126,0.68) 0px, rgba(212,175,126,0.68) 9px, transparent 9px), radial-gradient(circle at 18% 12%, rgba(212,175,126,0.24), transparent 55%)',
    backgroundSize: '9px 100%, 100% 100%',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'left top, center',
  },
};

/**
 * Gets base node style for a family
 * @param {string} familyKey - Family key (empire, power, etc.)
 * @param {Object} theme - Theme object
 * @param {number} nodeWidth - Node width
 * @param {number} nodeHeight - Node height
 * @param {string} status - Node status ('studying' or 'graduated')
 * @returns {Object} Base node style object
 */
export const getBaseNodeStyle = (familyKey, theme, nodeWidth, nodeHeight, status = 'studying') => {
  // Safety check: ensure theme exists and has required properties
  if (!theme || typeof theme.nodeStudying === 'undefined' || typeof theme.nodeGraduated === 'undefined') {
    console.warn('getBaseNodeStyle: Theme not fully initialized, using fallback');
    // Return a minimal fallback style
    return {
      background: '#ffffff',
      color: '#333333',
      border: '1px solid #cccccc',
      borderRadius: '8px',
      padding: '10px',
      width: nodeWidth,
      minHeight: nodeHeight,
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    };
  }
  
  // Check if family has custom palette first - these take priority
  const familyStyle = NODE_PALETTES[familyKey];
  if (familyStyle) {
    // Family styles have fixed backgrounds and are designed to work for both statuses
    // Create a complete style object with family-specific overrides
    const familyStyleCopy = { ...familyStyle };
    return {
      background: familyStyleCopy.background || (status === 'studying' ? theme.nodeStudying : theme.nodeGraduated),
      color: familyStyleCopy.color || theme.nodeText || '#333333',
      border: familyStyleCopy.border || `2px solid ${theme.nodeBorder || '#cccccc'}`,
      borderRadius: familyStyleCopy.borderRadius || `${theme.nodeRadius || 8}px`,
      padding: familyStyleCopy.padding || '10px',
      width: nodeWidth,
      minHeight: familyStyleCopy.minHeight || nodeHeight,
      fontSize: '12px',
      fontWeight: '600',
      boxShadow: familyStyleCopy.boxShadow || '0 8px 24px rgba(0,0,0,0.25)',
      backgroundImage: familyStyleCopy.backgroundImage || undefined,
      backgroundSize: familyStyleCopy.backgroundSize || undefined,
      backgroundRepeat: familyStyleCopy.backgroundRepeat || undefined,
      backgroundPosition: familyStyleCopy.backgroundPosition || undefined,
    };
  }

  // Fallback to base theme styles if no family palette
  const baseStyle = {
    background: status === 'studying' ? theme.nodeStudying : theme.nodeGraduated,
    color: theme.nodeText || '#333333',
    border: `2px solid ${theme.nodeBorder || '#cccccc'}`,
    borderRadius: `${theme.nodeRadius || 8}px`,
    padding: '10px',
    width: nodeWidth,
    minHeight: nodeHeight,
    fontSize: '12px',
    fontWeight: '600',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  };

  return baseStyle;
};

/**
 * Applies placeholder styling to a node
 * @param {Object} nodeStyle - Node style object to modify
 * @param {Object} theme - Theme object
 */
export const applyPlaceholderStyle = (nodeStyle, theme) => {
  if (!theme || !nodeStyle) return;
  const accentColor = hexToRgba(theme.accent || '#c9a857', 0.75);
  const overlay = hexToRgba(theme.accent || '#c9a857', 0.12);
  const existingShadow = nodeStyle.boxShadow ? `${nodeStyle.boxShadow}, ` : '';
  nodeStyle.border = `1.8px dashed ${accentColor}`;
  nodeStyle.boxShadow = `${existingShadow}0 0 0 1px ${hexToRgba(theme.accent || '#c9a857', 0.18)} inset`;
  nodeStyle.backgroundImage = `${nodeStyle.backgroundImage ? `${nodeStyle.backgroundImage},` : ''}repeating-linear-gradient(135deg, ${overlay} 0 8px, transparent 8px 16px)`;
};

/**
 * Applies highlight styling to a node
 * @param {Object} nodeStyle - Node style object to modify
 * @param {Object} theme - Theme object
 */
export const applyHighlightStyle = (nodeStyle, theme) => {
  if (!theme || !nodeStyle) return;
  const accent = theme.accent || '#c9a857';
  const existingShadow = nodeStyle.boxShadow ? `${nodeStyle.boxShadow}, ` : '';
  nodeStyle.border = `2px solid ${accent}`;
  nodeStyle.boxShadow = `${existingShadow}0 0 0 4px ${hexToRgba(accent, 0.3)}`;
};

/**
 * Applies lineage highlight styling to a node
 * @param {Object} nodeStyle - Node style object to modify
 * @param {Object} theme - Theme object
 */
export const applyLineageHighlightStyle = (nodeStyle, theme) => {
  if (!theme || !nodeStyle) return;
  const accent = hexToRgba(theme.accent || '#c9a857', 0.25);
  const existingShadow = nodeStyle.boxShadow ? `${nodeStyle.boxShadow}, ` : '';
  nodeStyle.boxShadow = `${existingShadow}0 0 0 3px ${accent}`;
  nodeStyle.filter = 'brightness(1.05)';
};

