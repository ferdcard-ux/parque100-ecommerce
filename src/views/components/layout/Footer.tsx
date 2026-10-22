/**
 * @fileoverview Pie de pagina con enlaces, categorias y contacto.
 * Los datos del negocio (nombre, descripcion, horario y contacto) se
 * leen de la ficha guardada en Admin > Configuracion (GET /business);
 * si la consulta falla se usan valores de respaldo sin romper la pagina.
 */
import { Link } from 'react-router';
import { Clock3, Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Store } from 'lucide-react';
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
  { label: 'Facebook', Icon: Facebook, href: 'https://www.facebook.com' },
  { label: 'Instagram', Icon: Instagram, href: 'https://www.instagram.com' },
  { label: 'X', Icon: null, href: 'https://x.com' },
  { label: 'WhatsApp', Icon: MessageCircle, href: 'https://wa.me/573046068846' },
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
    <footer className="bg-brand-ink text-white pt-12 pb-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--brand-yellow), var(--brand-red))' }}
              >
                <Store size={20} className="text-white" aria-hidden="true" />
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
                  <p className="mt-2 flex items-start gap-2 text-white/50" style={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
                    <Clock3 size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {horario}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <h4 className="text-brand-yellow font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Categorías</h4>
            {FOOTER_CATEGORIES.map((c) => (
              <Link key={c} to={`/catalogo?cat=${encodeURIComponent(c)}`} className="block text-white/50 hover:text-white transition-colors mb-2" style={{ fontSize: '0.875rem' }}>{c}</Link>
            ))}
          </div>

          <div>
            <h4 className="text-brand-yellow font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Ayuda</h4>
            {FOOTER_HELP.map((c) => (
              <Link key={c} to="/ayuda" className="block text-white/50 hover:text-white transition-colors mb-2" style={{ fontSize: '0.875rem' }}>{c}</Link>
            ))}
          </div>

          <div>
            <h4 className="text-brand-yellow font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Contáctanos</h4>
            {isLoading ? (
              <FooterSkeleton />
            ) : (
              <>
                {direccion && <p className="mb-2 flex items-start gap-2 text-white/50" style={{ fontSize: '0.875rem' }}><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {direccion}</p>}
                {telefono && <p className="mb-2 flex items-start gap-2 text-white/50" style={{ fontSize: '0.875rem' }}><Phone size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {telefono}</p>}
                {correo && <p className="mb-4 flex items-start gap-2 text-white/50" style={{ fontSize: '0.875rem' }}><Mail size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {correo}</p>}
              </>
            )}
            <div className="flex gap-3">
              {SOCIAL_LINKS.map(({ label, Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:border-brand-yellow/50 hover:bg-brand-red hover:text-white"
                >
                  {Icon ? (
                    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.6 22H2.4l7.3-8.4L1.9 2h6.4l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
                    </svg>
                  )}
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
