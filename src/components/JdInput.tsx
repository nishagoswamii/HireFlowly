import { Briefcase } from 'lucide-react';

interface JdInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JdInput({ value, onChange }: JdInputProps) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
          <Briefcase className="w-3 h-3 text-primary" />
        </div>
        <span className="section-label">Job Description</span>
        {wordCount > 0 && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
            {wordCount} words
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium w-full flex-1 min-h-[220px]"
        placeholder="Paste the target job description here..."
      />
    </div>
  );
}
