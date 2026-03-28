import { motion } from 'motion/react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

const themeOptions: { value: Theme; label: string; desc: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', desc: 'Fondo azul claro, ideal para uso diurno', icon: Sun },
  { value: 'dark', label: 'Oscuro', desc: 'Fondo oscuro, reduce la fatiga visual nocturna', icon: Moon },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-[var(--teal)]/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-[var(--teal)]" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[var(--navy)]">Apariencia</h3>
            <p className="text-xs text-[var(--text-muted)]">Elige cómo se ve la plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'relative p-5 rounded-2xl border-2 text-left transition-all duration-200',
                  active
                    ? 'border-[var(--teal)] bg-[var(--teal)]/5'
                    : 'border-[var(--border)] hover:border-[var(--teal)]/40'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center mb-4',
                  active ? 'bg-[var(--teal)] text-white' : 'bg-[var(--bg)] text-[var(--text-muted)]'
                )}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <p className="text-sm font-bold text-[var(--navy)] mb-1">{opt.label}</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{opt.desc}</p>
                {active && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--teal)]" />
                )}
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-[var(--text-subtle)] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--teal)] inline-block" />
          Tu preferencia se guarda automáticamente en la base de datos
        </p>
      </motion.div>
    </div>
  );
}
