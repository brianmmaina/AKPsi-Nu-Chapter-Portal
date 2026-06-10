import pointsDataSource from '../data/points.json';
import { families as familiesApi } from '../api';
import {
  pointSystemConfig,
  STREAK_ELIGIBLE_CATEGORIES,
  type PointCategory,
  type PointsTimeframe as ConfigPointsTimeframe,
} from '../config/pointSystemConfig';
import { computeStreakHistory, type AttendanceRecord } from '../utils/streakEngine';
import { fetchGoogleSheetData } from './googleSheetsService';
import { getSupabaseClient } from './supabaseClient';

export type PointsTimeframe = ConfigPointsTimeframe;
export type { PointCategory } from '../config/pointSystemConfig';

export interface PointEventDefinition {
  id: string;
  name: string;
  date: string; // ISO date
  category: PointCategory;
  subcategory?: string;
  required: boolean;
  defaultPoints: number;
  checkpoints: string[];
  countsForFamilyCup: boolean;
  timeframe: PointsTimeframe;
}

export interface PointAward {
  id?: string;
  eventId: string;
  memberId: string;
  points: number;
  createdAt: string;
  isAdjustment?: boolean;
  note?: string;
  termId?: string;
}

export interface MemberPointsSummary {
  memberId: string;
  memberName: string;
  familyId: string;
  familyName: string;
  totalPoints: number;
  streak?: number;
  streakBadge?: string | null;
  streakKey?: string | null;
  streakMultiplier?: number;
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
  events: PointEventDefinition[];
  awards: PointAward[];
}

export interface MemberEventBreakdown {
  awardId: string;
  eventId: string;
  eventName: string;
  date: string;
  category: PointCategory;
  points: number;
  isAdjustment?: boolean;
  note?: string;
}

type MemberProfile = {
  memberId: string;
  memberName: string;
  familyId: string;
  familyName: string;
};

type BootstrapFamily = {
  familyId: string;
  familyName: string;
  memberCount: number;
};

interface BootstrapData {
  roster?: {
    members?: MemberProfile[];
    families?: BootstrapFamily[];
  };
  events?: PointEventDefinition[];
  awards?: PointAward[];
}

interface StoredPointsState {
  customEvents: PointEventDefinition[];
  eventOverrides: Record<string, Partial<PointEventDefinition>>;
  awards: PointAward[];
}

const supabase = getSupabaseClient();
const useSupabase = Boolean(supabase);

const bootstrapData = pointsDataSource as BootstrapData;
const CURRENT_TERM =
  pointSystemConfig.semester?.replace(/\s+/g, '_').toUpperCase() || 'CURRENT_TERM';
const STORAGE_VERSION = 'v1';
const STORAGE_KEY = `akpsi_points_admin_state_${STORAGE_VERSION}`;
const MANUAL_ADJUST_EVENT_ID = 'manual-adjustment';

const cache = new Map<PointsTimeframe, PointsData>();
let memoryState: StoredPointsState | null = null;
let rosterCache: MemberProfile[] | null = null;

const DEFAULT_STATE: StoredPointsState = {
  customEvents: [],
  eventOverrides: {},
  awards: [],
};

const ensureArray = <T>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);

const baseEvents = ensureArray(bootstrapData.events);
const baseAwards = ensureArray(bootstrapData.awards);

const hasWindow = () => typeof window !== 'undefined';

const readStorage = (): StoredPointsState => {
  if (hasWindow()) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_STATE };
    }
    try {
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch (error) {
      console.warn('Failed to parse stored points state, resetting.', error);
      window.localStorage.removeItem(STORAGE_KEY);
      return { ...DEFAULT_STATE };
    }
  }
  if (!memoryState) {
    memoryState = { ...DEFAULT_STATE };
  }
  return memoryState;
};

const writeStorage = (state: StoredPointsState) => {
  if (hasWindow()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    memoryState = state;
  }
};

const normalizeTimeframe = (value?: string | null): PointsTimeframe =>
  value === 'YEAR' ? 'YEAR' : 'SEMESTER';

const normalizeCheckpoints = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
};

