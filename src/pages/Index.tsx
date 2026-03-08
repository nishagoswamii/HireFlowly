import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeUploader } from '@/components/ResumeUploader';
import { JdInput } from '@/components/JdInput';
import { ScoreSidebar } from '@/components/ScoreSidebar';
import { AnalysisResults } from '@/components/AnalysisResults';
import { analyzeResume, type AnalysisResult } from '@/lib/analysis-api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">ResumeRAG</h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Semantic Resume Analyzer
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">v1.0</span>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Left column */}
          <div className="space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResumeUploader onTextExtracted={setResumeText} extractedText={resumeText} />
              <JdInput value={jdText} onChange={setJdText} />
            </div>

            {/* Analyze Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="analyze"
                size="lg"
                className="w-full"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !resumeText.trim() || !jdText.trim()}
              >
                <Zap className="w-4 h-4" />
                {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
              </Button>
            </motion.div>

            {/* Results */}
            {result && <AnalysisResults result={result} />}
          </div>

          {/* Right sidebar */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ScoreSidebar result={result} isAnalyzing={isAnalyzing} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
