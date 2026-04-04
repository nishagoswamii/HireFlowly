import { describe, expect, it } from 'vitest';
import { analysisRequestSchema, analysisResultSchema } from '@/lib/analysis-schema';

const sampleResult = {
  overallScore: 88,
  semanticMatch: {
    score: 85,
    matchedSkills: ['React', 'TypeScript'],
    missingSkills: ['GraphQL'],
    summary: 'Strong front-end alignment with minor API gap.',
  },
  xyzScorer: {
    score: 82,
    bullets: [
      {
        text: 'Increased conversion by 12% by shipping A/B tested checkout flow using React.',
        hasMetric: true,
        hasTool: true,
        hasAction: true,
        score: 3,
        suggestion: 'Add data source and sample size.',
      },
    ],
    strongBullets: 1,
    weakBullets: 0,
  },
  buzzwordRedliner: {
    score: 90,
    flaggedWords: [
      { word: 'synergy', count: 1, alternative: 'collaboration' },
    ],
    authenticity: 'Mostly concrete language.',
  },
  probingQuestions: ['How did you measure the uplift?'],
};

describe('analysis schemas', () => {
  it('validates a correct request', () => {
    const parsed = analysisRequestSchema.parse({
      resumeText: 'resume content',
      jobDescription: 'jd content',
    });
    expect(parsed.resumeText).toBe('resume content');
  });

  it('rejects oversized request text', () => {
    const longText = 'a'.repeat(21000);
    expect(() =>
      analysisRequestSchema.parse({ resumeText: longText, jobDescription: 'ok' })
    ).toThrow();
  });

  it('accepts a valid analysis result', () => {
    const parsed = analysisResultSchema.parse(sampleResult);
    expect(parsed.xyzScorer.bullets[0].score).toBe(3);
  });

  it('rejects too many bullets', () => {
    const tooMany = {
      ...sampleResult,
      xyzScorer: {
        ...sampleResult.xyzScorer,
        bullets: new Array(10).fill(sampleResult.xyzScorer.bullets[0]),
      },
    };
    const result = analysisResultSchema.safeParse(tooMany);
    expect(result.success).toBe(false);
  });
});
