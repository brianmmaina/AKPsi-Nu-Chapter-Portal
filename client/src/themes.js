export const getThemeStyles = (themeName) => {
  const themes = {
    // WOLFPACK - Slate blue background, white boxes, dark blue lines
    // From corrected spec: Primary #ffffff (white), Accent #3d5373 (dark blue-gray)
    wolfpack: {
      background: '#364c73',
      backgroundGrid: '#2a3a5c',
      nodeStudying: '#ffffff',
      nodeGraduated: '#ffffff',
      nodeBorder: '#3d5373',
      nodeText: '#3d5373',
      edgeColor: '#364c73',
      minimapNode: '#ffffff',
      minimapBg: '#2a3a5c',
      modalBg: 'rgba(54, 76, 115, 0.95)',
      accent: '#ffffff', // Primary text color for tabs/headers (was #3d5373)
      accentSecondary: '#3d5373', // For accent elements like boxes
      titleFont: 'Russo One, sans-serif',
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 8,
      edgeType: 'smoothstep',
      backgroundVariant: 'dots',
    },
    // PRIDE - Very dark brown/black with muted gold accents
    pride: {
      background: '#181413',
      backgroundGrid: '#242220',
      nodeStudying: '#181413', // we will use bordered boxes instead of filled nodes
      nodeGraduated: '#181413',
      nodeBorder: '#d4af7e',
      nodeText: '#ffffff',
      edgeColor: '#d4af7e',
      minimapNode: '#d4af7e',
      minimapBg: '#181413',
      modalBg: 'rgba(24, 20, 19, 0.95)',
      accent: '#d4af7e',
      titleFont: 'Cinzel, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      nodeRadius: 8,
      edgeType: 'straight',
      backgroundVariant: 'lines',
    },
    // POWER - Very dark navy with champagne gold accents
    power: {
      background: '#101a26',
      backgroundGrid: '#0d151f',
      nodeStudying: 'transparent',
      nodeGraduated: 'transparent',
      nodeBorder: '#ebd290',
      nodeText: '#ffffff',
      edgeColor: '#ebd290',
      minimapNode: '#ebd290',
      minimapBg: '#101a26',
      modalBg: 'rgba(16, 26, 38, 0.95)',
      accent: '#ebd290',
      titleFont: 'Orbitron, sans-serif',
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 6,
      edgeType: 'smoothstep',
      backgroundVariant: 'dots',
    },
    // GREED - Deep forest green background with white boxes and yellow-gold accents
    greed: {
      background: '#095332',
      backgroundGrid: '#073d26',
      nodeStudying: '#ffffff',
      nodeGraduated: '#ffffff',
      nodeBorder: '#e0e0e0',
      nodeText: '#333333',
      edgeColor: '#ffffff',
      minimapNode: '#ffffff',
      minimapBg: '#095332',
      modalBg: 'rgba(9, 83, 50, 0.95)',
      accent: '#f4d961',
      titleFont: 'Montserrat, system-ui, sans-serif',
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 8,
      edgeType: 'smoothstep',
      backgroundVariant: 'dots',
    },
    // EMPIRE - Cream background, white boxes, tan borders, dark gray lines
    // From corrected spec: Primary #c9a857 (warm gold), Background #f8f7f3 (cream)
    empire: {
      background: '#f8f7f3',
      backgroundGrid: '#f0efeb',
      backgroundTexture: 'radial-gradient(closest-side, rgba(0,0,0,0.02), rgba(0,0,0,0) 60%)',
      nodeStudying: '#ffffff',
      nodeGraduated: '#ffffff',
      nodeBorder: '#d4c9b3',
      nodeText: '#1f1f1f',
      edgeColor: '#4a4a4a',
      minimapNode: '#c9a857',
      minimapBg: '#f0efeb',
      modalBg: 'rgba(248, 247, 243, 0.95)',
      accent: '#c9a857', // Primary gold color
      titleFont: 'Cinzel, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      nodeRadius: 12,
      edgeType: 'straight',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
  };

  return themes[themeName] || themes.wolfpack;
};

