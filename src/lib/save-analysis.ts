import { supabase } from '@/integrations/supabase/client';
import type { AnalysisResult, EnhancedAnalysisResult } from './analysis-api';
import type { Role, Seniority } from './enhanced-analysis';
import type { Json, TablesInsert } from '@/integrations/supabase/types';

interface SaveAnalysisOptions {
  role?: Role;
  seniority?: Seniority;
}

function normalizeInput(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

export function buildAnalysisTrackKey(jobDescription: string, role?: Role, seniority?: Seniority): string {
  const normalizedJd = normalizeInput(jobDescription).slice(0, 2500);
  const jdHash = hashString(normalizedJd);
  const roleKey = role ?? 'General';
  const seniorityKey = seniority ?? 'Any';
  return `jd:${jdHash}|role:${roleKey}|seniority:${seniorityKey}`;
}

function getResultContext(result: AnalysisResult | EnhancedAnalysisResult): SaveAnalysisOptions {
  const maybeEnhanced = result as Partial<EnhancedAnalysisResult>;
  return {
    role: maybeEnhanced.role,
    seniority: maybeEnhanced.seniority,
  };
}

export async function saveAnalysis(
  resumeText: string,
  jobDescription: string,
  result: AnalysisResult | EnhancedAnalysisResult,
  options?: SaveAnalysisOptions,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Not logged in, skip saving

  const contextFromResult = getResultContext(result);
  const role = options?.role ?? contextFromResult.role;
  const seniority = options?.seniority ?? contextFromResult.seniority;
  const trackKey = buildAnalysisTrackKey(jobDescription, role, seniority);

  const { data: latestRows, error: latestVersionError } = await supabase
    .from('analyses')
    .select('version_number')
    .eq('user_id', user.id)
    .eq('track_key', trackKey)
    .order('version_number', { ascending: false })
    .limit(1);

  if (latestVersionError) {
    console.error('Failed to fetch latest analysis version:', latestVersionError);
  }

  const nextVersion = (latestRows?.[0]?.version_number ?? 0) + 1;

  const insertPayload: TablesInsert<'analyses'> = {
    user_id: user.id,
    resume_text: resumeText,
    job_description: jobDescription,
    result: result as Json,
    overall_score: result.overallScore,
    role: role ?? null,
    seniority: seniority ?? null,
    track_key: trackKey,
    version_number: nextVersion,
  };

  const { error } = await supabase.from('analyses').insert(insertPayload);

  if (error) {
    console.error('Failed to save analysis:', error);
  }
}
