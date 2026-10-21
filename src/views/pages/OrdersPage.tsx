/**
 * @fileoverview Historial de compras del usuario.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '../../App';
import { useOrdersController, useProductController, useRatingsController } from '../../controllers';
import type { ApiOrder, ApiOrderItem } from '../../models';
import { PageHeader } from '../components/shared/page-header';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { EmptyState } from '../components/shared/empty-state';
import { CancelOrderModal } from '../components/shared/cancel-order-modal';
import { ReviewProductModal } from '../components/ratings/review-product-modal';
import { ReviewFormModal } from '../components/ratings/review-form-modal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { CANCEL_REFUND_NOTICE, canReviewOrder, formatPrice, isDemoPaymentMethod } from '../../utils';

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
  const { orders, isLoading, error, fetchDetail, cancelOwn } = useOrdersController(user?.id ?? null, { items: true });
  const { ratings: myReviews, rate } = useRatingsController({ usuario: user?.id ?? undefined });
  const { products } = useProductController();
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null);
  const [reviewItems, setReviewItems] = useState<ApiOrderItem[]>([]);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApiOrderItem | null>(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewOk, setReviewOk] = useState(false);

  const handleCancel = async (motivo: string) => {
    if (cancelId === null) return;
    setCancelError(null);
    setSaving(true);
    try {
      await cancelOwn(cancelId, motivo);
      setCancelId(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No fue posible cancelar.');
    } finally {
      setSaving(false);
    }
  };

  /** Abre el Modal 1 con los articulos del pedido listos para resenar. */
  const openReview = async (order: ApiOrder) => {
    setReviewOk(false);
    setReviewError(null);
    try {
      const detail = await fetchDetail(order.ID_Pedido);
      setReviewItems(detail?.detalles ?? []);
      setReviewedIds(
        myReviews
          .filter((r) => r.Tipo === 'producto' && r.ID_Pedido === order.ID_Pedido && r.ID_Producto)
          .map((r) => String(r.ID_Producto)),
      );
      setReviewOrder(order);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No fue posible cargar el pedido.');
    }
  };

  /** Publica la resena del producto elegido (Modal 2). */
  const submitReview = async (stars: number, comment: string) => {
    if (!reviewOrder || !selectedItem || !user) return;
    setReviewError(null);
    setReviewSaving(true);
    try {
      await rate({
        ID_Usuario: user.id,
        ID_Producto: String(selectedItem.ID_Producto),
        ID_Pedido: reviewOrder.ID_Pedido,
        Tipo: 'producto',
        Estrellas: stars,
        Comentario: comment,
      });
      setSelectedItem(null);
      setReviewOrder(null);
      setReviewOk(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'No fue posible guardar la resena.');
    } finally {
      setReviewSaving(false);
    }
  };

  const selectedCatalog = selectedItem
    ? products.find((p) => String(p.id) === String(selectedItem.ID_Producto))
    : undefined;

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
              const isDemoOrder = isDemoPaymentMethod(order.Metodo_Pago);
              const cancellable = order.Estado === 'pendiente' || order.Estado === 'preparando';
              const locked = order.Estado === 'enviando';
              const items = order.detalles ?? [];
              const totalQty = items.reduce((sum, it) => sum + Number(it.Cantidad), 0);
              const firstName = items.length > 0
                ? (items[0].Producto_Nombre ?? String(items[0].ID_Producto))
                : '';
              const shownItems = items.slice(0, 4);
              const extraItems = items.length - shownItems.length;
              return (
              <div
                key={order.ID_Pedido}
                onClick={() => navigate(`/compras/${order.ID_Pedido}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/compras/${order.ID_Pedido}`); } }}
                role="link"
                tabIndex={0}
                aria-label={`Ver detalle del pedido ${order.ID_Pedido}, estado ${order.Estado}`}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#C62828]/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#212121] font-bold">Pedido #{order.ID_Pedido}</span>
                  <StatusBadge estado={order.Estado} />
                </div>
                {isDemoOrder && (
                  <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    SIMULACIÓN — no pagado, sin reserva de inventario ni despacho
                  </p>
                )}
                <div className="flex items-center justify-between text-gray-400 mb-3" style={{ fontSize: '0.8rem' }}>
                  <span>{formatDate(order.Fecha)}</span>
                  <span className="text-[#C62828] font-bold" style={{ fontSize: '1rem' }}>{formatPrice(order.Total)}</span>
                </div>
                {items.length > 0 && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center shrink-0 pl-2">
                      {shownItems.map((item) => {
                        const catalog = products.find((p) => String(p.id) === String(item.ID_Producto));
                        return (
                          <ImageWithFallback
                            key={String(item.ID_Producto)}
                            src={catalog?.image ?? ''}
                            alt={item.Producto_Nombre ?? String(item.ID_Producto)}
                            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow -ml-2"
                          />
                        );
                      })}
                      {extraItems > 0 && (
                        <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center ring-2 ring-white shadow -ml-2" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                          +{extraItems}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 truncate" style={{ fontSize: '0.8rem' }}>
                      {totalQty} {totalQty === 1 ? 'producto' : 'productos'} - {firstName}...
                    </p>
                  </div>
                )}
                {order.Estado === 'cancelado' ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-1">
                    <p className="text-red-700" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Motivo: {order.Motivo_Cancelacion ?? '—'}</p>
                    <p className="text-red-600 mt-1" style={{ fontSize: '0.75rem' }}>{CANCEL_REFUND_NOTICE}</p>
                  </div>
                ) : (
                  <OrderTracker estado={order.Estado} />
                )}
                <div className="flex items-center justify-start gap-2 mt-4">
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
                  {canReviewOrder(order.Estado) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); void openReview(order); }}
                      className="border border-[#FBC02D] text-[#f57f17] hover:bg-[#FBC02D]/10 rounded-full px-5 py-1.5 transition-colors"
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Dejar una reseña
                    </button>
                  )}
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
        {reviewOk && (
          <p className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700" style={{ fontSize: '0.85rem' }}>
            Reseña publicada. Gracias por tu opinión.
          </p>
        )}
        {reviewOrder && !selectedItem && (
          <ReviewProductModal
            orderId={reviewOrder.ID_Pedido}
            items={reviewItems}
            products={products}
            reviewedProductIds={reviewedIds}
            onClose={() => { setReviewOrder(null); setReviewItems([]); }}
            onSelect={(item) => { setReviewError(null); setSelectedItem(item); }}
          />
        )}
        {reviewOrder && selectedItem && (
          <ReviewFormModal
            title="Dejar una reseña"
            productImage={selectedCatalog?.image ?? ''}
            productName={selectedItem.Producto_Nombre ?? selectedCatalog?.name ?? String(selectedItem.ID_Producto)}
            productDetails={`Cantidad x${selectedItem.Cantidad}`}
            submitLabel="Publicar Reseña"
            saving={reviewSaving}
            error={reviewError}
            onClose={() => { setSelectedItem(null); setReviewError(null); }}
            onSubmit={(stars, comment) => { void submitReview(stars, comment); }}
          />
        )}
      </div>
    </main>
  );
}
