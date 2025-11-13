export const getThemeStyles = (themeName) => {
  const themes = {
    // EMPIRE - Cream background, white boxes, tan borders, dark gray lines
    // From family-tree-corrected.md: #f8f7f3 cream, #c9a857 gold primary
    empire: {
      background: '#f1e7d1',
      backgroundGrid: '#e6d9bd',
      backgroundTexture: 'radial-gradient(closest-side, rgba(201,168,87,0.08), rgba(0,0,0,0) 60%)',
      nodeStudying: '#fff7ea',
      nodeGraduated: '#fff7ea',
      nodeBorder: '#d6b87a',
      nodeText: '#3b2b16',
      edgeColor: '#b89347',
      minimapNode: '#c9a857',
      minimapBg: '#f1e7d1',
      modalBg: 'rgba(241, 231, 210, 0.92)',
      accent: '#c9a857',
      titleFont: 'Cinzel, serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      nodeRadius: 6,
      edgeType: 'smoothstep',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
    // POWER - Very dark navy with champagne gold accents
    // From family-tree-corrected.md: #101a26 dark navy, #ebd290 champagne gold
    // Applied Empire format: backgroundTexture, edgeAnimated: false, backgroundVariant: 'lines', nodeRadius: 6
    power: {
      background: '#101a26',
      backgroundGrid: '#0d151f',
      backgroundTexture: 'radial-gradient(closest-side, rgba(235,210,144,0.08), rgba(0,0,0,0) 60%)',
      nodeStudying: 'rgba(17, 30, 48, 0.96)', // solid cards
      nodeGraduated: 'rgba(17, 30, 48, 0.96)',
      nodeBorder: '#f3dca6', // Champagne gold border
      nodeText: '#ffffff', // White text
      edgeColor: '#f6e4b7', // Gold connecting lines
      minimapNode: '#ebd290',
      minimapBg: '#101a26',
      modalBg: 'rgba(16, 26, 38, 0.95)',
      accent: '#ebd290', // Champagne gold primary
      titleFont: 'Orbitron, sans-serif', // Modern, powerful font
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 6, // Match Empire format
      edgeType: 'smoothstep',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
    // GREED - Deep forest green background with white boxes and yellow-gold accents
    // From family-tree-corrected.md: #095332 forest green, #f4d961 golden yellow
    // Applied Empire format: backgroundTexture, edgeAnimated: false, backgroundVariant: 'lines', nodeRadius: 6
    greed: {
      background: '#064729',
      backgroundGrid: '#04341f',
      backgroundTexture: 'radial-gradient(closest-side, rgba(244,217,97,0.08), rgba(0,0,0,0) 60%)',
      nodeStudying: '#fcfff7', // bright cards
      nodeGraduated: '#fcfff7',
      nodeBorder: '#d8f2a8', // vivid border
      nodeText: '#0a2316', // Deep forest text for contrast
      edgeColor: '#f9e97a', // luminous gold connecting lines
      minimapNode: '#ffffff',
      minimapBg: '#064729',
      modalBg: 'rgba(7, 58, 34, 0.95)',
      accent: '#f6e66a', // Golden yellow primary
      titleFont: 'Montserrat, system-ui, sans-serif', // Heavy/bold sans-serif
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 6, // Match Empire format
      edgeType: 'smoothstep',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
    // WOLFPACK - Slate blue background, white boxes, dark blue headers
    // From family-tree-corrected.md: #364c73 slate blue, #ffffff white primary, #3d5373 dark blue headers
    // Applied Empire format: backgroundTexture, edgeAnimated: false, backgroundVariant: 'lines', nodeRadius: 6
    wolfpack: {
      background: '#364c73',
      backgroundGrid: '#2a3a5c',
      backgroundTexture: 'radial-gradient(closest-side, rgba(156,184,234,0.08), rgba(0,0,0,0) 60%)',
      nodeStudying: '#f7faff', // Bright cards
      nodeGraduated: '#f7faff',
      nodeBorder: '#d6e4ff', // Brighter border for contrast
      nodeText: '#1e2c45', // Deep navy text
      edgeColor: '#f0f6ff', // High contrast connecting lines
      minimapNode: '#ffffff',
      minimapBg: '#2a3a5c',
      modalBg: 'rgba(54, 76, 115, 0.95)',
      accent: '#ffffff', // White primary - ALL WOLFPACK text should be white
      accentSecondary: '#3d5373', // Dark blue for headers/boxes
      titleFont: 'Russo One, sans-serif', // Heavy bold sans-serif
      bodyFont: 'Montserrat, system-ui, sans-serif',
      nodeRadius: 6, // Match Empire format
      edgeType: 'smoothstep',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
    // PRIDE - Very dark brown/black with muted gold accents, photo-focused
    // From family-tree-corrected.md: #181413 dark brown, #d4af7e muted gold
    // Applied Empire format: backgroundTexture, edgeAnimated: false, backgroundVariant: 'lines', nodeRadius: 6
    pride: {
      background: '#181413',
      backgroundGrid: '#242220',
      backgroundTexture: 'radial-gradient(closest-side, rgba(212,175,126,0.08), rgba(0,0,0,0) 60%)',
      nodeStudying: '#2a1d12', // Solid dark card
      nodeGraduated: '#2a1d12',
      nodeBorder: '#d4af7e', // Muted gold border
      nodeText: '#ffffff', // White text
      edgeColor: '#d4af7e', // Gold connecting lines
      minimapNode: '#d4af7e',
      minimapBg: '#181413',
      modalBg: 'rgba(24, 20, 19, 0.95)',
      accent: '#d4af7e', // Muted gold primary
      titleFont: 'Cinzel, serif', // Elegant serif
      bodyFont: 'Inter, system-ui, sans-serif',
      nodeRadius: 6, // Match Empire format
      edgeType: 'smoothstep',
      edgeAnimated: false,
      backgroundVariant: 'lines',
    },
  };

  return themes[themeName] || themes.wolfpack;
};

