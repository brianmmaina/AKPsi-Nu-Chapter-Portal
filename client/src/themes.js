export const getThemeStyles = (themeName) => {
  const themes = {
    // EMPIRE - Cream background, white boxes, tan borders, dark gray lines
    // From family-tree-corrected.md: #f8f7f3 cream, #c9a857 gold primary
    empire: {
      background: '#f8f7f3',
      backgroundGrid: '#f0efeb',
      backgroundTexture: 'radial-gradient(closest-side, rgba(0,0,0,0.02), rgba(0,0,0,0) 60%)',
      nodeStudying: '#ffffff',
      nodeGraduated: '#ffffff',
      nodeBorder: '#d4c9b3', // Tan border #d4c9b3
      nodeText: '#1f1f1f', // Very dark gray/black for member names
      edgeColor: '#2a2a2a', // Darker gray for better visibility on cream background
      minimapNode: '#c9a857',
      minimapBg: '#f0efeb',
      modalBg: 'rgba(248, 247, 243, 0.95)',
      accent: '#c9a857', // Warm gold primary
      titleFont: 'Cinzel, serif', // Classic serif for elegance
      bodyFont: 'Inter, system-ui, sans-serif',
      nodeRadius: 12, // Elegant rounded corners
      edgeType: 'straight',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
    // POWER - Very dark navy with champagne gold accents, hexagon shapes
    // From family-tree-corrected.md: #101a26 dark navy, #ebd290 champagne gold
    power: {
      background: '#101a26',
      backgroundGrid: '#0d151f',
      nodeStudying: 'transparent', // Hexagons with transparent fill
      nodeGraduated: 'transparent',
      nodeBorder: '#ebd290', // Champagne gold hexagon border
      nodeText: '#ffffff', // White text
      edgeColor: '#ebd290', // Gold connecting lines
      minimapNode: '#ebd290',
      minimapBg: '#101a26',
      modalBg: 'rgba(16, 26, 38, 0.95)',
      accent: '#ebd290', // Champagne gold primary
      titleFont: 'Orbitron, sans-serif', // Modern, powerful font
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 0, // Hexagons don't have border-radius (handled by clip-path)
      edgeType: 'smoothstep',
      backgroundVariant: 'dots',
    },
    // GREED - Deep forest green background with white boxes and yellow-gold accents
    // From family-tree-corrected.md: #095332 forest green, #f4d961 golden yellow
    greed: {
      background: '#095332',
      backgroundGrid: '#073d26',
      nodeStudying: '#ffffff', // White boxes
      nodeGraduated: '#ffffff',
      nodeBorder: '#e0e0e0', // Light gray border
      nodeText: '#333333', // Dark text on white boxes (UPPERCASE)
      edgeColor: '#ffffff', // White connecting lines
      minimapNode: '#ffffff',
      minimapBg: '#095332',
      modalBg: 'rgba(9, 83, 50, 0.95)',
      accent: '#f4d961', // Golden yellow primary
      titleFont: 'Montserrat, system-ui, sans-serif', // Heavy/bold sans-serif
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 0, // Crisp corners (0px border-radius)
      edgeType: 'smoothstep',
      backgroundVariant: 'dots',
    },
    // WOLFPACK - Slate blue background, white boxes, dark blue headers
    // From family-tree-corrected.md: #364c73 slate blue, #ffffff white primary, #3d5373 dark blue headers
    wolfpack: {
      background: '#364c73',
      backgroundGrid: '#2a3a5c',
      nodeStudying: '#ffffff', // White boxes
      nodeGraduated: '#ffffff',
      nodeBorder: '#3d5373', // Dark blue header bar color
      nodeText: '#3d5373', // Dark blue text (but headers/accents are white)
      edgeColor: '#364c73', // Slate blue connecting lines
      minimapNode: '#ffffff',
      minimapBg: '#2a3a5c',
      modalBg: 'rgba(54, 76, 115, 0.95)',
      accent: '#ffffff', // White primary - ALL WOLFPACK text should be white
      accentSecondary: '#3d5373', // Dark blue for headers/boxes
      titleFont: 'Russo One, sans-serif', // Heavy bold sans-serif
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 0, // Crisp corners
      edgeType: 'smoothstep',
      backgroundVariant: 'dots',
    },
    // PRIDE - Very dark brown/black with muted gold accents, photo-focused
    // From family-tree-corrected.md: #181413 dark brown, #d4af7e muted gold
    pride: {
      background: '#181413',
      backgroundGrid: '#242220',
      nodeStudying: '#181413', // Dark background with gold border
      nodeGraduated: '#181413',
      nodeBorder: '#d4af7e', // Muted gold border
      nodeText: '#ffffff', // White text
      edgeColor: '#d4af7e', // Gold connecting lines
      minimapNode: '#d4af7e',
      minimapBg: '#181413',
      modalBg: 'rgba(24, 20, 19, 0.95)',
      accent: '#d4af7e', // Muted gold primary
      titleFont: 'Cinzel, serif', // Elegant serif
      bodyFont: 'Inter, system-ui, sans-serif',
      nodeRadius: 8,
      edgeType: 'straight',
      backgroundVariant: 'lines',
    },
  };

  return themes[themeName] || themes.wolfpack;
};

