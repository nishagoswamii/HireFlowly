import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Lightbulb, MessageSquare } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analysis-api';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.1 }}
      className="space-y-6"
    >
      {/* Semantic Match */}
      <Section title="Semantic JD Match" icon="🎯">
        <p className="text-sm text-foreground mb-4">{result.semanticMatch.summary}</p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-score-excellent mb-2">
              ✓ Matched Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.semanticMatch.matchedSkills.map((skill) => (
                <span key={skill} className="score-badge score-excellent">{skill}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-score-poor mb-2">
              ✗ Missing Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.semanticMatch.missingSkills.map((skill) => (
                <span key={skill} className="score-badge score-poor">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* X-Y-Z Scorer */}
      <Section title="X-Y-Z Impact Scorer" icon="📊">
        <p className="text-xs text-muted-foreground mb-4">
          Google formula: "Accomplished [X] as measured by [Y], by doing [Z]"
        </p>
        <div className="space-y-3">
          {result.xyzScorer.bullets.map((bullet, i) => (
            <BulletCard key={i} bullet={bullet} />
          ))}
        </div>
      </Section>

      {/* Buzzword Redliner */}
      <Section title="AI-Authenticity Redliner" icon="🔍">
        <p className="text-sm text-foreground mb-4">{result.buzzwordRedliner.authenticity}</p>
        {result.buzzwordRedliner.flaggedWords.length > 0 ? (
          <div className="space-y-2">
            {result.buzzwordRedliner.flaggedWords.map((hit) => (
              <div key={hit.word} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <span className="score-badge score-warning">"{hit.word}" ×{hit.count}</span>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs text-score-excellent font-medium">{hit.alternative}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-score-excellent flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> No major buzzword issues detected
          </p>
        )}
      </Section>

      {/* Probing Questions */}
      <Section title="Recruiter Probing Questions" icon="❓">
        <p className="text-xs text-muted-foreground mb-3">
          These are questions a recruiter might ask to probe the weakest areas:
        </p>
        <div className="space-y-3">
          {result.probingQuestions.map((q, i) => (
            <div key={i} className="flex gap-3 p-3 bg-secondary rounded-lg">
              <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">{q}</p>
            </div>
          ))}
        </div>
      </Section>
    </motion.div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-lg p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {children}
    </motion.div>
  );
}

function BulletCard({ bullet }: { bullet: { text: string; hasMetric: boolean; hasTool: boolean; hasAction: boolean; score: number; suggestion: string } }) {
  const scoreClass = bullet.score >= 3 ? 'score-excellent' : bullet.score >= 2 ? 'score-good' : bullet.score >= 1 ? 'score-warning' : 'score-poor';
  
  return (
    <div className="p-3 bg-secondary rounded-lg space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground flex-1">"{bullet.text}"</p>
        <span className={`score-badge ${scoreClass} shrink-0`}>{bullet.score}/3</span>
      </div>
      <div className="flex gap-3 text-[10px] font-mono">
        <Indicator ok={bullet.hasAction} label="ACTION" />
        <Indicator ok={bullet.hasMetric} label="METRIC" />
        <Indicator ok={bullet.hasTool} label="TOOL" />
      </div>
      {bullet.suggestion && (
        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border">
          <Lightbulb className="w-3 h-3 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{bullet.suggestion}</p>
        </div>
      )}
    </div>
  );
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 ${ok ? 'text-score-excellent' : 'text-score-poor'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}
