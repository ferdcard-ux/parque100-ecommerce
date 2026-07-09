import { useState } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Product, Category } from '../../../models';
import { formatPrice } from '../../../utils';
import { useScrollLock } from '../../../utils/useScrollLock';

interface CategoryModalProps {
  category: Category | null;
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function CategoryModal({ category, products, onClose, onAddToCart }: CategoryModalProps) {
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  useScrollLock(category !== null);

  if (!category) return null;

  const filtered = products.filter((p) => p.category.toLowerCase() === category.name.toLowerCase());

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${category.color} ${category.border} border-2`}>
              <span style={{ fontSize: '1.3rem' }}>{category.emoji}</span>
            </div>
            <div>
              <h2 className="text-[#212121] font-bold" style={{ fontSize: '1.1rem' }}>{category.name}</h2>
              <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>
                {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${category.color} ${category.border} border-2 mb-4`}>
                <span style={{ fontSize: '2rem' }}>{category.emoji}</span>
              </div>
              <p className="text-[#212121] font-semibold mb-1" style={{ fontSize: '1rem' }}>Categoría sin productos</p>
              <p className="text-gray-400" style={{ fontSize: '0.875rem' }}>
                No hay productos disponibles en "{category.name}" por el momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                  <div className="relative h-32 overflow-hidden bg-[#F5F5F5]">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock <= 8 && (
                      <div className="absolute top-2 left-2 bg-[#FBC02D] text-[#212121] px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: '0.6rem' }}>
                        ¡Últimas unidades!
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-[#212121] font-semibold leading-tight mb-2" style={{ fontSize: '0.8rem' }}>{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[#C62828] font-bold" style={{ fontSize: '0.95rem' }}>{formatPrice(product.price)}</span>
                      <button onClick={() => handleAdd(product)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all text-white ${addedIds.has(product.id) ? 'bg-green-500' : 'bg-[#C62828] hover:bg-[#b71c1c]'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        <ShoppingCart size={11} />
                        {addedIds.has(product.id) ? '¡Añadido!' : 'Añadir'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}