import { useRef, useState, type MouseEvent } from 'react';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { Zap, Terminal, Sparkles, ArrowDown, ArrowRight, Clock, LogOut, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';
import { ResumeUploader } from '@/components/ResumeUploader';
import { JdInput } from '@/components/JdInput';
import { ScoreSidebar } from '@/components/ScoreSidebar';
import { AnalysisResults } from '@/components/AnalysisResults';
import { RoleSenioritySelector } from '@/components/RoleSenioritySelector';
import { BorderTrail } from '@/components/motion-primitives/border-trail';
import { analyzeResumeEnhanced, type EnhancedAnalysisResult } from '@/lib/analysis-api';
import { saveAnalysis } from '@/lib/save-analysis';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Role, Seniority } from '@/lib/enhanced-analysis';

interface SpotlightFeatureCardProps {
  label: string;
  description: string;
}

function SpotlightFeatureCard({ label, description }: SpotlightFeatureCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(180px circle at ${mouseX}px ${mouseY}px, hsl(var(--primary) / 0.24), transparent 72%)`;

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      className="group relative premium-card rounded-2xl px-4 py-3"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <div className="relative z-10">
        <p className="section-label mb-1">{label}</p>
        <p className="text-[13px] text-foreground/80">{description}</p>
      </div>
    </motion.div>
  );
}

const Index = () => {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [role, setRole] = useState<Role | undefined>(undefined);
  const [seniority, setSeniority] = useState<Seniority | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EnhancedAnalysisResult | null>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const uploadZoneRef = useRef<HTMLDivElement | null>(null);

  const scrollToUploadZone = () => {
    uploadZoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
      const data = await analyzeResumeEnhanced({
        resumeText,
        jobDescription: jdText,
        role,
        seniority,
      });
      setResult(data);
      await saveAnalysis(resumeText, jdText, data, { role, seniority });
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

  const canAnalyze = Boolean(resumeText.trim() && jdText.trim());

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background noise-texture">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="pointer-events-none fixed -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[110px]" />
      <div className="pointer-events-none fixed right-[-8rem] top-20 h-[18rem] w-[18rem] rounded-full bg-chart-3/20 blur-[90px]" />

      <header className="relative z-10 border-b border-border/50 bg-background/75 backdrop-blur-lg">
        <div className="container mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/12 shadow-[0_18px_35px_-22px_hsl(var(--primary)/0.95)]">
                <Terminal className="h-5 w-5 text-primary" />
              </div>
              <div className="absolute -inset-2 -z-10 rounded-2xl bg-primary/20 blur-lg" />
            </motion.div>
            <div>
              <h1 className="text-[1.65rem] leading-none font-display font-semibold text-foreground">
                Hire<span className="text-gradient">Flowly</span>
              </h1>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground/80">
                Resume Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {user && (
              <Link
                to="/history"
                className="ui-outline-button inline-flex items-center gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                History
              </Link>
            )}
            {user ? (
              <button
                onClick={signOut}
                className="ui-outline-button inline-flex items-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            ) : (
              <Link
                to="/auth"
                className="ui-outline-button inline-flex items-center gap-1.5 border-primary/40 text-primary"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {!result && !isAnalyzing && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 container mx-auto max-w-7xl px-6 pb-9 pt-14 text-center sm:pt-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto max-w-3xl"
            >
              <div className="ui-chip mb-7">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/90">
                  Signal-first Resume AI
                </span>
              </div>
              <h2 className="font-display text-[2.45rem] font-semibold leading-[1.02] tracking-[0.01em] text-foreground sm:text-[3.65rem]">
                Resume intelligence that cuts through the noise.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                HireFlowly blends semantic matching, quantified impact scoring, and authenticity checks to show exactly how your profile lands with recruiters.
              </p>

              <div className="mt-7 flex justify-center">
                <div className="relative w-full max-w-xs rounded-2xl sm:w-auto">
                  <BorderTrail
                    size={96}
                    className="bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--chart-3)),hsl(var(--gradient-mesh-2)))] opacity-85 blur-[1px]"
                    transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <button
                    onClick={scrollToUploadZone}
                    className="ui-primary-button group relative inline-flex w-full items-center justify-center gap-2.5 sm:w-auto"
                  >
                    Start Live Analysis
                    <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                  </button>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                <SpotlightFeatureCard
                  label="Context Graph"
                  description="Deep JD-context evaluation"
                />
                <SpotlightFeatureCard
                  label="Impact Engine"
                  description="XYZ impact diagnostics"
                />
                <SpotlightFeatureCard
                  label="Authenticity Radar"
                  description="Buzzword and signal checks"
                />
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <main className="relative z-10 container mx-auto max-w-7xl px-6 pb-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {resumeText.trim() && jdText.trim() && (
              <RoleSenioritySelector
                role={role}
                seniority={seniority}
                onRoleChange={setRole}
                onSeniorityChange={setSeniority}
              />
            )}

            <motion.div
              ref={uploadZoneRef}
              id="upload-zone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 gap-5 md:grid-cols-2"
            >
              <div className="premium-card rounded-3xl p-5 sm:p-6">
                <ResumeUploader onTextExtracted={setResumeText} extractedText={resumeText} />
              </div>
              <div className="premium-card rounded-3xl p-5 sm:p-6">
                <JdInput value={jdText} onChange={setJdText} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !canAnalyze}
                className={`group relative w-full overflow-hidden rounded-3xl py-4 text-sm font-semibold tracking-[0.08em] uppercase transition-all duration-500 ${
                  canAnalyze && !isAnalyzing
                    ? 'ui-primary-button'
                    : 'cursor-not-allowed rounded-3xl border border-border/70 bg-secondary/60 text-muted-foreground'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isAnalyzing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Zap className="h-4 w-4" />
                      </motion.div>
                      Running Analysis
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Run Full Analysis
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
                {canAnalyze && !isAnalyzing && (
                  <div className="absolute inset-0 translate-x-[-200%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]" />
                )}
              </button>
            </motion.div>

            <AnimatePresence>
              {result && <AnalysisResults result={result} />}
            </AnimatePresence>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <ScoreSidebar result={result} isAnalyzing={isAnalyzing} />
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/40 bg-background/60">
        <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 sm:flex-row">
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/60">
            Developed by{' '}
            <Link to="/about" className="text-primary/75 transition-colors hover:text-primary">
              Nisha Goswami
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
