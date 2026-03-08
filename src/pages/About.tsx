import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Terminal, ArrowLeft, Github, Linkedin, Globe, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const developer = {
  name: 'Nisha Goswami',
  bio: "I'm a engineer who writes!",
  links: [
    { label: 'GitHub', url: 'https://github.com/nishagoswamii', icon: Github },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/nishagoswamii', icon: Linkedin },
    { label: 'Portfolio', url: 'https://nishagoswami.com', icon: Globe },
  ],
};

export default function About() {
  return (
    <div className="min-h-screen bg-background noise-texture">
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      <header className="relative z-10 border-b border-border/50">
        <div className="container max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground tracking-tight">
                Hire<span className="text-gradient">Flowly</span>
              </h1>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.25em]">
                About the Developer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/60 border border-border/40 text-xs font-display font-medium text-foreground/70 hover:text-foreground hover:border-primary/20 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 container max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-display font-bold text-gradient">
              {developer.name.charAt(0)}
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-3">
            {developer.name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {developer.bio}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          {developer.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-card rounded-2xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                <link.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-semibold text-foreground/90">{link.label}</p>
                <p className="text-[11px] text-muted-foreground/50 font-mono truncate">{link.url}</p>
              </div>
              <ArrowLeft className="w-4 h-4 text-muted-foreground/30 rotate-180 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </a>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-[10px] font-mono text-muted-foreground/40">
            Built with ❤️ using HireFlowly
          </p>
        </motion.div>
      </main>
    </div>
  );
}
