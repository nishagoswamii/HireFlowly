import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface ConfidenceBandProps {
  score: number;
  confidence: number;
  reasoning: string;
}

export function ConfidenceBand({ score, confidence, reasoning }: ConfidenceBandProps) {
  const [expanded, setExpanded] = useState(false);
  
  const confidenceColor =
    confidence >= 85 ? 'text-score-excellent' :
    confidence >= 70 ? 'text-score-good' :
    confidence >= 50 ? 'text-score-warning' :
    'text-score-poor';

  const confidenceBg =
    confidence >= 85 ? 'bg-score-excellent/10 border-score-excellent/20' :
    confidence >= 70 ? 'bg-score-good/10 border-score-good/20' :
    confidence >= 50 ? 'bg-score-warning/10 border-score-warning/20' :
    'bg-score-poor/10 border-score-poor/20';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`w-full p-2.5 rounded-lg border ${confidenceBg} cursor-pointer transition-all`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/60">Confidence:</span>
          <span className={`text-[11px] font-bold ${confidenceColor}`}>
            {confidence}%
          </span>
        </div>
        <Info className="w-3 h-3 text-muted-foreground/40" />
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 pt-2 border-t border-border/20"
        >
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
            {reasoning}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
