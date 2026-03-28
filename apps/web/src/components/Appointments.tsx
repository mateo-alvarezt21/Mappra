import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, UserRound, Stethoscope, X, Pencil, Check, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo } from "react";
import { useLayoutContext } from "../App";
import { Appointment } from "../types";
import { apiFetch } from "../lib/api";

function getWeekDays(referenceDate: Date) {
  const day = referenceDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + diffToMonday);
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const today = new Date().toISOString().split('T')[0];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    days.push({ name: dayNames[i], date: iso, dayNum: d.getDate(), isToday: iso === today });
  }
  return { days, monday };
}

function getCalendarDays(year: number, month: number, appointments: Appointment[]) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: { day: number | null; date: string | null; isToday: boolean; count: number }[] = [];
  for (let i = 0; i < offset; i++) cells.push({ day: null, date: null, isToday: false, count: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ day: d, date: dateStr, isToday: dateStr === today, count: appointments.filter(a => a.date === dateStr).length });
  }
  return cells;
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const STATUSES = ['Pendiente', 'Confirmada', 'En consulta', 'Atendida', 'Cancelada'] as const;

const STATUS_STYLES: Record<string, string> = {
  'Confirmada':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En consulta': 'bg-blue-50 text-blue-700 border-blue-200',
  'Atendida':    'bg-[var(--teal-soft)] text-[var(--teal)] border-[var(--teal)]/20',
  'Pendiente':   'bg-amber-50 text-amber-700 border-amber-200',
  'Cancelada':   'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_BTN: Record<string, string> = {
  'Pendiente':   'border-amber-300 text-amber-700 hover:bg-amber-50',
  'Confirmada':  'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
  'En consulta': 'border-blue-300 text-blue-700 hover:bg-blue-50',
  'Atendida':    'border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal-soft)]',
  'Cancelada':   'border-rose-300 text-rose-700 hover:bg-rose-50',
};

const CARD_COLORS: Record<string, string> = {
  teal:   'bg-teal-50 border-teal-400 text-teal-700',
  purple: 'bg-purple-50 border-purple-400 text-purple-700',
  blue:   'bg-blue-50 border-blue-400 text-blue-700',
  amber:  'bg-amber-50 border-amber-400 text-amber-700',
  green:  'bg-emerald-50 border-emerald-400 text-emerald-700',
  red:    'bg-rose-50 border-rose-400 text-rose-700',
};

function sortByTime(a: Appointment, b: Appointment) {
  const toMins = (t: string, ap: string) => {
    const [h, m] = t.split(':').map(Number);
    return (ap === 'PM' && h !== 12 ? h + 12 : h) * 60 + (m || 0);
  };
  return toMins(a.time, a.ampm) - toMins(b.time, b.ampm);
}

