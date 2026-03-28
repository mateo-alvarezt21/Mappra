import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useOutletContext, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Bell } from 'lucide-react';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import Validation from './components/Validation';
import Channels from './components/Channels';
import Analytics from './components/Analytics';
import Doctors from './components/Doctors';
import Settings from './components/Settings';
import Login from './components/Login';

import { ThemeProvider } from './contexts/ThemeContext';
import { apiFetch, isTokenValid } from './lib/api';
import { cn } from './lib/utils';
import { Appointment } from './types';
import AppointmentPicker from './components/AppointmentPicker';

// ─── Shared context type for child routes ────────────────────────────────────
export interface LayoutContext {
  appointments: Appointment[];
  onStatusCycle: (id: string) => void;
}

export function useLayoutContext() {
  return useOutletContext<LayoutContext>();
}

// ─── Auth guard ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isTokenValid()) {
    localStorage.removeItem('mappra_token');
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const STATUS_CYCLE: Record<string, string> = {
  'Confirmada': 'En consulta',
  'En consulta': 'Atendida',
  'Atendida': 'Confirmada',
  'Pendiente': 'Confirmada',
  'Cancelada': 'Confirmada',
};

// ─── Main layout (wraps all protected pages) ─────────────────────────────────
function MainLayout() {
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastEpsValidation, setLastEpsValidation] = useState<{ validated: boolean; status: string; eps: string | null } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch<Appointment[]>('/appointments')
      .then(setAppointments)
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    patientName: '',
    document: '',
    specialty: 'Medicina General',
    doctorId: '',
    eps: 'Sura',
    date: '',
    time: '',
    contactChannel: 'WhatsApp',
  });

  useEffect(() => {
    apiFetch<any[]>(`/doctors?specialty=${encodeURIComponent(formData.specialty)}&onlyAvailable=true`)
      .then(data => {
        setDoctors(data);
        setFormData(prev => ({ ...prev, doctorId: data[0]?.id ?? '' }));
      })
      .catch(() => setDoctors([]));
  }, [formData.specialty]);

  const handleStatusCycle = async (apptId: string) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) return;
    const nextStatus = STATUS_CYCLE[appt.status] ?? 'Confirmada';
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: nextStatus as any } : a));
    try {
      await apiFetch(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: appt.status } : a));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.patientName.trim()) newErrors.patientName = 'El nombre es requerido';
    if (!formData.document.trim()) newErrors.document = 'El documento es requerido';
    if (!formData.date) newErrors.date = 'Selecciona una fecha';
    if (!formData.time) newErrors.time = 'Selecciona una hora';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert HH:MM (24h) to { time: "H:MM", ampm: "AM"|"PM" }
  const parse24h = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { time: `${h12}:${String(m).padStart(2, '0')}`, ampm };
  };

  const handleConfirmAppointment = async () => {
    if (!validateForm()) return;
    const { time, ampm } = parse24h(formData.time);
    try {
      const res = await apiFetch<Appointment & { epsValidation?: { validated: boolean; status: string; eps: string | null } }>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          patientName: formData.patientName,
          document: formData.document,
          specialty: formData.specialty,
          doctorId: formData.doctorId,
          date: formData.date,
          time, ampm,
          contactChannel: formData.contactChannel,
        }),
      });
      const { epsValidation, ...newAppt } = res;
      setAppointments(prev => [...prev, newAppt as Appointment]);
      setLastEpsValidation(epsValidation ?? null);
      setIsModalOpen(false);
      setShowToast(true);
      setFormData(prev => ({ ...prev, patientName: '', document: '', date: '', time: '', contactChannel: 'WhatsApp' }));
      setTimeout(() => setShowToast(false), 6000);
    } catch (e: any) {
      setErrors(prev => ({ ...prev, time: e.message ?? 'Error al agendar la cita' }));
    }
  };

  return (
    <div className="flex min-h-screen text-[var(--text)] font-sans" style={{ background: 'var(--layout-bg)' }}>
      <Sidebar />

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopBar onNewAppointment={() => { setErrors({}); setIsModalOpen(true); }} />

        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet context={{ appointments, onStatusCycle: handleStatusCycle } satisfies LayoutContext} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* New appointment modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[var(--navy)]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl p-10 w-full max-w-5xl shadow-2xl overflow-y-auto max-h-[90vh]"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="font-display text-xl font-bold text-[var(--navy)]">Agendar Nueva Cita</h3>
                  <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Complete los datos y seleccione fecha y hora</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-[var(--bg)] rounded-xl transition-all text-[var(--text-subtle)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Left: patient fields ── */}
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nombre del paciente</label>
                    <input type="text" placeholder="Nombre completo" value={formData.patientName}
                      onChange={e => { setFormData({...formData, patientName: e.target.value}); if (errors.patientName) setErrors({...errors, patientName: ''}); }}
                      className={cn("w-full px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 transition-all border", errors.patientName ? "ring-2 ring-red-400 border-red-300" : "border-[var(--border)] focus:ring-[var(--teal)]/20 focus:border-[var(--teal)]")} />
                    {errors.patientName && <p className="text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.patientName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Nº de documento</label>
                    <input type="text" placeholder="CC / TI / PP" value={formData.document}
                      onChange={e => { setFormData({...formData, document: e.target.value}); if (errors.document) setErrors({...errors, document: ''}); }}
                      className={cn("w-full px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 transition-all border", errors.document ? "ring-2 ring-red-400 border-red-300" : "border-[var(--border)] focus:ring-[var(--teal)]/20 focus:border-[var(--teal)]")} />
                    {errors.document && <p className="text-[10px] font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.document}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Especialidad</label>
                      <select value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value, doctorId: '', date: '', time: ''})}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--teal)]/20 transition-all border border-[var(--border)]">
                        {['Medicina General','Cardiología','Pediatría','Dermatología','Ginecología','Neurología','Ortopedia'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Médico</label>
                      <select value={formData.doctorId} onChange={e => setFormData({...formData, doctorId: e.target.value, date: '', time: ''})}
                        disabled={doctors.length === 0}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--teal)]/20 transition-all border border-[var(--border)] disabled:opacity-50">
                        {doctors.length === 0
                          ? <option value="">Sin médicos disponibles</option>
                          : doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">EPS</label>
                    <select value={formData.eps} onChange={e => setFormData({...formData, eps: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--teal)]/20 transition-all border border-[var(--border)]">
                      {['Sura','Sanitas','Nueva EPS','Compensar','Coosalud','Famisanar'].map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Canal de contacto del paciente</label>
                    <div className="flex gap-3">
                      {(['WhatsApp', 'Email', 'SMS'] as const).map(ch => (
                        <button key={ch} type="button" onClick={() => setFormData({...formData, contactChannel: ch})}
                          className={cn("flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all",
                            formData.contactChannel === ch
                              ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--teal)]/40")}>
                          {ch}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1.5 pt-0.5">
                      <Bell className="w-3 h-3" />
                      Se guardará como canal preferido del paciente para recordatorios futuros.
                    </p>
                  </div>

                  {(errors.date || errors.time) && (
                    <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.date || errors.time}
                    </p>
                  )}
                </div>

                {/* ── Right: Calendly-like picker ── */}
                <div className="border border-[var(--border)] rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Fecha y hora de la cita</p>
                  <AppointmentPicker
                    doctorId={formData.doctorId}
                    selectedDate={formData.date}
                    selectedTime={formData.time}
                    onSelect={(date, time) => {
                      setFormData(prev => ({ ...prev, date, time }));
                      if (errors.date || errors.time) setErrors(prev => ({ ...prev, date: '', time: '' }));
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all">
                  Cancelar
                </button>
                <button onClick={handleConfirmAppointment} className="flex-1 btn-primary justify-center py-4">
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Cita
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-[200] p-4 pr-6 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm"
            style={{ background: 'var(--card-bg)', border: `1px solid ${lastEpsValidation?.validated === false ? 'rgba(245,158,11,0.35)' : 'var(--card-border)'}` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: lastEpsValidation?.validated === false ? 'rgba(245,158,11,0.15)' : 'var(--teal)' }}
            >
              {lastEpsValidation?.validated === false
                ? <AlertCircle className="w-5 h-5 text-amber-500" />
                : <CheckCircle2 className="w-5 h-5 text-white" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--navy)]">Cita agendada</p>
              {lastEpsValidation?.validated === false ? (
                <p className="text-[11px] font-semibold text-amber-500 mt-0.5">
                  EPS pendiente de validación manual
                </p>
              ) : (
                <p className="text-[11px] font-semibold text-emerald-500 mt-0.5">
                  Cobertura EPS verificada · {lastEpsValidation?.eps ?? ''}
                </p>
              )}
              <p className="text-[10px] text-[var(--text-subtle)] font-medium mt-0.5 uppercase tracking-widest">
                Recordatorio por {formData.contactChannel}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── App & routes ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="validation" element={<Validation />} />
          <Route path="channels" element={<Channels />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
