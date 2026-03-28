import { ShieldCheck, Search, CheckCircle2, Clock, AlertCircle, Loader2, XCircle, Database, Wifi, FileCheck } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiFetch } from "../lib/api";

interface ValidationRecord {
  id: string;
  patients?: { full_name?: string };
  patientName?: string;
  document_number?: string;
  eps?: { name?: string } | string;
  result_status: string;
  created_at?: string;
}

interface CheckResult {
  found?: boolean;
  name?: string;
  eps?: string;
  affiliationType?: string;
  status?: string;
  lastUpdate?: string;
  source?: 'ADRES' | 'internal';
}

const CONSULT_STEPS = [
  { icon: Database, label: 'Verificando documento en registro' },
  { icon: Wifi,     label: 'Consultando base ADRES' },
  { icon: FileCheck, label: 'Validando cobertura activa' },
];

export default function Validation() {
  const [docType, setDocType] = useState('CC');
  const [docNumber, setDocNumber] = useState('');
  const [eps, setEps] = useState('');
  const [checking, setChecking] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [checkError, setCheckError] = useState('');

  const [history, setHistory] = useState<ValidationRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiFetch<ValidationRecord[]>('/validation')
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  const handleValidate = async () => {
    if (!docNumber.trim()) { setCheckError('Ingresa el número de documento'); return; }
    setCheckError('');
    setChecking(true);
    setResult(null);
    setStepIndex(0);

    // Animate steps while the real request runs
    stepTimer.current = setInterval(() => {
      setStepIndex(prev => {
        if (prev >= CONSULT_STEPS.length - 1) {
          clearInterval(stepTimer.current!);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    try {
      const data = await apiFetch<CheckResult>('/validation/check', {
        method: 'POST',
        body: JSON.stringify({ document_type: docType, document_number: docNumber.trim() }),
      });
      clearInterval(stepTimer.current!);
      setStepIndex(CONSULT_STEPS.length); // mark all done
      // Small pause so the user sees "all green" before result appears
      await new Promise(r => setTimeout(r, 400));
      setResult(data);
      apiFetch<ValidationRecord[]>('/validation').then(setHistory).catch(() => {});
    } catch (err: any) {
      clearInterval(stepTimer.current!);
      setCheckError(err.message ?? 'Error al consultar la afiliación');
    } finally {
      setChecking(false);
      setStepIndex(-1);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCheckError('');
    setDocNumber('');
  };

  const patientName = (v: ValidationRecord) =>
    v.patients?.full_name ?? v.patientName ?? 'Paciente';

  const epsName = (v: ValidationRecord) =>
    typeof v.eps === 'string' ? v.eps : (v.eps as any)?.name ?? '—';

  const statusColor = (s: string) => {
    if (s === 'Activa') return 'text-emerald-500';
    if (s === 'Pendiente') return 'text-amber-500';
    return 'text-rose-500';
  };

  const StatusIcon = ({ s }: { s: string }) => {
    if (s === 'Activa') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (s === 'Pendiente') return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
  };

  const isActive = result?.status === 'Activa';
  const accentColor = isActive ? '#10B981' : '#F59E0B';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Form */}
        <div className="card p-8">
          <h3 className="font-display text-lg font-bold text-[var(--navy)] mb-6">Consulta de Afiliación</h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Tipo de documento</label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl text-sm font-medium outline-none focus:border-[var(--teal)] transition-all"
              >
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="PA">Pasaporte</option>
                <option value="CE">Cédula Extranjería</option>
                <option value="RC">Registro Civil</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Número de documento</label>
              <input
                type="text"
                value={docNumber}
                onChange={e => { setDocNumber(e.target.value); setCheckError(''); }}
                placeholder="Ej: 1234567890"
                className={cn(
                  "w-full px-4 py-3 border-2 rounded-xl text-sm font-medium outline-none transition-all",
                  checkError ? "border-rose-400 focus:border-rose-500" : "border-[var(--border)] focus:border-[var(--teal)]"
                )}
              />
              {checkError && (
                <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {checkError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">EPS a consultar</label>
              <select
                value={eps}
                onChange={e => setEps(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl text-sm font-medium outline-none focus:border-[var(--teal)] transition-all"
              >
                <option value="">Todas las EPS</option>
                <option value="Sura">Sura</option>
                <option value="Sanitas">Sanitas</option>
                <option value="Nueva EPS">Nueva EPS</option>
                <option value="Compensar">Compensar</option>
                <option value="Coosalud">Coosalud</option>
                <option value="Famisanar">Famisanar</option>
              </select>
            </div>

            <button
              onClick={handleValidate}
              disabled={checking}
              className="btn-primary w-full justify-center py-4 mt-4"
            >
              {checking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Validar Afiliación</span>
                </>
              )}
            </button>

            {/* Consultation steps */}
            <AnimatePresence>
              {checking && stepIndex >= 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 mt-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                      Procesando consulta
                    </p>
                    {CONSULT_STEPS.map((step, i) => {
                      const done = stepIndex > i;
                      const active = stepIndex === i;
                      const Icon = step.icon;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className={cn(
                            "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                            done ? "bg-emerald-500/20" : active ? "bg-[var(--teal)]/15" : "bg-[var(--border)]"
                          )}>
                            {done
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              : active
                                ? <Loader2 className="w-3.5 h-3.5 text-[var(--teal)] animate-spin" />
                                : <Icon className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                            }
                          </div>
                          <span className={cn(
                            "text-xs font-medium transition-colors",
                            done ? "text-emerald-500" : active ? "text-[var(--navy)]" : "text-[var(--text-subtle)]"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Result / History */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-bold text-[var(--navy)]">Resultado</h3>
                {result.source && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{
                      background: result.source === 'ADRES' ? 'rgba(0,194,203,0.12)' : 'var(--bg)',
                      color: result.source === 'ADRES' ? 'var(--teal)' : 'var(--text-muted)',
                    }}>
                    {result.source === 'ADRES' ? 'Fuente: ADRES' : 'Fuente: Registro interno'}
                  </span>
                )}
              </div>

              {/* Status banner */}
              <div
                className="flex items-center gap-4 p-4 rounded-2xl border mb-8"
                style={{
                  background: `${accentColor}14`,
                  borderColor: `${accentColor}33`,
                }}
              >
                {isActive
                  ? <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  : <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />}
                <div>
                  <p className="text-sm font-extrabold text-[var(--navy)]">
                    {isActive ? 'Afiliación Activa y Verificada' : 'Estado: ' + result.status}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                    {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Nombre', value: result.name ?? '—' },
                  { label: 'EPS', value: result.eps ?? '—' },
                  { label: 'Tipo de afiliación', value: result.affiliationType ?? '—' },
                  { label: 'Estado', value: result.status ?? '—', badge: true },
                  { label: 'Última actualización', value: result.lastUpdate ?? '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-[var(--border)] last:border-0">
                    <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{row.label}</span>
                    {row.badge ? (
                      <span
                        className="px-3 py-1 text-white text-[10px] font-bold rounded-full uppercase"
                        style={{ background: accentColor }}
                      >
                        {row.value}
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-[var(--navy)]">{row.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <button onClick={handleReset} className="w-full mt-8 text-xs font-bold text-[var(--teal)] hover:underline">
                Realizar nueva consulta
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="card p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-bold text-[var(--navy)]">Consultas recientes</h3>
                <Search className="w-4 h-4 text-[var(--text-subtle)]" />
              </div>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[var(--teal)] animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-4">
                  {history.slice(0, 6).map((val, i) => (
                    <div key={val.id ?? i} className="flex items-center gap-4 py-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)] transition-all rounded-xl px-2 -mx-2">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold bg-[var(--teal)]/10 text-[var(--teal)] shrink-0">
                        {patientName(val).split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[var(--navy)] truncate">{patientName(val)}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-medium truncate">
                          {val.document_number ? `${val.document_number} · ` : ''}{epsName(val)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusIcon s={val.result_status} />
                        <span className={cn("text-[10px] font-bold", statusColor(val.result_status))}>
                          {val.result_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShieldCheck className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-subtle)]">Sin consultas previas</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
