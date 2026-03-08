import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractTextFromPdf } from '@/lib/pdf-parser';

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
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <FileText className="w-3 h-3 text-primary" />
        </div>
        <span className="section-label">Resume</span>
        {extractedText && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-score-excellent">
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
                relative rounded-xl p-6 text-center cursor-pointer flex-1 flex flex-col items-center justify-center
                transition-all duration-300 group
                border border-dashed
                ${isDragActive
                  ? 'border-primary bg-primary/5 shadow-[inset_0_0_30px_hsl(var(--primary)/0.05)]'
                  : 'border-border/60 hover:border-primary/30 hover:bg-primary/[0.02]'
                }
                ${isProcessing ? 'pointer-events-none opacity-60' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-secondary/80 flex items-center justify-center transition-transform group-hover:scale-105">
                    <Upload className="w-4.5 h-4.5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/80">
                    {isProcessing ? 'Processing...' : 'Drop PDF here'}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    PDF or TXT • Max 10MB
                  </p>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-destructive mt-2">{error}</p>}

            <div className="mt-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] text-muted-foreground/40 font-mono">OR PASTE</span>
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
            className="flex-1 rounded-xl bg-secondary/40 border border-border/50 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-mono text-foreground/80 truncate max-w-[160px]">{fileName}</span>
              </div>
              <button
                onClick={handleClear}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
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
