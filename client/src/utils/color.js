/**
 * Color utility functions
 * 
 * @module utils/color
 */

/**
 * Converts a hex color to rgba format
 * Also handles rgba colors by replacing their alpha value
 * 
 * @param {string} color - Hex color string (e.g., '#ff5733' or '#f73') or rgba string (e.g., 'rgba(255, 87, 51, 0.5)')
 * @param {number} [alpha=1] - Alpha value between 0 and 1 (default: 1)
 * @returns {string} RGBA color string (e.g., 'rgba(255, 87, 51, 0.5)')
 * @throws {Error} If color format is invalid
 * 
 * @example
 * hexToRgba('#ff5733', 0.5) // returns 'rgba(255, 87, 51, 0.5)'
 * hexToRgba('#f73', 0.8) // returns 'rgba(255, 119, 51, 0.8)'
 * hexToRgba('rgba(255, 87, 51, 0.5)', 0.8) // returns 'rgba(255, 87, 51, 0.8)'
 */
export const hexToRgba = (color, alpha = 1) => {
  if (!color || typeof color !== 'string') {
    throw new Error('Color must be a non-empty string');
  }

  // Validate alpha
  const validAlpha = Math.max(0, Math.min(1, alpha));

  // Check if it's already an rgba color
  const rgbaMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
  }

  // Handle hex color
  // Remove # if present
  const cleanHex = color.replace('#', '');
  
  // Handle shorthand hex (e.g., #f73 -> #ff7733)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;

  if (fullHex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(fullHex)) {
    throw new Error(`Invalid color format: ${color}`);
  }

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${validAlpha})`;
};

