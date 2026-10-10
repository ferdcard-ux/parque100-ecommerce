/**
 * @fileoverview Pie de pagina con enlaces, categorias y contacto.
 * Los datos del negocio (nombre, descripcion, horario y contacto) se
 * leen de la ficha guardada en Admin > Configuracion (GET /business);
 * si la consulta falla se usan valores de respaldo sin romper la pagina.
 */
import { Link } from 'react-router';
import { APP_ADDRESS, APP_PHONE, APP_EMAIL } from '../../../utils';
import { useBusinessController } from '../../../controllers';

/** Valores de respaldo cuando la ficha del negocio no carga. */
const FALLBACK = {
  Nombre: 'Tienda Parque 100',
  Descripcion: 'Los mejores productos del conjunto, frescos y a precios accesibles para toda la familia.',
  Direccion: APP_ADDRESS,
  Telefono: APP_PHONE,
  Email: APP_EMAIL,
};

const FOOTER_CATEGORIES = ['Verduras', 'Frutas', 'Carnes', 'Lácteos', 'Bebidas', 'Limpieza'];
const FOOTER_HELP = ['¿Cómo comprar?', 'Seguimiento de pedido', 'Política de devolución', 'Términos y condiciones', 'Preguntas frecuentes'];
const SOCIAL_LINKS = [
  { label: '📘', href: 'https://www.facebook.com' },
  { label: '📸', href: 'https://www.instagram.com' },
  { label: '🐦', href: 'https://x.com' },
  { label: '💬', href: 'https://wa.me/573046068846' },
];

/** Esqueleto con el mismo espacio reservado para evitar saltos de layout. */
function FooterSkeleton() {
  return (
    <div>
      <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
      <div className="h-4 w-28 bg-white/10 rounded animate-pulse mt-2" />
      <div className="h-4 w-full bg-white/10 rounded animate-pulse mt-4" />
      <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse mt-2" />
      <div className="h-4 w-4/6 bg-white/10 rounded animate-pulse mt-2" />
      <div className="h-4 w-full bg-white/10 rounded animate-pulse mt-4" />
      <div className="h-4 w-full bg-white/10 rounded animate-pulse mt-2" />
      <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse mt-2" />
    </div>
  );
}

/** Footer con navegacion por categoria, ayuda y contacto del negocio. */
export function Footer() {
  const { business, isLoading } = useBusinessController();

  const nombre = business?.Nombre?.trim() || FALLBACK.Nombre;
  const descripcion = business?.Descripcion?.trim() || FALLBACK.Descripcion;
  const horario = business?.Horario?.trim() || '';
  const direccion = business?.Direccion?.trim() || FALLBACK.Direccion;
  const telefono = business?.Telefono?.trim() || FALLBACK.Telefono;
  const correo = business?.Email?.trim() || FALLBACK.Email;

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
                <span className="text-white font-bold block" style={{ fontSize: '0.95rem' }}>{nombre}</span>
                <span className="text-white/50" style={{ fontSize: '0.75rem' }}>Tu tienda de confianza</span>
              </div>
            </div>
            {isLoading ? (
              <FooterSkeleton />
            ) : (
              <>
                <p className="text-white/50" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                  {descripcion}
                </p>
                {horario && (
                  <p className="text-white/50 mt-2" style={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>🕒 {horario}</p>
                )}
              </>
            )}
          </div>

          <div>
            <h4 className="text-[#FBC02D] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Categorías</h4>
            {FOOTER_CATEGORIES.map((c) => (
              <Link key={c} to={`/catalogo?cat=${encodeURIComponent(c)}`} className="block text-white/50 hover:text-white transition-colors mb-2" style={{ fontSize: '0.875rem' }}>{c}</Link>
            ))}
          </div>

          <div>
            <h4 className="text-[#FBC02D] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Ayuda</h4>
            {FOOTER_HELP.map((c) => (
              <Link key={c} to="/ayuda" className="block text-white/50 hover:text-white transition-colors mb-2" style={{ fontSize: '0.875rem' }}>{c}</Link>
            ))}
          </div>

          <div>
            <h4 className="text-[#FBC02D] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Contáctanos</h4>
            {isLoading ? (
              <FooterSkeleton />
            ) : (
              <>
                {direccion && <p className="text-white/50 mb-2" style={{ fontSize: '0.875rem' }}>📍 {direccion}</p>}
                {telefono && <p className="text-white/50 mb-2" style={{ fontSize: '0.875rem' }}>📞 {telefono}</p>}
                {correo && <p className="text-white/50 mb-4" style={{ fontSize: '0.875rem' }}>✉️ {correo}</p>}
              </>
            )}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={href}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C62828] flex items-center justify-center transition-colors"
                >
                  <span style={{ fontSize: '0.85rem' }}>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6">
          <p className="text-white/40" style={{ fontSize: '0.8rem' }}>© 2026 {nombre}. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link to="/privacidad" className="text-white/40 hover:text-white transition-colors" style={{ fontSize: '0.8rem' }}>Privacidad</Link>
            <Link to="/privacidad#cookies" className="text-white/40 hover:text-white transition-colors" style={{ fontSize: '0.8rem' }}>Cookies</Link>
            <Link to="/mapa-sitio" className="text-white/40 hover:text-white transition-colors" style={{ fontSize: '0.8rem' }}>Mapa del sitio</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
