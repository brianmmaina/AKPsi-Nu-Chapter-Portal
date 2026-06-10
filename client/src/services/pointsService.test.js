import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./supabaseClient', () => ({
  getSupabaseClient: () => null,
}));

const mockFamilies = {
  getAll: vi.fn().mockResolvedValue({ data: [] }),
  getTree: vi.fn(),
};

vi.mock('../api', () => ({
  families: mockFamilies,
}));

// Lazy import so the mocks above are applied.
const loadService = async () => {
  const module = await import('./pointsService');
  return module;
};

describe('pointsService fallback data', () => {
  beforeEach(() => {
    mockFamilies.getAll.mockClear();
    mockFamilies.getTree.mockClear();
  });

  it('returns bootstrap members when Supabase is not configured', async () => {
    const { getPointsData } = await loadService();
    const data = await getPointsData('SEMESTER');

    expect(Array.isArray(data.members)).toBe(true);
    expect(data.members.length).toBeGreaterThan(0);
    expect(Array.isArray(data.events)).toBe(true);
  });
});

