/**
 * Pledge Class Normalization Utilities
 * 
 * Handles normalization, synonym mapping, and level calculation for pledge classes
 */

const PLEDGE_ORDER = [
  'alpha','beta','gamma','delta','epsilon','zeta','eta','theta','iota','kappa','lambda','mu','nu','xi','omicron','pi','rho','sigma','tau','upsilon','phi','chi','psi','omega',
  'alpha alpha','alpha beta','alpha gamma','alpha delta','alpha epsilon','alpha zeta','alpha eta','alpha theta','alpha iota','alpha kappa','alpha lambda','alpha mu','alpha nu','alpha xi','alpha omicron','alpha pi','alpha rho','alpha sigma','alpha tau','alpha upsilon','alpha phi','alpha chi','alpha psi','alpha omega',
];

const PLEDGE_INDEX = new Map(PLEDGE_ORDER.map((pledge, idx) => [pledge, idx]));

const PLEDGE_SYNONYMS = {
  'alphabeta': 'alpha beta',
  'alpha beta': 'alpha beta',
  'alpha-beta': 'alpha beta',
  'alpha gamma': 'alpha gamma',
  'alphagamma': 'alpha gamma',
  'alphazeta': 'alpha zeta',
  'alpha zeta': 'alpha zeta',
  'alphatheta': 'alpha theta',
  'alpha theta': 'alpha theta',
  'alpha eta': 'alpha eta',
  'alphaeta': 'alpha eta',
  'alpha iota': 'alpha iota',
  'alphaiota': 'alpha iota',
  'alpha lambda': 'alpha lambda',
  'alphalambda': 'alpha lambda',
  'alpha mu': 'alpha mu',
  'alphamu': 'alpha mu',
  'alpha nu': 'alpha nu',
  'alphan u': 'alpha nu',
  'alpha xi': 'alpha xi',
  'alphaxi': 'alpha xi',
  'alpha omicron': 'alpha omicron',
  'alphaomicron': 'alpha omicron',
  'alpha pi': 'alpha pi',
  'alphapi': 'alpha pi',
  'alpha rho': 'alpha rho',
  'alpharho': 'alpha rho',
  'alpha sigma': 'alpha sigma',
  'alphasigma': 'alpha sigma',
  'alpha tau': 'alpha tau',
  'alphatau': 'alpha tau',
  'alpha upsilon': 'alpha upsilon',
  'alphaupsilon': 'alpha upsilon',
  'alpha phi': 'alpha phi',
  'alphaphi': 'alpha phi',
  'alpha chi': 'alpha chi',
  'alphachi': 'alpha chi',
  'alpha psi': 'alpha psi',
  'alphapsi': 'alpha psi',
  'alpha omega': 'alpha omega',
  'alphaomega': 'alpha omega',
  // Handle "ONE" variants for OMEGA
  'one': 'omega',
  'one ea': 'omega',
  'oneea': 'omega',
  'one-ea': 'omega',
};

const LETTER_TO_GREEK = {
  a: 'alpha',
  b: 'beta',
  g: 'gamma',
  d: 'delta',
  e: 'epsilon',
  z: 'zeta',
  h: 'eta',
  t: 'theta',
  i: 'iota',
  k: 'kappa',
  l: 'lambda',
  m: 'mu',
  n: 'nu',
  x: 'xi',
  o: 'omicron',
  p: 'pi',
  r: 'rho',
  s: 'sigma',
  u: 'upsilon',
  f: 'phi',
  c: 'chi',
  y: 'psi',
  w: 'omega',
};

/**
 * Normalizes a pledge class string
 * @param {string} value - Pledge class string
 * @returns {string} Normalized pledge class
 */
export const normalizePledge = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Expands a two-letter abbreviation to full pledge class name
 * @param {string} normalized - Normalized pledge class string
 * @returns {string|null} Expanded pledge class or null
 */
export const expandDoubleLetter = (normalized) => {
  const compact = normalized.replace(/\s+/g, '');
  if (compact.length === 2) {
    const first = LETTER_TO_GREEK[compact[0]];
    const second = LETTER_TO_GREEK[compact[1]];
    if (first && second) {
      return `${first} ${second}`;
    }
  }
  return null;
};

/**
 * Gets the pledge level index for a given pledge class
 * @param {string} pledgeClass - Pledge class string
 * @param {number} fallback - Fallback level if pledge class not found
 * @returns {number} Pledge level index
 */
export const getPledgeLevel = (pledgeClass, fallback) => {
  if (!pledgeClass || typeof pledgeClass !== 'string') return fallback;
  const normalized = normalizePledge(pledgeClass);
  if (!normalized) return fallback;

  const synonym = PLEDGE_SYNONYMS[normalized];
  const canonical = synonym || normalized;

  if (PLEDGE_INDEX.has(canonical)) {
    return PLEDGE_INDEX.get(canonical);
  }

  const expanded = expandDoubleLetter(canonical);
  if (expanded && PLEDGE_INDEX.has(expanded)) {
    return PLEDGE_INDEX.get(expanded);
  }

  return fallback;
};

/**
 * Gets the pledge order array
 * @returns {string[]} Array of pledge classes in order
 */
export const getPledgeOrder = () => [...PLEDGE_ORDER];

