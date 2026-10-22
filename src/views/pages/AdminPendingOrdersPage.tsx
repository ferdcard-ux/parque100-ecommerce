/**
 * @fileoverview Pedidos pendientes de tomar (panel admin).
 */
import { Link } from 'react-router';
import { Package, TriangleAlert } from 'lucide-react';
import { useAdminOrdersController } from '../../controllers';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { formatPrice, isApprovedDemoPayment, isDemoPaymentMethod } from '../../utils';

/** Listado de pedidos con estado 'pendiente' listos para tomar. */
export function AdminPendingOrdersPage() {
  const { orders, isLoading, error, takeOrder } = useAdminOrdersController();
  const pending = orders.filter((o) => o.Estado === 'pendiente');

  return (
    <AdminPageShell active="pendientes" title="Pedidos Pendientes" subtitle={`${pending.length} pedidos esperando`}>
      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error ? (
        <p className="text-center text-brand-red py-16">{error}</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          No hay pedidos pendientes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pending.map((order) => {
            const isDemoOrder = isDemoPaymentMethod(order.Metodo_Pago);
            const demoApproved = isApprovedDemoPayment(order.Metodo_Pago, order.Estado_Pago_DEMO);
            const blockedDemo = isDemoOrder && !demoApproved;
            return (
            <div key={order.ID_Pedido} className="bg-white rounded-2xl border border-gray-100 p-5">
              {isDemoOrder && (
                <p role="alert" className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {demoApproved
                    ? 'SIMULACION: aprobacion ficticia; sin cobro real. Inventario actualizado.'
                    : 'SIMULACION historica sin transaccion aprobada; no despachable.'}
                </p>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-brand-ink font-bold">Pedido #{order.ID_Pedido}</span>
                <span className="text-brand-red font-bold">{formatPrice(order.Total)}</span>
              </div>
              {order.Metodo_Pago === 'Efectivo' && (
                <p role="alert" className="flex items-center gap-2 mb-3 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-amber-800" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  <TriangleAlert size={14} className="shrink-0" />
                  Efectivo: llevar cambio de {formatPrice(Number(order.Cambio ?? 0))}
                </p>
              )}
              <dl className="text-gray-500 mb-4 flex flex-col gap-1" style={{ fontSize: '0.8rem' }}>
                <div className="flex justify-between"><dt>Cliente</dt><dd className="text-brand-ink">{order.Usuario_Nombre ?? order.Destinatario ?? '—'}</dd></div>
                <div className="flex justify-between"><dt>Ubicacion</dt><dd className="text-brand-ink">Torre {order.Torre ?? '—'} · Apto {order.Apartamento ?? '—'}</dd></div>
                <div className="flex justify-between"><dt>Pago</dt><dd className="text-brand-ink">{order.Metodo_Pago ?? '—'}</dd></div>
                {order.Referencia_Pago_DEMO && <div className="flex justify-between"><dt>Referencia DEMO</dt><dd className="text-brand-ink break-all">{order.Referencia_Pago_DEMO}</dd></div>}
              </dl>
              <div className="flex gap-2">
                <button
                  onClick={() => takeOrder(order.ID_Pedido)}
                  disabled={blockedDemo}
                  title={blockedDemo ? 'La transaccion demo no esta aprobada' : undefined}
                  className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white rounded-full py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Package size={14} className="inline mr-1" /> {blockedDemo ? 'No despachable' : isDemoOrder ? 'Tomar pedido DEMO' : 'Tomar pedido'}
                </button>
                <Link to={`/admin/pedidos/${order.ID_Pedido}`} className="px-4 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors" style={{ fontSize: '0.8rem' }}>
                  Ver
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
