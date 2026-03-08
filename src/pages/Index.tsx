import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Terminal, Sparkles, ArrowRight, Clock, LogOut, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ResumeUploader } from '@/components/ResumeUploader';
import { JdInput } from '@/components/JdInput';
import { ScoreSidebar } from '@/components/ScoreSidebar';
import { AnalysisResults } from '@/components/AnalysisResults';
import { analyzeResume, type AnalysisResult } from '@/lib/analysis-api';
import { saveAnalysis } from '@/lib/save-analysis';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jdText.trim()) {
      toast({
        title: 'Missing input',
        description: 'Please provide both a resume and a job description.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const data = await analyzeResume({ resumeText, jobDescription: jdText });
      setResult(data);
      await saveAnalysis(resumeText, jdText, data);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Analysis failed',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = resumeText.trim() && jdText.trim();

  return (
    <div className="min-h-screen bg-background noise-texture">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -inset-1 rounded-xl bg-primary/10 blur-md -z-10" />
            </motion.div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground tracking-tight">
                Hire<span className="text-gradient">Flowly</span>
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.25em]">
                Semantic Resume Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Link
                to="/history"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-mono text-primary/80 hover:bg-primary/10 transition-colors"
              >
                <Clock className="w-3 h-3" />
                History
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
              <div className="w-1.5 h-1.5 rounded-full bg-score-excellent animate-pulse-glow" />
              <span className="text-[10px] font-mono text-primary/80">AI-Powered</span>
            </div>
            {user ? (
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 border border-border/40 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono text-primary hover:bg-primary/20 transition-colors"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </Link>
            )}
            <span className="text-[10px] font-mono text-muted-foreground/50">v1.0</span>
          </div>
        </div>
      </header>

      {/* Hero section when no result */}
      <AnimatePresence>
        {!result && !isAnalyzing && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 container max-w-7xl mx-auto px-6 pt-16 pb-8 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-medium text-primary/90">Beyond keyword matching</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
                <span className="text-gradient-subtle">Know exactly how</span>
                <br />
                <span className="text-gradient">recruiters see you</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Semantic matching, impact scoring, and authenticity analysis — powered by AI that thinks like a senior recruiter.
              </p>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="relative z-10 container max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Input cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
              <div className="premium-card rounded-2xl p-5">
                <ResumeUploader onTextExtracted={setResumeText} extractedText={resumeText} />
              </div>
              <div className="premium-card rounded-2xl p-5">
                <JdInput value={jdText} onChange={setJdText} />
              </div>
            </motion.div>

            {/* Analyze Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !canAnalyze}
                className={`
                  group relative w-full h-14 rounded-2xl font-display font-semibold text-sm tracking-wide
                  transition-all duration-500 overflow-hidden
                  ${canAnalyze && !isAnalyzing
                    ? 'bg-primary text-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_-5px_hsl(var(--primary)/0.6)] hover:scale-[1.01] active:scale-[0.99]'
                    : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }
                `}
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="w-4 h-4" />
                      </motion.div>
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Run Deep Analysis
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
                {canAnalyze && !isAnalyzing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                )}
              </button>
            </motion.div>

            {/* Results */}
            <AnimatePresence>
              {result && <AnalysisResults result={result} />}
            </AnimatePresence>
          </div>

          {/* Right sidebar */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ScoreSidebar result={result} isAnalyzing={isAnalyzing} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 mt-16">
        <div className="container max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground/40">
            Built with semantic intelligence
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/40">
            <div className="w-1 h-1 rounded-full bg-score-excellent/50" />
            System Online
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
