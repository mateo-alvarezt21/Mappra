import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

interface ChannelItem { channel: string; count: number; percentage: number; }
interface DayItem { date: string; count: number; }

export default function Analytics() {
  const [summary, setSummary] = useState<any>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [daily, setDaily] = useState<DayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<any>('/analytics/summary'),
      apiFetch<ChannelItem[]>('/analytics/channel-distribution'),
      apiFetch<DayItem[]>('/analytics/daily-volume?days=30'),
    ]).then(([s, ch, d]) => {
      setSummary(s);
      setChannels(ch);
      setDaily(d);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const channelColors: Record<string, string> = {
    'WhatsApp': 'bg-emerald-500',
    'Portal Web': 'bg-blue-500',
    'Teléfono': 'bg-amber-500',
    'Presencial': 'bg-purple-500',
    'Email': 'bg-rose-500',
  };

  const digitalPct = channels.length > 0
    ? channels.filter(c => ['WhatsApp', 'Portal Web', 'Email'].includes(c.channel))
              .reduce((s, c) => s + c.percentage, 0)
    : null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Citas hoy', value: loading ? '—' : String(summary?.todayAppointments ?? 0), color: 'teal' },
          { label: 'Pacientes totales', value: loading ? '—' : String(summary?.totalPatients ?? 0), color: 'green' },
          { label: 'Validaciones activas', value: loading ? '—' : String(summary?.activeValidations ?? 0), color: 'purple' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="card p-8"
          >
            <h3 className="font-display text-base font-bold text-[var(--navy)] mb-6">{stat.label}</h3>
            <span className={cn("font-display text-5xl font-extrabold leading-none", `text-[var(--${stat.color})]`)}>
              {stat.value}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="card p-8">
        <h3 className="font-display text-lg font-bold text-[var(--navy)] mb-8">Canal de agendamiento</h3>
        {channels.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 w-full space-y-6">
              {channels.map((ch) => (
                <div key={ch.channel} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-[var(--navy)]">{ch.channel}</span>
                    <span className="text-[var(--text-muted)]">{ch.percentage}%</span>
                  </div>
                  <div className="h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ch.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", channelColors[ch.channel] ?? 'bg-[var(--teal)]')}
                    />
                  </div>
                </div>
              ))}
            </div>

            {digitalPct !== null && (
              <div className="p-10 bg-[var(--bg)] rounded-3xl border border-[var(--border)] text-center min-w-[240px]">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Digitalización</p>
                <p className="font-display text-7xl font-extrabold text-[var(--teal)] leading-none mb-4">{digitalPct}%</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold">
                  <TrendingUp className="w-4 h-4" />
                  Canales digitales
                </div>
              </div>
            )}
          </div>
        ) : loading ? (
          <p className="text-sm text-[var(--text-subtle)] text-center py-12">Cargando…</p>
        ) : (
          <p className="text-sm text-[var(--text-subtle)] text-center py-12">Sin datos de canales aún</p>
        )}
      </div>

      {daily.length > 0 && (
        <div className="card p-8">
          <h3 className="font-display text-lg font-bold text-[var(--navy)] mb-8">Volumen últimos 30 días</h3>
          <div className="flex items-end gap-1 h-28">
            {daily.map((d, i) => {
              const max = Math.max(...daily.map(x => x.count), 1);
              const h = Math.max((d.count / max) * 100, 4);
              return (
                <motion.div
                  key={d.date}
                  title={`${d.date}: ${d.count} citas`}
                  className="flex-1 bg-[var(--teal)] rounded-t-sm opacity-70 hover:opacity-100 transition-opacity cursor-default"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.02, duration: 0.4 }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
