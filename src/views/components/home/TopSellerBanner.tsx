/**
 * @fileoverview Panel compacto del producto mas vendido de la semana.
 * Se ubica dentro de la tarjeta del hero, encima del carrusel, y muestra
 * datos calculados por el backend a partir de los pedidos reales.
 */
import { Link } from 'react-router';
import { ArrowRight, Flame, TrendingUp } from 'lucide-react';
import type { Product } from '../../../models';
import { discountPercent, formatPrice, hasPromo } from '../../../utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface TopSellerBannerProps {
  /** Producto lider de ventas de los ultimos 7 dias. */
  product: Product;
  /** Unidades vendidas en la ventana semanal. */
  unitsSold: number;
  /** Pedidos distintos que incluyeron el producto. */
  ordersCount: number;
}

/**
 * Franja de "mas vendido" con imagen, precio y acceso a la ficha.
 * El diseno es horizontal para aprovechar el ancho del hero en escritorio
 * y se compacta en pantallas pequenas.
 */
export function TopSellerBanner({ product, unitsSold, ordersCount }: TopSellerBannerProps) {
  const promo = hasPromo(product.price, product.previousPrice);
  const unitsLabel = unitsSold === 1 ? 'unidad vendida' : 'unidades vendidas';

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/30 text-white shadow-2xl ring-1 ring-black/10"
      style={{ background: 'linear-gradient(135deg, #1f1f1f 0%, #35280f 55%, #4a1c1c 100%)' }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand-yellow/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/3 h-24 w-24 rounded-full bg-brand-red/25 blur-2xl" />

      <div className="relative z-10 flex items-center gap-3 p-2.5 sm:gap-4 sm:p-3.5">
        <Link
          to={`/producto/${product.id}`}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15 bg-white/10 sm:h-16 sm:w-16"
          aria-label={`Ver ${product.name}`}
        >
          <ImageWithFallback
            src={product.image}
            alt={product.name}
            sizes="64px"
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
          {promo && (
            <span
              className="absolute left-1 top-1 rounded-full bg-brand-orange px-1.5 py-0.5 font-bold shadow-sm"
              style={{ fontSize: '0.6rem' }}
            >
              -{discountPercent(product.price, product.previousPrice)}%
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <span
            className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-brand-yellow"
            style={{ fontSize: '0.62rem' }}
          >
            <Flame size={12} className="fill-brand-yellow" aria-hidden="true" />
            Más vendido de la semana
          </span>

          <Link to={`/producto/${product.id}`} className="mt-0.5 block">
            <h3
              className="truncate font-bold leading-tight transition-colors hover:text-brand-yellow"
              style={{ fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)' }}
              title={product.name}
            >
              {product.name}
            </h3>
          </Link>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-extrabold text-brand-yellow" style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.35rem)' }}>
              {formatPrice(product.price)}
            </span>
            {promo && (
              <span className="text-white/50 line-through" style={{ fontSize: '0.72rem' }}>
                {formatPrice(product.previousPrice as number)}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 text-white/75"
              style={{ fontSize: '0.68rem' }}
              title={`${ordersCount} ${ordersCount === 1 ? 'pedido' : 'pedidos'} esta semana`}
            >
              <TrendingUp size={11} aria-hidden="true" />
              {unitsSold} {unitsLabel}
            </span>
          </div>
        </div>

        <Link
          to={`/producto/${product.id}`}
          className="hidden shrink-0 items-center gap-1 rounded-full bg-white px-3.5 py-2 font-bold text-brand-red shadow-sm transition-colors hover:bg-brand-yellow sm:inline-flex"
          style={{ fontSize: '0.78rem' }}
        >
          Ver
          <ArrowRight size={14} aria-hidden="true" />
        </Link>

        <Link
          to={`/producto/${product.id}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-red shadow-sm transition-colors hover:bg-brand-yellow sm:hidden"
          aria-label={`Ver ${product.name}`}
        >
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
