/**
 * @fileoverview Campana de notificaciones de pedidos para usuarios.
 * Muestra los pedidos del usuario activo con su estado actual.
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { Bell } from 'lucide-react';
import type { ApiOrder } from '../../../models';
import { orderService } from '../../../services';
import { orderStatusMeta } from '../../../utils/constants';
import { formatPrice } from '../../../utils';

interface UserNotificationsProps {
  /** Id del usuario activo (null si no hay sesion). */
  userId: number | null;
}

/** Campana con el estado de los pedidos del usuario. */
export function UserNotifications({ userId }: UserNotificationsProps) {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId === null) {
      setOrders([]);
      return;
    }
    let cancelled = false;
    orderService
      .getAll()
      .then((all) => {
        if (!cancelled) setOrders(all.filter((o) => o.ID_Usuario === userId));
      })
      .catch(() => {
        /* sin notificaciones si el backend no responde */
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const active = orders.filter((o) => o.Estado !== 'entregado');

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="relative p-2 rounded-full hover:bg-red-50 transition-colors" aria-label="Notificaciones de pedidos">
        <Bell size={22} className="text-[#212121]" />
        {active.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#C62828] text-white flex items-center justify-center" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
            {active.length > 99 ? '99+' : active.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <p className="px-4 py-3 text-[#212121] font-semibold border-b border-gray-100" style={{ fontSize: '0.85rem' }}>
            Estado de tus pedidos ({orders.length})
          </p>
          <div className="max-h-72 overflow-y-auto">
            {orders.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>Aun no tienes pedidos.</p>
                <Link to="/catalogo" onClick={() => setOpen(false)} className="text-[#C62828] hover:underline" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Ir al catalogo
                </Link>
              </div>
            ) : (
              orders.map((o) => {
                const meta = orderStatusMeta(o.Estado);
                return (
                  <Link
                    key={o.ID_Pedido}
                    to={`/compras/${o.ID_Pedido}`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-[#F5F5F5] transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#212121] font-semibold" style={{ fontSize: '0.85rem' }}>Pedido #{o.ID_Pedido}</span>
                      <span className={`px-2 py-0.5 rounded-full border ${meta.badgeClass}`} style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{formatPrice(o.Total)}</p>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
