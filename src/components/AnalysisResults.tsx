import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, MessageSquare, Target, BarChart3, Shield, HelpCircle } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analysis-api';

interface AnalysisResultsProps {
  result: AnalysisResult;
}

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Semantic Match */}
      <motion.div variants={fadeUp}>
        <Section title="Semantic JD Match" icon={<Target className="w-4 h-4 text-primary" />} score={result.semanticMatch.score}>
          <p className="text-[13px] text-foreground/70 mb-5 leading-relaxed">{result.semanticMatch.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <SkillGroup label="Matched Skills" variant="excellent" skills={result.semanticMatch.matchedSkills} />
            <SkillGroup label="Missing Skills" variant="poor" skills={result.semanticMatch.missingSkills} />
          </div>
        </Section>
      </motion.div>

      {/* X-Y-Z Scorer */}
      <motion.div variants={fadeUp}>
        <Section title="X-Y-Z Impact Scorer" icon={<BarChart3 className="w-4 h-4 text-primary" />} score={result.xyzScorer.score}>
          <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-primary/[0.03] border border-primary/10">
            <span className="text-[11px] text-primary/60 font-mono">
              Google formula: "Accomplished [X] as measured by [Y], by doing [Z]"
            </span>
          </div>
          <div className="space-y-3">
            {result.xyzScorer.bullets.map((bullet, i) => (
              <BulletCard key={i} bullet={bullet} index={i} />
            ))}
          </div>
        </Section>
      </motion.div>

      {/* Buzzword Redliner */}
      <motion.div variants={fadeUp}>
        <Section title="AI-Authenticity Redliner" icon={<Shield className="w-4 h-4 text-primary" />} score={result.buzzwordRedliner.score}>
          <p className="text-[13px] text-foreground/70 mb-5 leading-relaxed">{result.buzzwordRedliner.authenticity}</p>
          {result.buzzwordRedliner.flaggedWords.length > 0 ? (
            <div className="space-y-2">
              {result.buzzwordRedliner.flaggedWords.map((hit) => (
                <div key={hit.word} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/30 group hover:border-primary/15 transition-colors">
                  <span className="score-badge score-warning shrink-0">"{hit.word}" ×{hit.count}</span>
                  <span className="text-muted-foreground/30">→</span>
                  <span className="text-[12px] text-score-excellent font-medium">{hit.alternative}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-score-excellent/[0.05] border border-score-excellent/10">
              <CheckCircle className="w-4 h-4 text-score-excellent" />
              <span className="text-[12px] text-score-excellent">No major buzzword issues detected</span>
            </div>
          )}
        </Section>
      </motion.div>

      {/* Probing Questions */}
      <motion.div variants={fadeUp}>
        <Section title="Recruiter Probing Questions" icon={<HelpCircle className="w-4 h-4 text-primary" />}>
          <p className="text-[11px] text-muted-foreground/50 mb-4 font-mono">
            Questions a recruiter may ask based on resume gaps:
          </p>
          <div className="space-y-2.5">
            {result.probingQuestions.map((q, i) => (
              <div key={i} className="flex gap-3 p-4 rounded-xl bg-secondary/40 border border-border/30 group hover:border-primary/15 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-mono font-bold text-primary">{i + 1}</span>
                </div>
                <p className="text-[13px] text-foreground/75 leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </Section>
      </motion.div>
    </motion.div>
  );
}

function Section({ title, icon, score, children }: { title: string; icon: React.ReactNode; score?: number; children: React.ReactNode }) {
  return (
    <div className="premium-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/[0.08] flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-sm font-display font-semibold text-foreground/90">{title}</h3>
        </div>
        {score !== undefined && (
          <span className={`score-badge ${score >= 80 ? 'score-excellent' : score >= 60 ? 'score-good' : score >= 40 ? 'score-warning' : 'score-poor'}`}>
            {score}/100
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SkillGroup({ label, variant, skills }: { label: string; variant: 'excellent' | 'poor'; skills: string[] }) {
  const isExcellent = variant === 'excellent';
  return (
    <div>
      <p className={`text-[10px] font-mono uppercase tracking-[0.15em] mb-2.5 ${isExcellent ? 'text-score-excellent/70' : 'text-score-poor/70'}`}>
        {isExcellent ? '✓' : '✗'} {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill) => (
          <span key={skill} className={`score-badge ${isExcellent ? 'score-excellent' : 'score-poor'}`}>
            {skill}
          </span>
        ))}
        {skills.length === 0 && (
          <span className="text-[11px] text-muted-foreground/40 italic">None</span>
        )}
      </div>
    </div>
  );
}

function BulletCard({ bullet, index }: { bullet: { text: string; hasMetric: boolean; hasTool: boolean; hasAction: boolean; score: number; suggestion: string }; index: number }) {
  const scoreClass = bullet.score >= 3 ? 'score-excellent' : bullet.score >= 2 ? 'score-good' : bullet.score >= 1 ? 'score-warning' : 'score-poor';

  return (
    <div className="p-4 rounded-xl bg-secondary/40 border border-border/30 space-y-3 group hover:border-primary/15 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-foreground/75 flex-1 leading-relaxed italic">"{bullet.text}"</p>
        <span className={`score-badge ${scoreClass} shrink-0`}>{bullet.score}/3</span>
      </div>
      <div className="flex gap-4 text-[10px] font-mono">
        <Indicator ok={bullet.hasAction} label="ACTION" />
        <Indicator ok={bullet.hasMetric} label="METRIC" />
        <Indicator ok={bullet.hasTool} label="TOOL" />
      </div>
      {bullet.suggestion && bullet.score < 3 && (
        <div className="flex items-start gap-2.5 pt-3 border-t border-border/20">
          <Lightbulb className="w-3.5 h-3.5 text-primary/60 mt-0.5 shrink-0" />
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{bullet.suggestion}</p>
        </div>
      )}
    </div>
  );
}

function Indicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${ok ? 'text-score-excellent/80' : 'text-score-poor/50'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}
