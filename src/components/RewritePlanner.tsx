import { motion } from 'framer-motion';
import { Zap, TrendingUp, AlertCircle } from 'lucide-react';
import type { Rewrite } from '@/lib/enhanced-analysis';

interface RewritePlannerProps {
  rewrites?: Rewrite[];
}

export function RewritePlanner({ rewrites }: RewritePlannerProps) {
  if (!rewrites || rewrites.length === 0) {
    return null;
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const totalLift = rewrites.reduce((sum, r) => sum + r.expectedScoreLift, 0);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="premium-card rounded-2xl p-6 border border-primary/15 bg-gradient-to-br from-primary/[0.02] to-transparent"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-display font-semibold text-foreground">
              Actionable Improvements
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground/60">
            Top rewrites with estimated score lift
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-score-excellent/10 border border-score-excellent/20">
          <TrendingUp className="w-3 h-3 text-score-excellent" />
          <span className="text-[11px] font-mono font-semibold text-score-excellent">
            +{totalLift.toFixed(0)} points
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {rewrites.map((rewrite, i) => (
          <motion.div
            key={i}
            variants={itemVariant}
            className="group p-4 rounded-xl bg-secondary/50 border border-border/40 hover:border-primary/20 transition-all"
          >
            {/* Original bullet */}
            <div className="mb-3 pb-3 border-b border-border/30">
              <p className="text-[12px] text-muted-foreground/70 italic">
                Original: "{rewrite.bullet}"
              </p>
            </div>

            {/* Rewritten bullet */}
            <div className="mb-3">
              <p className="text-[12px] font-semibold text-foreground/90 mb-1">
                Suggested rewrite:
              </p>
              <p className="text-[12px] text-score-excellent/90 font-medium leading-relaxed">
                "{rewrite.suggestedRewrite}"
              </p>
            </div>

            {/* Score lift and reasoning */}
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] text-muted-foreground/60 flex-1 leading-relaxed">
                {rewrite.explanation}
              </p>
              <div className="shrink-0 px-2.5 py-1 rounded-lg bg-score-excellent/10 border border-score-excellent/20">
                <span className="text-[10px] font-mono font-bold text-score-excellent">
                  +{rewrite.expectedScoreLift}
                </span>
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(rewrite.suggestedRewrite);
              }}
              className="mt-2 text-[10px] px-2 py-1 rounded border border-primary/20 text-primary/60 hover:bg-primary/5 transition-colors"
            >
              Copy
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
        <p className="text-[11px] text-primary/70">
          Apply these rewrites to your resume for a more compelling fit. Changes are cumulative.
        </p>
      </div>
    </motion.div>
  );
}
