export const getThemeStyles = (themeName) => {
  const themes = {
    // EMPIRE - Cream background, white boxes, tan borders, dark gray lines
    // From family-tree-corrected.md: #f8f7f3 cream, #c9a857 gold primary
    empire: {
      background: '#f1e7d1',
      backgroundGrid: '#d9c7a8', // Increased opacity ~5% (from #e6d9bd to #d9c7a8) for better grid visibility
      backgroundTexture: 'radial-gradient(closest-side, rgba(201,168,87,0.08), rgba(0,0,0,0) 60%)',
      nodeStudying: '#fff7ea',
      nodeGraduated: '#fff7ea',
      nodeBorder: '#d6b87a',
      nodeText: '#3b2b16',
    edgeColor: '#b89347',
    edgeStrokeWidth: 2.4,
    edgeStrokeColor: '#a0803a',
    edgeShadow: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.25)) drop-shadow(0px 0px 1px rgba(160, 128, 58, 0.4))',
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
    pledgeMarkerAccent: '#d9b87b',
    pledgeMarkerAccentEnd: '#be9d5b',
    pledgeMarkerText: '#3d3526',
    pledgeMarkerLabelBg: 'rgba(255, 255, 255, 0.35)',
    pledgeMarkerLabelBorder: 'rgba(255, 255, 255, 0.55)',
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
    edgeStrokeWidth: 2.2,
    edgeStrokeColor: 'rgba(246, 228, 183, 0.95)',
    edgeShadow: 'drop-shadow(0px 1px 2px rgba(8,16,24,0.65)) drop-shadow(0px 0px 1px rgba(235,210,144,0.45))',
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
    pledgeMarkerAccent: '#f3e2b2',
    pledgeMarkerAccentEnd: '#d9b67a',
    pledgeMarkerText: '#fdf5dc',
    pledgeMarkerLabelBg: 'rgba(17, 30, 48, 0.86)',
    pledgeMarkerLabelBorder: 'rgba(243, 220, 166, 0.55)',
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
    edgeStrokeWidth: 2.2,
    edgeStrokeColor: 'rgba(244, 217, 97, 0.85)',
    edgeShadow: 'drop-shadow(0px 1px 2px rgba(5,40,26,0.55)) drop-shadow(0px 0px 1px rgba(244,217,97,0.35))',
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
    pledgeMarkerAccent: '#f4d961',
    pledgeMarkerAccentEnd: '#c5b04b',
    pledgeMarkerText: '#0a2316',
    pledgeMarkerLabelBg: 'rgba(252, 255, 247, 0.8)',
    pledgeMarkerLabelBorder: 'rgba(216, 242, 168, 0.65)',
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
    edgeStrokeWidth: 2.2,
    edgeStrokeColor: 'rgba(214, 228, 255, 0.85)',
    edgeShadow: 'drop-shadow(0px 1px 2px rgba(26,38,66,0.45)) drop-shadow(0px 0px 1px rgba(214,228,255,0.4))',
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
    pledgeMarkerAccent: '#d6e4ff',
    pledgeMarkerAccentEnd: '#9cb4e6',
    pledgeMarkerText: '#1e2c45',
    pledgeMarkerLabelBg: 'rgba(247, 250, 255, 0.85)',
    pledgeMarkerLabelBorder: 'rgba(214, 228, 255, 0.6)',
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
    edgeStrokeWidth: 2.2,
    edgeStrokeColor: 'rgba(212, 175, 126, 0.92)',
    edgeShadow: 'drop-shadow(0px 1px 2px rgba(12,10,8,0.55)) drop-shadow(0px 0px 1px rgba(212,175,126,0.45))',
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
    pledgeMarkerAccent: '#d4af7e',
    pledgeMarkerAccentEnd: '#b88f63',
    pledgeMarkerText: '#fbf7ee',
    pledgeMarkerLabelBg: 'rgba(36, 24, 18, 0.9)',
    pledgeMarkerLabelBorder: 'rgba(212, 175, 126, 0.55)',
    },
  };

  return themes[themeName] || themes.wolfpack;
};

