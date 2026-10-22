import { Link } from 'react-router';
import { Tag } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function PromoBanner() {
  return (
    <section className="py-10 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, var(--brand-ink) 0%, #424242 100%)' }}
        >
          <div className="absolute inset-0 opacity-10">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1628102491629-778571d893a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1000"
              alt="Supermercado"
              sizes="100vw"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-10">
            <div>
              <span className="inline-flex items-center gap-1.5 bg-brand-yellow text-brand-ink px-3 py-1 rounded-full font-bold mb-3" style={{ fontSize: '0.75rem' }}>
                <Tag size={13} aria-hidden="true" /> OFERTA ESPECIAL
              </span>
              <h2 className="text-white mb-2" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                Canasta familiar completa
              </h2>
              <p className="text-white/70" style={{ fontSize: '0.95rem' }}>
                Ahorra hasta un 25% en tu primera compra de la semana
              </p>
              <p className="text-white/50 mt-1" style={{ fontSize: '0.72rem' }}>Vigencia hasta agotar existencias. No acumulable con otras ofertas.</p>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="text-center">
                <span className="text-white/60 line-through" style={{ fontSize: '0.9rem' }}>$65.000</span>
                <p className="text-brand-yellow font-black" style={{ fontSize: '2rem' }}>$48.750</p>
              </div>
              <Link to="/catalogo">
                <button className="px-8 py-3 rounded-xl bg-brand-red text-white font-bold hover:bg-brand-red-dark transition-all shadow-lg" style={{ fontSize: '1rem' }}>
                  Aprovechar oferta
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
