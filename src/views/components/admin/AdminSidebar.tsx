import { useState } from 'react';
import { Link } from 'react-router';
import {
  Package, ShoppingCart, Users, BarChart2, Settings,
  Store, ChevronLeft, ChevronRight as ChevRight, LogOut, LayoutDashboard,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { key: 'inventario', icon: <Package size={18} />, label: 'Inventario', path: '/admin' },
  { key: 'pendientes', icon: <ShoppingCart size={18} />, label: 'Pedidos pendientes', path: '/admin/pedidos-pendientes' },
  { key: 'pedidos', icon: <LayoutDashboard size={18} />, label: 'Administrar pedidos', path: '/admin/pedidos' },
  { key: 'reportes', icon: <BarChart2 size={18} />, label: 'Reportes', path: '/admin/reportes' },
  { key: 'clientes', icon: <Users size={18} />, label: 'Clientes', path: '/admin/clientes' },
  { key: 'configuracion', icon: <Settings size={18} />, label: 'Configuración', path: '/admin/configuracion' },
];

interface AdminSidebarProps {
  /** Clave del item activo en el segundo plano. */
  active?: string;
}

export function AdminSidebar({ active = 'inventario' }: AdminSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-[#212121] min-h-screen flex flex-col transition-all duration-300 shrink-0`}>
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
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/40 hover:text-white transition-colors ml-auto">
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevRight size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {SIDEBAR_ITEMS.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              item.key === active ? 'bg-[#C62828] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {sidebarOpen && <span style={{ fontSize: '0.875rem' }}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {sidebarOpen && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-7 h-7 rounded-full bg-[#C62828] flex items-center justify-center shrink-0">
              <span className="text-white font-bold" style={{ fontSize: '0.7rem' }}>AD</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium truncate" style={{ fontSize: '0.78rem' }}>Administrador</p>
              <p className="text-white/40 truncate" style={{ fontSize: '0.68rem' }}>admin@parque100.com</p>
            </div>
          </div>
        )}
        <Link to="/login">
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/40 hover:bg-white/5 hover:text-white transition-all w-full">
            <LogOut size={16} className="shrink-0" />
            {sidebarOpen && <span style={{ fontSize: '0.8rem' }}>Cerrar sesión</span>}
          </button>
        </Link>
      </div>
    </aside>
  );
}
