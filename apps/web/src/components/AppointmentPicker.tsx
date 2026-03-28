import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

interface Schedule { day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number; }
interface Slot { time: string; available: boolean; }

interface AppointmentPickerProps {
  doctorId: string;
  selectedDate: string;
  selectedTime: string;
  onSelect: (date: string, time: string) => void;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function to12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function AppointmentPicker({ doctorId, selectedDate, selectedTime, onSelect }: AppointmentPickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [schedulesLoading, setSchedulesLoading] = useState(true);

  // Working days set (0-6)
  const workingDays = new Set(schedules.map(s => s.day_of_week));

  // Fetch doctor schedules when doctor changes
  useEffect(() => {
    if (!doctorId) { setSchedules([]); setSchedulesLoading(false); return; }
    setSchedulesLoading(true);
    apiFetch<Schedule[]>(`/doctors/${doctorId}/schedules`)
      .then(setSchedules)
      .catch(() => setSchedules([]))
      .finally(() => setSchedulesLoading(false));
  }, [doctorId]);

  // Fetch slots when date changes
  const fetchSlots = useCallback((date: string) => {
    if (!doctorId || !date) return;
    setSlotsLoading(true);
    apiFetch<Slot[]>(`/doctors/${doctorId}/slots?date=${date}`)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) fetchSlots(selectedDate);
    else setSlots([]);
  }, [selectedDate, fetchSlots]);

  // Calendar helpers
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon-start offset

  const isDisabled = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr < todayStr) return true;
    const dow = new Date(`${dateStr}T12:00:00`).getDay();
    return !workingDays.has(dow);
  };

  const handleDayClick = (day: number) => {
    if (isDisabled(day)) return;
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(dateStr, ''); // clear time when date changes
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  if (!doctorId) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--text-subtle)] text-sm">
        Selecciona un médico para ver disponibilidad
      </div>
    );
  }

  if (schedulesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-[var(--teal)] animate-spin" />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[var(--text-subtle)] text-sm text-center">
        Este médico no tiene horarios definidos aún.<br />
        <span className="text-xs">Configúralos en la sección Médicos.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ── Calendar ── */}
      <div className="flex-1 min-w-0">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg)] transition-all text-[var(--text-muted)]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[var(--navy)]">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg)] transition-all text-[var(--text-muted)]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {['L','M','X','J','V','S','D'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-[var(--text-subtle)] py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const disabled = isDisabled(day);
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={day}
                disabled={disabled}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all",
                  disabled && "text-[var(--text-subtle)] opacity-30 cursor-not-allowed",
                  !disabled && !isSelected && "text-[var(--navy)] hover:bg-[var(--teal-soft)] hover:text-[var(--teal)] cursor-pointer",
                  !disabled && isToday && !isSelected && "ring-2 ring-[var(--teal)]/40",
                  isSelected && "bg-[var(--teal)] text-white shadow-lg shadow-[var(--teal)]/25 font-bold",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Working days legend */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {schedules.map(s => (
            <span key={s.day_of_week} className="px-2 py-0.5 bg-[var(--teal-soft)] text-[var(--teal)] rounded-full text-[10px] font-bold">
              {DAY_NAMES[s.day_of_week]} {to12h(s.start_time)}–{to12h(s.end_time)}
            </span>
          ))}
        </div>
      </div>

      {/* ── Time slots ── */}
      <div className="w-full lg:w-56 shrink-0 flex flex-col">
        <AnimatePresence mode="wait">
          {!selectedDate ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full py-8 text-center">
              <p className="text-xs text-[var(--text-subtle)]">← Selecciona<br />una fecha</p>
            </motion.div>
          ) : slotsLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[var(--teal)] animate-spin" />
            </motion.div>
          ) : slots.length === 0 ? (
            <motion.div key="noSlots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-8 text-center">
              <p className="text-xs text-[var(--text-subtle)]">Sin slots para<br />esta fecha</p>
            </motion.div>
          ) : (
            <motion.div key={selectedDate} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col min-h-0">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3 shrink-0">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <div className="overflow-y-auto max-h-64 pr-1 grid grid-cols-2 gap-1.5 content-start">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => slot.available && onSelect(selectedDate, slot.time)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold transition-all border-2",
                      !slot.available && "border-[var(--border)] text-[var(--text-subtle)] opacity-40 cursor-not-allowed line-through",
                      slot.available && selectedTime !== slot.time && "border-[var(--teal)]/40 text-[var(--teal)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]",
                      slot.available && selectedTime === slot.time && "border-[var(--teal)] bg-[var(--teal)] text-white shadow-md shadow-[var(--teal)]/25",
                    )}
                  >
                    {to12h(slot.time)}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
