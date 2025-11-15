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
    columnWidth: 420,
    rowHeight: 168,
    minColumnGap: 46,
    minRowGap: 26,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.9,
    columnSnap: 8,
  },
  empire: {
    columnWidth: 390,
    rowHeight: 160,
    minColumnGap: 42,
    minRowGap: 24,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.6,
  },
  greed: {
    columnWidth: 460,
    rowHeight: 162,
    minColumnGap: 54,
    minRowGap: 22,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 2.1,
  },
  power: {
    columnWidth: 420,
    rowHeight: 165,
    minColumnGap: 48,
    minRowGap: 24,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.8,
  },
  pride: {
    columnWidth: 420,
    rowHeight: 168,
    minColumnGap: 50,
    minRowGap: 26,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.8,
  },
  wolfpack: {
    columnWidth: 480,
    rowHeight: 160,
    minColumnGap: 56,
    minRowGap: 22,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 2.1,
  },
};

