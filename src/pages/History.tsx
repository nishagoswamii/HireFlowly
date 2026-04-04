import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trash2, ArrowLeft, ArrowRight, Loader2, GitCompare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ScoreRing } from '@/components/ScoreRing';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AnalysisRow {
  id: string;
  resume_text: string;
  job_description: string;
  result: unknown;
  overall_score: number;
  created_at: string;
  role: string | null;
  seniority: string | null;
  track_key: string;
  version_number: number;
}

interface AnalysisTrack {
  key: string;
  label: string;
  role: string;
  seniority: string;
  versions: AnalysisRow[];
  latestScore: number;
  delta: number;
}

interface MetricDelta {
  label: string;
  from: number;
  to: number;
  delta: number;
}

const chartConfig = {
  score: {
    label: 'Overall Score',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getComponentScores(result: unknown): { semantic: number; impact: number; authenticity: number } {
  const parsed = (result ?? {}) as {
    semanticMatch?: { score?: number };
    xyzScorer?: { score?: number };
    buzzwordRedliner?: { score?: number };
  };

  return {
    semantic: Number(parsed.semanticMatch?.score ?? 0),
    impact: Number(parsed.xyzScorer?.score ?? 0),
    authenticity: Number(parsed.buzzwordRedliner?.score ?? 0),
  };
}

function buildMetrics(fromVersion: AnalysisRow, toVersion: AnalysisRow): MetricDelta[] {
  const fromScores = getComponentScores(fromVersion.result);
  const toScores = getComponentScores(toVersion.result);

  return [
    {
      label: 'Overall',
      from: fromVersion.overall_score,
      to: toVersion.overall_score,
      delta: toVersion.overall_score - fromVersion.overall_score,
    },
    {
      label: 'Semantic Match',
      from: fromScores.semantic,
      to: toScores.semantic,
      delta: toScores.semantic - fromScores.semantic,
    },
    {
      label: 'Impact Scorer',
      from: fromScores.impact,
      to: toScores.impact,
      delta: toScores.impact - fromScores.impact,
    },
    {
      label: 'Authenticity',
      from: fromScores.authenticity,
      to: toScores.authenticity,
      delta: toScores.authenticity - fromScores.authenticity,
    },
  ];
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackKey, setSelectedTrackKey] = useState<string | null>(null);
  const [fromVersionId, setFromVersionId] = useState<string | null>(null);
  const [toVersionId, setToVersionId] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading history', description: error.message, variant: 'destructive' });
    } else {
      setAnalyses(data as unknown as AnalysisRow[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    fetchAnalyses();
  }, [user, fetchAnalyses]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('analyses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const tracks = useMemo<AnalysisTrack[]>(() => {
    const groups = new Map<string, AnalysisRow[]>();

    for (const analysis of analyses) {
      const key = analysis.track_key || `legacy-${analysis.id}`;
      const current = groups.get(key) ?? [];
      current.push(analysis);
      groups.set(key, current);
    }

    return Array.from(groups.entries())
      .map(([key, versions]) => {
        const sortedVersions = [...versions].sort((a, b) => {
          if (a.version_number !== b.version_number) {
            return a.version_number - b.version_number;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const first = sortedVersions[0];
        const latest = sortedVersions[sortedVersions.length - 1];
        const role = latest.role ?? 'General';
        const seniority = latest.seniority ?? 'Any';
        const jdPreview = latest.job_description.slice(0, 44).trim();
        const suffix = latest.job_description.length > 44 ? '...' : '';

        return {
          key,
          label: `${role} / ${seniority} - ${jdPreview}${suffix}`,
          role,
          seniority,
          versions: sortedVersions,
          latestScore: latest.overall_score,
          delta: latest.overall_score - first.overall_score,
        };
      })
      .sort((a, b) => {
        const aLatest = new Date(a.versions[a.versions.length - 1].created_at).getTime();
        const bLatest = new Date(b.versions[b.versions.length - 1].created_at).getTime();
        return bLatest - aLatest;
      });
  }, [analyses]);

  useEffect(() => {
    if (tracks.length === 0) {
      setSelectedTrackKey(null);
      return;
    }

    if (!selectedTrackKey || !tracks.some((track) => track.key === selectedTrackKey)) {
      setSelectedTrackKey(tracks[0].key);
    }
  }, [tracks, selectedTrackKey]);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.key === selectedTrackKey) ?? null,
    [tracks, selectedTrackKey],
  );

  useEffect(() => {
    if (!selectedTrack || selectedTrack.versions.length === 0) {
      setFromVersionId(null);
      setToVersionId(null);
      return;
    }

    const firstId = selectedTrack.versions[0].id;
    const lastId = selectedTrack.versions[selectedTrack.versions.length - 1].id;

    setFromVersionId((current) => {
      if (current && selectedTrack.versions.some((version) => version.id === current)) {
        return current;
      }
      return firstId;
    });

    setToVersionId((current) => {
      if (current && selectedTrack.versions.some((version) => version.id === current)) {
        return current;
      }
      return lastId;
    });
  }, [selectedTrack]);

  const trendData = useMemo(() => {
    if (!selectedTrack) return [];

    return selectedTrack.versions.map((version, index) => ({
      versionLabel: `v${version.version_number ?? index + 1}`,
      score: version.overall_score,
      dateLabel: formatShortDate(version.created_at),
    }));
  }, [selectedTrack]);

  const fromVersion = useMemo(
    () => selectedTrack?.versions.find((version) => version.id === fromVersionId) ?? null,
    [selectedTrack, fromVersionId],
  );

  const toVersion = useMemo(
    () => selectedTrack?.versions.find((version) => version.id === toVersionId) ?? null,
    [selectedTrack, toVersionId],
  );

  const metricDeltas = useMemo(() => {
    if (!fromVersion || !toVersion) return [];
    return buildMetrics(fromVersion, toVersion);
  }, [fromVersion, toVersion]);

  return (
    <div className="min-h-screen bg-background noise-texture">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      <header className="relative z-10 border-b border-border/50">
        <div className="container max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground tracking-tight">
                Hire<span className="text-gradient">Flowly</span>
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.25em]">
                Analysis History
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-border/40 text-xs font-display font-medium text-foreground/70 hover:text-foreground hover:border-primary/20 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            New Analysis
          </Link>
        </div>
      </header>

      <main className="relative z-10 container max-w-5xl mx-auto px-6 py-10">
        {!user ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 premium-card rounded-2xl"
          >
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground/80 font-display mb-2">Sign in to view your analyses</p>
            <p className="text-[11px] text-muted-foreground/50 mb-4">
              Your history is private and available only after authentication.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                to="/auth"
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold"
              >
                Go to sign in
              </Link>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg border border-border/50 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Back to analysis
              </button>
            </div>
          </motion.div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : analyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground/60 font-display">No analyses yet</p>
            <p className="text-[11px] text-muted-foreground/40 mt-1">Run your first analysis to see it here</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {selectedTrack && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card rounded-2xl p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-primary/70 mb-1">Trend Tracking</p>
                    <h2 className="text-sm font-display font-semibold text-foreground/90">Score Timeline</h2>
                  </div>
                  <div className="w-full md:w-[360px]">
                    <Select value={selectedTrack.key} onValueChange={setSelectedTrackKey}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select analysis track" />
                      </SelectTrigger>
                      <SelectContent>
                        {tracks.map((track) => (
                          <SelectItem key={track.key} value={track.key}>
                            {track.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                  <div className="rounded-xl bg-secondary/40 border border-border/40 p-3">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Latest Score</p>
                    <p className="text-xl font-display font-semibold text-foreground/90 mt-1">{selectedTrack.latestScore}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/40 p-3">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Total Delta</p>
                    <p className={`text-xl font-display font-semibold mt-1 ${selectedTrack.delta >= 0 ? 'text-score-excellent' : 'text-score-poor'}`}>
                      {selectedTrack.delta >= 0 ? '+' : ''}{selectedTrack.delta}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 border border-border/40 p-3">
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase">Versions</p>
                    <p className="text-xl font-display font-semibold text-foreground/90 mt-1">{selectedTrack.versions.length}</p>
                  </div>
                </div>

                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <LineChart data={trendData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="versionLabel" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent labelKey="dateLabel" indicator="line" />} />
                    <Line
                      dataKey="score"
                      type="monotone"
                      stroke="var(--color-score)"
                      strokeWidth={2.5}
                      dot={{ fill: 'var(--color-score)', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ChartContainer>
              </motion.section>
            )}

            {selectedTrack && selectedTrack.versions.length > 1 && (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <GitCompare className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-display font-semibold text-foreground/90">Version Compare</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase mb-1.5">From Version</p>
                    <Select value={fromVersionId ?? undefined} onValueChange={setFromVersionId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select baseline" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTrack.versions.map((version, index) => (
                          <SelectItem key={version.id} value={version.id}>
                            v{version.version_number ?? index + 1} - {formatShortDate(version.created_at)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground/60 uppercase mb-1.5">To Version</p>
                    <Select value={toVersionId ?? undefined} onValueChange={setToVersionId}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTrack.versions.map((version, index) => (
                          <SelectItem key={version.id} value={version.id}>
                            v{version.version_number ?? index + 1} - {formatShortDate(version.created_at)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  {metricDeltas.map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-border/35 bg-secondary/35 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-foreground/80 font-medium">{metric.label}</p>
                        <span className={`text-[11px] font-mono font-semibold ${metric.delta >= 0 ? 'text-score-excellent' : 'text-score-poor'}`}>
                          {metric.delta >= 0 ? '+' : ''}{metric.delta}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/55 mt-1">
                        {metric.from} → {metric.to}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60">Version Snapshots</p>
                {selectedTrack && (
                  <p className="text-[10px] text-muted-foreground/50">
                    Showing {selectedTrack.versions.length} version{selectedTrack.versions.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {(selectedTrack?.versions ?? analyses)
                    .slice()
                    .reverse()
                    .map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.04 }}
                        className="premium-card rounded-2xl p-5 flex items-center gap-5 group"
                      >
                        <div className="shrink-0">
                          <ScoreRing score={a.overall_score} size={56} label="" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary/80">
                              v{a.version_number}
                            </span>
                            {a.role && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/70 text-muted-foreground">
                                {a.role} / {a.seniority ?? 'Any'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-foreground/80 font-medium truncate">
                            {a.job_description.slice(0, 100)}...
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 font-mono mt-1">
                            {formatDate(a.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            to={`/?view=${a.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium hover:bg-primary/20 transition-colors"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-score-poor hover:bg-score-poor/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
