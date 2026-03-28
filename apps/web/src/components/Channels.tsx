import {
  Webhook, Plus, Trash2, TestTube2, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Clock, Loader2, Eye, EyeOff, ToggleLeft, ToggleRight, Pencil
} from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { apiFetch } from "../lib/api";

const ALL_EVENTS = [
  { key: 'appointment.created',        label: 'Cita creada' },
  { key: 'appointment.status_changed', label: 'Cita cambió estado' },
  { key: 'appointment.cancelled',      label: 'Cita cancelada' },
  { key: 'eps_validation.completed',   label: 'Validación EPS completada' },
];

interface WebhookRow {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  hasSecret: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_http_status: number | null;
}

interface DeliveryLog {
  id: string;
  event: string;
  http_status: number | null;
  response_ms: number | null;
  error: string | null;
  triggered_at: string;
}

interface WebhookForm {
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

const emptyForm = (): WebhookForm => ({
  name: '', url: '', events: [], secret: '', active: true,
});

export default function Channels() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookRow | null>(null);
  const [form, setForm] = useState<WebhookForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // per-webhook logs expansion + test state
  const [logsOpen, setLogsOpen] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<Record<string, DeliveryLog[]>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; status: number | null; ms: number }>>({});

  useEffect(() => {
    apiFetch<WebhookRow[]>('/channels')
      .then(setWebhooks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowSecret(false);
    setModalOpen(true);
  };

  const openEdit = (wh: WebhookRow) => {
    setEditing(wh);
    setForm({ name: wh.name, url: wh.url, events: wh.events, secret: '', active: wh.active });
    setFormError('');
    setShowSecret(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('El nombre es requerido'); return; }
    if (!form.url.trim())  { setFormError('La URL es requerida'); return; }
    if (!form.events.length) { setFormError('Selecciona al menos un evento'); return; }
    setSaving(true); setFormError('');
    try {
      const body: any = { name: form.name, url: form.url, events: form.events, active: form.active };
      if (form.secret.trim()) body.secret = form.secret.trim();

      if (editing) {
        const updated = await apiFetch<WebhookRow>(`/channels/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
        setWebhooks(prev => prev.map(w => w.id === editing.id ? updated : w));
      } else {
        const created = await apiFetch<WebhookRow>('/channels', { method: 'POST', body: JSON.stringify(body) });
        setWebhooks(prev => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (e: any) {
      setFormError(e.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este webhook?')) return;
    await apiFetch(`/channels/${id}`, { method: 'DELETE' });
    setWebhooks(prev => prev.filter(w => w.id !== id));
  };

  const handleToggle = async (wh: WebhookRow) => {
    const updated = await apiFetch<WebhookRow>(`/channels/${wh.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !wh.active }),
    });
    setWebhooks(prev => prev.map(w => w.id === wh.id ? updated : w));
  };

  const handleTest = async (id: string) => {
    setTesting(prev => ({ ...prev, [id]: true }));
    setTestResult(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await apiFetch<{ success: boolean; status: number | null; ms: number }>(`/channels/${id}/test`, { method: 'POST' });
      setTestResult(prev => ({ ...prev, [id]: res }));
    } catch {
      setTestResult(prev => ({ ...prev, [id]: { success: false, status: null, ms: 0 } }));
    } finally {
      setTesting(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleLogs = async (id: string) => {
    const open = !logsOpen[id];
    setLogsOpen(prev => ({ ...prev, [id]: open }));
    if (open && !logs[id]) {
      setLogsLoading(prev => ({ ...prev, [id]: true }));
      const data = await apiFetch<DeliveryLog[]>(`/channels/${id}/logs`).catch(() => []);
      setLogs(prev => ({ ...prev, [id]: data }));
      setLogsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const toggleEvent = (key: string) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(key) ? f.events.filter(e => e !== key) : [...f.events, key],
    }));
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

  const maskUrl = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname.length > 16 ? u.pathname.slice(0, 8) + '…' + u.pathname.slice(-6) : u.pathname;
      return `${u.hostname}${path}`;
    } catch { return url; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-[var(--teal)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[var(--navy)]">Webhooks</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Mappra dispara estos endpoints cuando ocurren eventos. Conéctalos a n8n para automatizar notificaciones.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo webhook
        </button>
      </div>

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="card p-16 text-center">
          <Webhook className="w-10 h-10 text-[var(--text-subtle)] mx-auto mb-4" />
          <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Sin webhooks configurados</p>
          <p className="text-xs text-[var(--text-subtle)]">Crea uno y conéctalo a un flujo de n8n</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh, i) => (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card overflow-hidden"
            >
              {/* Main row */}
              <div className="p-6 flex items-start gap-4">
                {/* Status dot */}
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                  wh.active ? "bg-emerald-500" : "bg-[var(--text-subtle)]"
                )} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--navy)]">{wh.name}</span>
                    {wh.hasSecret && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--teal)]/10 text-[var(--teal)] uppercase tracking-wider">
                        firmado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5 truncate">{maskUrl(wh.url)}</p>

                  {/* Event badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {wh.events.map(ev => (
                      <span key={ev} className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider">
                        {ALL_EVENTS.find(e => e.key === ev)?.label ?? ev}
                      </span>
                    ))}
                  </div>

                  {/* Last delivery info */}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-[var(--text-subtle)] font-medium">
                    <span>Última entrega: {fmtDate(wh.last_triggered_at)}</span>
                    {wh.last_http_status && (
                      <span className={cn(
                        "font-bold",
                        wh.last_http_status < 300 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        HTTP {wh.last_http_status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Test */}
                  <button
                    onClick={() => handleTest(wh.id)}
                    disabled={testing[wh.id]}
                    title="Enviar payload de prueba"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--teal)] transition-all"
                  >
                    {testing[wh.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube2 className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEdit(wh)}
                    title="Editar"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--navy)] transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {/* Toggle active */}
                  <button
                    onClick={() => handleToggle(wh)}
                    title={wh.active ? 'Desactivar' : 'Activar'}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all"
                  >
                    {wh.active
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5" />
                    }
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(wh.id)}
                    title="Eliminar"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Logs toggle */}
                  <button
                    onClick={() => toggleLogs(wh.id)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all"
                  >
                    {logsOpen[wh.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Test result */}
              <AnimatePresence>
                {testResult[wh.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "mx-6 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-semibold",
                      testResult[wh.id].success
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-500"
                    )}>
                      {testResult[wh.id].success
                        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                        : <XCircle className="w-4 h-4 shrink-0" />
                      }
                      {testResult[wh.id].success
                        ? `Entregado correctamente · HTTP ${testResult[wh.id].status} · ${testResult[wh.id].ms}ms`
                        : `Error al entregar · ${testResult[wh.id].ms}ms`
                      }
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Delivery logs */}
              <AnimatePresence>
                {logsOpen[wh.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[var(--border)] px-6 py-4">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-3">
                        Últimas entregas
                      </p>
                      {logsLoading[wh.id] ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-4 h-4 text-[var(--teal)] animate-spin" />
                        </div>
                      ) : !logs[wh.id]?.length ? (
                        <p className="text-xs text-[var(--text-subtle)] py-2">Sin entregas registradas</p>
                      ) : (
                        <div className="space-y-2">
                          {logs[wh.id].map(log => (
                            <div key={log.id} className="flex items-center gap-3 text-xs">
                              {log.http_status && log.http_status < 300
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                : log.error
                                  ? <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              }
                              <span className="font-mono text-[var(--text-muted)] shrink-0 w-28 truncate">
                                {log.http_status ? `HTTP ${log.http_status}` : log.error ?? '—'}
                              </span>
                              <span className="text-[var(--text-subtle)] shrink-0">{log.response_ms}ms</span>
                              <span className="font-medium text-[var(--navy)] truncate">
                                {ALL_EVENTS.find(e => e.key === log.event)?.label ?? log.event}
                              </span>
                              <span className="text-[var(--text-subtle)] ml-auto shrink-0">{fmtDate(log.triggered_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-[var(--navy)]/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg card p-8"
            >
              <h3 className="font-display text-lg font-bold text-[var(--navy)] mb-6">
                {editing ? 'Editar webhook' : 'Nuevo webhook'}
              </h3>

              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Nombre</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Recordatorio WhatsApp"
                    className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl text-sm font-medium outline-none focus:border-[var(--teal)] transition-all"
                  />
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">URL del webhook (n8n)</label>
                  <input
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://n8n.tudominio.com/webhook/..."
                    className="w-full px-4 py-3 border-2 border-[var(--border)] rounded-xl text-sm font-medium font-mono outline-none focus:border-[var(--teal)] transition-all"
                  />
                </div>

                {/* Events */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Eventos que disparan este webhook</label>
                  <div className="space-y-2">
                    {ALL_EVENTS.map(ev => (
                      <label key={ev.key} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => toggleEvent(ev.key)}
                          className={cn(
                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                            form.events.includes(ev.key)
                              ? "bg-[var(--teal)] border-[var(--teal)]"
                              : "border-[var(--border)] group-hover:border-[var(--teal)]"
                          )}
                        >
                          {form.events.includes(ev.key) && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-[var(--navy)] font-medium">{ev.label}</span>
                        <span className="text-[10px] font-mono text-[var(--text-subtle)] ml-auto">{ev.key}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Secret */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Secret HMAC <span className="normal-case font-normal">(opcional — para verificar la firma en n8n)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={form.secret}
                      onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                      placeholder={editing?.hasSecret ? '••••••• (dejar vacío para no cambiar)' : 'mi_secret_seguro'}
                      className="w-full px-4 py-3 pr-12 border-2 border-[var(--border)] rounded-xl text-sm font-medium outline-none focus:border-[var(--teal)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--teal)]"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative",
                      form.active ? "bg-[var(--teal)]" : "bg-[var(--border)]"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      form.active ? "translate-x-6" : "translate-x-1"
                    )} />
                  </div>
                  <span className="text-sm font-medium text-[var(--navy)]">
                    {form.active ? 'Activo' : 'Inactivo'}
                  </span>
                </label>

                {formError && (
                  <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> {formError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl font-bold text-[var(--text-muted)] hover:bg-[var(--bg)] transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 btn-primary justify-center py-3"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Guardar cambios' : 'Crear webhook'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
