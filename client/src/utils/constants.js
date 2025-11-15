export const LEFT_TREE_GUTTER = 140;
export const RIGHT_TREE_GUTTER = 80;
export const SAFE_VIEWPORT_WIDTH = 1280;
export const SAFE_VIEWPORT_HEIGHT = 700;

export const READABILITY_ZOOM = {
  empire: 0.52,
  power: 0.5,
  pride: 0.52,
  greed: 0.54,
  wolfpack: 0.54,
};

export const FAMILY_LAYOUT_RULES = {
  base: {
    columnWidth: 340,
    rowHeight: 168,
    minColumnGap: 38,
    minRowGap: 26,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.45,
    columnSnap: 8,
  },
  empire: {
    columnWidth: 330,
    rowHeight: 160,
    minColumnGap: 36,
    minRowGap: 24,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.3,
  },
  greed: {
    columnWidth: 380,
    rowHeight: 162,
    minColumnGap: 44,
    minRowGap: 22,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.6,
  },
  power: {
    columnWidth: 360,
    rowHeight: 165,
    minColumnGap: 40,
    minRowGap: 24,
  },
  pride: {
    columnWidth: 360,
    rowHeight: 168,
    minColumnGap: 42,
    minRowGap: 26,
  },
  wolfpack: {
    columnWidth: 380,
    rowHeight: 160,
    minColumnGap: 44,
    minRowGap: 22,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.6,
  },
};

