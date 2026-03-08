import { motion } from 'framer-motion';
import { ScoreRing } from './ScoreRing';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analysis-api';

interface ScoreSidebarProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

export function ScoreSidebar({ result, isAnalyzing }: ScoreSidebarProps) {
  if (!result && !isAnalyzing) {
    return (
      <div className="glass-panel rounded-2xl p-8 h-80 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mb-5">
          <Activity className="w-6 h-6 text-muted-foreground/30" />
        </div>
        <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-[200px]">
          Upload a resume and paste a JD to begin analysis
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="glass-panel-glow rounded-2xl p-8 h-80 flex flex-col items-center justify-center">
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
        <p className="text-xs font-mono text-primary animate-pulse-glow tracking-widest">
          ANALYZING
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-2 font-mono">
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
      className="glass-panel-glow rounded-2xl p-6 space-y-6"
    >
      {/* Overall */}
      <div className="text-center pb-1">
        <p className="section-label mb-4">Overall Score</p>
        <ScoreRing score={result.overallScore} label="" size={110} />
        <p className="text-[11px] text-muted-foreground/50 mt-3 font-mono">
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
      <span className="text-[11px] text-muted-foreground/60 flex-1">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${variant === 'warning' ? 'text-score-warning' : 'text-foreground/80'}`}>
        {value}
      </span>
    </div>
  );
}
