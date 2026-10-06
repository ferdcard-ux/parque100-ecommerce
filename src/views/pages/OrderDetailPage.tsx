/**
 * @fileoverview Detalle de un pedido del usuario.
 */
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import type { ApiOrder } from '../../models';
import { orderService } from '../../services';
import { PageHeader } from '../components/shared/page-header';
import { SectionTitle } from '../components/shared/section-title';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { formatPrice } from '../../utils';

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
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Estado del pedido</SectionTitle>
                <StatusBadge estado={order.Estado} />
              </div>
              <OrderTracker estado={order.Estado} />
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
              </dl>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
