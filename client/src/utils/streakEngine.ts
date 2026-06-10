import { STREAK_TIERS, type StreakTier } from '../config/pointSystemConfig';

export type AttendanceStatus = 'Present' | 'Absent' | 'Absent - Excused' | 'Late';

export interface AttendanceRecord {
  eventId: string;
  date: string;
  status: AttendanceStatus;
  basePoints: number;
  isRecurring: boolean;
}

export interface StreakResult {
  current: number;
  tier: StreakTier | null;
  badge: string | null;
  key: string | null;
  multiplier: number;
  nextTier: StreakTier | null;
  progressToNext: number; // 0-1
}

export interface AttendanceWithPoints {
  record: AttendanceRecord;
  streakBefore: number;
  multiplier: number;
  pointsAwarded: number;
}

const getTierForStreak = (streak: number): StreakTier | null =>
  [...STREAK_TIERS].sort((a, b) => b.threshold - a.threshold).find((t) => streak >= t.threshold) ?? null;

const getNextTier = (streak: number): StreakTier | null =>
  [...STREAK_TIERS].sort((a, b) => a.threshold - b.threshold).find((t) => t.threshold > streak) ?? null;

/**
 * Walks through attendance records chronologically and computes:
 * - The current streak (consecutive present/late, excused = pause, absent = reset)
 * - Per-event multipliers based on streak at time of attendance
 * - Points awarded per event (base × multiplier for present/late, 0 for absent/excused)
 */
export function computeStreakHistory(records: AttendanceRecord[]): {
  streakResult: StreakResult;
  history: AttendanceWithPoints[];
} {
  const sorted = [...records]
    .filter((r) => r.isRecurring)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let streak = 0;
  const history: AttendanceWithPoints[] = [];

  for (const record of sorted) {
    const tier = getTierForStreak(streak);
    const multiplier = tier?.multiplier ?? 1.0;

    if (record.status === 'Present' || record.status === 'Late') {
      history.push({
        record,
        streakBefore: streak,
        multiplier,
        pointsAwarded: Math.round(record.basePoints * multiplier),
      });
      streak += 1;
    } else if (record.status === 'Absent') {
      history.push({ record, streakBefore: streak, multiplier: 1.0, pointsAwarded: 0 });
      streak = 0;
    } else {
      // Excused: streak paused — no points, no reset
      history.push({ record, streakBefore: streak, multiplier: 1.0, pointsAwarded: 0 });
    }
  }

  const currentTier = getTierForStreak(streak);
  const nextTier = getNextTier(streak);
  const prevThreshold = currentTier?.threshold ?? 0;
  const nextThreshold = nextTier?.threshold ?? prevThreshold;
  const progressToNext =
    nextTier && nextThreshold > prevThreshold
      ? (streak - prevThreshold) / (nextThreshold - prevThreshold)
      : currentTier
        ? 1
        : 0;

  return {
    streakResult: {
      current: streak,
      tier: currentTier,
      badge: currentTier?.badge ?? null,
      key: currentTier?.key ?? null,
      multiplier: currentTier?.multiplier ?? 1.0,
      nextTier,
      progressToNext,
    },
    history,
  };
}
