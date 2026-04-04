import { describe, expect, it, vi, beforeEach } from 'vitest';
import { saveAnalysis } from '@/lib/save-analysis';
import type { AnalysisResult } from '@/lib/analysis-schema';

const mocks = vi.hoisted(() => {
  const insert = vi.fn();
  const select = vi.fn();
  const eq = vi.fn();
  const order = vi.fn();
  const limit = vi.fn();

  const queryBuilder = {
    eq,
    order,
    limit,
  };

  select.mockReturnValue(queryBuilder);
  eq.mockReturnValue(queryBuilder);
  order.mockReturnValue(queryBuilder);

  const from = vi.fn(() => ({ insert, select }));
  const getUser = vi.fn();
  return { insert, select, eq, order, limit, from, getUser };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}));

describe('saveAnalysis', () => {
  const mockResult: AnalysisResult = {
    overallScore: 90,
    semanticMatch: {
      score: 88,
      matchedSkills: ['React'],
      missingSkills: [],
      summary: 'Strong fit.',
    },
    xyzScorer: {
      score: 85,
      bullets: [],
      strongBullets: 0,
      weakBullets: 0,
    },
    buzzwordRedliner: {
      score: 92,
      flaggedWords: [],
      authenticity: 'Authentic',
    },
    probingQuestions: [],
  };

  beforeEach(() => {
    mocks.insert.mockReset();
    mocks.select.mockClear();
    mocks.eq.mockClear();
    mocks.order.mockClear();
    mocks.limit.mockReset();
    mocks.from.mockClear();
    mocks.getUser.mockReset();
    mocks.limit.mockResolvedValue({ data: [], error: null });
  });

  it('skips save when no user', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    await saveAnalysis('resume', 'jd', mockResult);

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('inserts when user exists', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mocks.insert.mockResolvedValue({ error: null });

    await saveAnalysis('resume text', 'jd text', mockResult);

    expect(mocks.from).toHaveBeenCalledWith('analyses');
    expect(mocks.limit).toHaveBeenCalledWith(1);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        overall_score: 90,
        version_number: 1,
        track_key: expect.stringContaining('jd:'),
      })
    );
  });

  it('increments version for existing track', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mocks.limit.mockResolvedValue({ data: [{ version_number: 3 }], error: null });
    mocks.insert.mockResolvedValue({ error: null });

    await saveAnalysis('resume text', 'jd text', mockResult, {
      role: 'SWE',
      seniority: 'Senior',
    });

    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        version_number: 4,
        role: 'SWE',
        seniority: 'Senior',
        track_key: expect.stringContaining('role:SWE'),
      }),
    );
  });
});
