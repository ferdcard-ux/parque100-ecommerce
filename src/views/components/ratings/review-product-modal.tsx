/**
 * @fileoverview Modal 1: seleccion del producto a resenar.
 * Lista los articulos de una orden con miniatura, nombre, descripcion
 * y flecha de seleccion.
 */
import { useRef } from 'react';
import { X, ChevronRight } from 'lucide-react';
import type { ApiOrderItem, Product } from '../../../models';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useDialogBehavior } from '../../../utils/useDialog';

interface ReviewProductModalProps {
  /** Identificador del pedido origen. */
  orderId: number;
  /** Lineas de detalle del pedido. */
  items: ApiOrderItem[];
  /** Catalogo para resolver imagen y descripcion por ID_Producto. */
  products: Product[];
  /** Producto ya resenado por el usuario en este pedido (se marca, no se bloquea). */
  reviewedProductIds: string[];
  /** Cierra el modal sin seleccionar. */
  onClose: () => void;
  /** Selecciona un producto y avanza al formulario. */
  onSelect: (item: ApiOrderItem) => void;
}

/** Modal "Dejar una resena": elige un articulo para resenar. */
export function ReviewProductModal({
  orderId,
  items,
  products,
  reviewedProductIds,
  onClose,
  onSelect,
}: ReviewProductModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(true, onClose, panelRef);
  const byId = new Map(products.map((p) => [String(p.id), p]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Dejar una reseña" className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-brand-ink font-bold" style={{ fontSize: '1rem' }}>
            Dejar una reseña
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>
        </div>
        <p className="text-gray-400 mb-4" style={{ fontSize: '0.85rem' }}>
          Elige un artículo para reseñar · Pedido #{orderId}
        </p>
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-8" style={{ fontSize: '0.85rem' }}>
            Este pedido no tiene articulos.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-50">
            {items.map((item) => {
              const catalog = byId.get(String(item.ID_Producto));
              const reviewed = reviewedProductIds.includes(String(item.ID_Producto));
              return (
                <li key={String(item.ID_Producto)}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 rounded-xl px-2 transition-colors"
                  >
                    <ImageWithFallback
                      src={catalog?.image ?? ''}
                      alt={item.Producto_Nombre ?? String(item.ID_Producto)}
                      className="w-12 h-12 object-cover rounded-xl shrink-0"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-brand-ink truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {item.Producto_Nombre ?? catalog?.name ?? String(item.ID_Producto)}
                      </span>
                      {catalog?.description && (
                        <span className="block text-gray-400 truncate" style={{ fontSize: '0.75rem' }}>
                          {catalog.description}
                        </span>
                      )}
                      <span className="block text-gray-400" style={{ fontSize: '0.75rem' }}>
                        x{item.Cantidad}{reviewed ? ' · Ya la reseñaste (puedes editarla)' : ''}
                      </span>
                    </span>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
