/**
 * Color utility functions
 * 
 * @module utils/color
 */

/**
 * Converts a hex color to rgba format
 * 
 * @param {string} hex - Hex color string (e.g., '#ff5733' or '#f73')
 * @param {number} [alpha=1] - Alpha value between 0 and 1 (default: 1)
 * @returns {string} RGBA color string (e.g., 'rgba(255, 87, 51, 0.5)')
 * @throws {Error} If hex format is invalid
 * 
 * @example
 * hexToRgba('#ff5733', 0.5) // returns 'rgba(255, 87, 51, 0.5)'
 * hexToRgba('#f73', 0.8) // returns 'rgba(255, 119, 51, 0.8)'
 */
export const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string') {
    throw new Error('Hex color must be a non-empty string');
  }

  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Handle shorthand hex (e.g., #f73 -> #ff7733)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  if (fullHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(fullHex)) {
    throw new Error(`Invalid hex color format: ${hex}`);
  }

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  
  // Validate alpha
  const validAlpha = Math.max(0, Math.min(1, alpha));
  
  return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
};

