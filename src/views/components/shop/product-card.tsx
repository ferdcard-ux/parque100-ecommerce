/**
 * @fileoverview Tarjeta de producto reutilizable (catalogo y relacionados).
 */
import { Link } from 'react-router';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product } from '../../../models';
import { formatPrice } from '../../../utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ProductCardProps {
  /** Producto a mostrar. */
  product: Product;
  /** true si esta en favoritos. */
  isFavorite?: boolean;
  /** Alternar favorito (opcional). */
  onToggleFavorite?: (id: number) => void;
  /** Agregar al carrito (opcional; oculta el boton si no se pasa). */
  onAddToCart?: (product: Product) => void;
}

/** Tarjeta visual de producto con favorito y boton de compra. */
export function ProductCard({ product, isFavorite = false, onToggleFavorite, onAddToCart }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group flex flex-col">
      <div className="relative h-40 overflow-hidden bg-[#F5F5F5]">
        <Link to={`/producto/${product.id}`}>
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <button
          onClick={() => onToggleFavorite?.(product.id)}
          aria-label="Favorito"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"
        >
          <Star size={13} className={isFavorite ? 'fill-[#FBC02D] text-[#FBC02D]' : 'text-gray-400'} />
        </button>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-gray-400 mb-0.5" style={{ fontSize: '0.7rem' }}>{product.category}</p>
        <Link to={`/producto/${product.id}`}>
          <h3 className="text-[#212121] font-semibold leading-tight mb-2 hover:text-[#C62828] transition-colors" style={{ fontSize: '0.875rem' }}>
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-[#C62828] font-bold" style={{ fontSize: '1rem' }}>{formatPrice(product.price)}</span>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="flex items-center gap-1 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-3 py-1.5 transition-colors"
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              <ShoppingCart size={13} /> Anadir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
