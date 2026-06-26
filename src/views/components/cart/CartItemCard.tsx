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
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 items-center">
      <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F5F5F5] shrink-0">
        <ImageWithFallback src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-400 mb-0.5" style={{ fontSize: '0.72rem' }}>{item.category}</p>
        <h3 className="text-[#212121] font-semibold truncate" style={{ fontSize: '0.95rem' }}>{item.name}</h3>
        <p className="text-[#C62828] font-bold mt-1" style={{ fontSize: '1rem' }}>{formatPrice(item.price)}</p>
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <button onClick={() => onRemove(item.id)} className="text-gray-300 hover:text-[#C62828] transition-colors">
          <Trash2 size={16} />
        </button>
        <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-1 py-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-[#C62828] hover:text-white transition-all"
          >
            <Minus size={12} />
          </button>
          <span className="w-6 text-center text-[#212121] font-semibold" style={{ fontSize: '0.9rem' }}>{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-[#C62828] hover:text-white transition-all"
          >
            <Plus size={12} />
          </button>
        </div>
        <p className="text-[#212121] font-bold" style={{ fontSize: '0.9rem' }}>
          {formatPrice(item.price * item.quantity)}
        </p>
      </div>
    </div>
  );
}
