import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ShoppingCart, Heart, Search, Menu, X, Store, ShieldCheck, User, LogOut,
} from 'lucide-react';
import type { User as UserType } from '../../../models';

interface NavbarProps {
  cartCount: number;
  isAdmin: boolean;
  isLoggedIn: boolean;
  user: UserType | null;
  onLogout: () => void;
}

export function Navbar({ cartCount, isAdmin, isLoggedIn, user, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoriesClick = () => {
    const onHome = window.location.pathname === '/';
    if (onHome) {
      document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/?scroll=categorias');
    }
  };

  const handleLogout = () => {
    setUserMenuOpen(false);
    onLogout();
    navigate('/');
  };

  const userInitials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '';

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
            <button onClick={handleCategoriesClick} className="text-[#212121] hover:text-[#C62828] transition-colors font-medium">Categorías</button>
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

            {isLoggedIn && user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C62828] text-white font-medium hover:bg-[#b71c1c] transition-colors"
                  style={{ fontSize: '0.875rem' }}
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold" style={{ fontSize: '0.65rem' }}>{userInitials}</span>
                  </div>
                  <span className="max-w-[100px] truncate">{isAdmin ? 'Admin' : user.firstName}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-[#212121] font-semibold" style={{ fontSize: '0.9rem' }}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-gray-400 truncate" style={{ fontSize: '0.8rem' }}>{user.email}</p>
                      {isAdmin && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <ShieldCheck size={12} className="text-[#C62828]" />
                          <span className="text-[#C62828] font-medium" style={{ fontSize: '0.75rem' }}>Administrador</span>
                        </div>
                      )}
                    </div>
                    <div className="py-1">
                      <button onClick={() => { setUserMenuOpen(false); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-600 hover:bg-[#F5F5F5] transition-colors"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <User size={16} />
                        Cambiar de usuario
                      </button>
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-[#C62828] hover:bg-red-50 transition-colors"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <LogOut size={16} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login"
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#C62828] text-white font-medium hover:bg-[#b71c1c] transition-colors"
                style={{ fontSize: '0.875rem' }}
              >
                <User size={15} />
                Iniciar Sesión
              </Link>
            )}

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
          <button onClick={() => { setMenuOpen(false); handleCategoriesClick(); }} className="text-left text-[#212121] font-medium py-2 border-b">Categorías</button>
          <Link to="/sitemap" className="text-[#212121] font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Mapa del Sitio</Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-1.5 text-[#C62828] font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>
              <ShieldCheck size={15} />
              Admin
            </Link>
          )}
          {isLoggedIn && user ? (
            <>
              <div className="flex items-center gap-2 py-2 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#C62828] flex items-center justify-center">
                  <span className="text-white font-bold" style={{ fontSize: '0.7rem' }}>{userInitials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[#212121] font-medium truncate" style={{ fontSize: '0.85rem' }}>{user.firstName} {user.lastName}</p>
                  <p className="text-gray-400 truncate" style={{ fontSize: '0.75rem' }}>{user.email}</p>
                </div>
              </div>
              <button onClick={() => { setMenuOpen(false); navigate('/login'); }}
                className="text-left flex items-center gap-2 text-gray-600 font-medium py-2 border-b"
                style={{ fontSize: '0.85rem' }}
              >
                <User size={16} /> Cambiar de usuario
              </button>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="text-left flex items-center gap-2 text-[#C62828] font-medium py-2 border-b"
                style={{ fontSize: '0.85rem' }}
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login" className="text-center py-2 rounded-full bg-[#C62828] text-white font-medium" onClick={() => setMenuOpen(false)}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
