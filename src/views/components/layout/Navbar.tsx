import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ShoppingCart, Heart, Search, Menu, X, Store, ShieldCheck,
} from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export function Navbar({ cartCount, isAdmin, isLoggedIn }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #FBC02D, #C62828)' }}
            >
              <Store className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <span className="text-[#C62828] font-bold leading-none block" style={{ fontSize: '1rem' }}>Tienda</span>
              <span className="text-[#FBC02D] font-bold leading-none block" style={{ fontSize: '0.85rem' }}>Parque 100</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-[#212121] hover:text-[#C62828] transition-colors font-medium">Inicio</Link>
            <Link to="/" className="text-[#212121] hover:text-[#C62828] transition-colors font-medium">Categorías</Link>
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1.5 text-[#C62828] hover:text-[#b71c1c] transition-colors font-medium">
                <ShieldCheck size={15} />
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F5F5F5] border border-gray-200 focus:outline-none focus:border-[#C62828] focus:ring-1 focus:ring-[#C62828] text-sm text-[#212121]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full hover:bg-red-50 transition-colors">
              <Heart size={22} className="text-[#C62828]" />
            </button>
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-red-50 transition-colors">
              <ShoppingCart size={22} className="text-[#212121]" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#C62828] text-white flex items-center justify-center"
                  style={{ fontSize: '0.65rem', fontWeight: 700 }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#C62828] text-white font-medium hover:bg-[#b71c1c] transition-colors"
              style={{ fontSize: '0.875rem' }}
            >
              {isAdmin && <ShieldCheck size={13} />}
              {isAdmin ? 'Administrador' : isLoggedIn ? 'Mi Cuenta' : 'Iniciar Sesión'}
            </Link>

            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 flex flex-col gap-3 shadow-lg">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F5F5F5] border border-gray-200 focus:outline-none focus:border-[#C62828] text-sm"
            />
          </div>
          <Link to="/" className="text-[#212121] font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/" className="text-[#212121] font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Categorías</Link>
          <Link to="/sitemap" className="text-[#212121] font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Mapa del Sitio</Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1.5 text-[#C62828] font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>
              <ShieldCheck size={15} />
              Admin
            </Link>
          )}
          <Link to="/login" className="text-center py-2 rounded-full bg-[#C62828] text-white font-medium" onClick={() => setMenuOpen(false)}>
            {isAdmin ? 'Administrador' : isLoggedIn ? 'Mi Cuenta' : 'Iniciar Sesión'}
          </Link>
        </div>
      )}
    </nav>
  );
}
