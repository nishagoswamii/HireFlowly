import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roleOptions, seniorityOptions, type Role, type Seniority } from '@/lib/enhanced-analysis';

interface RoleSenioritySelector {
  role: Role | undefined;
  seniority: Seniority | undefined;
  onRoleChange: (role: Role) => void;
  onSeniorityChange: (seniority: Seniority) => void;
}

export function RoleSenioritySelector({
  role,
  seniority,
  onRoleChange,
  onSeniorityChange,
}: RoleSenioritySelector) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card rounded-2xl p-4 mb-5"
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60 mb-3">
        Tune Analysis (Optional)
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-foreground/70 block mb-1.5">
            Role
          </label>
          <Select value={role} onValueChange={onRoleChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-foreground/70 block mb-1.5">
            Seniority
          </label>
          <Select value={seniority} onValueChange={onSeniorityChange}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select level..." />
            </SelectTrigger>
            <SelectContent>
              {seniorityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
