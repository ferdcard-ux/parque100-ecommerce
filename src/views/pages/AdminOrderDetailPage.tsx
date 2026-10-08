/**
 * @fileoverview Detalle de un pedido para el panel admin.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import type { ApiOrder, OrderEstado } from '../../models';
import { orderService } from '../../services';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { SectionTitle } from '../components/shared/section-title';
import { CancelOrderModal } from '../components/shared/cancel-order-modal';
import { ORDER_ESTADOS, ADMIN_CANCEL_REASONS, formatPrice } from '../../utils';

/** Detalle admin de un pedido con cambio de estado y cancelacion con motivo. */
export function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
    if (estado === 'cancelado') {
      setCancelError(null);
      setCancelOpen(true);
      return;
    }
    if (order.Estado === 'cancelado') {
      setError('Un pedido cancelado no se puede reanudar.');
      return;
    }
    try {
      await orderService.updateStatus(order.ID_Pedido, estado);
      setOrder({ ...order, Estado: estado });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el estado.');
    }
  };

  const handleCancel = async (motivo: string) => {
    if (!order) return;
    setCancelError(null);
    setSaving(true);
    try {
      await orderService.cancel(order.ID_Pedido, motivo);
      setOrder({ ...order, Estado: 'cancelado', Motivo_Cancelacion: motivo });
      setCancelOpen(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No fue posible cancelar.');
    } finally {
      setSaving(false);
    }
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
          {order.Metodo_Pago === 'Efectivo' && (
            <div role="alert" className="lg:col-span-2 flex gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <TriangleAlert size={22} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Pago en efectivo: recibir {formatPrice(Number(order.Monto_Recibido ?? 0))} y
                enviar el cambio de {formatPrice(Number(order.Cambio ?? 0))} con el pedido.
              </p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionTitle>Estado</SectionTitle>
            <div className="flex items-center justify-between mb-4">
              <StatusBadge estado={order.Estado} />
              <select
                value={order.Estado}
                disabled={order.Estado === 'cancelado'}
                title={order.Estado === 'cancelado' ? 'Un pedido cancelado no se puede reanudar' : undefined}
                onChange={(e) => changeStatus(e.target.value as OrderEstado)}
                className="border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#C62828] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '0.8rem' }}
              >
                {ORDER_ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>{estado === 'cancelado' ? 'cancelado (con motivo)' : estado}</option>
                ))}
              </select>
            </div>
            {order.Estado === 'cancelado' ? (
              <div role="alert" className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <TriangleAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cancelado: {order.Motivo_Cancelacion ?? '—'}</p>
                  <p className="text-red-600 mt-0.5" style={{ fontSize: '0.75rem' }}>Proceder con la devolución del pago según lo acordado con el cliente.</p>
                </div>
              </div>
            ) : (
              <OrderTracker estado={order.Estado} compact />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionTitle>Cliente y entrega</SectionTitle>
            <dl className="grid grid-cols-2 gap-3 text-gray-600" style={{ fontSize: '0.85rem' }}>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Cliente</dt><dd>{order.Destinatario ?? order.Usuario_Nombre ?? '—'}</dd></div>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Telefono</dt><dd>{order.Telefono ?? '—'}</dd></div>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Direccion</dt><dd>Torre {order.Torre ?? '—'}, Piso {order.Piso ?? '—'}, Apto {order.Apartamento ?? '—'}</dd></div>
              <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Pago</dt><dd>{order.Metodo_Pago ?? '—'}</dd></div>
              {order.Metodo_Pago === 'Efectivo' && (
                <>
                  <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Recibido</dt><dd>{formatPrice(Number(order.Monto_Recibido ?? 0))}</dd></div>
                  <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Cambio</dt><dd>{formatPrice(Number(order.Cambio ?? 0))}</dd></div>
                </>
              )}
            </dl>
            {order.Comprobante && (
              <div className="mt-4">
                <p className="text-gray-400 mb-2" style={{ fontSize: '0.7rem' }}>Comprobante Nequi</p>
                <img src={order.Comprobante} alt="Comprobante de pago Nequi" className="w-full max-h-72 object-contain rounded-xl border border-gray-100 bg-[#F5F5F5]" />
              </div>
            )}
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
      {cancelOpen && order && (
        <CancelOrderModal
          orderId={order.ID_Pedido}
          saving={saving}
          error={cancelError}
          reasons={ADMIN_CANCEL_REASONS}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
        />
      )}
    </AdminPageShell>
  );
}