const normalizeEventDefinition = (
  event: Partial<PointEventDefinition> & { id: string },
): PointEventDefinition => ({
  id: event.id,
  name: event.name || 'Untitled Event',
  date: event.date || new Date().toISOString().split('T')[0],
  category: (event.category || 'OTHER') as PointCategory,
  subcategory: event.subcategory,
  required: Boolean(event.required),
  defaultPoints: typeof event.defaultPoints === 'number' ? event.defaultPoints : 0,
  checkpoints: normalizeCheckpoints(event.checkpoints),
  countsForFamilyCup: event.countsForFamilyCup !== false,
  timeframe: normalizeTimeframe(event.timeframe),
});

const getBootstrapRoster = (): MemberProfile[] =>
  ensureArray(bootstrapData.roster?.members).map((member) => ({ ...member }));

const getAllFallbackEvents = (): PointEventDefinition[] => {
  const storage = readStorage();
  const overrideEntries = Object.entries(storage.eventOverrides);
  const overriddenBase = baseEvents.map((baseEvent) => {
    const override = overrideEntries.find(([id]) => id === baseEvent.id)?.[1];
    return override ? { ...baseEvent, ...override } : baseEvent;
  });
  const customEvents = storage.customEvents || [];
  return [...overriddenBase, ...customEvents].map((event) => normalizeEventDefinition(event));
};

const getFallbackEventsForTimeframe = (timeframe: PointsTimeframe): PointEventDefinition[] =>
  getAllFallbackEvents()
    .filter((event) => event.timeframe === timeframe)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const getFallbackAwardsForTimeframe = (
  timeframe: PointsTimeframe,
  events: PointEventDefinition[],
): PointAward[] => {
  const storageAwards = readStorage().awards || [];
  const eventMap = new Map(events.map((event) => [event.id, event]));

  return [...baseAwards, ...storageAwards].filter((award) => {
    const event = eventMap.get(award.eventId);
    if (!event) {
      return false;
    }
    if (award.termId && award.termId !== CURRENT_TERM) {
      return false;
    }
    if (event.id === MANUAL_ADJUST_EVENT_ID) {
      return true;
    }
    return event.timeframe === timeframe;
  });
};

const makeAwardId = (award: PointAward, index: number) =>
  award.id || `${award.eventId}-${award.memberId}-${award.createdAt}-${index}`;

