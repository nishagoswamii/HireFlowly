import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Clock, Trash2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ScoreRing } from '@/components/ScoreRing';

interface AnalysisRow {
  id: string;
  resume_text: string;
  job_description: string;
  result: any;
  overall_score: number;
  created_at: string;
}

export default function History() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAnalyses();
  }, [user]);

  const fetchAnalyses = async () => {
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
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('analyses').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    }
  };

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
        {loading ? (
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
          <div className="space-y-4">
            <AnimatePresence>
              {analyses.map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="premium-card rounded-2xl p-5 flex items-center gap-5 group"
                >
                  <div className="shrink-0">
                    <ScoreRing score={a.overall_score} size={56} strokeWidth={4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80 font-medium truncate">
                      {a.job_description.slice(0, 100)}...
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 font-mono mt-1">
                      {new Date(a.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
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
        )}
      </main>
    </div>
  );
}
