/**
 * @fileoverview Detalle de un pedido del usuario.
 */
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import type { ApiOrder, RatingType } from '../../models';
import { orderService } from '../../services';
import { useApp } from '../../App';
import { useRatingsController } from '../../controllers';
import { PageHeader } from '../components/shared/page-header';
import { SectionTitle } from '../components/shared/section-title';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { StarRating } from '../components/shared/star-rating';
import { DISPATCH_DELAY_WARNING, CANCEL_REFUND_NOTICE, formatPrice } from '../../utils';

/** Formatea fecha y hora legibles. */
function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return value;
  }
}

/** Detalle completo de un pedido: estado, productos, totales y entrega. */
export function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useApp();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderId = Number(id);
  const { ratings, isSaving, rate } = useRatingsController({ pedido: Number.isInteger(orderId) ? orderId : undefined });
  const [stars, setStars] = useState(5);
  const [kind, setKind] = useState<RatingType>('pedido');
  const [comment, setComment] = useState('');
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateOk, setRateOk] = useState(false);

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateError(null);
    setRateOk(false);
    try {
      await rate({
        ID_Usuario: user?.id ?? null,
        ID_Pedido: orderId,
        Tipo: kind,
        Estrellas: stars,
        Comentario: comment.trim(),
      });
      setComment('');
      setRateOk(true);
    } catch (err) {
      setRateError(err instanceof Error ? err.message : 'No fue posible guardar.');
    }
  };

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

  const subtotal = (order?.detalles ?? []).reduce((sum, d) => sum + Number(d.Subtotal), 0);

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Detalle del pedido" subtitle={order ? `Pedido #${order.ID_Pedido} · ${formatDateTime(order.Fecha)}` : undefined} backTo="/compras" />

        {isLoading ? (
          <p className="text-center text-gray-400 py-16">Cargando...</p>
        ) : error || !order ? (
          <p className="text-center text-[#C62828] py-16">{error ?? 'Pedido no encontrado.'}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {order.Estado !== 'entregado' && (
              <div role="alert" className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <TriangleAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800" style={{ fontSize: '0.85rem' }}>{DISPATCH_DELAY_WARNING}</p>
              </div>
            )}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Estado del pedido</SectionTitle>
                <StatusBadge estado={order.Estado} />
              </div>
              {order.Estado === 'cancelado' ? (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-700" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Motivo: {order.Motivo_Cancelacion ?? '—'}</p>
                  <p className="text-red-600 mt-1" style={{ fontSize: '0.8rem' }}>{CANCEL_REFUND_NOTICE}</p>
                </div>
              ) : (
                <OrderTracker estado={order.Estado} />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <SectionTitle>Productos</SectionTitle>
              <ul className="flex flex-col divide-y divide-gray-50">
                {(order.detalles ?? []).map((item, idx) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[#212121] font-medium" style={{ fontSize: '0.9rem' }}>{item.Producto_Nombre ?? item.ID_Producto}</p>
                      <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>x{item.Cantidad}</p>
                    </div>
                    <span className="text-[#212121] font-semibold">{formatPrice(Number(item.Subtotal))}</span>
                  </li>
                ))}
              </ul>
              <dl className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-1" style={{ fontSize: '0.85rem' }}>
                <div className="flex justify-between text-gray-500"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
                <div className="flex justify-between text-gray-500"><dt>Envio</dt><dd className="text-green-600 font-medium">Gratis</dd></div>
                <div className="flex justify-between text-[#C62828] font-bold mt-1" style={{ fontSize: '1rem' }}><dt>Total</dt><dd>{formatPrice(order.Total)}</dd></div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <SectionTitle>Informacion de entrega</SectionTitle>
              <dl className="grid grid-cols-2 gap-3 text-gray-600" style={{ fontSize: '0.85rem' }}>
                <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Destinatario</dt><dd>{order.Destinatario ?? '—'}</dd></div>
                <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Telefono</dt><dd>{order.Telefono ?? '—'}</dd></div>
                <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Torre</dt><dd>{order.Torre ?? '—'}</dd></div>
                <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Piso</dt><dd>{order.Piso ?? '—'}</dd></div>
                <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Apartamento</dt><dd>{order.Apartamento ?? '—'}</dd></div>
                <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Metodo de pago</dt><dd>{order.Metodo_Pago ?? '—'}</dd></div>
                {order.Metodo_Pago === 'Efectivo' && (
                  <>
                    <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Efectivo recibido</dt><dd>{formatPrice(Number(order.Monto_Recibido ?? 0))}</dd></div>
                    <div><dt className="text-gray-400" style={{ fontSize: '0.7rem' }}>Tu cambio</dt><dd>{formatPrice(Number(order.Cambio ?? 0))}</dd></div>
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

            {order.Estado === 'entregado' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <SectionTitle>Califica tu pedido y el envio</SectionTitle>
                <form onSubmit={handleRate} className="flex flex-col gap-3 mt-3">
                  <div className="flex items-center gap-3">
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value as RatingType)}
                      className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#C62828]"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="pedido">El pedido</option>
                      <option value="envio">El repartidor / envio</option>
                    </select>
                    <StarRating value={stars} editable onChange={setStars} />
                  </div>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={255}
                    placeholder="Comentario opcional"
                    className="border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#C62828]"
                    style={{ fontSize: '0.85rem' }}
                  />
                  {rateError && <p className="text-[#C62828]" style={{ fontSize: '0.8rem' }}>{rateError}</p>}
                  {rateOk && <p className="text-green-600" style={{ fontSize: '0.8rem' }}>Calificacion guardada.</p>}
                  <button
                    type="submit"
                    disabled={isSaving || !Number.isInteger(orderId)}
                    className="w-fit bg-[#212121] hover:bg-black disabled:opacity-60 text-white rounded-full px-6 py-2 transition-colors"
                    style={{ fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {isSaving ? 'Guardando...' : 'Enviar calificacion'}
                  </button>
                </form>
                {ratings.length > 0 && (
                  <ul className="mt-4 flex flex-col divide-y divide-gray-50">
                    {ratings.slice(0, 5).map((r) => (
                      <li key={r.ID_Calificacion} className="py-2 flex items-center gap-3">
                        <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>{r.Tipo}</span>
                        <StarRating value={r.Estrellas} size={14} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