// ── Detail / Edit modal ───────────────────────────────────────────────────────
function AppointmentModal({
  appt,
  onClose,
  onSaved,
}: {
  appt: Appointment;
  onClose: () => void;
  onSaved: (updated: Appointment) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState(appt.status);
  const [notes, setNotes] = useState((appt as any).notes ?? '');
  const [channel, setChannel] = useState((appt as any).channel ?? '');
  const [saving, setSaving] = useState(false);

  const dateLabel = appt.date
    ? new Date(appt.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch<Appointment>(`/appointments/${appt.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes: notes || undefined, channel: channel || undefined }),
      });
      onSaved(updated);
      setEditMode(false);
    } catch {
      // keep modal open on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[var(--navy)]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--navy)]">Detalle de cita</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className={cn(
                "p-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5",
                editMode
                  ? "bg-[var(--teal)] text-white"
                  : "hover:bg-[var(--bg)] text-[var(--text-muted)]"
              )}
            >
              <Pencil className="w-3.5 h-3.5" />
              {editMode ? 'Editando' : 'Editar'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-[var(--bg)] rounded-xl transition-all text-[var(--text-subtle)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Patient & appointment info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--teal)]/10 flex items-center justify-center shrink-0">
              <UserRound className="w-6 h-6 text-[var(--teal)]" />
            </div>
            <div>
              <p className="font-display font-bold text-[var(--navy)] text-base leading-tight">{appt.patientName}</p>
              {appt.specialty && (
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <Stethoscope className="w-3 h-3" /> {appt.specialty}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-[var(--bg)]">
              <p className="text-[9px] font-bold text-[var(--text-subtle)] uppercase tracking-widest mb-1">Hora</p>
              <p className="text-sm font-bold text-[var(--navy)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--teal)]" />
                {appt.time} {appt.ampm}
              </p>
            </div>
            <div className="rounded-xl p-3 bg-[var(--bg)]">
              <p className="text-[9px] font-bold text-[var(--text-subtle)] uppercase tracking-widest mb-1">Médico</p>
              <p className="text-sm font-bold text-[var(--navy)] truncate">{appt.doctor || '—'}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Estado</p>
            {editMode ? (
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all",
                      status === s
                        ? "bg-[var(--teal)] border-[var(--teal)] text-white"
                        : `border-2 ${STATUS_BTN[s]}`
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", STATUS_STYLES[status] ?? STATUS_STYLES['Confirmada'])}>
                {status}
              </span>
            )}
          </div>

          {/* Channel */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
              Canal de contacto
            </p>
            {editMode ? (
              <div className="flex gap-2">
                {(['WhatsApp', 'Email', 'SMS', 'Teléfono'] as const).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                      channel === ch
                        ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--teal)]/40"
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-[var(--navy)] flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[var(--teal)]" />
                {channel || '—'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Notas</p>
            {editMode ? (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Agregar observaciones..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border border-[var(--border)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 transition-all resize-none"
              />
            ) : (
              <p className="text-sm text-[var(--text-muted)]">{notes || <span className="italic opacity-50">Sin notas</span>}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        {editMode && (
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => { setEditMode(false); setStatus(appt.status); setNotes((appt as any).notes ?? ''); }}
              className="flex-1 py-3 rounded-2xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 btn-primary justify-center py-3"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Appointments() {
  const { appointments, onStatusCycle } = useLayoutContext();
  const todayStr = new Date().toISOString().split('T')[0];

  const [weekRef, setWeekRef]         = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calMonth, setCalMonth]       = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });
  const [detailAppt, setDetailAppt]   = useState<Appointment | null>(null);
  const [localAppts, setLocalAppts]   = useState<Appointment[] | null>(null);

  // Merge server appointments with local overrides from saves
  const allAppts = localAppts ?? appointments;

  const { days: weekDays, monday } = useMemo(() => getWeekDays(weekRef), [weekRef]);
  const calDays = useMemo(() => getCalendarDays(calMonth.year, calMonth.month, allAppts), [calMonth, allAppts]);

  const weekLabel = useMemo(() => {
    const last = new Date(monday);
    last.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    return `${fmt(monday)} – ${fmt(last)} ${last.getFullYear()}`;
  }, [monday]);

  const selectedDayAppts = useMemo(
    () => allAppts.filter(a => a.date === selectedDate).sort(sortByTime),
    [allAppts, selectedDate]
  );

  const selectedDayLabel = useMemo(() =>
    selectedDate
      ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
      : '',
    [selectedDate]
  );

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setWeekRef(new Date(date + 'T12:00:00'));
  };

  const shiftWeek = (dir: number) => {
    setWeekRef(prev => { const d = new Date(prev); d.setDate(d.getDate() + dir * 7); return d; });
  };

  const goToday = () => {
    const now = new Date();
    setWeekRef(now);
    setSelectedDate(todayStr);
    setCalMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  const handleSaved = (updated: Appointment) => {
    const base = localAppts ?? appointments;
    setLocalAppts(base.map(a => a.id === updated.id ? updated : a));
    setDetailAppt(updated);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* ── Week view ── */}
      <div className="lg:col-span-3">
        <div className="card">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-sm font-bold text-[var(--navy)]">{weekLabel}</h3>
              <div className="flex items-center gap-0.5 bg-[var(--bg)] p-1 rounded-lg">
                <button onClick={() => shiftWeek(-1)} className="p-1.5 hover:bg-[var(--card-bg)] rounded-md transition-all text-[var(--text-muted)]">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => shiftWeek(1)} className="p-1.5 hover:bg-[var(--card-bg)] rounded-md transition-all text-[var(--text-muted)]">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <button onClick={goToday} className="btn-outline text-xs py-1.5 px-3">Hoy</button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, i) => {
                const dayAppts = allAppts.filter(a => a.date === day.date).sort(sortByTime);
                const isSelected = day.date === selectedDate;
                return (
                  <div key={i} className="space-y-2 min-w-0">
                    <button
                      onClick={() => handleDayClick(day.date)}
                      className={cn(
                        "w-full text-center pb-3 border-b-2 transition-all",
                        isSelected ? "border-[var(--teal)]" : "border-[var(--border)] hover:border-[var(--teal)]/40"
                      )}
                    >
                      <p className={cn("text-[9px] font-bold uppercase tracking-widest mb-1.5", isSelected || day.isToday ? "text-[var(--teal)]" : "text-[var(--text-subtle)]")}>
                        {day.name}
                      </p>
                      <div className={cn(
                        "w-8 h-8 mx-auto rounded-xl flex items-center justify-center font-display text-sm font-extrabold transition-all",
                        day.isToday && isSelected && "bg-[var(--teal)] text-white shadow-md shadow-[var(--teal)]/30",
                        day.isToday && !isSelected && "ring-2 ring-[var(--teal)] text-[var(--teal)]",
                        !day.isToday && isSelected && "bg-[var(--teal-soft)] text-[var(--teal)]",
                        !day.isToday && !isSelected && "text-[var(--text-muted)]",
                      )}>
                        {day.dayNum}
                      </div>
                      {dayAppts.length > 0 && (
                        <p className="text-[9px] font-bold text-[var(--teal)] mt-1">{dayAppts.length}</p>
                      )}
                    </button>

                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                      {dayAppts.map((appt, j) => (
                        <motion.div
                          key={appt.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: j * 0.04 }}
                          onClick={() => { handleDayClick(day.date); setDetailAppt(appt); }}
                          className={cn(
                            "p-2 rounded-lg border-l-[3px] text-[10px] font-bold cursor-pointer transition-all hover:brightness-95",
                            CARD_COLORS[appt.color ?? 'teal'] ?? CARD_COLORS.teal,
                          )}
                        >
                          <p className="opacity-60 mb-0.5 font-medium">{appt.time} {appt.ampm}</p>
                          <p className="truncate leading-tight">{appt.patientName}</p>
                          <span className={cn("inline-block mt-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold", STATUS_STYLES[appt.status] ?? STATUS_STYLES['Confirmada'])}>
                            {appt.status}
                          </span>
                        </motion.div>
                      ))}
                      {dayAppts.length === 0 && (
                        <p className="text-[9px] text-center text-[var(--text-subtle)] pt-4 opacity-40">—</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div className="space-y-5">
        {/* Mini calendar */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[var(--navy)]">{MONTH_NAMES[calMonth.month]} {calMonth.year}</span>
            <div className="flex gap-0.5">
              <button onClick={() => setCalMonth(p => ({ month: p.month === 0 ? 11 : p.month - 1, year: p.month === 0 ? p.year - 1 : p.year }))}
                className="p-1 hover:bg-[var(--bg)] rounded-lg transition-all text-[var(--text-muted)]">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button onClick={() => setCalMonth(p => ({ month: p.month === 11 ? 0 : p.month + 1, year: p.month === 11 ? p.year + 1 : p.year }))}
                className="p-1 hover:bg-[var(--bg)] rounded-lg transition-all text-[var(--text-muted)]">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
            {['L','M','X','J','V','S','D'].map(d => (
              <div key={d} className="text-[9px] font-bold text-[var(--text-subtle)] py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((cell, i) => {
              const isSelected = cell.date === selectedDate;
              return (
                <button key={i} disabled={!cell.day}
                  onClick={() => cell.date && handleDayClick(cell.date)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-lg text-[10px] font-semibold transition-all relative",
                    !cell.day && "pointer-events-none",
                    cell.day && !isSelected && !cell.isToday && "text-[var(--navy)] hover:bg-[var(--teal-soft)] hover:text-[var(--teal)] cursor-pointer",
                    cell.isToday && !isSelected && "ring-2 ring-[var(--teal)]/50 text-[var(--teal)] font-bold",
                    isSelected && "bg-[var(--teal)] text-white font-bold shadow-md shadow-[var(--teal)]/25",
                  )}
                >
                  {cell.day ?? ''}
                  {cell.count > 0 && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-[var(--teal)] absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        <div className="card">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest capitalize">{selectedDayLabel}</p>
            <p className="text-xl font-display font-extrabold text-[var(--navy)] mt-0.5">
              {selectedDayAppts.length}
              <span className="text-xs font-bold text-[var(--text-muted)] ml-1.5 normal-case font-sans">
                {selectedDayAppts.length === 1 ? 'cita' : 'citas'}
              </span>
            </p>
          </div>
          <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedDayAppts.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center">
                  <CalendarIcon className="w-7 h-7 text-[var(--text-subtle)] mx-auto mb-2 opacity-40" />
                  <p className="text-xs text-[var(--text-subtle)]">Sin citas este día</p>
                </motion.div>
              ) : (
                <motion.div key={selectedDate} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {selectedDayAppts.map((appt, i) => (
                    <motion.div
                      key={appt.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setDetailAppt(appt)}
                      className="p-3 rounded-xl border border-[var(--border)] hover:border-[var(--teal)]/40 hover:bg-[var(--teal-soft)] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px] font-bold">{appt.time} {appt.ampm}</span>
                        </div>
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", STATUS_STYLES[appt.status] ?? STATUS_STYLES['Confirmada'])}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[var(--teal)]/10 flex items-center justify-center shrink-0">
                          <UserRound className="w-3.5 h-3.5 text-[var(--teal)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--navy)] group-hover:text-[var(--teal)] transition-colors truncate">{appt.patientName}</p>
                          {appt.specialty && (
                            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                              <Stethoscope className="w-2.5 h-2.5" />{appt.specialty}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Detail modal ── */}
      <AnimatePresence>
        {detailAppt && (
          <AppointmentModal
            appt={detailAppt}
            onClose={() => setDetailAppt(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
