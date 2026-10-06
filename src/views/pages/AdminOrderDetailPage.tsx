/**
 * @fileoverview Detalle de un pedido para el panel admin.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import type { ApiOrder, OrderEstado } from '../../models';
import { orderService } from '../../services';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { SectionTitle } from '../components/shared/section-title';
import { ORDER_ESTADOS, formatPrice } from '../../utils';

/** Detalle admin de un pedido con cambio de estado. */
export function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    orderService
      .getById(id ?? '')
      .then((data) => {
        if (cancelled) return;
        if (data === null) setError('Pedido no encontrado.');
        setOrder(data);
      })
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Error al cargar.'))
      .finally(() => !cancelled && setIsLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const changeStatus = async (estado: OrderEstado) => {
    if (!order) return;
    await orderService.updateStatus(order.ID_Pedido, estado);
    setOrder({ ...order, Estado: estado });
  };

  const subtotal = (order?.detalles ?? []).reduce((sum, d) => sum + Number(d.Subtotal), 0);

  return (
    <AdminPageShell active="pedidos" title={`Pedido #${id ?? ''}`} subtitle="Detalle y gestion del pedido">
      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error || !order ? (
        <p className="text-center text-[#C62828] py-16">{error ?? 'Pedido no encontrado.'}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionTitle>Estado</SectionTitle>
            <div className="flex items-center justify-between mb-4">
              <StatusBadge estado={order.Estado} />
              <select
                value={order.Estado}
                onChange={(e) => changeStatus(e.target.value as OrderEstado)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#C62828]"
                style={{ fontSize: '0.8rem' }}
              >
                {ORDER_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
            <OrderTracker estado={order.Estado} compact />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionTitle>Cliente y entrega</SectionTitle>
            <dl className="grid grid-cols-2 gap-3 text-gray-600" style={{ fontSize: '0.85rem' }}>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Cliente</dt><dd>{order.Destinatario ?? order.Usuario_Nombre ?? '—'}</dd></div>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Telefono</dt><dd>{order.Telefono ?? '—'}</dd></div>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Direccion</dt><dd>Torre {order.Torre ?? '—'}, Piso {order.Piso ?? '—'}, Apto {order.Apartamento ?? '—'}</dd></div>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Pago</dt><dd>{order.Metodo_Pago ?? '—'}</dd></div>
            </dl>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
            <SectionTitle>Productos</SectionTitle>
            <ul className="flex flex-col divide-y divide-gray-50 mb-3">
              {(order.detalles ?? []).map((item, idx) => (
                <li key={idx} className="py-3 flex items-center justify-between">
                  <span className="text-[#212121]" style={{ fontSize: '0.9rem' }}>{item.Producto_Nombre ?? item.ID_Producto} x{item.Cantidad}</span>
                  <span className="font-semibold">{formatPrice(Number(item.Subtotal))}</span>
                </li>
              ))}
            </ul>
            <dl className="border-t border-gray-100 pt-3" style={{ fontSize: '0.85rem' }}>
              <div className="flex justify-between text-gray-500"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between text-gray-500"><dt>Envio</dt><dd className="text-green-600">Gratis</dd></div>
              <div className="flex justify-between text-[#C62828] font-bold mt-1" style={{ fontSize: '1rem' }}><dt>Total</dt><dd>{formatPrice(order.Total)}</dd></div>
            </dl>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
