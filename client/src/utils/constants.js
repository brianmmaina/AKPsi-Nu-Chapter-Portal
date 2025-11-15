export const LEFT_TREE_GUTTER = 140;
export const RIGHT_TREE_GUTTER = 80;
export const SAFE_VIEWPORT_WIDTH = 1280;
export const SAFE_VIEWPORT_HEIGHT = 700;

export const READABILITY_ZOOM = {
  empire: 0.05,
  power: 0.05,
  pride: 0.05,
  greed: 0.05,
  wolfpack: 0.05,
};

export const FAMILY_LAYOUT_RULES = {
  base: {
    horizontalSpacing: 410,
    rowHeight: 100,
    minColumnGap: 40,
    minRowGap: 10,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 5,
  },
  empire: {
    horizontalSpacing: 350,
    rowHeight: 50,
    minColumnGap: 40,
    minRowGap: 10,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 8,
  },
  greed: {
    horizontalSpacing: 700,
    rowHeight: 110,
    minColumnGap: 80,
    minRowGap: 30,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 10.5,
  },
  power: {
    horizontalSpacing: 650,
    rowHeight: 165,
    minColumnGap: 40,
    minRowGap: 10,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 8,
  },
  pride: {
    horizontalSpacing: 840,
    rowHeight: 168,
    minColumnGap: 80,
    minRowGap: 30,
  },
  wolfpack: {
    horizontalSpacing: 980,
    rowHeight: 160,
    minColumnGap: 80,
    minRowGap: 30,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH * 10,
  },
};

