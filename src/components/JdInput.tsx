interface JdInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JdInput({ value, onChange }: JdInputProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Job Description
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-48 bg-secondary border border-border rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
        placeholder="Paste the target job description here..."
      />
    </div>
  );
}
