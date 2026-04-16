import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractTextFromPdf } from '@/lib/pdf-parser';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

interface ResumeUploaderProps {
  onTextExtracted: (text: string) => void;
  extractedText: string;
}

export function ResumeUploader({ onTextExtracted, extractedText }: ResumeUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setFileName(file.name);
    try {
      if (file.type === 'application/pdf') {
        const text = await extractTextFromPdf(file);
        onTextExtracted(text);
      } else {
        const text = await file.text();
        onTextExtracted(text);
      }
    } catch (err) {
      setError('Failed to parse file. Try pasting text instead.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }, [onTextExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleClear = () => {
    setFileName(null);
    setError(null);
    onTextExtracted('');
  };

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/12">
          <FileText className="w-3 h-3 text-primary" />
        </div>
        <span className="section-label">Resume</span>
        {extractedText && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.12em] text-score-excellent">
            <CheckCircle2 className="w-3 h-3" /> Loaded
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!extractedText ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <div
              {...getRootProps()}
              className={`
                relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl p-6 text-center
                transition-all duration-300 group
                border
                ${isDragActive
                  ? 'border-solid border-primary/95 bg-primary/10 shadow-[inset_0_0_36px_hsl(var(--primary)/0.26),0_0_26px_-10px_hsl(var(--primary)/0.95)]'
                  : 'border-dashed border-border/70 bg-secondary/20 hover:border-primary/35 hover:bg-primary/6'
                }
                ${isProcessing ? 'pointer-events-none opacity-80' : ''}
              `}
            >
              <BorderTrail
                size={84}
                className={`bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--chart-3)),hsl(var(--gradient-mesh-2)))] blur-[1px] transition-opacity duration-300 ${isDragActive || isProcessing ? 'opacity-100' : 'opacity-55'}`}
                transition={{ duration: 5.2, repeat: Infinity, ease: 'linear' }}
              />
              <input {...getInputProps()} />
              {isProcessing ? (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="relative flex h-28 w-20 items-center justify-center overflow-hidden rounded-xl border border-primary/45 bg-secondary/55">
                    <FileText className="h-9 w-9 text-primary/85" />
                    <motion.div
                      className="absolute left-1.5 right-1.5 h-[2px] rounded-full bg-primary shadow-[0_0_16px_hsl(var(--primary)/0.95)]"
                      initial={{ y: -38 }}
                      animate={{ y: 38 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <div>
                    <p className="font-display text-lg leading-none text-foreground/88">
                      Scanning document...
                    </p>
                    <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-primary/80">
                      Parsing resume data stream
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/70 transition-transform group-hover:scale-105">
                      <Upload className="w-4.5 h-4.5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="font-display text-lg leading-none text-foreground/85">
                      Drop PDF here
                    </p>
                    <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground/70">
                      PDF or TXT • Max 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-destructive mt-2">{error}</p>}

            <div className="mt-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] text-muted-foreground/55 font-mono tracking-[0.18em]">OR PASTE</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
              <textarea
                className="input-premium w-full h-24"
                placeholder="Paste resume text..."
                onChange={(e) => {
                  if (e.target.value.trim()) {
                    onTextExtracted(e.target.value);
                    setFileName('pasted-text');
                  }
                }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-1 rounded-2xl border border-border/70 bg-secondary/35 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/12">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-mono text-foreground/80 truncate max-w-[160px]">{fileName}</span>
              </div>
              <button
                onClick={handleClear}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto">
              <pre className="text-[11px] text-muted-foreground/70 font-mono whitespace-pre-wrap leading-relaxed">
                {extractedText.slice(0, 600)}
                {extractedText.length > 600 && <span className="text-primary/40">... ({extractedText.length} chars)</span>}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
