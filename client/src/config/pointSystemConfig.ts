export type PointsTimeframe = 'SEMESTER' | 'YEAR';

export interface StreakTier {
  threshold: number;
  multiplier: number;
  badge: string;
  key: 'on-fire' | 'locked' | 'goat';
}

export const STREAK_TIERS: StreakTier[] = [
  { threshold: 8, multiplier: 1.8, badge: 'G.O.A.T', key: 'goat' },
  { threshold: 5, multiplier: 1.4, badge: 'Locked',  key: 'locked' },
  { threshold: 3, multiplier: 1.2, badge: 'On Fire',  key: 'on-fire' },
];

export const STREAK_ELIGIBLE_CATEGORIES: PointCategory[] = ['CHAPTER'];

export type PointCategory =
  | 'CHAPTER'
  | 'PROFESSIONAL'
  | 'DEI'
  | 'SERVICE'
  | 'SOCIAL'
  | 'RECRUITMENT'
  | 'RITUAL'
  | 'COMMITTEE'
  | 'COMPETITION'
  | 'OTHER';

export interface Checkpoint {
  id: string;
  label: string;
  dueWeek: number;
  timeframe: PointsTimeframe;
  minimumPoints: number;
  description?: string;
}

export interface SpecialRequirement {
  key: string;
  label: string;
  owner: string;
  description: string;
}

export interface RequiredEvent {
  key: string;
  label: string;
  category: PointCategory;
  points: number;
  checkpoints: string[];
  description?: string;
}

export interface Deduction {
  key: string;
  label: string;
  points: number;
  appliesTo: 'MEMBER' | 'FAMILY';
  notes?: string;
}

export interface PointEventVariant {
  key: string;
  label: string;
  points: number;
}

export interface PointEventConfig {
  key: string;
  name: string;
  category: PointCategory;
  perUnit: string;
  points?: number;
  maxPerCheckpoint?: number;
  notes?: string;
  variants?: PointEventVariant[];
}

export interface PointSystemConfig {
  semester: string;
  checkpoints: Checkpoint[];
  specialRequirements: SpecialRequirement[];
  requiredEvents: RequiredEvent[];
  deductions: Deduction[];
  pointEvents: PointEventConfig[];
}

const checkpoints: Checkpoint[] = [
  {
    id: 'CP1',
    label: 'Checkpoint 1',
    dueWeek: 5,
    timeframe: 'SEMESTER',
    minimumPoints: 45,
    description: 'Early momentum target before fall break.',
  },
  {
    id: 'CP2',
    label: 'Checkpoint 2',
    dueWeek: 9,
    timeframe: 'SEMESTER',
    minimumPoints: 95,
    description: 'Second midpoint check prior to Midcourt.',
  },
  {
    id: 'CP3',
    label: 'Checkpoint 3',
    dueWeek: 14,
    timeframe: 'SEMESTER',
    minimumPoints: 140,
    description: 'Final checkpoint before banquets and closeout.',
  },
];

const specialRequirements: SpecialRequirement[] = [
  {
    key: 'fellowship',
    label: 'Brotherhood Points',
    owner: 'VPAA',
    description: 'Unity/support points granted for showing up when brothers need help.',
  },
  {
    key: 'dei',
    label: 'DEI Minimum',
    owner: 'VPDiversity',
    description: 'At least one DEI experience per checkpoint or remediation is required.',
  },
  {
    key: 'service',
    label: 'Service Minimum',
    owner: 'VPService',
    description: 'Every brother should log at least 4 service hours per semester.',
  },
];

const requiredEvents: RequiredEvent[] = [
  {
    key: 'chapter_meeting',
    label: 'Weekly Chapter Meetings',
    category: 'CHAPTER',
    points: 8,
    checkpoints: ['CP1', 'CP2'],
    description: 'Standard weekly meeting attendance requirement.',
  },
  {
    key: 'midcourt',
    label: 'Midcourt',
    category: 'RITUAL',
    points: 10,
    checkpoints: ['CP2'],
    description: 'Rehearsal and ceremony participation.',
  },
  {
    key: 'initiation',
    label: 'Initiation',
    category: 'RITUAL',
    points: 10,
    checkpoints: ['CP3'],
    description: 'Initiation duties and rituals.',
  },
];

const deductions: Deduction[] = [
  {
    key: 'unexcused-absence',
    label: 'Unexcused Absence',
    points: -8,
    appliesTo: 'MEMBER',
    notes: 'Applied when an absence occurs without approved excuse.',
  },
  {
    key: 'late-form',
    label: 'Late Form/Submission',
    points: -2,
    appliesTo: 'MEMBER',
    notes: 'Used for forms turned in after the posted deadline.',
  },
  {
    key: 'family-penalty',
    label: 'Family Cup Penalty',
    points: -10,
    appliesTo: 'FAMILY',
    notes: 'Used sparingly for family level penalties (e.g., repeated lateness).',
  },
];

