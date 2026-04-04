import { z } from 'zod';
import { analysisResultSchema, analysisRequestSchema } from './analysis-schema';

export type Role = 'SWE' | 'PM' | 'DS' | 'Design' | 'Sales';
export type Seniority = 'Junior' | 'Mid' | 'Senior';

export const roleOptions: { label: string; value: Role }[] = [
  { label: 'Software Engineer', value: 'SWE' },
  { label: 'Product Manager', value: 'PM' },
  { label: 'Data Scientist', value: 'DS' },
  { label: 'Designer', value: 'Design' },
  { label: 'Sales', value: 'Sales' },
];

export const seniorityOptions: { label: string; value: Seniority }[] = [
  { label: 'Junior', value: 'Junior' },
  { label: 'Mid-Level', value: 'Mid' },
  { label: 'Senior', value: 'Senior' },
];

export const enhancedRequestSchema = analysisRequestSchema.extend({
  role: z.enum(['SWE', 'PM', 'DS', 'Design', 'Sales']).optional(),
  seniority: z.enum(['Junior', 'Mid', 'Senior']).optional(),
});

export const rewriteSchema = z.object({
  bullet: z.string(),
  suggestedRewrite: z.string(),
  expectedScoreLift: z.number().min(0).max(10),
  explanation: z.string(),
});

export const skillGapSchema = z.object({
  skill: z.string(),
  jdContext: z.string(),
  suggestedPlacement: z.string(),
  priority: z.enum(['High', 'Medium', 'Low']),
});

export const confidenceSchema = z.object({
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const enhancedAnalysisResultSchema = analysisResultSchema.extend({
  role: z.enum(['SWE', 'PM', 'DS', 'Design', 'Sales']).optional(),
  seniority: z.enum(['Junior', 'Mid', 'Senior']).optional(),
  rewrites: z.array(rewriteSchema).optional(),
  skillGaps: z.array(skillGapSchema).optional(),
  confidenceBands: z.object({
    semanticMatch: confidenceSchema,
    xyzScorer: confidenceSchema,
    buzzwordRedliner: confidenceSchema,
  }).optional(),
});

export type EnhancedAnalysisRequest = z.infer<typeof enhancedRequestSchema>;
export type Rewrite = z.infer<typeof rewriteSchema>;
export type SkillGap = z.infer<typeof skillGapSchema>;
export type EnhancedAnalysisResult = z.infer<typeof enhancedAnalysisResultSchema>;
