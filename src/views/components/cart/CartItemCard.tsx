import { Trash2, Plus, Minus } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { CartItem } from '../../../models';
import { formatPrice } from '../../../utils';

interface CartItemCardProps {
  item: CartItem;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
}

export function CartItemCard({ item, onRemove, onUpdateQuantity }: CartItemCardProps) {
  const atMax = item.quantity >= item.stock;
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 items-center">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-brand-surface shrink-0">
        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 mb-0.5" style={{ fontSize: '0.72rem' }}>{item.category}</p>
        <h3 className="text-brand-ink font-semibold truncate" style={{ fontSize: '0.95rem' }}>{item.name}</h3>
        <p className="text-brand-red font-bold mt-1" style={{ fontSize: '1rem' }}>{formatPrice(item.price)}</p>
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <button onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.name} del carrito`} className="min-w-10 min-h-10 p-2 rounded-lg text-gray-300 hover:text-brand-red hover:bg-red-50 transition-colors flex items-center justify-center">
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-2 bg-brand-surface rounded-xl px-1 py-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            aria-label={`Quitar uno de ${item.name}`}
            className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-brand-red hover:text-white transition-all"
          >
            <Minus size={12} />
          </button>
          <span className="w-6 text-center text-brand-ink font-semibold" style={{ fontSize: '0.9rem' }}>{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={atMax}
            title={atMax ? `Máximo ${item.stock} disponibles` : 'Agregar uno'}
            aria-label={atMax ? `${item.name}: máximo ${item.stock} disponibles` : `Agregar uno de ${item.name}`}
            className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-brand-red hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-current"
          >
            <Plus size={12} />
          </button>
        </div>
        {atMax && (
          <p className="text-gray-400" style={{ fontSize: '0.7rem' }}>Máx. {item.stock} disponibles</p>
        )}
        <p className="text-brand-ink font-bold" style={{ fontSize: '0.9rem' }}>
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}
