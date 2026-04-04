import { z } from 'zod';

export const analysisRequestSchema = z.object({
  resumeText: z.string().min(1).max(20000),
  jobDescription: z.string().min(1).max(20000),
});

export const bulletAnalysisSchema = z.object({
  text: z.string(),
  hasMetric: z.boolean(),
  hasTool: z.boolean(),
  hasAction: z.boolean(),
  score: z.number().min(0).max(3),
  suggestion: z.string(),
});

export const buzzwordHitSchema = z.object({
  word: z.string(),
  count: z.number().nonnegative(),
  alternative: z.string(),
});

export const analysisResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  semanticMatch: z.object({
    score: z.number().min(0).max(100),
    matchedSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    summary: z.string(),
  }),
  xyzScorer: z.object({
    score: z.number().min(0).max(100),
    bullets: z.array(bulletAnalysisSchema).max(8),
    strongBullets: z.number().nonnegative(),
    weakBullets: z.number().nonnegative(),
  }),
  buzzwordRedliner: z.object({
    score: z.number().min(0).max(100),
    flaggedWords: z.array(buzzwordHitSchema),
    authenticity: z.string(),
  }),
  probingQuestions: z.array(z.string()).max(5),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type BulletAnalysis = z.infer<typeof bulletAnalysisSchema>;
export type BuzzwordHit = z.infer<typeof buzzwordHitSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
