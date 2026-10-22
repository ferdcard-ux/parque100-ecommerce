/**
 * @fileoverview Estructura comun de las paginas del panel admin.
 */
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Bell, Home } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useApp } from '../../../App';
import { useAdminOrdersController } from '../../../controllers';
import { isDemoPaymentMethod } from '../../../utils';
import { AdminSidebar } from './AdminSidebar';

interface AdminPageShellProps {
  /** Clave del item activo del sidebar. */
  active: string;
  /** Titulo de la cabecera. */
  title: string;
  /** Subtitulo de la cabecera. */
  subtitle?: string;
  /** Contenido de la pagina. */
  children: ReactNode;
  /** Ruta del boton de regreso (opcional). */
  backTo?: string;
}

/** Layout estandar del panel: sidebar oscuro + topbar + contenido. */
export function AdminPageShell({ active, title, subtitle, children, backTo }: AdminPageShellProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const { orders, reload } = useAdminOrdersController();
  const pending = orders.filter((o) => o.Estado === 'pendiente');
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { userRole, user, logout } = useApp();

  useEffect(() => {
    const timer = setInterval(reload, 15000);
    return () => clearInterval(timer);
  }, [reload]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="min-h-screen bg-brand-surface flex h-screen overflow-hidden">
      <AdminSidebar
        active={active}
        pendingCount={pending.length}
        role={userRole}
        user={user}
        onLogout={() => { logout(); navigate('/'); }}
      />
      <main className="flex-1 min-w-0 overflow-y-auto h-screen">
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="min-w-0 flex items-center gap-3">
            {backTo && (
              <Link to={backTo} aria-label="Volver" className="relative w-11 h-11 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0 before:absolute before:-inset-1 before:content-['']">
                <ArrowLeft size={17} className="text-brand-ink" />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-brand-ink truncate" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h1>
              {subtitle && <p className={`${active === 'dashboard' ? 'text-brand-muted' : 'text-gray-400'} truncate`} style={{ fontSize: '0.75rem' }}>{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-brand-ink hover:bg-gray-50 transition-colors font-medium" style={{ fontSize: '0.8rem' }}>
              <Home size={14} /> Ver tienda
            </Link>
            <div className="relative" ref={bellRef}>
              <button onClick={() => setBellOpen((v) => !v)} className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${active === 'dashboard' ? 'min-w-11 min-h-11 flex items-center justify-center' : ''}`} aria-label="Notificaciones" aria-expanded={bellOpen}>
                <Bell size={18} className="text-gray-500" />
                {pending.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-brand-red rounded-full" />}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <p className="px-4 py-3 text-brand-ink font-semibold border-b border-gray-100" style={{ fontSize: '0.85rem' }}>
                    Pedidos pendientes ({pending.length})
                  </p>
                  <div className="max-h-64 overflow-y-auto">
                    {pending.length === 0 ? (
                      <p className={`px-4 py-6 ${active === 'dashboard' ? 'text-brand-muted' : 'text-gray-400'} text-center`} style={{ fontSize: '0.8rem' }}>Sin pedidos pendientes.</p>
                    ) : (
                      pending.map((o) => (
                        <button
                          key={o.ID_Pedido}
                          onClick={() => { setBellOpen(false); navigate(`/admin/pedidos/${o.ID_Pedido}`); }}
                          className="w-full text-left px-4 py-3 hover:bg-brand-surface transition-colors border-b border-gray-50"
                        >
                          <p className="text-brand-ink" style={{ fontSize: '0.85rem' }}>Pedido #{o.ID_Pedido} · {o.Usuario_Nombre ?? 'Cliente'}</p>
                          <p className={active === 'dashboard' ? 'text-brand-muted' : 'text-gray-400'} style={{ fontSize: '0.75rem' }}>
                            {isDemoPaymentMethod(o.Metodo_Pago) ? 'SIMULACION · Total de referencia: ' : o.Metodo_Pago === 'Efectivo' ? 'EFECTIVO · ' : ''}${o.Total.toLocaleString('es-CO')}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6 min-w-0">{children}</div>
      </main>
    </div>
  );
}
