/**
 * Node Rendering Utilities
 * 
 * Handles node rendering data and palettes (rendering logic stays in component)
 */

/**
 * Gets status label for a brother
 * @param {Object} brother - Brother object
 * @returns {string} Status label
 */
export const statusLabelForBrother = (brother) => {
  if (!brother) return 'Status Pending';
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

/**
 * Node palettes for each family
 */
export const NODE_PALETTES = {
  empire: {
    bodyColor: '#24170b',
    badgeBg: 'rgba(147, 107, 28, 0.2)',
    badgeColor: '#5a3d16',
    transferColor: 'rgba(59, 43, 22, 0.6)',
    nameColor: '#24170b',
    statusColor: 'rgba(36, 23, 11, 0.9)',
    classColor: 'rgba(36, 23, 11, 0.75)',
    placeholderColor: 'rgba(147, 107, 28, 0.75)',
    supportsTransfer: false,
    nameSize: '13px',
    nameTracking: '0.4px',
  },
  power: {
    bodyColor: '#fdf5dc',
    badgeBg: 'rgba(247, 227, 168, 0.24)',
    badgeColor: '#fef3d8',
    transferColor: 'rgba(247, 235, 206, 0.7)',
    nameColor: '#fef8e3',
    statusColor: 'rgba(250, 240, 210, 0.95)',
    classColor: 'rgba(246, 233, 196, 0.86)',
    placeholderColor: 'rgba(243, 220, 166, 0.8)',
    supportsTransfer: true,
  },
  greed: {
    bodyColor: '#0a2316',
    badgeBg: 'rgba(244, 217, 97, 0.28)',
    badgeColor: '#5b4811',
    transferColor: 'rgba(10, 31, 20, 0.6)',
    nameColor: '#182b1e',
    statusColor: 'rgba(10, 31, 20, 0.82)',
    classColor: 'rgba(10, 31, 20, 0.7)',
    placeholderColor: 'rgba(180, 214, 138, 0.85)',
    supportsTransfer: true,
  },
  wolfpack: {
    bodyColor: '#1e2c45',
    badgeBg: 'rgba(156,184,234,0.28)',
    badgeColor: '#1e2c45',
    transferColor: 'rgba(33, 51, 82, 0.65)',
    nameColor: '#1e2c45',
    statusColor: 'rgba(24, 41, 68, 0.9)',
    classColor: 'rgba(24, 41, 68, 0.78)',
    placeholderColor: 'rgba(156,184,234,0.82)',
    supportsTransfer: true,
  },
  pride: {
    bodyColor: '#fbf7ee',
    badgeBg: 'rgba(212, 175, 126, 0.24)',
    badgeColor: '#f1d0a0',
    transferColor: 'rgba(212, 175, 126, 0.75)',
    nameColor: '#f6d9a5',
    statusColor: 'rgba(248, 245, 239, 0.85)',
    classColor: 'rgba(248, 245, 239, 0.72)',
    placeholderColor: 'rgba(212, 175, 126, 0.78)',
    supportsTransfer: true,
    nameTracking: '0.6px',
  },
};

/**
 * Gets node palette for a family
 * @param {string} familyKey - Family key
 * @param {Object} theme - Theme object
 * @returns {Object} Node palette
 */
export const getNodePalette = (familyKey, theme) => {
  return NODE_PALETTES[familyKey] || {
    bodyColor: theme?.nodeText || '#3b2b16',
    badgeBg: `rgba(212, 176, 103, 0.22)`,
    badgeColor: theme?.nodeText || '#3b2b16',
    transferColor: 'rgba(80,80,80,0.65)',
    nameColor: theme?.nodeText || '#3b2b16',
    statusColor: `rgba(58, 43, 22, 0.82)`,
    classColor: `rgba(58, 43, 22, 0.7)`,
    placeholderColor: `rgba(212, 176, 103, 0.7)`,
    supportsTransfer: true,
  };
};

