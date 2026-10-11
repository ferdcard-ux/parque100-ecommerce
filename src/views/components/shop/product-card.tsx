/**
 * @fileoverview Tarjeta de producto reutilizable (catalogo y relacionados).
 */
import { Link } from 'react-router';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../../../models';
import { formatPrice, formatUnitPrice, hasPromo } from '../../../utils';
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
  const promo = hasPromo(product.price, product.previousPrice);
  const unit = formatUnitPrice(product.price, product.contentQty, product.contentUnit);
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F5F5F5]">
        <Link to={`/producto/${product.id}`}>
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            sizes="(max-width: 380px) 100vw, (max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        {promo && (
          <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#FF8F01] text-white flex items-center justify-center font-bold" style={{ fontSize: '0.7rem' }} title="En promoción">
            %
          </span>
        )}
        <button
          onClick={() => onToggleFavorite?.(product.id)}
          aria-label="Favorito"
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center before:absolute before:-inset-2.5 before:content-['']"
        >
          <Heart size={13} className={isFavorite ? 'fill-[#C62828] text-[#C62828]' : 'text-gray-400'} />
        </button>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-gray-400 mb-0.5" style={{ fontSize: '0.7rem' }}>{product.category}</p>
        <Link to={`/producto/${product.id}`}>
          <h3 className="text-[#212121] font-semibold leading-tight mb-1 hover:text-[#C62828] transition-colors line-clamp-2" style={{ fontSize: '0.875rem', minHeight: '2.2em' }}>
            {product.name}
          </h3>
        </Link>
        {unit && <p className="text-gray-400 mb-1" style={{ fontSize: '0.7rem' }}>{unit}</p>}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {promo && (
              <span className="text-gray-400 line-through" style={{ fontSize: '0.72rem' }}>({formatPrice(product.previousPrice as number)})</span>
            )}
            <span className="text-[#C62828] font-bold" style={{ fontSize: '1rem' }}>{formatPrice(product.price)}</span>
          </div>
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
