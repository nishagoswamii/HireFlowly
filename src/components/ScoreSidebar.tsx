import { motion } from 'framer-motion';
import { ScoreRing } from './ScoreRing';
import type { AnalysisResult } from '@/lib/analysis-api';

interface ScoreSidebarProps {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
}

export function ScoreSidebar({ result, isAnalyzing }: ScoreSidebarProps) {
  if (!result && !isAnalyzing) {
    return (
      <div className="glass-panel rounded-lg p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <span className="font-mono text-2xl text-muted-foreground">?</span>
        </div>
        <p className="text-sm text-muted-foreground">Upload a resume and paste a JD to begin analysis</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="glass-panel rounded-lg p-6 h-full flex flex-col items-center justify-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <p className="text-sm font-mono text-primary animate-pulse-glow">ANALYZING...</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel rounded-lg p-6 space-y-6"
    >
      <div className="text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Overall Score
        </p>
        <ScoreRing score={result.overallScore} label="" size={100} />
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-3 gap-2">
        <ScoreRing score={result.semanticMatch.score} label="Match" size={60} />
        <ScoreRing score={result.xyzScorer.score} label="Impact" size={60} />
        <ScoreRing score={result.buzzwordRedliner.score} label="Auth" size={60} />
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Quick Stats
        </p>
        <div className="space-y-2">
          <StatRow label="Skills Matched" value={`${result.semanticMatch.matchedSkills.length}`} />
          <StatRow label="Skills Missing" value={`${result.semanticMatch.missingSkills.length}`} variant="warning" />
          <StatRow label="Strong Bullets" value={`${result.xyzScorer.strongBullets}`} />
          <StatRow label="Weak Bullets" value={`${result.xyzScorer.weakBullets}`} variant="warning" />
          <StatRow label="Buzzwords Found" value={`${result.buzzwordRedliner.flaggedWords.length}`} variant="warning" />
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ label, value, variant }: { label: string; value: string; variant?: 'warning' }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono font-semibold ${variant === 'warning' ? 'text-score-warning' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
