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
    background: 'linear-gradient(135deg, rgba(20, 38, 60, 0.92) 0%, rgba(10, 22, 38, 0.85) 100%)',
    border: '1.5px solid rgba(245, 210, 131, 0.85)',
    color: '#fdf5dc',
    borderRadius: '6px',
    padding: '14px 18px 14px 26px',
    minHeight: '108px',
    boxShadow: '0 18px 34px rgba(8, 16, 24, 0.55), 0 6px 16px rgba(245, 210, 131, 0.3)',
    backgroundImage: 'linear-gradient(90deg, rgba(243,220,166,0.75) 0px, rgba(243,220,166,0.75) 9px, transparent 9px)',
    backgroundSize: '9px 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left top',
  },
  greed: {
    background: 'linear-gradient(135deg, rgba(246, 252, 244, 0.96) 0%, rgba(233, 247, 230, 0.92) 100%)',
    border: '1.6px solid rgba(180, 214, 138, 0.9)',
    color: '#0a2316',
    borderRadius: '4px',
    padding: '12px 16px 12px 24px',
    minHeight: '104px',
    boxShadow: '0 16px 32px rgba(9,53,32,0.28), 0 6px 16px rgba(244, 217, 97, 0.26)',
    backgroundImage: 'linear-gradient(90deg, rgba(244,217,97,0.55) 0px, rgba(244,217,97,0.55) 8px, transparent 8px)',
    backgroundSize: '8px 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left top',
  },
  wolfpack: {
    background: 'linear-gradient(135deg, rgba(248,252,255,0.98) 0%, rgba(234,243,255,0.94) 100%)',
    border: '1.6px solid rgba(156, 184, 234, 0.85)',
    color: '#1f2f49',
    borderRadius: '4px',
    padding: '13px 16px 13px 24px',
    minHeight: '106px',
    boxShadow: '0 18px 34px rgba(41, 62, 96, 0.28), 0 6px 18px rgba(20, 33, 54, 0.2)',
    backgroundImage: 'linear-gradient(90deg, rgba(156,184,234,0.65) 0px, rgba(156,184,234,0.65) 9px, transparent 9px)',
    backgroundSize: '9px 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left top',
  },
  pride: {
    background: '#231d17',
    border: '1.8px solid rgba(212,175,126,0.82)',
    color: '#fbf7ee',
    borderRadius: '4px',
    padding: '14px 18px 14px 28px',
    minHeight: '110px',
    boxShadow: '0 14px 30px rgba(0,0,0,0.45), 0 6px 16px rgba(212,175,126,0.28)',
    backgroundImage: 'linear-gradient(90deg, rgba(212,175,126,0.55) 0px, rgba(212,175,126,0.55) 10px, transparent 10px)',
    backgroundSize: '10px 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left top',
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

  // Apply family-specific styles if available (these override base styles)
  const familyStyle = NODE_PALETTES[familyKey];
  if (familyStyle) {
    // Create a copy of family style to avoid mutating the original
    const familyStyleCopy = { ...familyStyle };
    // Family styles have fixed backgrounds, so use them as-is
    // They're designed to work for both statuses
    return { ...baseStyle, ...familyStyleCopy };
  }

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

