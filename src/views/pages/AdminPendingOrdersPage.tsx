/**
 * @fileoverview Pedidos pendientes de tomar (panel admin).
 */
import { Link } from 'react-router';
import { Package } from 'lucide-react';
import { useAdminOrdersController } from '../../controllers';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { formatPrice } from '../../utils';

/** Listado de pedidos con estado 'pendiente' listos para tomar. */
export function AdminPendingOrdersPage() {
  const { orders, isLoading, error, takeOrder } = useAdminOrdersController();
  const pending = orders.filter((o) => o.Estado === 'pendiente');

  return (
    <AdminPageShell active="pendientes" title="Pedidos Pendientes" subtitle={`${pending.length} pedidos esperando`}>
      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error ? (
        <p className="text-center text-[#C62828] py-16">{error}</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          No hay pedidos pendientes.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pending.map((order) => (
            <div key={order.ID_Pedido} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#212121] font-bold">Pedido #{order.ID_Pedido}</span>
                <span className="text-[#C62828] font-bold">{formatPrice(order.Total)}</span>
              </div>
              <dl className="text-gray-500 mb-4 flex flex-col gap-1" style={{ fontSize: '0.8rem' }}>
                <div className="flex justify-between"><dt>Cliente</dt><dd className="text-[#212121]">{order.Usuario_Nombre ?? order.Destinatario ?? '—'}</dd></div>
                <div className="flex justify-between"><dt>Ubicacion</dt><dd className="text-[#212121]">Torre {order.Torre ?? '—'} · Apto {order.Apartamento ?? '—'}</dd></div>
                <div className="flex justify-between"><dt>Pago</dt><dd className="text-[#212121]">{order.Metodo_Pago ?? '—'}</dd></div>
              </dl>
              <div className="flex gap-2">
                <button
                  onClick={() => takeOrder(order.ID_Pedido)}
                  className="flex-1 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full py-2 transition-colors"
                  style={{ fontSize: '0.8rem', fontWeight: 600 }}
                >
                  <Package size={14} className="inline mr-1" /> Tomar pedido
                </button>
                <Link to={`/admin/pedidos/${order.ID_Pedido}`} className="px-4 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors" style={{ fontSize: '0.8rem' }}>
                  Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
