/**
 * @fileoverview Panel de control de la cuenta del usuario.
 */
import { Link, useNavigate } from 'react-router';
import { User, MapPin, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../../App';

const SHORTCUTS = [
  { icon: User, title: 'Informacion de tu perfil', description: 'Consulta y edita tus datos personales', to: '/perfil', tile: 'bg-[#C62828]/10 text-[#C62828]' },
  { icon: MapPin, title: 'Direcciones', description: 'Administra tus direcciones de entrega', to: '/address', tile: 'bg-[#FBC02D]/20 text-[#f57f17]' },
  { icon: ShoppingBag, title: 'Tus compras', description: 'Revisa el estado de tus pedidos', to: '/compras', tile: 'bg-green-100 text-green-700' },
];

/** Pagina "Mi cuenta" con perfil resumido y accesos rapidos. */
export function AccountPage() {
  const { user, isLoggedIn, logout } = useApp();
  const navigate = useNavigate();

  if (!isLoggedIn || !user) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <h1 className="text-[#212121] mb-2" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Inicia sesion</h1>
          <p className="text-gray-400 mb-6" style={{ fontSize: '0.85rem' }}>Necesitas una cuenta para ver esta seccion.</p>
          <Link to="/login" className="inline-block bg-[#C62828] text-white rounded-full px-6 py-2.5" style={{ fontWeight: 600 }}>Ir al login</Link>
        </div>
      </main>
    );
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[#212121] mb-6" style={{ fontSize: '1.4rem', fontWeight: 700 }}>Mi cuenta</h1>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 mb-6">
          {user.photo ? (
            <img src={user.photo} alt="Foto de perfil" className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-100" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#C62828] flex items-center justify-center shrink-0">
              <span className="text-white font-bold" style={{ fontSize: '1.2rem' }}>{initials}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[#212121] font-semibold truncate">{user.firstName} {user.lastName}</p>
            <p className="text-gray-400 truncate" style={{ fontSize: '0.85rem' }}>{user.email}</p>
          </div>
          <Link to="/perfil" className="border border-gray-200 rounded-full px-4 py-1.5 text-[#212121] hover:bg-gray-50 transition-colors" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            Editar
          </Link>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {SHORTCUTS.map(({ icon: Icon, title, description, to, tile }) => (
            <Link key={to} to={to} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md hover:border-[#C62828]/20 transition-all">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${tile}`}><Icon size={20} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-[#212121] font-semibold" style={{ fontSize: '0.9rem' }}>{title}</span>
                <span className="block text-gray-400" style={{ fontSize: '0.78rem' }}>{description}</span>
              </span>
              <ChevronRight size={18} className="text-gray-300" />
            </Link>
          ))}
        </div>

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="w-full bg-white rounded-2xl border border-[#C62828]/20 text-[#C62828] p-4 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          style={{ fontWeight: 600 }}
        >
          <LogOut size={17} /> Cerrar sesion
        </button>
      </div>
    </main>
  );
}