const buildMemberSummaries = (
  profiles: MemberProfile[],
  awards: PointAward[],
): MemberPointsSummary[] => {
  const totals = new Map<string, number>();
  awards.forEach((award) => {
    const current = totals.get(award.memberId) ?? 0;
    totals.set(award.memberId, current + award.points);
  });

  return profiles
    .map((profile) => ({
      ...profile,
      totalPoints: totals.get(profile.memberId) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        a.memberName.localeCompare(b.memberName),
    );
};

const buildFamilySummaries = (members: MemberPointsSummary[]): FamilyPointsSummary[] => {
  const familyMap = new Map<
    string,
    { familyId: string; familyName: string; totalPoints: number; memberCount: number }
  >();

  members.forEach((member) => {
    if (!member.familyId) return;
    const record = familyMap.get(member.familyId) ?? {
      familyId: member.familyId,
      familyName: member.familyName,
      totalPoints: 0,
      memberCount: 0,
    };
    record.totalPoints += member.totalPoints;
    record.memberCount += 1;
    familyMap.set(member.familyId, record);
  });

  return Array.from(familyMap.values())
    .map((entry) => ({
      familyId: entry.familyId,
      familyName: entry.familyName,
      totalPoints: entry.totalPoints,
      averagePointsPerMember:
        entry.memberCount > 0
          ? Number((entry.totalPoints / entry.memberCount).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
};

const buildSnapshot = (
  profiles: MemberProfile[],
  events: PointEventDefinition[],
  awards: PointAward[],
): PointsData => {
  const memberSummaries = buildMemberSummaries(profiles, awards);
  const familySummaries = buildFamilySummaries(memberSummaries);

  return {
    members: memberSummaries,
    families: familySummaries,
    events,
    awards,
  };
};

const tryFetchRosterFromBackend = async (): Promise<MemberProfile[]> => {
  try {
    const response = await familiesApi.getAll();
    const familyList = Array.isArray(response?.data) ? response.data : [];
    if (familyList.length === 0) {
      return [];
    }

    const entries = await Promise.all(
      familyList.map(async (family) => {
        const treeResponse = await familiesApi.getTree(family.id);
        const brothers = Array.isArray(treeResponse?.data?.brothers)
          ? treeResponse?.data?.brothers
          : [];
        return brothers
          .filter((brother) => brother?.id && brother?.name && brother?.status === 'studying')
          .map(
            (brother) =>
              ({
                memberId: String(brother.id),
                memberName: brother.name,
                familyId: String(family.id),
                familyName: family.name || 'Family',
              }) as MemberProfile,
          );
      }),
    );

    const map = new Map<string, MemberProfile>();
    entries.flat().forEach((profile) => {
      if (!map.has(profile.memberId)) {
        map.set(profile.memberId, profile);
      }
    });
    return Array.from(map.values());
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load roster from backend', error);
    }
    return [];
  }
};

const getFallbackRoster = async (): Promise<MemberProfile[]> => {
  if (rosterCache) {
    return rosterCache;
  }

  const backendRoster = await tryFetchRosterFromBackend();
  if (backendRoster.length > 0) {
    rosterCache = backendRoster;
    return backendRoster;
  }

  rosterCache = getBootstrapRoster();
  return rosterCache;
};

const fetchSupabaseMembers = async (): Promise<MemberProfile[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('points_members')
    .select('id, member_id, member_name, family_id, family_name, is_active')
    .eq('is_active', true)
    .order('member_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row: Record<string, any>) => {
      const memberId = String(row.member_id ?? row.id ?? '');
      if (!memberId) return null;
      return {
        memberId,
        memberName: row.member_name || row.name || 'Member',
        familyId: String(row.family_id ?? ''),
        familyName: row.family_name || 'Family',
      } as MemberProfile;
    })
    .filter((entry): entry is MemberProfile => Boolean(entry?.memberId));
};

const fetchSupabaseEvents = async (
  timeframe: PointsTimeframe,
): Promise<PointEventDefinition[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('points_events')
    .select('*')
    .eq('timeframe', timeframe);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row: Record<string, any>) =>
      normalizeEventDefinition({
        id: String(row.id),
        name: row.name,
        date: row.date,
        category: row.category,
        subcategory: row.subcategory,
        required: row.required,
        defaultPoints: row.default_points,
        checkpoints: row.checkpoints,
        countsForFamilyCup: row.counts_for_family_cup,
        timeframe: row.timeframe,
      }),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const fetchSupabaseEventById = async (id: string): Promise<PointEventDefinition | null> => {
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.from('points_events').select('*').eq('id', id).single();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  return normalizeEventDefinition({
    id: String(data.id),
    name: data.name,
    date: data.date,
    category: data.category,
    subcategory: data.subcategory,
    required: data.required,
    defaultPoints: data.default_points,
    checkpoints: data.checkpoints,
    countsForFamilyCup: data.counts_for_family_cup,
    timeframe: data.timeframe,
  });
};

const fetchSupabaseAwards = async (
  timeframe: PointsTimeframe,
  events: PointEventDefinition[],
): Promise<PointAward[]> => {
  if (!supabase) {
    return [];
  }

  const eventMap = new Map(events.map((event) => [event.id, event]));

  const { data, error } = await supabase
    .from('points_awards')
    .select('*')
    .eq('term_id', CURRENT_TERM);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row: Record<string, any>) => {
      const award: PointAward = {
        id: row.id ? String(row.id) : undefined,
        eventId: String(row.event_id),
        memberId: String(row.member_id),
        points: Number(row.points ?? 0),
        createdAt: row.created_at || new Date().toISOString(),
        isAdjustment: Boolean(row.is_adjustment),
        note: row.note || undefined,
        termId: row.term_id || CURRENT_TERM,
      };
      return award;
    })
    .filter((award) => {
      const event = eventMap.get(award.eventId);
      return Boolean(event && event.timeframe === timeframe);
    });
};

const loadSupabaseSnapshot = async (timeframe: PointsTimeframe) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const [profiles, events] = await Promise.all([
    fetchSupabaseMembers(),
    fetchSupabaseEvents(timeframe),
  ]);
  const awards = await fetchSupabaseAwards(timeframe, events);

  return buildSnapshot(profiles, events, awards);
};

const loadFallbackSnapshot = async (timeframe: PointsTimeframe) => {
  const [profiles, events] = await Promise.all([
    getFallbackRoster(),
    Promise.resolve(getFallbackEventsForTimeframe(timeframe)),
  ]);
  const awards = getFallbackAwardsForTimeframe(timeframe, events);
  return buildSnapshot(profiles, events, awards);
};

const loadGoogleSheetsSnapshot = async (): Promise<PointsData> => {
  const sheetId = import.meta.env.VITE_GOOGLE_SHEETS_ID as string;
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY as string;

  const sheetData = await fetchGoogleSheetData(sheetId, apiKey);

  const eventMap = new Map(sheetData.events.map((e) => [e.id, e]));

  const attendanceByMember = new Map<string, typeof sheetData.attendance>();
  for (const record of sheetData.attendance) {
    const list = attendanceByMember.get(record.memberName) ?? [];
    list.push(record);
    attendanceByMember.set(record.memberName, list);
  }

  const adjustmentsByMember = new Map<string, typeof sheetData.adjustments>();
  for (const adj of sheetData.adjustments) {
    const list = adjustmentsByMember.get(adj.memberName) ?? [];
    list.push(adj);
    adjustmentsByMember.set(adj.memberName, list);
  }

  const events: PointEventDefinition[] = sheetData.events.map((e) => ({
    id: e.id,
    name: e.name,
    date: e.date,
    category: e.category as PointCategory,
    required: e.required,
    defaultPoints: e.points,
    checkpoints: e.checkpoint ? [e.checkpoint] : [],
    countsForFamilyCup: true,
    timeframe: 'SEMESTER' as const,
  }));

  const allAwards: PointAward[] = [];
  const memberSummaries: MemberPointsSummary[] = [];

  for (const member of sheetData.members) {
    const memberId = member.dbId || member.memberName;
    const attendance = attendanceByMember.get(member.memberName) ?? [];
    const adjustments = adjustmentsByMember.get(member.memberName) ?? [];

    const streakRecords: AttendanceRecord[] = [];
    const otherAwards: PointAward[] = [];

    for (const att of attendance) {
      const event = eventMap.get(att.eventId);
      if (!event) continue;

      const isStreakEligible =
        event.recurring &&
        STREAK_ELIGIBLE_CATEGORIES.includes(event.category as PointCategory);

      if (isStreakEligible) {
        streakRecords.push({
          eventId: event.id,
          date: event.date,
          status: att.status,
          basePoints: event.points,
          isRecurring: true,
        });
      } else if (att.status === 'Present' || att.status === 'Late') {
        otherAwards.push({
          eventId: event.id,
          memberId,
          points: event.points,
          createdAt: `${event.date}T00:00:00.000Z`,
          termId: CURRENT_TERM,
        });
      }
    }

    const { streakResult, history } = computeStreakHistory(streakRecords);

    const streakAwards: PointAward[] = history
      .filter((h) => h.pointsAwarded > 0)
      .map((h) => ({
        eventId: h.record.eventId,
        memberId,
        points: h.pointsAwarded,
        createdAt: `${h.record.date}T00:00:00.000Z`,
        termId: CURRENT_TERM,
      }));

    const adjustmentAwards: PointAward[] = adjustments.map((adj) => ({
      eventId: MANUAL_ADJUST_EVENT_ID,
      memberId,
      points: adj.points,
      createdAt: `${adj.date}T00:00:00.000Z`,
      isAdjustment: true,
      note: adj.reason,
      termId: CURRENT_TERM,
    }));

    const memberAwards = [...streakAwards, ...otherAwards, ...adjustmentAwards];
    allAwards.push(...memberAwards);

    const totalPoints = memberAwards.reduce((sum, a) => sum + a.points, 0);

    memberSummaries.push({
      memberId,
      memberName: member.memberName,
      familyId: member.familyId,
      familyName: member.familyName,
      totalPoints,
      streak: streakResult.current,
      streakBadge: streakResult.badge,
      streakKey: streakResult.key,
      streakMultiplier: streakResult.multiplier,
    });
  }

  const sorted = [...memberSummaries].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.memberName.localeCompare(b.memberName),
  );

  return {
    members: sorted,
    families: buildFamilySummaries(sorted),
    events,
    awards: allAwards,
  };
};

