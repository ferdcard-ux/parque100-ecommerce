import { Link } from 'react-router';
import { Zap } from 'lucide-react';
import type { Product, WeeklyTopSeller } from '../../../models';
import { HeroProductSlider } from './HeroProductSlider';
import { TopSellerBanner } from './TopSellerBanner';

interface HeroBannerProps {
  /** Catalogo real para el carrusel de productos destacados. */
  products: Product[];
  /** Agrega un producto al carrito desde el carrusel. */
  onAddToCart: (product: Product) => void;
  /** Producto con mas ventas en los ultimos 7 dias (opcional si no hay ventas). */
  weeklyTopSeller?: WeeklyTopSeller | null;
}

export function HeroBanner({ products, onAddToCart, weeklyTopSeller }: HeroBannerProps) {
  return (
    <section
      className="relative overflow-hidden py-12 px-4 md:px-8 lg:py-16"
      style={{ background: 'linear-gradient(135deg, var(--brand-yellow) 0%, var(--brand-orange) 40%, var(--brand-red) 100%)' }}
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-20%, 30%)' }} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 items-center gap-8 relative z-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="w-full text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
            <Zap size={14} className="text-white" />
            <span style={{ fontSize: '0.8rem' }}>Entregas a tu apartamento</span>
          </div>
          <h1 className="text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800 }}>
            Productos frescos,<br />
            directo a tu hogar
          </h1>
          <p className="text-white/85 mb-6 max-w-md" style={{ fontSize: '1.05rem' }}>
            Frutas, verduras, granos y más con la mejor calidad del conjunto. ¡Compra hoy y recibe hoy!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/catalogo">
              <button className="px-6 py-3 rounded-xl bg-white text-brand-red font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.97]" style={{ fontSize: '1rem' }}>
                Comprar ahora
              </button>
            </Link>
            <Link to="/catalogo?promo=1">
              <button className="px-6 py-3 rounded-xl bg-white/20 text-white font-semibold border border-white/40 hover:bg-white/30 transition-all" style={{ fontSize: '1rem' }}>
                Ver ofertas
              </button>
            </Link>
          </div>
          <p className="text-white/70 mt-4" style={{ fontSize: '0.75rem' }}>Promoción válida hasta agotar existencias. Aplican términos y condiciones.</p>
        </div>

        <div className="mx-auto flex w-full max-w-[700px] flex-col gap-3 sm:gap-4 lg:ml-auto lg:mr-0">
          {weeklyTopSeller && (
            <TopSellerBanner
              product={weeklyTopSeller.product}
              unitsSold={weeklyTopSeller.unitsSold}
              ordersCount={weeklyTopSeller.ordersCount}
            />
          )}
          <HeroProductSlider products={products} onAddToCart={onAddToCart} />
        </div>
      </div>
    </section>
  );
}
