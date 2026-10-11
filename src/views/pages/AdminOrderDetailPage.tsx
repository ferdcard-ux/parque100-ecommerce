/**
 * @fileoverview Detalle de un pedido para el panel admin.
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import type { ApiOrder, OrderEstado } from '../../models';
import { orderService, userService } from '../../services';
import { useApp } from '../../App';
import { useProductController, useRatingsController } from '../../controllers';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { SectionTitle } from '../components/shared/section-title';
import { StarRating } from '../components/shared/star-rating';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { CancelOrderModal } from '../components/shared/cancel-order-modal';
import { ORDER_ESTADOS, ADMIN_CANCEL_REASONS, formatPrice, ratingLabel } from '../../utils';

/** Extension del comprobante segun su dataURL (png por defecto). */
function receiptExtension(comprobante: string): string {
  const match = /^data:image\/(png|jpe?g|webp|gif)/i.exec(comprobante);
  const type = match?.[1]?.toLowerCase();
  if (type === 'jpeg' || type === 'jpg') return 'jpg';
  if (type === 'webp' || type === 'gif' || type === 'png') return type;
  return 'png';
}

/** Detalle admin de un pedido con cambio de estado y cancelacion con motivo. */
export function AdminOrderDetailPage() {  const { id } = useParams();
  const { user, isAdmin } = useApp();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(isAdmin);
  const orderNumericId = Number(id);
  const { ratings: orderRatings } = useRatingsController({
    pedido: Number.isInteger(orderNumericId) ? orderNumericId : undefined,
  });
  const { products } = useProductController();
  const envioReviews = orderRatings.filter((r) => r.Tipo === 'envio');

  useEffect(() => {
    if (isAdmin || !user) {
      setCanCancel(isAdmin);
      return;
    }
    userService.getPermissions(user.id).then((p) => setCanCancel(p.puede_cancelar)).catch(() => setCanCancel(false));
  }, [isAdmin, user?.id]);

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
      if (!canCancel) {
        setError('No tienes permiso para cancelar pedidos. Pide al administrador que te delegue el permiso.');
        return;
      }
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
      await orderService.cancel(order.ID_Pedido, motivo, isAdmin ? 'admin' : 'domiciliario', user?.id ?? null);
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
                {ORDER_ESTADOS.filter((estado) => canCancel || estado !== 'cancelado').map((estado) => (
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
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600" style={{ fontSize: '0.85rem' }}>
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400" style={{ fontSize: '0.7rem' }}>Comprobante Nequi</p>
                  <a
                    href={order.Comprobante}
                    download={`comprobante-pedido-${order.ID_Pedido}.${receiptExtension(order.Comprobante)}`}
                    className="bg-[#212121] hover:bg-black text-white rounded-full px-4 py-1.5 transition-colors"
                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Descargar imagen
                  </a>
                </div>
                <img src={order.Comprobante} alt="Comprobante de pago Nequi" className="w-full max-h-72 object-contain rounded-xl border border-gray-100 bg-[#F5F5F5]" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
            <SectionTitle>Productos</SectionTitle>
            <ul className="flex flex-col divide-y divide-gray-50 mb-3">
              {(order.detalles ?? []).map((item, idx) => {
                const catalog = products.find((p) => String(p.id) === String(item.ID_Producto));
                const name = item.Producto_Nombre ?? catalog?.name ?? String(item.ID_Producto);
                const qty = Number(item.Cantidad);
                const unit = qty > 0 ? Number(item.Subtotal) / qty : Number(item.Subtotal);
                return (
                  <li key={idx} className="py-3 flex items-center gap-3">
                    <ImageWithFallback
                      src={catalog?.image ?? ''}
                      alt={name}
                      className="w-12 h-12 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#212121] font-medium truncate" style={{ fontSize: '0.9rem' }}>{name}</p>
                      <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>x{qty} - {formatPrice(unit)} c/u</p>
                    </div>
                    <span className="font-semibold shrink-0">{formatPrice(Number(item.Subtotal))}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="border-t border-gray-100 pt-3" style={{ fontSize: '0.85rem' }}>
              <div className="flex justify-between text-gray-500"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between text-gray-500"><dt>Envio</dt><dd className="text-green-600">Gratis</dd></div>
              <div className="flex justify-between text-[#C62828] font-bold mt-1" style={{ fontSize: '1rem' }}><dt>Total</dt><dd>{formatPrice(order.Total)}</dd></div>
            </dl>
          </div>

          {envioReviews.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:col-span-2">
              <SectionTitle>Resena del servicio de envio</SectionTitle>
              <ul className="flex flex-col divide-y divide-gray-50">
                {envioReviews.map((r) => (
                  <li key={r.ID_Calificacion} className="py-3">
                    <p className="text-[#212121]" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {r.Usuario_Nombre?.trim() || 'Usuario'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating value={r.Estrellas} size={14} />
                      {ratingLabel(r.Estrellas) && (
                        <span className="text-[#f57f17]" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {ratingLabel(r.Estrellas)}
                        </span>
                      )}
                    </div>
                    {r.Comentario && <p className="text-gray-600 mt-1" style={{ fontSize: '0.85rem' }}>{r.Comentario}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {cancelOpen && order && canCancel && (
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
