import { useRef, useState } from 'react';
import { useDialogBehavior } from '../../../utils/useDialog';
import { X, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Product, Category } from '../../../models';
import { formatPrice, formatUnitPrice } from '../../../utils';
import { useScrollLock } from '../../../utils/useScrollLock';
import { CategoryIllustration } from '../shared/CategoryIllustration';

interface CategoryModalProps {
  category: Category | null;
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function CategoryModal({ category, products, onClose, onAddToCart }: CategoryModalProps) {
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  useScrollLock(category !== null);
  useDialogBehavior(category !== null, onClose, panelRef);

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
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={`Categoría ${category.name}`} className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${category.color} ${category.border} border`}>
              <CategoryIllustration icon={category.icon} className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-brand-ink font-bold" style={{ fontSize: '1.1rem' }}>{category.name}</h2>
              <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>
                {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${category.color} ${category.border} border mb-4`}>
                <CategoryIllustration icon={category.icon} className="w-9 h-9" />
              </div>
              <p className="text-brand-ink font-semibold mb-1" style={{ fontSize: '1rem' }}>Categoría sin productos</p>
              <p className="text-gray-400" style={{ fontSize: '0.875rem' }}>
                No hay productos disponibles en "{category.name}" por el momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 max-[380px]:grid-cols-1 sm:grid-cols-3 gap-4">
              {filtered.map((product) => {
                const unitPrice = formatUnitPrice(product.price, product.contentQty, product.contentUnit);
                return (
                  <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                  <div className="relative aspect-[4/3] overflow-hidden bg-brand-surface">
                    <Link to={`/producto/${product.id}`} onClick={onClose}>
                      <ImageWithFallback
                        src={product.image}
                        alt={product.name}
                        sizes="(max-width: 380px) 100vw, (max-width: 639px) 50vw, 33vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    {product.stock <= 8 && (
                      <div className="absolute top-2 left-2 bg-brand-yellow text-brand-ink px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: '0.6rem' }}>
                        ¡Últimas unidades!
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <Link to={`/producto/${product.id}`} onClick={onClose}>
                      <h3 className="text-brand-ink font-semibold leading-tight mb-1 hover:text-brand-red transition-colors" style={{ fontSize: '0.8rem' }}>{product.name}</h3>
                    </Link>
                    {unitPrice && <p className="mb-2 text-gray-400" style={{ fontSize: '0.62rem' }}>{unitPrice}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-brand-red font-bold" style={{ fontSize: '0.95rem' }}>{formatPrice(product.price)}</span>
                      <button onClick={() => handleAdd(product)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all text-white ${addedIds.has(product.id) ? 'bg-green-500' : 'bg-brand-red hover:bg-brand-red-dark'}`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        <ShoppingCart size={11} />
                        {addedIds.has(product.id) ? '¡Añadido!' : 'Añadir'}
                      </button>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}