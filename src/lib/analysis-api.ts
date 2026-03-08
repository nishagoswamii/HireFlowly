import { supabase } from '@/integrations/supabase/client';

export interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
}

export interface BulletAnalysis {
  text: string;
  hasMetric: boolean;
  hasTool: boolean;
  hasAction: boolean;
  score: number; // 0-3
  suggestion: string;
}

export interface BuzzwordHit {
  word: string;
  count: number;
  alternative: string;
}

export interface AnalysisResult {
  overallScore: number;
  semanticMatch: {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    summary: string;
  };
  xyzScorer: {
    score: number;
    bullets: BulletAnalysis[];
    strongBullets: number;
    weakBullets: number;
  };
  buzzwordRedliner: {
    score: number;
    flaggedWords: BuzzwordHit[];
    authenticity: string;
  };
  probingQuestions: string[];
}

export async function analyzeResume(request: AnalysisRequest): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-resume', {
    body: request,
  });

  if (error) {
    throw new Error(error.message || 'Analysis failed');
  }

  return data as AnalysisResult;
}