const pointEvents: PointEventConfig[] = [
  {
    key: 'splash_tabling',
    name: 'Splash & Tabling',
    category: 'RECRUITMENT',
    perUnit: 'hour',
    points: 2,
  },
  {
    key: 'application_readings',
    name: 'Application Readings',
    category: 'RECRUITMENT',
    perUnit: 'reading',
    points: 4,
  },
  {
    key: 'recruitment_events',
    name: 'Recruitment Events',
    category: 'RECRUITMENT',
    perUnit: 'event',
    points: 5,
    notes: 'Must fill out notable interaction form to get points.',
  },
  {
    key: 'make_up_interviews',
    name: 'Make-up Interviews',
    category: 'RECRUITMENT',
    perUnit: 'interview',
    points: 2,
  },
  {
    key: 'pledge_meeting_attendance',
    name: 'Pledge Meeting Attendance',
    category: 'CHAPTER',
    perUnit: 'meeting',
    points: 2,
  },
  {
    key: 'pledge_meeting_participation',
    name: 'Pledge Meeting Participation',
    category: 'CHAPTER',
    perUnit: 'meeting',
    points: 2,
  },
  {
    key: 'pc_social_event',
    name: 'PC Social Event',
    category: 'SOCIAL',
    perUnit: 'event',
    points: 4,
  },
  {
    key: 'midcourt_prep',
    name: 'Midcourt Prep',
    category: 'RITUAL',
    perUnit: 'event',
    points: 4,
  },
  {
    key: 'iron_chef',
    name: 'Iron Chef',
    category: 'SOCIAL',
    perUnit: 'event',
    variants: [
      { key: 'general', label: 'General participation', points: 2 },
      { key: 'kitchen', label: 'Kitchen role', points: 4 },
    ],
    notes: '2 points normally, 4 points for kitchen roles.',
  },
  {
    key: 'academic_drive_contribution',
    name: 'Academic Drive Contribution',
    category: 'PROFESSIONAL',
    perUnit: 'contribution',
    points: 1,
    maxPerCheckpoint: 4,
    notes: 'Max 4 points per checkpoint from this source.',
  },
  {
    key: 'sub_org_meetings',
    name: 'Sub-Org Meetings',
    category: 'COMMITTEE',
    perUnit: 'meeting',
    points: 2,
  },
  {
    key: 'cs_events',
    name: 'Consulting/Case Events',
    category: 'PROFESSIONAL',
    perUnit: 'event',
    points: 4,
  },
  {
    key: 'dei_events',
    name: 'DEI Events',
    category: 'DEI',
    perUnit: 'event',
    points: 4,
  },
  {
    key: 'professional_events',
    name: 'Professional Events',
    category: 'PROFESSIONAL',
    perUnit: 'event',
    points: 7,
  },
  {
    key: 'social_events',
    name: 'Social Events',
    category: 'SOCIAL',
    perUnit: 'event',
    points: 3,
  },
  {
    key: 'b2b',
    name: 'B2B Meetings',
    category: 'SOCIAL',
    perUnit: 'meeting',
    points: 2,
  },
  {
    key: 'eboard_meetings',
    name: 'Eboard Meetings',
    category: 'COMMITTEE',
    perUnit: 'meeting',
    points: 1,
  },
  {
    key: 'leading_workshop',
    name: 'Leading Workshop',
    category: 'PROFESSIONAL',
    perUnit: 'workshop',
    points: 4,
  },
  {
    key: 'photo_contribution',
    name: 'Photo Contribution',
    category: 'OTHER',
    perUnit: '5 photos',
    points: 1,
    notes: '1 point per 5 pictures submitted.',
  },
  {
    key: 'study_hours',
    name: 'Study Hours',
    category: 'PROFESSIONAL',
    perUnit: 'hour',
    points: 2,
  },
  {
    key: 'mock_interviews',
    name: 'Mock Interviews',
    category: 'PROFESSIONAL',
    perUnit: 'interview',
    points: 2,
  },
  {
    key: 'creativity',
    name: 'Creativity',
    category: 'OTHER',
    perUnit: 'instance',
    points: 2,
    notes: 'Flexible creative contributions.',
  },
  {
    key: 'unity_point',
    name: 'Unity Point (Brotherhood support)',
    category: 'SOCIAL',
    perUnit: 'instance',
    points: 3,
  },
  {
    key: 'fam_events',
    name: 'Family Events',
    category: 'SOCIAL',
    perUnit: 'event',
    points: 2,
  },
  {
    key: 'coffee_chats',
    name: 'Coffee Chats',
    category: 'PROFESSIONAL',
    perUnit: 'chat',
    points: 2,
  },
  {
    key: 'senior_speaker_series',
    name: 'Senior Speaker Series',
    category: 'PROFESSIONAL',
    perUnit: 'session',
    points: 4,
  },
];

export const pointSystemConfig: PointSystemConfig = {
  semester: 'Spring 2026',
  checkpoints,
  specialRequirements,
  requiredEvents,
  deductions,
  pointEvents,
};

const pointEventMap = new Map(pointEvents.map((event) => [event.key, event]));

export const getPointEventTemplate = (key: string): PointEventConfig | undefined =>
  pointEventMap.get(key);

