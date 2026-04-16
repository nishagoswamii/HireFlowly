import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Lightbulb, Target, BarChart3, Shield, HelpCircle, Download } from 'lucide-react';
import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { EnhancedAnalysisResult } from '@/lib/analysis-api';
import { RewritePlanner } from './RewritePlanner';
import { SkillGapExplainer } from './SkillGapExplainer';
import { exportAnalysisPDF } from '@/lib/pdf-export';

interface AnalysisResultsProps {
  result: EnhancedAnalysisResult;
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
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export function AnalysisResults({ result }: AnalysisResultsProps) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Export Button */}
      <motion.div variants={fadeUp} className="flex justify-end">
        <button
          onClick={() => exportAnalysisPDF(result)}
          className="group flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/12 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary transition-all duration-300 hover:border-primary/45 hover:bg-primary/20"
        >
          <Download className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
          Export PDF Report
        </button>
      </motion.div>

      {/* Actionable Rewrites */}
      {result.rewrites && result.rewrites.length > 0 && (
        <motion.div variants={fadeUp}>
          <RewritePlanner rewrites={result.rewrites} />
        </motion.div>
      )}

      {/* Missing Skills Roadmap */}
      {result.skillGaps && result.skillGaps.length > 0 && (
        <motion.div variants={fadeUp}>
          <SkillGapExplainer gaps={result.skillGaps} />
        </motion.div>
      )}
      <motion.div variants={fadeUp}>
        <Section title="Semantic JD Match" icon={<Target className="w-4 h-4 text-primary" />} score={result.semanticMatch.score}>
          <p className="text-[13px] text-foreground/70 mb-5 leading-relaxed">{result.semanticMatch.summary}</p>
          <ContextRadarChart
            matchedSkills={result.semanticMatch.matchedSkills}
            missingSkills={result.semanticMatch.missingSkills}
          />
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
    <div className="premium-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/[0.08] flex items-center justify-center">
            {icon}
          </div>
          <h3 className="text-[1.2rem] font-display font-semibold leading-none text-foreground/92">{title}</h3>
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

function ContextRadarChart({ matchedSkills, missingSkills }: { matchedSkills: string[]; missingSkills: string[] }) {
  const points = useMemo(() => {
    const normalize = (value: string) => value.trim();
    const matched = Array.from(new Set(matchedSkills.map(normalize).filter(Boolean)));
    const missing = Array.from(new Set(missingSkills.map(normalize).filter(Boolean)));
    const all = Array.from(new Set([...matched, ...missing])).slice(0, 10);

    return all.map((skill) => ({
      skill,
      resume: matched.includes(skill) ? 100 : 24,
      jd: 100,
      status: matched.includes(skill) ? 'Matched' : 'Missing',
    }));
  }, [matchedSkills, missingSkills]);

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-border/45 bg-secondary/35 p-4 text-[12px] text-muted-foreground/70">
        Skill graph unavailable for this analysis result.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/45 bg-secondary/35 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="section-label">Context Graph</p>
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/65">
          Resume vs target JD
        </p>
      </div>

      <div className="h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={points}>
            <PolarGrid stroke="hsl(var(--border) / 0.58)" />
            <PolarAngleAxis
              dataKey="skill"
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground) / 0.88)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            />
            <PolarRadiusAxis
              tick={false}
              axisLine={false}
              angle={90}
              domain={[0, 100]}
            />
            <Radar
              name="Target JD"
              dataKey="jd"
              stroke="hsl(var(--chart-3))"
              fill="hsl(var(--chart-3) / 0.18)"
              fillOpacity={0.75}
            />
            <Radar
              name="Your Resume"
              dataKey="resume"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.34)"
              fillOpacity={0.8}
            />
            <Tooltip content={<ContextRadarTooltip />} cursor={{ stroke: 'hsl(var(--primary) / 0.4)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '11px', paddingTop: '8px' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/65">
        Interactive skill overlay
      </p>
    </div>
  );
}

function ContextRadarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload?: { status?: string } }>; label?: string }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const status = payload[0]?.payload?.status;

  return (
    <div className="rounded-xl border border-border/60 bg-card/95 px-3 py-2 shadow-md backdrop-blur">
      <p className="text-[11px] font-semibold text-foreground/90">{label}</p>
      <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/70">
        {status === 'Matched' ? 'Detected in resume' : 'Missing from resume'}
      </p>
    </div>
  );
}

function BulletCard({ bullet, index }: { bullet: { text: string; hasMetric: boolean; hasTool: boolean; hasAction: boolean; score: number; suggestion: string }; index: number }) {
  const scoreClass = bullet.score >= 3 ? 'score-excellent' : bullet.score >= 2 ? 'score-good' : bullet.score >= 1 ? 'score-warning' : 'score-poor';

  return (
    <div className="group space-y-3 rounded-2xl border border-border/45 bg-secondary/35 p-4 transition-colors hover:border-primary/20">
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
