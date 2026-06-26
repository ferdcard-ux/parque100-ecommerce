import { APP_ADDRESS, APP_PHONE, APP_EMAIL } from '../../../utils';

const FOOTER_CATEGORIES = ['Verduras', 'Frutas', 'Carnes', 'Lácteos', 'Bebidas', 'Limpieza'];
const FOOTER_HELP = ['¿Cómo comprar?', 'Seguimiento de pedido', 'Política de devolución', 'Términos y condiciones', 'Preguntas frecuentes'];
const SOCIAL_ICONS = ['📘', '📸', '🐦', '💬'];

export function Footer() {
  return (
    <footer className="bg-[#212121] text-white pt-12 pb-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FBC02D, #C62828)' }}
              >
                <span style={{ fontSize: '1.1rem' }}>🏪</span>
              </div>
              <div>
                <span className="text-white font-bold block" style={{ fontSize: '0.95rem' }}>Tienda Parque 100</span>
                <span className="text-white/50" style={{ fontSize: '0.75rem' }}>Tu tienda de confianza</span>
              </div>
            </div>
            <p className="text-white/50" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
              Los mejores productos del conjunto, frescos y a precios accesibles para toda la familia.
            </p>
          </div>

          <div>
            <h4 className="text-[#FBC02D] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Categorías</h4>
            {FOOTER_CATEGORIES.map((c) => (
              <p key={c} className="text-white/50 hover:text-white cursor-pointer transition-colors mb-2" style={{ fontSize: '0.875rem' }}>{c}</p>
            ))}
          </div>

          <div>
            <h4 className="text-[#FBC02D] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Ayuda</h4>
            {FOOTER_HELP.map((c) => (
              <p key={c} className="text-white/50 hover:text-white cursor-pointer transition-colors mb-2" style={{ fontSize: '0.875rem' }}>{c}</p>
            ))}
          </div>

          <div>
            <h4 className="text-[#FBC02D] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Contáctanos</h4>
            <p className="text-white/50 mb-2" style={{ fontSize: '0.875rem' }}>📍 {APP_ADDRESS}</p>
            <p className="text-white/50 mb-2" style={{ fontSize: '0.875rem' }}>📞 {APP_PHONE}</p>
            <p className="text-white/50 mb-4" style={{ fontSize: '0.875rem' }}>✉️ {APP_EMAIL}</p>
            <div className="flex gap-3">
              {SOCIAL_ICONS.map((icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C62828] flex items-center justify-center transition-colors"
                >
                  <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6">
          <p className="text-white/40" style={{ fontSize: '0.8rem' }}>© 2026 Tienda Parque 100. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <span className="text-white/40 hover:text-white cursor-pointer" style={{ fontSize: '0.8rem' }}>Privacidad</span>
            <span className="text-white/40 hover:text-white cursor-pointer" style={{ fontSize: '0.8rem' }}>Cookies</span>
            <span className="text-white/40 hover:text-white cursor-pointer" style={{ fontSize: '0.8rem' }}>Mapa del sitio</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
