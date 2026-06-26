import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Store } from 'lucide-react';
import type { RegisterData } from '../../../models';
import { isValidEmail, isValidPassword } from '../../../utils';

interface RegisterFormProps {
  onRegister: (data: RegisterData) => Promise<void>;
}

export function RegisterForm({ onRegister }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(form.email)) {
      setError('Correo electrónico inválido');
      return;
    }
    if (!isValidPassword(form.password)) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister(form);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden flex items-center justify-center px-4 py-8">
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-5" style={{ background: '#C62828', transform: 'translate(20%, -20%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5" style={{ background: '#FBC02D', transform: 'translate(-20%, 20%)' }} />

      <div className="w-full max-w-2xl relative z-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-[#212121] hover:text-[#C62828] mb-4 transition-colors font-medium">
          <ArrowLeft size={18} />
          <span style={{ fontSize: '0.9rem' }}>Volver al inicio de sesión</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FBC02D, #C62828)' }}>
              <Store className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-[#212121] font-bold" style={{ fontSize: '1.3rem' }}>Crear cuenta</h1>
              <p className="text-gray-500" style={{ fontSize: '0.85rem' }}>Únete a Tienda Parque 100 hoy</p>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 rounded-full bg-[#FBC02D]" />
                <h2 className="text-[#212121]" style={{ fontSize: '1rem' }}>Información personal</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Nombre *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="Tu nombre"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Apellido *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Tu apellido"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                      style={{ fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Correo electrónico *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                    style={{ fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 mt-6">
                <div className="w-1 h-6 rounded-full bg-[#FBC02D]" />
                <h2 className="text-[#212121]" style={{ fontSize: '1rem' }}>Seguridad</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Contraseña *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" required value={form.password} onChange={handleChange} placeholder="Mín. 8 caracteres"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                      style={{ fontSize: '0.9rem' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Confirmar contraseña *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type={showConfirm ? 'text' : 'password'} name="confirm" required value={form.confirm} onChange={handleChange} placeholder="Repite tu contraseña"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] transition-all"
                      style={{ fontSize: '0.9rem' }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[#C62828] cursor-pointer shrink-0" />
                <span className="text-gray-500" style={{ fontSize: '0.875rem' }}>
                  Acepto los{' '}
                  <span className="text-[#C62828] hover:underline cursor-pointer">Términos y Condiciones</span>
                  {' '}y la{' '}
                  <span className="text-[#C62828] hover:underline cursor-pointer">Política de Privacidad</span>
                </span>
              </label>

              <button type="submit" disabled={!terms || isSubmitting}
                className="w-full py-3.5 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                style={{ fontSize: '1rem' }}
              >
                {isSubmitting ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>

            <p className="text-center text-gray-500 mt-4" style={{ fontSize: '0.875rem' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-[#C62828] hover:underline font-medium">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
