/**
 * @fileoverview Historial de compras del usuario.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '../../App';
import { useOrdersController } from '../../controllers';
import { orderService } from '../../services';
import { PageHeader } from '../components/shared/page-header';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { EmptyState } from '../components/shared/empty-state';
import { CancelOrderModal } from '../components/shared/cancel-order-modal';
import { CANCEL_REFUND_NOTICE, formatPrice } from '../../utils';

/** Formatea la fecha ISO a estilo legible (ej. 10 de diciembre de 2024). */
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return value;
  }
}

/** Lista de pedidos del usuario con tracker, cancelacion con motivo y reembolso. */
export function OrdersPage() {
  const { user, isLoggedIn } = useApp();
  const navigate = useNavigate();
  const { orders, isLoading, error, reload } = useOrdersController(user?.id ?? null);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async (motivo: string) => {
    if (cancelId === null) return;
    setCancelError(null);
    setSaving(true);
    try {
      await orderService.cancel(cancelId, motivo, 'cliente', user?.id ?? null);
      setCancelId(null);
      await reload();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No fue posible cancelar.');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
        <p className="text-center text-gray-400 py-16">Inicia sesion para ver tus compras.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Mis compras" subtitle="Revisa el estado de tus pedidos" backTo="/cuenta" />

        {cancelError && (
          <p className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>{cancelError}</p>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-4" aria-label="Cargando pedidos">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-4" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse" />
                      <div className="h-3 w-12 bg-gray-100 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-[#C62828] py-16">{error}</p>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aun no tienes compras"
            description="Cuando realices un pedido aparecera aqui."
            action={<Link to="/catalogo" className="bg-[#C62828] text-white rounded-full px-6 py-2.5" style={{ fontWeight: 600 }}>Ir al catalogo</Link>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const cancellable = order.Estado === 'pendiente' || order.Estado === 'preparando';
              const locked = order.Estado === 'enviando';
              return (
              <div
                key={order.ID_Pedido}
                onClick={() => navigate(`/compras/${order.ID_Pedido}`)}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#C62828]/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#212121] font-bold">Pedido #{order.ID_Pedido}</span>
                  <StatusBadge estado={order.Estado} />
                </div>
                <div className="flex items-center justify-between text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
                  <span>{formatDate(order.Fecha)}</span>
                  <span className="text-[#C62828] font-bold" style={{ fontSize: '1rem' }}>{formatPrice(order.Total)}</span>
                </div>
                {order.Estado === 'cancelado' ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-1">
                    <p className="text-red-700" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Motivo: {order.Motivo_Cancelacion ?? '—'}</p>
                    <p className="text-red-600 mt-1" style={{ fontSize: '0.75rem' }}>{CANCEL_REFUND_NOTICE}</p>
                  </div>
                ) : (
                  <OrderTracker estado={order.Estado} />
                )}
                <div className="flex items-center justify-start mt-4">
                  {cancellable ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCancelError(null); setCancelId(order.ID_Pedido); }}
                      className="bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-5 py-1.5 transition-colors"
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Cancelar pedido
                    </button>
                  ) : locked ? (
                    <span title="Ya no se puede cancelar en este estado" className="bg-red-50 text-red-300 border border-red-100 rounded-full px-5 py-1.5 cursor-not-allowed" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      Cancelar pedido
                    </span>
                  ) : <span />}
                </div>
              </div>
              );
            })}
          </div>
        )}
        {cancelId !== null && (
          <CancelOrderModal
            orderId={cancelId}
            saving={saving}
            error={cancelError}
            onClose={() => setCancelId(null)}
            onConfirm={handleCancel}
          />
        )}
      </div>
    </main>
  );
}
