/**
 * Google Sheets integration — parses the actual AKPsi tracking sheet format.
 *
 * Tabs read:
 *   [Checkpoint Tracker]   row 0: section labels  row 1: column headers
 *                          row 2: guide/template row (no Family — skip)
 *                          row 3+: brothers: Name | Total | PledgeClass | Family | ...
 *
 *   [Chapter Attendance]   row 0: "Name" | MM/DD dates… | "POINT DEDUCTIONS:"
 *                          row 1: empty
 *                          row 2+: Name | Present/Absent/… per date | deduction
 *
 * Sheet must be shared as "Anyone with the link can view."
 * Set VITE_GOOGLE_SHEETS_ID and VITE_GOOGLE_SHEETS_API_KEY in .env.local
 */

import type { AttendanceStatus } from '../utils/streakEngine';

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

async function fetchRange(sheetId: string, apiKey: string, range: string): Promise<string[][]> {
  const url = `${SHEETS_BASE}/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Sheets API error ${res.status} fetching "${range}"`);
  }
  const json = await res.json();
  return (json.values as string[][] | undefined) ?? [];
}

const cell = (row: string[], idx: number): string => (row[idx] ?? '').trim();
const num = (val: string): number => parseFloat(val) || 0;

export interface SheetMember {
  memberName: string;
  familyId: string;
  familyName: string;
  pledgeClass: string;
  year: string;
  dbId: string;
  basePoints: number;
}

export interface SheetEvent {
  id: string;
  name: string;
  date: string;
  category: string;
  points: number;
  required: boolean;
  checkpoint: string;
  recurring: boolean;
}

export interface SheetAttendance {
  eventId: string;
  memberName: string;
  status: AttendanceStatus;
}

export interface SheetAdjustment {
  memberName: string;
  points: number;
  reason: string;
  date: string;
}

export interface GoogleSheetData {
  members: SheetMember[];
  events: SheetEvent[];
  attendance: SheetAttendance[];
  adjustments: SheetAdjustment[];
}

const FAMILY_ID_MAP: Record<string, string> = {
  empire: 'empire',
  wolfpack: 'wolfpack',
  greed: 'greed',
  power: 'power',
  pride: 'pride',
};

const normalizeFamily = (raw: string): { id: string; name: string } => {
  const key = raw.toLowerCase().trim();
  const id = FAMILY_ID_MAP[key] ?? key;
  return { id, name: raw.trim() || id };
};

const VALID_STATUSES = new Set(['Present', 'Absent', 'Absent - Excused', 'Late']);

const normalizeStatus = (raw: string): AttendanceStatus => {
  const trimmed = raw.trim();
  if (VALID_STATUSES.has(trimmed)) return trimmed as AttendanceStatus;
  if (trimmed.toLowerCase().includes('excused')) return 'Absent - Excused';
  if (trimmed.toLowerCase().includes('absent')) return 'Absent';
  if (trimmed.toLowerCase().includes('late')) return 'Late';
  if (trimmed.toLowerCase() === 'present') return 'Present';
  // Empty cell in a tracking sheet = absent
  if (!trimmed) return 'Absent';
  return 'Present';
};

// Convert "M/DD" or "MM/DD" to "YYYY-MM-DD"
const parseMeetingDate = (raw: string, year: number): string => {
  const parts = raw.trim().split('/').map((s) => parseInt(s, 10));
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return '';
  const [month, day] = parts;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const CHAPTER_MEETING_BASE_POINTS = 8;

export async function fetchGoogleSheetData(
  sheetId: string,
  apiKey: string,
): Promise<GoogleSheetData> {
  const year = new Date().getFullYear();

  const [trackerRows, chapterRows] = await Promise.all([
    fetchRange(sheetId, apiKey, 'Checkpoint Tracker!A1:D200'),
    fetchRange(sheetId, apiKey, 'Chapter Attendance!A1:ZZ200'),
  ]);

  // ── Roster from Checkpoint Tracker ──────────────────────────────────────
  // Row 0: section labels  Row 1: column headers  Row 2: guide row (no family)
  // Row 3+: real brothers
  const members: SheetMember[] = trackerRows
    .slice(2) // skip section labels + column headers
    .filter((row) => cell(row, 0) && cell(row, 3)) // must have name AND family
    .map((row) => {
      const { id, name } = normalizeFamily(cell(row, 3));
      return {
        memberName: cell(row, 0),
        familyId: id,
        familyName: name,
        pledgeClass: cell(row, 2),
        year: '',
        dbId: '',
        basePoints: num(cell(row, 1)),
      };
    });

  // ── Chapter meeting events from Chapter Attendance headers ────────────────
  // Row 0: ["Name", "1/21", "1/26", …, "POINT DEDUCTIONS:"]
  // Row 1: empty
  // Row 2+: brother data
  const chapterHeaders = chapterRows[0] ?? [];

  const meetingCols: Array<{ index: number; date: string }> = [];
  for (let i = 1; i < chapterHeaders.length; i++) {
    const header = chapterHeaders[i]?.trim();
    if (!header || header.toUpperCase().includes('DEDUCTION') || header.toUpperCase().includes('POINT')) break;
    const date = parseMeetingDate(header, year);
    if (date) meetingCols.push({ index: i, date });
  }

  const events: SheetEvent[] = meetingCols.map(({ date }) => ({
    id: `chapter-meeting-${date}`,
    name: `Chapter Meeting ${date}`,
    date,
    category: 'CHAPTER',
    points: CHAPTER_MEETING_BASE_POINTS,
    required: true,
    checkpoint: '',
    recurring: true,
  }));

  // ── Attendance: wide → narrow ─────────────────────────────────────────────
  const attendance: SheetAttendance[] = [];

  for (const row of chapterRows.slice(2)) {
    const name = cell(row, 0);
    if (!name) continue;

    for (const { index, date } of meetingCols) {
      const status = normalizeStatus(cell(row, index));
      attendance.push({
        eventId: `chapter-meeting-${date}`,
        memberName: name,
        status,
      });
    }
  }

  // ── Adjustments: point deductions from Chapter Attendance ─────────────────
  const deductionColIndex = chapterHeaders.findIndex(
    (h) => h?.toUpperCase().includes('DEDUCTION'),
  );

  const today = new Date().toISOString().split('T')[0];

  const adjustments: SheetAdjustment[] = [];

  // Per-member non-chapter base points as adjustments (everything already tracked in Checkpoint Tracker)
  for (const member of members) {
    if (member.basePoints !== 0) {
      adjustments.push({
        memberName: member.memberName,
        points: member.basePoints,
        reason: 'Points from events',
        date: today,
      });
    }
  }

  // Point deductions from Chapter Attendance
  if (deductionColIndex > 0) {
    for (const row of chapterRows.slice(2)) {
      const name = cell(row, 0);
      const deduction = num(cell(row, deductionColIndex));
      if (name && deduction !== 0) {
        adjustments.push({
          memberName: name,
          points: -Math.abs(deduction),
          reason: 'Chapter attendance deduction',
          date: today,
        });
      }
    }
  }

  return { members, events, attendance, adjustments };
}
