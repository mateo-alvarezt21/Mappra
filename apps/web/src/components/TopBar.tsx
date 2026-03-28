import { Bell, Search, Plus } from "lucide-react";
import { useLocation } from "react-router-dom";

const TITLES: Record<string, string> = {
  '/':             'Resumen General',
  '/appointments': 'Agenda de Citas',
  '/validation':   'Validación de Afiliación',
  '/channels':     'Canales Digitales',
  '/doctors':      'Médicos',
  '/analytics':    'Analíticas',
  '/settings':     'Configuración',
};

interface TopBarProps {
  onNewAppointment: () => void;
}

export default function TopBar({ onNewAppointment }: TopBarProps) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Mappra';

  return (
    <header
      className="h-16 border-b border-[var(--border)] px-8 flex items-center justify-between sticky top-0 z-40"
      style={{ background: 'var(--card-bg)', backdropFilter: 'blur(16px)' }}
    >
      <div className="flex items-center gap-6">
        <h2 className="font-display text-lg font-bold text-[var(--navy)]">{title}</h2>
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]" />
          <input
            type="text"
            placeholder="Buscar paciente, cita..."
            className="pl-10 pr-4 py-2 bg-[var(--bg)] border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-[var(--teal)]/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-xl border-2 border-[var(--border)] flex items-center justify-center relative hover:border-[var(--teal)] transition-all group">
          <Bell className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--teal)] transition-colors" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[var(--red)] rounded-full" />
        </button>
        <button onClick={onNewAppointment} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva Cita</span>
        </button>
      </div>
    </header>
  );
}
