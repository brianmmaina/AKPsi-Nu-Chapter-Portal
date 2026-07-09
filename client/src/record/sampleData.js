// Bundled sample roster used only when the chapter server is unreachable.
// Mirrors the design prototype's offline dataset so the archive stays browsable.

export const SAMPLE_META = {
  empire: { founded: 'Est. Fall ’19' },
  power: { founded: 'Est. Spring ’20' },
  greed: { founded: 'Est. Fall ’20' },
  pride: { founded: 'Est. Spring ’21' },
  wolfpack: { founded: 'Est. Fall ’21' },
};

export const SAMPLE_NAMES = {
  empire: 'Empire',
  power: 'Power',
  greed: 'Greed',
  pride: 'Pride',
  wolfpack: 'Wolfpack',
};

// [name, pledgeClass, major, gradYear, role, bio, points]
export const SAMPLE_DATA = {
  empire: [
    ['Brandon Chen', 'Sigma ’20', 'Finance', '2024', 'Founding Big', 'Investment banking analyst; chaired Professional Development.', 188],
    ['Alex Kim', 'Tau ’21', 'Accounting', '2025', 'Pledge Educator', 'Audit associate; led the Fall recruitment overhaul.', 169],
    ['Owen Brooks', 'Tau ’21', 'Marketing', '2025', 'Brother', 'Brand-strategy intern; ran the chapter newsletter.', 142],
    ['Hana Suzuki', 'Phi ’22', 'Economics', '2026', 'Brother', 'Research assistant; coordinates the case-competition team.', 128],
    ['Wei Zhang', 'Phi ’22', 'Information Systems', '2026', 'Brother', 'Software intern; maintains the chapter portal.', 119],
    ['Caleb Ortiz', 'Chi ’23', 'Finance', '2027', 'New Member', 'Pledge-class treasurer; rowing club.', 96],
    ['Sora Mehta', 'Chi ’23', 'Business Analytics', '2027', 'New Member', 'Data-analyst intern; debate society.', 88],
    ['Jenna Park', 'Psi ’24', 'Marketing', '2027', 'New Member', 'Brand intern; photography lead.', 74],
    ['Marco Diaz', 'Psi ’24', 'Finance', '2028', 'New Member', 'Finance society member.', 62],
  ],
  power: [
    ['Marcus Reid', 'Sigma ’20', 'Management', '2024', 'Founding Big', 'Consulting analyst; founded the mentorship program.', 144],
    ['Tobias Lund', 'Tau ’21', 'Finance', '2025', 'VP Finance', 'Private-equity intern; manages chapter dues.', 121],
    ['Grace Whitman', 'Tau ’21', 'Marketing', '2025', 'Social Chair', 'Growth-marketing intern; runs chapter socials.', 133],
    ['Ivan Petrov', 'Phi ’22', 'Economics', '2026', 'Brother', 'Economics tutor; case team.', 104],
    ['Lena Park', 'Phi ’22', 'Business Administration', '2026', 'Philanthropy Lead', 'Operations intern; philanthropy lead.', 98],
    ['Noah Bennett', 'Chi ’23', 'Finance', '2027', 'New Member', 'Wealth-management intern.', 79],
    ['Dani Okafor', 'Chi ’23', 'Information Systems', '2027', 'New Member', 'IT support; esports club.', 72],
    ['Sara Lin', 'Psi ’24', 'Economics', '2027', 'New Member', 'Policy research intern.', 66],
    ['Theo Walsh', 'Psi ’24', 'Marketing', '2028', 'New Member', 'Marketing club member.', 58],
  ],
  greed: [
    ['Nina Alvarez', 'Sigma ’20', 'Finance', '2024', 'Founding Big', 'Sales & trading analyst; alumni liaison.', 151],
    ['Priya Shah', 'Tau ’21', 'Accounting', '2025', 'Scholarship Chair', 'Tax associate; scholarship chair.', 132],
    ['Devon Clarke', 'Tau ’21', 'Information Systems', '2025', 'Brother', 'Product intern; built the points engine.', 126],
    ['Mia Rosario', 'Phi ’22', 'Marketing', '2026', 'Events Committee', 'Content strategist; events committee.', 110],
    ['Felix Yorke', 'Phi ’22', 'Economics', '2026', 'Brother', 'Macro-research intern.', 101],
    ['Aisha Bello', 'Chi ’23', 'Finance', '2027', 'New Member', 'Investment-club VP.', 84],
    ['Ravi Anand', 'Chi ’23', 'Business Analytics', '2027', 'New Member', 'Analytics intern; chess club.', 77],
    ['Hugo Bauer', 'Psi ’24', 'Finance', '2027', 'New Member', 'Venture-capital intern.', 64],
    ['Lila Cruz', 'Psi ’24', 'Accounting', '2028', 'New Member', 'Accounting society member.', 55],
  ],
  pride: [
    ['Jordan Lee', 'Rho ’19', 'Finance', '2023', 'Founding Big', 'Portfolio analyst; chapter founder.', 158],
    ['Diego Martinez', 'Tau ’21', 'Management', '2025', 'Chapter President', 'Strategy consultant; chapter president.', 214],
    ['Sophia Reyes', 'Tau ’21', 'Marketing', '2025', 'VP Programming', 'Marketing lead; runs the Family Cup.', 176],
    ['Aaron Cole', 'Phi ’22', 'Economics', '2026', 'Brother', 'Equity-research intern.', 147],
    ['Tasha Green', 'Phi ’22', 'Business Administration', '2026', 'Service Chair', 'Operations intern; service chair.', 122],
    ['Liam Walsh', 'Chi ’23', 'Finance', '2027', 'New Member', 'Corporate-finance intern.', 93],
    ['Priscilla Yoon', 'Chi ’23', 'Marketing', '2027', 'New Member', 'Brand intern; dance team.', 86],
    ['Marcus Vale', 'Psi ’24', 'Finance', '2027', 'New Member', 'Private-equity intern.', 71],
    ['Elena Cho', 'Psi ’24', 'Economics', '2028', 'New Member', 'Economics club member.', 60],
  ],
  wolfpack: [
    ['Maya Patel', 'Sigma ’20', 'Finance', '2024', 'Founding Big', 'Banking analyst; founded Wolfpack.', 201],
    ['Samira Yusuf', 'Tau ’21', 'Information Systems', '2025', 'VP Technology', 'Software engineer; portal lead.', 176],
    ['Eli Brandt', 'Tau ’21', 'Marketing', '2025', 'Recruitment Chair', 'Growth intern; recruitment chair.', 138],
    ['Ruth Nakamura', 'Phi ’22', 'Economics', '2026', 'Brother', 'Policy-research intern.', 124],
    ['Carlos Vega', 'Phi ’22', 'Finance', '2026', 'Brother', 'Investment-analyst intern.', 112],
    ['Dana Cho', 'Chi ’23', 'Business Administration', '2027', 'New Member', 'Consulting-club lead.', 90],
    ['Omar Haddad', 'Chi ’23', 'Finance', '2027', 'New Member', 'Trading society member.', 83],
    ['Nadia Khan', 'Psi ’24', 'Information Systems', '2027', 'New Member', 'Software-engineering intern.', 69],
    ['Ben Foster', 'Psi ’24', 'Finance', '2028', 'New Member', 'Trading club member.', 57],
  ],
};

