/**
 * @fileoverview Panel de administracion de pedidos.
 */
import { Link } from 'react-router';
import { useAdminOrdersController } from '../../controllers';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { ORDER_ESTADOS, formatPrice } from '../../utils';
import type { OrderEstado } from '../../models';

/** Resumen y gestion de pedidos en curso y finalizados. */
export function AdminOrdersPage() {
  const { orders, counts, isLoading, error, changeStatus } = useAdminOrdersController();

  const summary = [
    { label: 'Pendientes', value: counts.pendiente },
    { label: 'Preparando', value: counts.preparando },
    { label: 'En envio', value: counts.enviando },
    { label: 'Entregados', value: counts.entregado },
  ];

  return (
    <AdminPageShell active="pedidos" title="Administrar Pedidos" subtitle="Gestiona el estado de cada pedido">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[#C62828]" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{s.value}</p>
            <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error ? (
        <p className="text-center text-[#C62828] py-16">{error}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.ID_Pedido} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-[#212121] font-bold">Pedido #{order.ID_Pedido}</span>
                  <span className="text-gray-400 ml-3" style={{ fontSize: '0.8rem' }}>{order.Usuario_Nombre ?? order.Destinatario ?? ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge estado={order.Estado} />
                  {order.Metodo_Pago === 'Efectivo' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      Efectivo · cambio {formatPrice(Number(order.Cambio ?? 0))}
                    </span>
                  )}
                  <span className="text-[#C62828] font-bold">{formatPrice(order.Total)}</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
                Torre {order.Torre ?? '—'} · Piso {order.Piso ?? '—'} · Apto {order.Apartamento ?? '—'}
              </p>
              <OrderTracker estado={order.Estado} compact />
              <div className="flex items-center justify-between mt-4">
                <Link to={`/admin/pedidos/${order.ID_Pedido}`} className="text-[#C62828] hover:underline" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Ver detalle
                </Link>
                <select
                  value={order.Estado}
                  onChange={(e) => changeStatus(order.ID_Pedido, e.target.value as OrderEstado)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#C62828]"
                  style={{ fontSize: '0.8rem' }}
                >
                  {ORDER_ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
