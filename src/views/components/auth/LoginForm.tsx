import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Store, UserCog, X } from 'lucide-react';
import type { LoginCredentials } from '../../../models';
import { isValidEmail } from '../../../utils';
import { useScrollLock } from '../../../utils/useScrollLock';
import { useDialogBehavior } from '../../../utils/useDialog';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onAdminLogin: (credentials: LoginCredentials) => Promise<void>;
  error?: string | null;
  /** Ruta de retorno tras un login exitoso. */
  nextPath?: string;
  /** true cuando se agrega otra cuenta sin cerrar la actual. */
  switchMode?: boolean;
  /** Nombre de la sesion activa (solo en modo switch). */
  currentUserName?: string | null;
}

export function LoginForm({ onLogin, onAdminLogin, error, nextPath = '/', switchMode = false, currentUserName = null }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adminModalOpen, setAdminModalOpen] = useState(false);
  useScrollLock(adminModalOpen);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  const [recoverOpen, setRecoverOpen] = useState(false);
  useScrollLock(recoverOpen);
  const recoverPanelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(recoverOpen, () => setRecoverOpen(false), recoverPanelRef);
  const adminPanelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(adminModalOpen, () => setAdminModalOpen(false), adminPanelRef);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return;
    setIsSubmitting(true);
    try {
      await onLogin({ email, password, remember });
      navigate(nextPath.startsWith('/') ? nextPath : '/');
    } catch {
      // el mensaje de error lo muestra el padre via prop `error`
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    try {
      await onAdminLogin({ email: adminEmail, password: adminPassword });
      setAdminModalOpen(false);
      navigate(nextPath.startsWith('/') ? nextPath : '/');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-5" style={{ background: '#FBC02D', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-5" style={{ background: '#C62828', transform: 'translate(-30%, 30%)' }} />
      <div className="absolute top-8 left-8 opacity-10 text-6xl select-none">🛒</div>
      <div className="absolute top-16 right-16 opacity-10 text-5xl select-none">🍎</div>
      <div className="absolute bottom-16 right-8 opacity-10 text-5xl select-none">🥦</div>
      <div className="absolute bottom-8 left-16 opacity-10 text-5xl select-none">🥕</div>
      <div className="absolute top-1/2 left-4 opacity-10 text-4xl select-none">🍌</div>
      <div className="absolute top-1/3 right-4 opacity-10 text-4xl select-none">🧅</div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="relative px-8 py-8 text-center" style={{ background: 'linear-gradient(135deg, #FBC02D 0%, #C62828 100%)' }}>
            <button onClick={() => navigate('/')} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white backdrop-blur-sm transition-colors">
              <X size={16} />
            </button>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Store className="text-white" size={28} />
              </div>
            </div>
            <h1 className="text-white font-bold" style={{ fontSize: '1.5rem' }}>Tienda Parque 100</h1>
            <p className="text-white/80 mt-1" style={{ fontSize: '0.875rem' }}>Productos frescos a tu puerta</p>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-[#212121] mb-6" style={{ fontSize: '1.25rem' }}>Iniciar Sesión</h2>

            {switchMode && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800" style={{ fontSize: '0.85rem' }}>
                Sesion activa: <strong>{currentUserName}</strong>. Esta sesion se mantiene; al ingresar agregaras otra cuenta.
              </div>
            )}
            {error && (
              <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="login-email" type="email" required maxLength={50} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="login-password" type={showPassword ? 'text' : 'password'} required maxLength={72} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                    style={{ fontSize: '0.9rem' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 rounded accent-[#C62828] cursor-pointer" />
                  <span className="text-[#212121]" style={{ fontSize: '0.85rem' }}>Recuérdame</span>
                </label>
                <button type="button" onClick={() => setRecoverOpen(true)} className="text-[#C62828] hover:underline" style={{ fontSize: '0.85rem' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                style={{ fontSize: '1rem' }}
              >
                {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
              </button>
            </form>

            <div className="mt-5 flex justify-center">
              <button type="button" onClick={() => setAdminModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-500 hover:text-[#C62828] hover:bg-[#F5F5F5] transition-all"
                style={{ fontSize: '0.82rem' }}
              >
                <UserCog size={15} className="shrink-0" />
                <span>¿Eres administrador?</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 mt-4" style={{ fontSize: '0.8rem' }}>
          © 2026 Tienda Parque 100. Todos los derechos reservados.
        </p>
      </div>

      {recoverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRecoverOpen(false); }}
        >
          <div ref={recoverPanelRef} role="dialog" aria-modal="true" aria-label="Recuperar contraseña" className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-[#212121] font-bold" style={{ fontSize: '1rem' }}>Recuperar contraseña</h3>
              <button type="button" onClick={() => setRecoverOpen(false)} aria-label="Cerrar" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              <p className="text-gray-600" style={{ fontSize: '0.9rem' }}>
                La recuperación automática está temporalmente deshabilitada para proteger tu cuenta.
              </p>
              <a href="mailto:info@parque100.com" className="w-full py-3 rounded-xl text-center text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] transition-all shadow-md" style={{ fontSize: '0.95rem' }}>
                Contactar soporte
              </a>
            </div>
          </div>
        </div>
      )}

      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setAdminModalOpen(false); }}
        >
          <div ref={adminPanelRef} role="dialog" aria-modal="true" aria-label="Inicio de sesión administrativo" className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C62828]/10 flex items-center justify-center">
                  <UserCog size={18} className="text-[#C62828]" />
                </div>
                <div>
                  <h3 className="text-[#212121] font-bold" style={{ fontSize: '1rem' }}>Inicio de sesión administrativo</h3>
                  <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>Ingresa tus credenciales de administrador</p>
                </div>
              </div>
              <button type="button" onClick={() => setAdminModalOpen(false)} aria-label="Cerrar" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                <X size={15} />
              </button>
            </div>

            {adminError && (
              <div role="alert" className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="px-6 py-6 flex flex-col gap-4">
              <div>
                <label htmlFor="admin-email" className="block text-[#212121] mb-1.5" style={{ fontSize: '0.85rem' }}>Correo</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="admin-email" type="email" required maxLength={50} autoComplete="username" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-[#212121] mb-1.5" style={{ fontSize: '0.85rem' }}>Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="admin-password" type={showAdminPassword ? 'text' : 'password'} required maxLength={72} autoComplete="current-password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                    style={{ fontSize: '0.875rem' }}
                  />
                  <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] transition-all shadow-md hover:shadow-lg active:scale-[0.98] mt-1" style={{ fontSize: '0.95rem' }}>
                Ingresar como administrador
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
