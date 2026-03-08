import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult } from './analysis-api';

export async function saveAnalysis(
  resumeText: string,
  jobDescription: string,
  result: AnalysisResult
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Not logged in, skip saving

  const { error } = await supabase.from('analyses').insert({
    user_id: user.id,
    resume_text: resumeText,
    job_description: jobDescription,
    result: result as any,
    overall_score: result.overallScore,
  } as any);

  if (error) {
    console.error('Failed to save analysis:', error);
  }
}
