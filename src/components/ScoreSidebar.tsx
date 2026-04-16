import { motion } from 'framer-motion';
import { ScoreRing } from './ScoreRing';
import { ConfidenceBand } from './ConfidenceBand';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { EnhancedAnalysisResult } from '@/lib/analysis-api';

interface ScoreSidebarProps {
  result: EnhancedAnalysisResult | null;
  isAnalyzing: boolean;
}

export function ScoreSidebar({ result, isAnalyzing }: ScoreSidebarProps) {
  if (!result && !isAnalyzing) {
    return (
      <div className="glass-panel flex h-80 flex-col items-center justify-center rounded-3xl p-8 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60">
          <Activity className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <p className="max-w-[210px] text-[12px] leading-relaxed text-muted-foreground/60">
          Upload a resume and paste a JD to begin analysis
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="glass-panel-glow flex h-80 flex-col items-center justify-center rounded-3xl p-8">
        <div className="relative w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-primary/10" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-transparent border-b-primary/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="animate-pulse-glow text-xs font-mono uppercase tracking-[0.24em] text-primary">
          ANALYZING
        </p>
        <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.1em] text-muted-foreground/55">
          Processing semantic signals...
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-glow space-y-6 rounded-3xl p-6"
    >
      {/* Overall */}
      <div className="text-center pb-1">
        <p className="section-label mb-4">Overall Score</p>
        <ScoreRing score={result.overallScore} label="" size={110} />
        <p className="mt-3 text-[11px] font-mono uppercase tracking-[0.12em] text-muted-foreground/65">
          {result.overallScore >= 80 ? 'Excellent' : result.overallScore >= 60 ? 'Good' : result.overallScore >= 40 ? 'Needs Work' : 'Weak'}
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Sub scores */}
      <div className="grid grid-cols-3 gap-1">
        <ScoreRing score={result.semanticMatch.score} label="Match" size={64} />
        <ScoreRing score={result.xyzScorer.score} label="Impact" size={64} />
        <ScoreRing score={result.buzzwordRedliner.score} label="Auth" size={64} />
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Confidence Bands */}
      {result.confidenceBands && (
        <div className="space-y-2">
          <p className="section-label">Confidence</p>
          <div className="space-y-2">
            {result.confidenceBands.semanticMatch && (
              <ConfidenceBand
                score={result.confidenceBands.semanticMatch.score}
                confidence={result.confidenceBands.semanticMatch.confidence}
                reasoning={result.confidenceBands.semanticMatch.reasoning}
              />
            )}
            {result.confidenceBands.xyzScorer && (
              <ConfidenceBand
                score={result.confidenceBands.xyzScorer.score}
                confidence={result.confidenceBands.xyzScorer.confidence}
                reasoning={result.confidenceBands.xyzScorer.reasoning}
              />
            )}
            {result.confidenceBands.buzzwordRedliner && (
              <ConfidenceBand
                score={result.confidenceBands.buzzwordRedliner.score}
                confidence={result.confidenceBands.buzzwordRedliner.confidence}
                reasoning={result.confidenceBands.buzzwordRedliner.reasoning}
              />
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      )}

      {/* Quick Stats */}
      <div className="space-y-3">
        <p className="section-label">Quick Stats</p>
        <div className="space-y-2.5">
          <StatRow icon={<TrendingUp className="w-3 h-3 text-score-excellent" />} label="Skills Matched" value={result.semanticMatch.matchedSkills.length} />
          <StatRow icon={<TrendingDown className="w-3 h-3 text-score-poor" />} label="Skills Missing" value={result.semanticMatch.missingSkills.length} variant="warning" />
          <StatRow icon={<TrendingUp className="w-3 h-3 text-score-excellent" />} label="Strong Bullets" value={result.xyzScorer.strongBullets} />
          <StatRow icon={<TrendingDown className="w-3 h-3 text-score-warning" />} label="Weak Bullets" value={result.xyzScorer.weakBullets} variant="warning" />
          <StatRow icon={<TrendingDown className="w-3 h-3 text-score-warning" />} label="Buzzwords" value={result.buzzwordRedliner.flaggedWords.length} variant="warning" />
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ icon, label, value, variant }: { icon: React.ReactNode; label: string; value: number; variant?: 'warning' }) {
  return (
    <div className="flex items-center gap-2.5 group">
      {icon}
      <span className="flex-1 text-[11px] text-muted-foreground/68">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${variant === 'warning' ? 'text-score-warning' : 'text-foreground/80'}`}>
        {value}
      </span>
    </div>
  );
}
