import { motion } from 'framer-motion';
import { Lightbulb, Plus } from 'lucide-react';
import type { SkillGap } from '@/lib/enhanced-analysis';

interface SkillGapExplainerProps {
  gaps?: SkillGap[];
}

export function SkillGapExplainer({ gaps }: SkillGapExplainerProps) {
  if (!gaps || gaps.length === 0) {
    return null;
  }

  const highPriority = gaps.filter((g) => g.priority === 'High');
  const mediumPriority = gaps.filter((g) => g.priority === 'Medium');

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  const renderGaps = (gapList: SkillGap[], label: string, colorClass: string) => {
    if (gapList.length === 0) return null;

    return (
      <div key={label} className="space-y-2">
        <p className={`text-[10px] font-mono uppercase tracking-[0.15em] mb-2.5 ${colorClass}`}>
          {label} Priority ({gapList.length})
        </p>
        <div className="space-y-2">
          {gapList.map((gap, i) => (
            <motion.div
              key={`${label}-${i}`}
              variants={itemVariant}
              className="group rounded-2xl border border-border/45 bg-secondary/35 p-3 transition-colors hover:border-primary/20"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[12px] font-semibold text-foreground/80">
                  {gap.skill}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${colorClass} opacity-70`}>
                  {gap.priority}
                </span>
              </div>

              {/* JD Context */}
              <div className="mb-2 pb-2 border-b border-border/20">
                <p className="text-[10px] text-muted-foreground/60 font-mono mb-1">
                  Found in JD:
                </p>
                <p className="text-[11px] text-foreground/70 italic">
                  "{gap.jdContext}"
                </p>
              </div>

              {/* Suggested Placement */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3 h-3 text-primary/60" />
                  <p className="text-[10px] text-primary/70 font-medium">Add to:</p>
                </div>
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed ml-4">
                  {gap.suggestedPlacement}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="premium-card rounded-3xl p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-primary/[0.08] flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-[1.2rem] font-display font-semibold leading-none text-foreground/92">
          Missing Skills Roadmap
        </h3>
      </div>

      <div className="space-y-5">
        {renderGaps(
          highPriority,
          'High',
          'text-score-poor/70'
        )}
        {renderGaps(
          mediumPriority,
          'Medium',
          'text-score-warning/70'
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 flex gap-2">
        <span className="text-[10px] text-blue-600/70">
          💡 Tip: Start with high-priority gaps. Add relevant projects or examples demonstrating these skills.
        </span>
      </div>
    </motion.div>
  );
}
