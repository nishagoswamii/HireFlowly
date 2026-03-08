import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
}

export function ScoreRing({ score, label, size = 80 }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const strokeWidth = size > 80 ? 5 : 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return 'hsl(var(--score-excellent))';
    if (s >= 60) return 'hsl(var(--score-good))';
    if (s >= 40) return 'hsl(var(--score-warning))';
    return 'hsl(var(--score-poor))';
  };

  const getGlow = (s: number) => {
    if (s >= 80) return 'drop-shadow(0 0 6px hsl(var(--score-excellent) / 0.4))';
    if (s >= 60) return 'drop-shadow(0 0 6px hsl(var(--score-good) / 0.4))';
    if (s >= 40) return 'drop-shadow(0 0 6px hsl(var(--score-warning) / 0.4))';
    return 'drop-shadow(0 0 6px hsl(var(--score-poor) / 0.4))';
  };

  const color = getColor(score);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size, filter: getGlow(score) }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border) / 0.5)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-mono font-bold"
            style={{ color, fontSize: size > 80 ? '1.5rem' : '0.875rem' }}
          >
            {displayScore}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
          {label}
        </span>
      )}
    </div>
  );
}
