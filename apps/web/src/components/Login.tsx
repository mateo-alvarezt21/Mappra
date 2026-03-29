import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Activity, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Credenciales inválidas');
        return;
      }

      localStorage.setItem('mappra_token', data.accessToken);
      navigate('/');
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {/* ── Left Panel ── */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #0B2040 0%, #0d2850 50%, #091a35 100%)' }}
      >
        {/* Geometric grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,194,203,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,194,203,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,194,203,0.12) 0%, transparent 65%)' }} />
        <div className="absolute bottom-[-80px] left-[-60px] w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,100,180,0.18) 0%, transparent 65%)' }} />

        {/* ECG / pulse line SVG */}
        <svg
          className="absolute bottom-[28%] left-0 right-0 w-full pointer-events-none"
          height="60"
          viewBox="0 0 800 60"
          fill="none"
          preserveAspectRatio="none"
          style={{ opacity: 0.12 }}
        >
          <motion.path
            d="M0 30 L120 30 L150 30 L160 8 L175 52 L190 18 L200 30 L260 30 L280 30 L300 30 L320 30 L340 30 L360 30 L380 30 L400 30 L420 30 L440 30 L460 30 L480 30 L500 8 L515 52 L530 18 L540 30 L600 30 L620 30 L640 30 L700 30 L800 30"
            stroke="#00C2CB"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.6 }}
          />
        </svg>

        {/* Top: Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(0,194,203,0.15)', border: '1px solid rgba(0,194,203,0.3)' }}
            >
              <Activity className="w-5 h-5 text-[#00C2CB]" strokeWidth={2.5} />
            </div>
            <span className="text-white text-xl font-extrabold tracking-tight">Mappra</span>
          </div>
          <p className="text-[#7a99bb] text-sm font-medium">HealthTech IPS Management</p>
        </div>

        {/* Middle: Hero text */}
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="text-white font-extrabold leading-[1.1] mb-5"
            style={{ fontSize: 'clamp(2rem, 3vw, 2.8rem)' }}
          >
            Gestión clínica<br />
            <span style={{ color: '#00C2CB' }}>inteligente</span> para<br />
            tu IPS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-[#5e7d9a] text-sm font-medium leading-relaxed max-w-xs"
          >
            Citas, validaciones EPS, canales de atención y analítica en una sola plataforma.
          </motion.p>
        </div>

        {/* Bottom: Feature list */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="relative z-10 space-y-3"
        >
          {[
            { icon: Calendar,   label: 'Agendamiento de citas' },
            { icon: ShieldCheck, label: 'Validación de cobertura EPS' },
            { icon: Users,      label: 'Gestión de pacientes y médicos' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,194,203,0.12)', border: '1px solid rgba(0,194,203,0.2)' }}
              >
                <Icon className="w-3.5 h-3.5 text-[#00C2CB]" strokeWidth={2} />
              </div>
              <span className="text-[#7a99bb] text-sm font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 relative"
        style={{ background: 'linear-gradient(145deg, #eef4fb 0%, #e8f0fa 100%)' }}
      >
        {/* Subtle texture blob */}
        <div className="absolute top-[-60px] right-[-60px] w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,194,203,0.07) 0%, transparent 65%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Mobile brand mark */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#0B2040' }}
            >
              <Activity className="w-4.5 h-4.5 text-[#00C2CB]" strokeWidth={2.5} />
            </div>
            <span className="text-[#0B2040] text-lg font-extrabold">Mappra</span>
          </div>

          <div className="mb-9">
            <h1 className="text-[#0B2040] font-extrabold text-2xl mb-1.5">Bienvenido de nuevo</h1>
            <p className="text-[#4D6480] text-sm font-medium">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#4D6480] uppercase tracking-widest pl-0.5">
                Correo corporativo
              </label>
              <FieldWrapper>
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA3B8] transition-colors duration-200" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@ips.com"
                  className="w-full pl-11 pr-5 py-3.5 rounded-2xl text-sm font-medium text-[#0B2040] placeholder:text-[#b0bfcc] outline-none transition-all duration-200 bg-white/70 border-2 border-transparent focus:bg-white focus:border-[rgba(0,194,203,0.45)] focus:shadow-[0_0_0_4px_rgba(0,194,203,0.08)]"
                />
              </FieldWrapper>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center pl-0.5">
                <label className="text-[11px] font-bold text-[#4D6480] uppercase tracking-widest">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-[11px] font-semibold text-[#00C2CB] hover:text-[#0B2040] transition-colors"
                >
                  ¿Olvidó su clave?
                </button>
              </div>
              <FieldWrapper>
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8FA3B8] transition-colors duration-200" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-5 py-3.5 rounded-2xl text-sm font-medium text-[#0B2040] placeholder:text-[#b0bfcc] outline-none transition-all duration-200 bg-white/70 border-2 border-transparent focus:bg-white focus:border-[rgba(0,194,203,0.45)] focus:shadow-[0_0_0_4px_rgba(0,194,203,0.08)]"
                />
              </FieldWrapper>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold text-red-500"
                style={{ background: 'rgba(239,68,68,0.07)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full mt-2 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 text-white',
                isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'
              )}
              style={{
                background: 'linear-gradient(135deg, #0B2040 0%, #163566 100%)',
                boxShadow: '0 6px 24px rgba(11,32,64,0.22)',
              }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Ingresar al sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-2 text-[#8FA3B8]">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-[11px] font-semibold">Acceso cifrado · © 2026 Mappra</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FieldWrapper({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>;
}
