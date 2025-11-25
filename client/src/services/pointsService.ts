import pointsDataSource from '../data/points.json';

export type PointCategory =
  | 'CHAPTER'
  | 'PROFESSIONAL'
  | 'DEI'
  | 'SERVICE'
  | 'SOCIAL'
  | 'OTHER';

export interface PointEvent {
  id: string;
  memberId: string;
  eventName: string;
  category: PointCategory;
  date: string; // ISO date string
  points: number;
}

export interface MemberPointsSummary {
  memberId: string;
  memberName: string;
  familyId: string;
  familyName: string;
  totalPoints: number;
}

export interface FamilyPointsSummary {
  familyId: string;
  familyName: string;
  totalPoints: number;
  averagePointsPerMember: number;
}

export interface PointsData {
  members: MemberPointsSummary[];
  families: FamilyPointsSummary[];
  events: PointEvent[];
}

export type PointsTimeframe = 'SEMESTER' | 'YEAR';

type PointsDataset = Record<PointsTimeframe, PointsData>;

/**
 * NOTE: Member IDs in this dataset MUST stay aligned with the IDs returned by the
 * family-tree API (`brother.id`). Keeping that parity allows us to cross-link
 * between the tree nodes and the points dashboard without extra mapping layers.
 */
const dataset = pointsDataSource as PointsDataset;

const cache = new Map<PointsTimeframe, PointsData>();

const clonePointsData = (data: PointsData): PointsData => ({
  members: data.members.map((member) => ({ ...member })),
  families: data.families.map((family) => ({ ...family })),
  events: data.events.map((event) => ({ ...event })),
});

const resolveTimeframe = (timeframe: PointsTimeframe): PointsTimeframe =>
  timeframe === 'YEAR' ? 'YEAR' : 'SEMESTER';

/**
 * Fetches points data for a given timeframe. For now this simply reads from a local
 * JSON file, but the function is intentionally async so we can swap in a Google
 * Sheets request or lightweight backend later without touching callers.
 */
export async function getPointsData(timeframe: PointsTimeframe): Promise<PointsData> {
  const safeTimeframe = resolveTimeframe(timeframe);

  if (cache.has(safeTimeframe)) {
    return cache.get(safeTimeframe)!;
  }

  const source = dataset[safeTimeframe];
  if (!source) {
    throw new Error(`Points data missing for timeframe: ${safeTimeframe}`);
  }

  const cloned = clonePointsData(source);
  cache.set(safeTimeframe, cloned);

  return cloned;
}

/**
 * Helper that clears the in-memory cache. Useful for manual refresh buttons or when
 * the static JSON file is replaced while the dev server is running.
 */
export function clearPointsDataCache() {
  cache.clear();
}

/**
 * Convenience helper for consumers that need a single member's breakdown without
 * manually filtering the events array each time.
 */
export function getMemberEvents(
  data: PointsData,
  memberId: string,
): PointEvent[] {
  return data.events.filter((event) => event.memberId === memberId);
}