const useGoogleSheets = Boolean(import.meta.env.VITE_GOOGLE_SHEETS_ID);

export async function getPointsData(timeframe: PointsTimeframe): Promise<PointsData> {
  if (cache.has(timeframe)) {
    return cache.get(timeframe)!;
  }

  if (useGoogleSheets) {
    try {
      const snapshot = await loadGoogleSheetsSnapshot();
      cache.set(timeframe, snapshot);
      return snapshot;
    } catch (error) {
      console.warn('Failed to load Google Sheets data, falling back to local source.', error);
    }
  }

  try {
    const snapshot = useSupabase
      ? await loadSupabaseSnapshot(timeframe)
      : await loadFallbackSnapshot(timeframe);
    cache.set(timeframe, snapshot);
    return snapshot;
  } catch (error) {
    console.warn('Failed to load Supabase data, falling back to local source.', error);
    const snapshot = await loadFallbackSnapshot(timeframe);
    cache.set(timeframe, snapshot);
    return snapshot;
  }
}

export function clearPointsDataCache() {
  cache.clear();
}

export function getMemberEvents(
  data: PointsData,
  memberId: string,
): MemberEventBreakdown[] {
  const eventMap = new Map(data.events.map((event) => [event.id, event]));
  return data.awards
    .map((award, index) => {
      if (award.memberId !== memberId) return null;
      const event = eventMap.get(award.eventId);
      if (!event) return null;
      return {
        awardId: makeAwardId(award, index),
        eventId: award.eventId,
        eventName: event.name,
        date: event.date,
        category: event.category,
        points: award.points,
        isAdjustment: award.isAdjustment,
        note: award.note,
      };
    })
    .filter((entry): entry is MemberEventBreakdown => Boolean(entry))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

const persistAndInvalidate = (nextState: StoredPointsState) => {
  writeStorage(nextState);
  clearPointsDataCache();
};

const resolveEventById = (eventId: string): PointEventDefinition | undefined =>
  getAllFallbackEvents().find((event) => event.id === eventId);

const createSupabaseEvent = async (definition: Omit<PointEventDefinition, 'id'>) => {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }
  const payload = {
    name: definition.name,
    date: definition.date,
    category: definition.category,
    subcategory: definition.subcategory,
    required: definition.required,
    default_points: definition.defaultPoints,
    checkpoints: definition.checkpoints,
    counts_for_family_cup: definition.countsForFamilyCup,
    timeframe: definition.timeframe,
  };
  const { data, error } = await supabase
    .from('points_events')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  clearPointsDataCache();
  return normalizeEventDefinition({
    id: String(data.id),
    ...definition,
  });
};

