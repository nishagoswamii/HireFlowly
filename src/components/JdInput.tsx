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
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/12">
          <Briefcase className="w-3 h-3 text-primary" />
        </div>
        <span className="section-label">Job Description</span>
        {wordCount > 0 && (
          <span className="ml-auto text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground/65">
            {wordCount} words
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-premium w-full min-h-[220px] flex-1"
        placeholder="Paste the target job description here. Include requirements, scope, and tech stack for sharper analysis."
      />
    </div>
  );
}
