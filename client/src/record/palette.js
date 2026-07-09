// Design tokens shared across the Nu Chapter Record screens.
// Values come straight from the design handoff (README "Design Tokens").

export const INK = '#2b2318';
export const PAPER_TEXT = '#f0e9d8';
export const CRIMSON = '#6f2b26';
export const GOLD = '#9a7327';

export const FAMILY_PALETTE = {
  empire: {
    accent: '#9a7327',
    soft: 'rgba(154,115,39,.13)',
    softBorder: 'rgba(154,115,39,.35)',
    subtitle: 'Heritage of enterprise and ambition',
  },
  power: {
    accent: '#5f6f86',
    soft: 'rgba(95,111,134,.13)',
    softBorder: 'rgba(95,111,134,.35)',
    subtitle: 'Strategic lineage and leadership',
  },
  greed: {
    accent: '#6b6f3a',
    soft: 'rgba(107,111,58,.14)',
    softBorder: 'rgba(107,111,58,.35)',
    subtitle: 'Commerce, drive, and ambition',
  },
  pride: {
    accent: '#7a3b2e',
    soft: 'rgba(122,59,46,.12)',
    softBorder: 'rgba(122,59,46,.34)',
    subtitle: 'A heritage of excellence',
  },
  wolfpack: {
    accent: '#4f6276',
    soft: 'rgba(79,98,118,.13)',
    softBorder: 'rgba(79,98,118,.35)',
    subtitle: 'Brotherhood and unity',
  },
};

// Accents cycled for families beyond the five known names.
export const EXTRA_ACCENTS = ['#8a4fb0', '#3a7a8c', '#a8466f'];

export const STREAK_META = {
  goat: { badge: 'G.O.A.T', color: '#9a7327', mult: 1.8, threshold: 8 },
  locked: { badge: 'Locked', color: '#4f6276', mult: 1.4, threshold: 5 },
  'on-fire': { badge: 'On Fire', color: '#b5651d', mult: 1.2, threshold: 3 },
};

export const STREAK_TIER_LIST = [
  { badge: 'On Fire', mult: '1.2', threshold: 3, color: '#b5651d' },
  { badge: 'Locked', mult: '1.4', threshold: 5, color: '#4f6276' },
  { badge: 'G.O.A.T', mult: '1.8', threshold: 8, color: '#9a7327' },
];

export const CAT_COLOR = {
  CHAPTER: '#3a2f20',
  PROFESSIONAL: '#0f766e',
  DEI: '#8a4fb0',
  SERVICE: '#3b6fb0',
  SOCIAL: '#a8466f',
  RECRUITMENT: '#9c4fb0',
  RITUAL: '#9a6040',
  COMMITTEE: '#3a7a8c',
  COMPETITION: '#4a7a3a',
  OTHER: '#8a7b62',
  ADJUSTMENT: '#8c4a3a',
};

export const CAT_SOFT = {
  CHAPTER: 'rgba(58,47,32,.1)',
  PROFESSIONAL: 'rgba(15,118,110,.1)',
  DEI: 'rgba(138,79,176,.12)',
  SERVICE: 'rgba(59,111,176,.1)',
  SOCIAL: 'rgba(168,70,111,.1)',
  RECRUITMENT: 'rgba(156,79,176,.1)',
  RITUAL: 'rgba(154,96,64,.1)',
  COMMITTEE: 'rgba(58,122,140,.1)',
  COMPETITION: 'rgba(74,122,58,.12)',
  OTHER: 'rgba(138,123,98,.12)',
  ADJUSTMENT: 'rgba(140,74,58,.12)',
};

export const CAT_LABEL = {
  CHAPTER: 'Chapter',
  PROFESSIONAL: 'Professional',
  DEI: 'DEI',
  SERVICE: 'Service',
  SOCIAL: 'Social',
  RECRUITMENT: 'Recruitment',
  RITUAL: 'Ritual',
  COMMITTEE: 'Committee',
  COMPETITION: 'Competition',
  OTHER: 'Other',
  ADJUSTMENT: 'Adjustments',
};

export const initials = (name) =>
  String(name || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const hexA = (hex, a) => {
  const n = String(hex || '#2b2318').replace('#', '');
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
};

/**
 * Chapter photo washed into the paper aesthetic: the image sits under a
 * paper-tone overlay so ink text keeps its contrast. Higher wash = fainter photo.
 */
export const photoBg = (url, wash = 0.86) => ({
  backgroundImage: `linear-gradient(rgba(230,220,198,${wash}), rgba(230,220,198,${wash})), url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
});
