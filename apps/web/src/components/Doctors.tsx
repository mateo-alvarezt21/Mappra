import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRound, Plus, X, Stethoscope, BadgeCheck, ToggleLeft, ToggleRight, Loader2, AlertCircle, CalendarClock } from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';

interface Specialty { id: string; name: string; color: string; }
interface Doctor {
  id: string;
  name: string;
  license_number?: string;
  available: boolean;
  specialties?: { name: string; color: string };
}

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const SPECIALTY_COLORS: Record<string, string> = {
  teal:   'bg-teal-50 text-teal-700 border-teal-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  rose:   'bg-rose-50 text-rose-700 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  green:  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const defaultDaySchedule = (): DaySchedule => ({
  enabled: false,
  start_time: '08:00',
  end_time: '17:00',
  slot_duration_minutes: 30,
});

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', specialty_id: '', license_number: '' });

  // Schedule editor state
  const [scheduleDoctor, setScheduleDoctor] = useState<Doctor | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleForm, setScheduleForm] = useState<DaySchedule[]>(
    Array.from({ length: 7 }, defaultDaySchedule)
  );

  useEffect(() => {
    Promise.all([
      apiFetch<Doctor[]>('/doctors'),
      apiFetch<Specialty[]>('/doctors/specialties'),
    ]).then(([docs, specs]) => {
      setDoctors(docs);
      setSpecialties(specs);
      if (specs.length > 0) setForm(f => ({ ...f, specialty_id: specs[0].id }));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggleAvailable = async (doctor: Doctor) => {
    const updated = { ...doctor, available: !doctor.available };
    setDoctors(prev => prev.map(d => d.id === doctor.id ? updated : d));
    try {
      await apiFetch(`/doctors/${doctor.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ available: !doctor.available }),
      });
    } catch {
      setDoctors(prev => prev.map(d => d.id === doctor.id ? doctor : d));
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return; }
    if (!form.specialty_id) { setFormError('Selecciona una especialidad'); return; }
    setFormError('');
    setSaving(true);
    try {
      const newDoc = await apiFetch<Doctor>('/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          specialty_id: form.specialty_id,
          license_number: form.license_number.trim() || undefined,
          available: true,
        }),
      });
      setDoctors(prev => [...prev, newDoc]);
      setModalOpen(false);
      setForm({ name: '', specialty_id: specialties[0]?.id ?? '', license_number: '' });
    } catch (e: any) {
      setFormError(e.message ?? 'Error al registrar médico');
    } finally {
      setSaving(false);
    }
  };

  const openScheduleModal = async (doctor: Doctor) => {
    setScheduleDoctor(doctor);
    setScheduleError('');
    const base = Array.from({ length: 7 }, defaultDaySchedule);
    setScheduleForm(base);
    setScheduleLoading(true);
    try {
      const schedules = await apiFetch<any[]>(`/doctors/${doctor.id}/schedules`);
      const updated = [...base];
      for (const s of schedules) {
        updated[s.day_of_week] = {
          enabled: true,
          start_time: s.start_time.slice(0, 5),
          end_time: s.end_time.slice(0, 5),
          slot_duration_minutes: s.slot_duration_minutes,
        };
      }
      setScheduleForm(updated);
    } catch {
      // keep defaults
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleDoctor) return;
    setScheduleSaving(true);
    setScheduleError('');
    try {
      const schedules = scheduleForm
        .map((day, i) => ({ ...day, day_of_week: i }))
        .filter(d => d.enabled)
        .map(({ day_of_week, start_time, end_time, slot_duration_minutes }) => ({
          day_of_week, start_time, end_time, slot_duration_minutes,
        }));

      await apiFetch(`/doctors/${scheduleDoctor.id}/schedules`, {
        method: 'PUT',
        body: JSON.stringify({ schedules }),
      });
      setScheduleDoctor(null);
    } catch (e: any) {
      setScheduleError(e.message ?? 'Error al guardar horario');
    } finally {
      setScheduleSaving(false);
    }
  };

  const updateDaySchedule = (index: number, patch: Partial<DaySchedule>) => {
    setScheduleForm(prev => prev.map((d, i) => i === index ? { ...d, ...patch } : d));
  };

  const filtered = filterSpecialty
    ? doctors.filter(d => d.specialties?.name === filterSpecialty)
    : doctors;

  const available = doctors.filter(d => d.available).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[var(--teal)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total médicos', value: doctors.length, color: 'teal' },
          { label: 'Disponibles', value: available, color: 'green' },
          { label: 'No disponibles', value: doctors.length - available, color: 'amber' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-6"
          >
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">{stat.label}</p>
            <p className={`font-display text-4xl font-extrabold text-[var(--${stat.color})]`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters + actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterSpecialty('')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all",
              filterSpecialty === ''
                ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--teal)]/40"
            )}
          >
            Todos
          </button>
          {specialties.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterSpecialty(s.name)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all",
                filterSpecialty === s.name
                  ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--teal)]/40"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          Nuevo médico
        </button>
      </div>

      {/* Doctors grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((doc, i) => {
            const specColor = SPECIALTY_COLORS[doc.specialties?.color ?? 'teal'];
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--teal)]/10 flex items-center justify-center shrink-0">
                      <UserRound className="w-5 h-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-[var(--navy)] leading-tight">{doc.name}</h4>
                      {doc.license_number && (
                        <p className="text-[10px] text-[var(--text-subtle)] font-medium mt-0.5 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> {doc.license_number}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Availability toggle */}
                  <button
                    onClick={() => handleToggleAvailable(doc)}
                    className="text-[var(--text-subtle)] hover:text-[var(--teal)] transition-colors"
                    title={doc.available ? 'Marcar como no disponible' : 'Marcar como disponible'}
                  >
                    {doc.available
                      ? <ToggleRight className="w-6 h-6 text-[var(--teal)]" />
                      : <ToggleLeft className="w-6 h-6" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {doc.specialties?.name && (
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border", specColor)}>
                      <Stethoscope className="w-3 h-3 inline mr-1" />
                      {doc.specialties.name}
                    </span>
                  )}
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold",
                    doc.available
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-[var(--bg)] text-[var(--text-subtle)]"
                  )}>
                    {doc.available ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                {/* Schedule button */}
                <button
                  onClick={() => openScheduleModal(doc)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-muted)] text-xs font-bold hover:border-[var(--teal)]/50 hover:text-[var(--teal)] hover:bg-[var(--teal-soft)] transition-all"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  Definir horario
                </button>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <UserRound className="w-10 h-10 text-[var(--text-subtle)] mx-auto mb-4" />
          <p className="text-sm font-medium text-[var(--text-subtle)]">
            {filterSpecialty ? `Sin médicos en ${filterSpecialty}` : 'No hay médicos registrados aún'}
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mx-auto mt-6">
            <Plus className="w-4 h-4" /> Registrar primer médico
          </button>
        </div>
      )}

      {/* ── Create doctor modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-[var(--navy)]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl p-8 w-full max-w-md shadow-2xl"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              <div className="flex justify-between items-start mb-7">
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--navy)]">Nuevo médico</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Completa los datos del profesional</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-[var(--bg)] rounded-xl transition-all text-[var(--text-subtle)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nombre completo</label>
                  <input
                    type="text"
                    placeholder="Ej: Dr. Carlos Herrera"
                    value={form.name}
                    onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormError(''); }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border border-[var(--border)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Especialidad</label>
                  <select
                    value={form.specialty_id}
                    onChange={e => setForm(f => ({ ...f, specialty_id: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border border-[var(--border)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 transition-all"
                  >
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {specialties.length === 0 && (
                      <option value="">Sin especialidades — agrégalas en Supabase</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Número de registro médico <span className="normal-case font-medium">(opcional)</span></label>
                  <input
                    type="text"
                    placeholder="Ej: RM-12345"
                    value={form.license_number}
                    onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none border border-[var(--border)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 transition-all"
                  />
                </div>

                {formError && (
                  <p className="text-xs font-bold text-rose-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all">
                  Cancelar
                </button>
                <button onClick={handleCreate} disabled={saving} className="flex-1 btn-primary justify-center py-3">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Registrar</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Schedule editor modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {scheduleDoctor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setScheduleDoctor(null)}
              className="absolute inset-0 bg-[var(--navy)]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              <div className="flex justify-between items-start mb-7">
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--navy)]">Horario de disponibilidad</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">{scheduleDoctor.name}</p>
                </div>
                <button onClick={() => setScheduleDoctor(null)} className="p-2 hover:bg-[var(--bg)] rounded-xl transition-all text-[var(--text-subtle)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {scheduleLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-[var(--teal)] animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduleForm.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-2xl border-2 transition-all",
                        day.enabled
                          ? "border-[var(--teal)]/40 bg-[var(--teal-soft)]"
                          : "border-[var(--border)] bg-[var(--bg)]"
                      )}
                    >
                      {/* Day toggle row */}
                      <div className="flex items-center gap-4 px-4 py-3">
                        <button
                          onClick={() => updateDaySchedule(i, { enabled: !day.enabled })}
                          className="shrink-0"
                        >
                          {day.enabled
                            ? <ToggleRight className="w-6 h-6 text-[var(--teal)]" />
                            : <ToggleLeft className="w-6 h-6 text-[var(--text-subtle)]" />}
                        </button>
                        <span className={cn(
                          "text-sm font-bold w-24 shrink-0",
                          day.enabled ? "text-[var(--navy)]" : "text-[var(--text-subtle)]"
                        )}>
                          {DAY_NAMES[i]}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                          day.enabled ? "bg-[var(--teal)] text-white" : "bg-[var(--border)] text-[var(--text-subtle)]"
                        )}>
                          {day.enabled ? 'Activo' : DAY_SHORT[i]}
                        </span>
                      </div>

                      {/* Expanded config when enabled */}
                      <AnimatePresence>
                        {day.enabled && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 grid grid-cols-3 gap-4 border-t border-[var(--teal)]/20 pt-3">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Hora inicio</label>
                                <input
                                  type="time"
                                  value={day.start_time}
                                  onChange={e => updateDaySchedule(i, { start_time: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none border border-[var(--border)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Hora fin</label>
                                <input
                                  type="time"
                                  value={day.end_time}
                                  onChange={e => updateDaySchedule(i, { end_time: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none border border-[var(--border)] focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal)]/20 transition-all"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Duración slot</label>
                                <select
                                  value={day.slot_duration_minutes}
                                  onChange={e => updateDaySchedule(i, { slot_duration_minutes: Number(e.target.value) })}
                                  className="w-full px-3 py-2 rounded-xl text-sm font-medium outline-none border border-[var(--border)] focus:border-[var(--teal)] transition-all"
                                >
                                  {[15, 20, 30, 45, 60].map(m => (
                                    <option key={m} value={m}>{m} min</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {scheduleError && (
                <p className="mt-6 text-xs font-bold text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {scheduleError}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setScheduleDoctor(null)} className="flex-1 px-4 py-3 rounded-2xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all">
                  Cancelar
                </button>
                <button onClick={handleSaveSchedule} disabled={scheduleSaving} className="flex-1 btn-primary justify-center py-3">
                  {scheduleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar horario'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
