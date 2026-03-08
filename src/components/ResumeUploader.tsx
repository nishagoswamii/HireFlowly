import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
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
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleClear = () => {
    setFileName(null);
    setError(null);
    onTextExtracted('');
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Resume
      </label>

      <AnimatePresence mode="wait">
        {!extractedText ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-all duration-200
                ${isDragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                }
                ${isProcessing ? 'pointer-events-none opacity-60' : ''}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-foreground">
                    {isProcessing ? 'Processing...' : 'Drop resume PDF here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF or TXT • Max 10MB
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive mt-2">{error}</p>
            )}

            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">Or paste resume text:</p>
              <textarea
                className="w-full h-32 bg-secondary border border-border rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Paste resume text here..."
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-panel rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono text-foreground">{fileName}</span>
              </div>
              <button onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">
                {extractedText.slice(0, 800)}
                {extractedText.length > 800 && '...'}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
