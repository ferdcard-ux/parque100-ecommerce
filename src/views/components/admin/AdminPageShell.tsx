/**
 * @fileoverview Estructura comun de las paginas del panel admin.
 */
import { Link, useNavigate } from 'react-router';
import { Bell, Home } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ApiOrder } from '../../../models';
import { orderService } from '../../../services';
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
}

/** Layout estandar del panel: sidebar oscuro + topbar + contenido. */
export function AdminPageShell({ active, title, subtitle, children }: AdminPageShellProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const [pending, setPending] = useState<ApiOrder[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const loadPending = () => {
      orderService.getAll().then((all) => {
        if (!cancelled) setPending(all.filter((o) => o.Estado === 'pendiente'));
      }).catch(() => {});
    };
    loadPending();
    const timer = setInterval(loadPending, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      <AdminSidebar active={active} pendingCount={pending.length} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-[#212121]" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{title}</h1>
            {subtitle && <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[#212121] hover:bg-gray-50 transition-colors font-medium" style={{ fontSize: '0.8rem' }}>
              <Home size={14} /> Ver tienda
            </Link>
            <div className="relative" ref={bellRef}>
              <button onClick={() => setBellOpen((v) => !v)} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Notificaciones">
                <Bell size={18} className="text-gray-500" />
                {pending.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#C62828] rounded-full" />}
              </button>
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <p className="px-4 py-3 text-[#212121] font-semibold border-b border-gray-100" style={{ fontSize: '0.85rem' }}>
                    Pedidos pendientes ({pending.length})
                  </p>
                  <div className="max-h-64 overflow-y-auto">
                    {pending.length === 0 ? (
                      <p className="px-4 py-6 text-gray-400 text-center" style={{ fontSize: '0.8rem' }}>Sin pedidos pendientes.</p>
                    ) : (
                      pending.map((o) => (
                        <button
                          key={o.ID_Pedido}
                          onClick={() => { setBellOpen(false); navigate(`/admin/pedidos/${o.ID_Pedido}`); }}
                          className="w-full text-left px-4 py-3 hover:bg-[#F5F5F5] transition-colors border-b border-gray-50"
                        >
                          <p className="text-[#212121]" style={{ fontSize: '0.85rem' }}>Pedido #{o.ID_Pedido} · {o.Usuario_Nombre ?? 'Cliente'}</p>
                          <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
                            {o.Metodo_Pago === 'Efectivo' ? 'EFECTIVO · ' : ''}Total: ${o.Total.toLocaleString('es-CO')}
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
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
