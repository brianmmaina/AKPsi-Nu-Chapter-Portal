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
    columnMultiplier: 2.4,
    rowHeight: 168,
    minColumnGap: 40,
    minRowGap: 26,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.8,
    columnSnap: 8,
  },
  empire: {
    columnMultiplier: 2.1,
    rowHeight: 160,
    minColumnGap: 34,
    minRowGap: 24,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.5,
  },
  greed: {
    columnMultiplier: 2.6,
    rowHeight: 162,
    minColumnGap: 46,
    minRowGap: 22,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 2.2,
  },
  power: {
    columnMultiplier: 2.3,
    rowHeight: 165,
    minColumnGap: 40,
    minRowGap: 24,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.9,
  },
  pride: {
    columnMultiplier: 2.3,
    rowHeight: 168,
    minColumnGap: 42,
    minRowGap: 26,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 1.9,
  },
  wolfpack: {
    columnMultiplier: 2.7,
    rowHeight: 160,
    minColumnGap: 48,
    minRowGap: 22,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 2.2,
  },
};