// Index of each brother's Big within their family list (null = root).
export const SAMPLE_BIG_MAP = [null, 0, 0, 1, 1, 2, 2, 3, 5];

export const SAMPLE_ALUMNI = [
  ['Jordan Lee', '2023', 'Goldman Sachs', 'Analyst', 'Finance', true],
  ['Maya Patel', '2024', 'McKinsey & Co.', 'Business Analyst', 'Consulting', true],
  ['Brandon Chen', '2024', 'J.P. Morgan', 'IB Analyst', 'Finance', true],
  ['Nina Alvarez', '2024', 'Morgan Stanley', 'S&T Analyst', 'Finance', false],
  ['Marcus Reid', '2024', 'Bain & Co.', 'Associate', 'Consulting', true],
  ['Grace Whitman', '2025', 'Google', 'APM', 'Technology', false],
  ['Devon Clarke', '2025', 'Stripe', 'Product Manager', 'Technology', true],
  ['Priya Shah', '2025', 'Deloitte', 'Tax Associate', 'Accounting', false],
  ['Sophia Reyes', '2025', 'Meta', 'Marketing', 'Technology', false],
  ['Samira Yusuf', '2025', 'Microsoft', 'Software Engineer', 'Technology', true],
].map((a) => ({
  name: a[0],
  year: a[1],
  company: a[2],
  role: a[3],
  industry: a[4],
  mentor: a[5],
  linkedin: '',
  email: '',
}));
