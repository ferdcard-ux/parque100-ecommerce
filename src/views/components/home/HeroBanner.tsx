import { Link } from 'react-router';
import { Zap, Star, Tag, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function HeroBanner() {
  return (
    <section
      className="relative overflow-hidden py-16 px-4 md:px-8"
      style={{ background: 'linear-gradient(135deg, #FBC02D 0%, #f57f17 40%, #C62828 100%)' }}
    >
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 bg-white" style={{ transform: 'translate(-20%, 30%)' }} />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="flex-1 text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
            <Zap size={14} className="text-white" />
            <span style={{ fontSize: '0.8rem' }}>Entregas a tu apartamento</span>
          </div>
          <h1 className="text-white mb-4 leading-tight" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', fontWeight: 800 }}>
            Productos frescos,<br />
            directo a tu hogar 🥬
          </h1>
          <p className="text-white/85 mb-6 max-w-md" style={{ fontSize: '1.05rem' }}>
            Frutas, verduras, granos y más con la mejor calidad del conjunto. ¡Compra hoy y recibe hoy!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/login">
              <button className="px-6 py-3 rounded-xl bg-white text-[#C62828] font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.97]" style={{ fontSize: '1rem' }}>
                Comprar ahora
              </button>
            </Link>
            <button className="px-6 py-3 rounded-xl bg-white/20 text-white font-semibold border border-white/40 hover:bg-white/30 transition-all" style={{ fontSize: '1rem' }}>
              Ver ofertas
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="relative w-72 h-60 md:w-96 md:h-72">
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1550989460-0adf9ea622e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
                alt="Productos frescos en el mercado"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <div className="absolute -bottom-3 -left-3 bg-white rounded-xl px-4 py-2 shadow-xl flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#FBC02D] flex items-center justify-center">
                <Tag size={14} className="text-white" />
              </div>
              <div>
                <p className="text-[#212121] font-bold leading-none" style={{ fontSize: '0.9rem' }}>Oferta del día</p>
                <p className="text-[#C62828] font-bold" style={{ fontSize: '0.8rem' }}>Hasta 30% OFF</p>
              </div>
            </div>
            <div className="absolute -top-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-xl flex items-center gap-1.5">
              <Star size={14} className="fill-[#FBC02D] text-[#FBC02D]" />
              <span className="text-[#212121] font-bold" style={{ fontSize: '0.9rem' }}>4.9</span>
              <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>+500 reseñas</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
