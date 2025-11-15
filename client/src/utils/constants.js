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
    columnWidth: 320,
    rowHeight: 150,
    minColumnGap: 32,
    minRowGap: 24,
    maxTreeWidth: SAFE_VIEWPORT_WIDTH - LEFT_TREE_GUTTER - RIGHT_TREE_GUTTER - 40,
    columnSnap: 16,
  },
  empire: {
    columnWidth: 310,
    rowHeight: 148,
    minColumnGap: 28,
    minRowGap: 20,
  },
  greed: {
    columnWidth: 330,
    rowHeight: 142,
    minColumnGap: 36,
    minRowGap: 18,
  },
  power: {
    columnWidth: 320,
    rowHeight: 145,
    minColumnGap: 32,
    minRowGap: 20,
  },
  pride: {
    columnWidth: 325,
    rowHeight: 150,
    minColumnGap: 30,
    minRowGap: 20,
  },
  wolfpack: {
    columnWidth: 320,
    rowHeight: 140,
    minColumnGap: 34,
    minRowGap: 18,
  },
};