const updateSupabaseEvent = async (id: string, updates: Partial<PointEventDefinition>) => {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.date !== undefined) payload.date = updates.date;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.subcategory !== undefined) payload.subcategory = updates.subcategory;
  if (updates.required !== undefined) payload.required = updates.required;
  if (updates.defaultPoints !== undefined) payload.default_points = updates.defaultPoints;
  if (updates.checkpoints !== undefined) payload.checkpoints = updates.checkpoints;
  if (updates.countsForFamilyCup !== undefined)
    payload.counts_for_family_cup = updates.countsForFamilyCup;
  if (updates.timeframe !== undefined) payload.timeframe = updates.timeframe;

  const { error } = await supabase.from('points_events').update(payload).eq('id', id);
  if (error) throw error;
  clearPointsDataCache();
  return { id, ...updates };
};

const insertSupabaseAwards = async (rows: PointAward[], defaultPoints: number | null = null) => {
  if (!supabase) {
    throw new Error('Supabase client unavailable');
  }
  if (!rows.length) return;
  const payload = rows.map((award) => ({
    event_id: award.eventId,
    member_id: award.memberId,
    points: award.points ?? defaultPoints ?? 0,
    created_at: award.createdAt,
    is_adjustment: award.isAdjustment ?? false,
    note: award.note,
    term_id: award.termId ?? CURRENT_TERM,
  }));
  const { error } = await supabase.from('points_awards').insert(payload);
  if (error) throw error;
  clearPointsDataCache();
};

