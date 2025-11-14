import { hexToRgba } from './color';

/**
 * Node Styling Utilities
 *
 * Generates node styles based on family theme and node state
 */

const BASE_FALLBACK_STYLE = {
  background: 'rgba(255,255,255,0.9)',
  color: '#1f1f1f',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: '10px',
  padding: '14px 16px 14px 22px',
  width: 200,
  minHeight: 110,
  fontSize: '12px',
  fontWeight: 600,
  boxShadow: '0 12px 24px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
export const getBaseNodeStyle = (
  _familyKey,
  theme,
  nodeWidth,
  nodeHeight,
  status = 'studying',
) => {
  if (!theme || (!theme.nodeStudying && !theme.nodeCardBg)) {
    return { ...BASE_FALLBACK_STYLE, width: nodeWidth, minHeight: nodeHeight };
  }

  const borderColor =
    theme.nodeCardBorder || `1.4px solid ${theme.nodeBorder || '#d6c6aa'}`;
  const baseBackground =
    theme.nodeCardBg ||
    (status === 'studying' ? theme.nodeStudying : theme.nodeGraduated);
  const accentStripe = theme.nodeCardAccent;

  const style = {
    background: baseBackground,
    color: theme.nodeText || '#1f1f1f',
    border: borderColor,
    borderRadius: `${theme.nodeRadius || 12}px`,
    padding: '16px 18px 16px 26px',
    width: nodeWidth,
    minHeight: nodeHeight + 14,
    fontSize: '13px',
    fontWeight: 600,
    boxShadow: theme.nodeCardShadow || BASE_FALLBACK_STYLE.boxShadow,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
    backgroundImage: accentStripe ? `${accentStripe}, radial-gradient(circle at 18% 12%, rgba(255,255,255,0.12), transparent 55%)` : undefined,
    backgroundRepeat: accentStripe ? 'no-repeat, no-repeat' : undefined,
    backgroundSize: accentStripe ? '14px 100%, 100% 100%' : undefined,
    backgroundPosition: accentStripe ? 'left top, center' : undefined,
    pointerEvents: 'auto',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  style['--node-hover-shadow'] =
    theme.nodeCardHoverShadow || '0 22px 40px rgba(0,0,0,0.28)';
  style['--node-hover-brightness'] = '1.02';

  return style;
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

