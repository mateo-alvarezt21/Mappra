import { Calendar, ShieldCheck, MessageSquare, Users } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useLayoutContext } from "../App";
import { Appointment } from "../types";

interface Summary {
  todayAppointments: number;
  totalPatients: number;
  activeValidations: number;
}

interface EpsItem { specialty: string; count: number; }

export default function Dashboard() {
  const navigate = useNavigate();
  const { appointments } = useLayoutContext();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bySpecialty, setBySpecialty] = useState<EpsItem[]>([]);
  const [validations, setValidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);

  useEffect(() => {
    Promise.all([
      apiFetch<Summary>('/analytics/summary'),
      apiFetch<EpsItem[]>('/analytics/appointments-by-specialty'),
      apiFetch<any[]>('/validation'),
    ]).then(([s, spec, val]) => {
      setSummary(s);
      setBySpecialty(spec);
      setValidations(val.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Citas hoy', value: loading ? '—' : String(summary?.todayAppointments ?? 0), icon: Calendar, color: 'teal' },
    { label: 'Validaciones activas', value: loading ? '—' : String(summary?.activeValidations ?? 0), icon: ShieldCheck, color: 'green' },
    { label: 'Mensajes', value: '—', icon: MessageSquare, color: 'amber' },
    { label: 'Pacientes activos', value: loading ? '—' : String(summary?.totalPatients ?? 0), icon: Users, color: 'purple' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "card p-6 relative overflow-hidden",
              `before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--${stat.color})] before:rounded-t-3xl`
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", `bg-[var(--${stat.color})]/10 text-[var(--${stat.color})]`)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <h3 className="font-display text-3xl font-extrabold text-[var(--navy)] leading-none mb-1">{stat.value}</h3>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[var(--navy)]">
                Citas de hoy — {new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </h3>
              <button onClick={() => navigate('/appointments')} className="text-xs font-bold text-[var(--teal)] hover:underline">Ver agenda completa</button>
            </div>
            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
              {todayAppointments.length > 0 ? (
                [...todayAppointments].sort((a, b) => {
                  const toMins = (t: string, ap: string) => {
                    const [h, m] = t.split(':').map(Number);
                    return (ap === 'PM' && h !== 12 ? h + 12 : h) * 60 + (m || 0);
                  };
                  return toMins(a.time, a.ampm) - toMins(b.time, b.ampm);
                }).map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--teal-soft)] transition-all cursor-pointer group">
                    <div className="text-center min-w-[60px]">
                      <p className="font-display text-sm font-bold text-[var(--navy)]">{appt.time}</p>
                      <p className="text-[10px] font-bold text-[var(--text-subtle)] uppercase">{appt.ampm}</p>
                    </div>
                    <div className="w-px h-8 bg-[var(--border)]" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-[var(--navy)] group-hover:text-[var(--teal)] transition-colors">{appt.patientName}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">{appt.specialty} · {appt.doctor}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold",
                      appt.status === 'Confirmada' && "bg-emerald-50 text-emerald-600",
                      appt.status === 'En consulta' && "bg-blue-50 text-blue-600",
                      appt.status === 'Pendiente' && "bg-amber-50 text-amber-600",
                      appt.status === 'Cancelada' && "bg-rose-50 text-rose-600",
                    )}>
                      {appt.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-[var(--text-subtle)]">No hay citas programadas para hoy</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card p-6">
            <h3 className="font-display text-base font-bold text-[var(--navy)] mb-6">Citas por especialidad</h3>
            {bySpecialty.length > 0 ? (
              <div className="space-y-5">
                {bySpecialty.map((item, i) => {
                  const total = bySpecialty.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  const colors = ['bg-[var(--teal)]', 'bg-[var(--purple)]', 'bg-[var(--green)]', 'bg-[var(--amber)]', 'bg-[var(--red)]'];
                  return (
                    <div key={item.specialty}>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-[var(--navy)]">{item.specialty}</span>
                        <span className="text-[var(--text-muted)]">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn("h-full rounded-full", colors[i % colors.length])}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-subtle)] text-center py-6">Sin datos aún</p>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-base font-bold text-[var(--navy)]">Validaciones recientes</h3>
              <button className="text-[10px] font-bold text-[var(--teal)] uppercase tracking-wider">Ver todo</button>
            </div>
            {validations.length > 0 ? (
              <div className="space-y-4">
                {validations.map((val, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold bg-[var(--teal)]/10 text-[var(--teal)]">
                      {(val.patients?.full_name ?? val.patientName ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[var(--navy)] truncate">{val.patients?.full_name ?? val.patientName ?? 'Paciente'}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium truncate">{val.eps?.name ?? val.eps ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", val.result_status === 'Activa' ? "bg-emerald-500" : "bg-amber-500")} />
                      <span className={cn("text-[10px] font-bold", val.result_status === 'Activa' ? "text-emerald-600" : "text-amber-600")}>
                        {val.result_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-subtle)] text-center py-6">Sin validaciones recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
