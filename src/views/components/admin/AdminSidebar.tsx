import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Package, ShoppingCart, Users, BarChart2, Settings, ClipboardList,
  Store, ChevronLeft, ChevronRight as ChevRight, LogOut, LayoutDashboard, Menu, X,
} from 'lucide-react';
import type { User, UserRole } from '../../../models';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/admin' },
  { key: 'inventario', icon: <Package size={18} />, label: 'Inventario', path: '/admin/inventario' },
  { key: 'pendientes', icon: <ShoppingCart size={18} />, label: 'Pedidos pendientes', path: '/admin/pedidos-pendientes' },
  { key: 'pedidos', icon: <ClipboardList size={18} />, label: 'Administrar pedidos', path: '/admin/pedidos' },
  { key: 'reportes', icon: <BarChart2 size={18} />, label: 'Reportes', path: '/admin/reportes' },
  { key: 'clientes', icon: <Users size={18} />, label: 'Clientes', path: '/admin/clientes' },
  { key: 'configuracion', icon: <Settings size={18} />, label: 'Configuración', path: '/admin/configuracion' },
];

/** Secciones visibles para el domiciliario (sin cancelaciones ni gestion). */
const DOMICILIARIO_KEYS = ['dashboard', 'pendientes', 'pedidos'];

interface AdminSidebarProps {
  /** Clave del item activo en el segundo plano. */
  active?: string;
  /** Cantidad de pedidos pendientes (badge en tiempo real). */
  pendingCount?: number;
  /** Rol del usuario (filtra las secciones visibles). */
  role?: UserRole | null;
  /** Cuenta con la sesión activa (se muestra en el pie). */
  user?: User | null;
  /** Cierra la sesión activa. */
  onLogout?: () => void;
}

/** Iniciales para el avatar (nombre o correo como respaldo). */
function initialsOf(user: User | null | undefined): string {
  const first = user?.firstName?.charAt(0) ?? '';
  const last = user?.lastName?.charAt(0) ?? '';
  const initials = `${first}${last}`.toUpperCase();
  if (initials) return initials;
  return (user?.email?.charAt(0) ?? 'A').toUpperCase();
}

/** Nombre visible y etiqueta de rol de la cuenta activa. */
function accountOf(user: User | null | undefined): { name: string; email: string; roleLabel: string } {
  if (!user) return { name: 'Administrador', email: 'admin@parque100.com', roleLabel: 'Administrador' };
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const roleLabel = user.isAdmin ? 'Administrador' : user.role === 'domiciliario' ? 'Domiciliario' : 'Cliente';
  return { name, email: user.email, roleLabel };
}

export function AdminSidebar({ active = 'dashboard', pendingCount = 0, role = 'admin', user = null, onLogout }: AdminSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const items = role === 'domiciliario' ? SIDEBAR_ITEMS.filter((item) => DOMICILIARIO_KEYS.includes(item.key)) : SIDEBAR_ITEMS;
  const account = accountOf(user);

  /** Cierra la sesión activa y vuelve a la tienda. */
  const handleLogout = () => {
    onLogout?.();
    setMobileOpen(false);
    navigate('/');
  };

  /** Bloque de cuenta: refleja siempre la sesión activa. */
  const accountBlock = (showName: boolean) => (
    <div className="flex items-center gap-2 mb-3 px-1">
      {user?.photo ? (
        <img src={user.photo} alt={`Foto de ${account.name}`} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-[#C62828] flex items-center justify-center shrink-0">
          <span className="text-white font-bold" style={{ fontSize: '0.7rem' }}>{initialsOf(user)}</span>
        </div>
      )}
      {showName && (
        <div className="min-w-0">
          <p className="text-white font-medium truncate" style={{ fontSize: '0.78rem' }}>{account.name}</p>
          <p className="text-white/40 truncate" style={{ fontSize: '0.68rem' }}>{account.email} · {account.roleLabel}</p>
        </div>
      )}
    </div>
  );

  const nav = (onNavigate?: () => void) => (
    <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl transition-all min-h-11 ${
            item.key === active ? 'bg-[#C62828] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
          }`}
        >
          <span className="shrink-0">{item.icon}</span>
          {(sidebarOpen || onNavigate) && <span style={{ fontSize: '0.875rem' }}>{item.label}</span>}
          {item.key === 'pendientes' && pendingCount > 0 && (
            <span
              className="ml-auto min-w-6 h-6 px-1.5 rounded-full bg-[#C62828] text-white flex items-center justify-center font-bold"
              style={{ fontSize: '0.7rem' }}
              aria-label={`${pendingCount} pedidos pendientes`}
            >
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} hidden md:flex bg-[#212121] h-screen sticky top-0 flex-col transition-all duration-300 shrink-0 overflow-hidden`}>
        <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FBC02D, #C62828)' }}>
                <Store size={14} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold block" style={{ fontSize: '0.8rem' }}>Parque 100</span>
                <span className="text-white/40" style={{ fontSize: '0.65rem' }}>Admin Panel</span>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white transition-colors ml-auto min-w-11 min-h-11 flex items-center justify-center" aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}>
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevRight size={18} />}
          </button>
        </div>

        {nav()}

        <div className="border-t border-white/10 p-3">
          {sidebarOpen && accountBlock(true)}
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all w-full min-h-11">
            <LogOut size={16} className="shrink-0" />
            {sidebarOpen && <span style={{ fontSize: '0.8rem' }}>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú de administración"
        className="md:hidden fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-[#212121] text-white shadow-xl flex items-center justify-center"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menú de administración">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[80vw] bg-[#212121] flex flex-col overflow-hidden">
            <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #FBC02D, #C62828)' }}>
                  <Store size={14} className="text-white" />
                </div>
                <div>
                  <span className="text-white font-bold block" style={{ fontSize: '0.8rem' }}>Parque 100</span>
                  <span className="text-white/40" style={{ fontSize: '0.65rem' }}>Admin Panel</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white min-w-11 min-h-11 flex items-center justify-center" aria-label="Cerrar menú">
                <X size={18} />
              </button>
            </div>

            {nav(() => setMobileOpen(false))}

            <div className="border-t border-white/10 p-3">
              {accountBlock(true)}
              <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all w-full min-h-11">
                <LogOut size={16} className="shrink-0" />
                <span style={{ fontSize: '0.8rem' }}>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