const createLocalEvent = async (
  definition: Omit<PointEventDefinition, 'id'>,
): Promise<PointEventDefinition> => {
  const storage = readStorage();
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}`;
  const nextEvent: PointEventDefinition = normalizeEventDefinition({
    ...definition,
    id,
  });
  storage.customEvents = [...storage.customEvents, nextEvent];
  persistAndInvalidate(storage);
  return nextEvent;
};

const updateLocalEvent = async (
  id: string,
  updates: Partial<PointEventDefinition>,
): Promise<PointEventDefinition> => {
  const storage = readStorage();
  const customIndex = storage.customEvents.findIndex((event) => event.id === id);

  if (customIndex >= 0) {
    const updated = normalizeEventDefinition({
      ...storage.customEvents[customIndex],
      ...updates,
      id,
    });
    storage.customEvents[customIndex] = updated;
    persistAndInvalidate(storage);
    return updated;
  }

  const existingOverrides = storage.eventOverrides[id] || {};
  storage.eventOverrides[id] = { ...existingOverrides, ...updates };
  persistAndInvalidate(storage);

  const baseEvent = resolveEventById(id);
  if (!baseEvent) {
    throw new Error(`Unable to locate event with id "${id}" to update.`);
  }
  return baseEvent;
};

export async function createEvent(
  definition: Omit<PointEventDefinition, 'id'>,
): Promise<PointEventDefinition> {
  if (useSupabase) {
    return createSupabaseEvent(definition);
  }
  return createLocalEvent(definition);
}

export async function updateEvent(
  id: string,
  updates: Partial<PointEventDefinition>,
): Promise<PointEventDefinition> {
  if (useSupabase) {
    await updateSupabaseEvent(id, updates);
    const updated = await fetchSupabaseEventById(id);
    if (!updated) {
      throw new Error(`Updated event ${id} not found after Supabase update.`);
    }
    return updated;
  }
  return updateLocalEvent(id, updates);
}

export async function recordAttendance(eventId: string, memberIds: string[]): Promise<void> {
  if (memberIds.length === 0) return;

  if (useSupabase) {
    const event = await fetchSupabaseEventById(eventId);
    const timestamp = new Date().toISOString();
    const awards = memberIds.map<PointAward>((memberId) => ({
      eventId,
      memberId,
      points: event?.defaultPoints ?? 0,
      createdAt: timestamp,
      termId: CURRENT_TERM,
    }));
    await insertSupabaseAwards(awards, event?.defaultPoints ?? 0);
    return;
  }

  const event = resolveEventById(eventId);
  if (!event) {
    throw new Error('Event not found. Please create the event before recording attendance.');
  }

  const storage = readStorage();
  const timestamp = new Date().toISOString();
  const awards: PointAward[] = memberIds.map((memberId) => ({
    eventId,
    memberId,
    points: event.defaultPoints,
    createdAt: timestamp,
    termId: CURRENT_TERM,
  }));

  storage.awards = [...storage.awards, ...awards];
  persistAndInvalidate(storage);
}

export async function addManualAdjustment(
  memberId: string,
  deltaPoints: number,
  note: string,
): Promise<void> {
  if (!deltaPoints) return;

  const award: PointAward = {
    eventId: MANUAL_ADJUST_EVENT_ID,
    memberId,
    points: deltaPoints,
    createdAt: new Date().toISOString(),
    isAdjustment: true,
    note,
    termId: CURRENT_TERM,
  };

  if (useSupabase) {
    await insertSupabaseAwards([award]);
    return;
  }

  const storage = readStorage();
  storage.awards = [...storage.awards, award];
  persistAndInvalidate(storage);
}

