/**
 * @fileoverview Mapa del sitio con las rutas internas.
 */
import { Link } from 'react-router';
import { PageHeader } from '../components/shared/page-header';

const ROUTES = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catalogo' },
  { to: '/cart', label: 'Carrito' },
  { to: '/cuenta', label: 'Mi cuenta' },
  { to: '/perfil', label: 'Perfil' },
  { to: '/compras', label: 'Mis compras' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/ayuda', label: 'Centro de ayuda' },
  { to: '/privacidad', label: 'Privacidad y Cookies' },
  { to: '/terminos', label: 'Términos y Condiciones' },
  { to: '/mapa-sitio', label: 'Mapa del sitio' },
];

/** Indice de rutas de la aplicacion. */
export function SitemapPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <PageHeader title="Mapa del sitio" subtitle="Todas las secciones" backTo="/" />
        <ul className="flex flex-col divide-y divide-gray-50">
          {ROUTES.map((r) => (
            <li key={r.to}>
              <Link to={r.to} className="block py-3 text-[#212121] hover:text-[#C62828] transition-colors" style={{ fontSize: '0.9rem' }}>
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
