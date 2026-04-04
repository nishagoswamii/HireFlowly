import { supabase } from '@/integrations/supabase/client';
import {
  analysisRequestSchema,
  analysisResultSchema,
  type AnalysisRequest,
  type AnalysisResult,
} from './analysis-schema';
import {
  enhancedRequestSchema,
  enhancedAnalysisResultSchema,
  type EnhancedAnalysisRequest,
  type EnhancedAnalysisResult,
} from './enhanced-analysis';

export type { EnhancedAnalysisResult, AnalysisResult };
export type { EnhancedAnalysisRequest, AnalysisRequest };

export async function analyzeResume(request: AnalysisRequest): Promise<AnalysisResult> {
  const parsedRequest = analysisRequestSchema.parse(request);

  const { data, error } = await supabase.functions.invoke('analyze-resume', {
    body: parsedRequest,
  });

  if (error) {
    throw new Error(error.message || 'Analysis failed');
  }

  const validated = analysisResultSchema.safeParse(data);
  if (!validated.success) {
    throw new Error('Invalid analysis response');
  }

  return validated.data;
}

export async function analyzeResumeEnhanced(request: EnhancedAnalysisRequest): Promise<EnhancedAnalysisResult> {
  const parsedRequest = enhancedRequestSchema.parse(request);

  const { data, error } = await supabase.functions.invoke('analyze-resume', {
    body: parsedRequest,
  });

  if (error) {
    throw new Error(error.message || 'Analysis failed');
  }

  const validated = enhancedAnalysisResultSchema.safeParse(data);
  if (!validated.success) {
    console.error('Validation errors:', validated.error.issues);
    throw new Error('Invalid analysis response');
  }

  return validated.data;
}
