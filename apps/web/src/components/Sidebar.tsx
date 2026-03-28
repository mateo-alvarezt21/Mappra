import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, ShieldCheck, MessageSquare, BarChart3, UserRound, Settings, LogOut, ShieldCheck as Logo } from "lucide-react";
import { cn } from "../lib/utils";

const navItems = [
  { path: '/',             label: 'Resumen General',      icon: LayoutDashboard },
  { path: '/appointments', label: 'Agenda de Citas',       icon: Calendar },
  { path: '/validation',   label: 'Validación Afiliación', icon: ShieldCheck },
  { path: '/channels',     label: 'Canales Digitales',     icon: MessageSquare },
  { path: '/doctors',      label: 'Médicos',               icon: UserRound },
  { path: '/analytics',    label: 'Analíticas',            icon: BarChart3 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('mappra_token');
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen fixed left-0 top-0 flex flex-col z-50" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Brand */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#00C2CB] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#00C2CB]/20">
            <Logo className="w-5 h-5 text-[#0B2040]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-extrabold text-white tracking-tight">Mappra</h1>
            <p className="text-[9px] text-white/30 font-bold tracking-[0.15em] uppercase">HealthTech IPS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold tracking-widest uppercase text-white/20 px-3 pb-2">Principal</p>
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm",
                active ? "bg-[#00C2CB]/15 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-[#00C2CB]" : "text-white/30")} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}

        <div className="pt-6">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/20 px-3 pb-2">Sistema</p>
          <button
            onClick={() => navigate('/settings')}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm",
              location.pathname === '/settings' ? "bg-[#00C2CB]/15 text-white" : "text-white/50 hover:bg-white/5 hover:text-white"
            )}
          >
            <Settings className={cn("w-4 h-4 shrink-0", location.pathname === '/settings' ? "text-[#00C2CB]" : "text-white/30")} />
            <span>Configuración</span>
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[#00C2CB] flex items-center justify-center text-[11px] font-bold text-[#0B2040] shrink-0">
            MC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">María Cadena</p>
            <p className="text-[10px] text-white/40 truncate">Admin IPS</p>
          </div>
          <button onClick={handleLogout} className="text-white/30 hover:text-white transition-colors" title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
