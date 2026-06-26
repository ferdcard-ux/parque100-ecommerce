import { useState } from 'react';
import { Link } from 'react-router';
import { ShoppingCart, Star, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Product } from '../../../models';
import { formatPrice } from '../../../utils';

interface FeaturedProductsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function FeaturedProducts({ products, onAddToCart }: FeaturedProductsProps) {
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const handleAddToCart = (product: Product) => {
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
    <section className="py-12 px-4 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-[#C62828]" />
              <span className="text-[#C62828] font-semibold" style={{ fontSize: '0.85rem' }}>DESTACADOS</span>
            </div>
            <h2 className="text-[#212121]" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Productos Destacados</h2>
          </div>
          <Link to="/cart" className="flex items-center gap-1 text-[#C62828] hover:underline font-medium" style={{ fontSize: '0.9rem' }}>
            Ver carrito <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group"
            >
              <div className="relative h-40 overflow-hidden bg-[#F5F5F5]">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.stock <= 8 && (
                  <div className="absolute top-2 left-2 bg-[#FBC02D] text-[#212121] px-2 py-0.5 rounded-full font-semibold" style={{ fontSize: '0.65rem' }}>
                    ¡Últimas unidades!
                  </div>
                )}
                <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Star size={12} className="text-gray-400 hover:fill-[#FBC02D] hover:text-[#FBC02D]" />
                </button>
              </div>
              <div className="p-3">
                <p className="text-gray-400 mb-0.5" style={{ fontSize: '0.7rem' }}>{product.category}</p>
                <h3 className="text-[#212121] font-semibold leading-tight mb-2" style={{ fontSize: '0.875rem' }}>{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-[#C62828] font-bold" style={{ fontSize: '1rem' }}>{formatPrice(product.price)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-white ${addedIds.has(product.id) ? 'bg-green-500' : 'bg-[#C62828] hover:bg-[#b71c1c]'}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <ShoppingCart size={12} />
                    {addedIds.has(product.id) ? '¡Añadido!' : 'Añadir'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
