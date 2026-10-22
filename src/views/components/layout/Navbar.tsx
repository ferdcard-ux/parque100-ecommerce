import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ShoppingCart, Heart, Search, Menu, X, Store, ShieldCheck, User, LogOut, RefreshCw,
} from 'lucide-react';
import type { User as UserType, UserRole, Product } from '../../../models';
import { useFavoritesController, useProductController, useUsersController } from '../../../controllers';
import { formatPrice } from '../../../utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { UserAvatar } from '../shared/user-avatar';
import { UserNotifications } from './UserNotifications';

interface NavbarProps {
  cartCount: number;
  isAdmin: boolean;
  isLoggedIn: boolean;
  user: UserType | null;
  userRole?: UserRole | null;
  sessions: UserType[];
  onSwitchSession: (id: number) => void;
  onLogout: () => void;
}

export function Navbar({ cartCount, isAdmin, isLoggedIn, user, userRole, sessions, onSwitchSession, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestItems, setSuggestItems] = useState<Product[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { users: allUsers, reload: reloadUsers } = useUsersController({ autoLoad: false });
  const { suggestProducts } = useProductController();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const q = searchValue.trim().toLowerCase();
    if (q.length < 2) {
      setSuggestItems([]);
      return;
    }
    const t = setTimeout(() => {
      suggestProducts(searchValue).then((items) => {
        setSuggestItems(items);
        setSuggestOpen(true);
      }).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [searchValue, suggestProducts]);

  const goSearch = () => {
    if (!searchValue.trim()) return;
    setSuggestOpen(false);
    navigate(`/catalogo?q=${encodeURIComponent(searchValue.trim())}`);
  };

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

  /** Fotos frescas del backend (la sesion local puede traer foto desactualizada). */
  const [photoMap, setPhotoMap] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!isLoggedIn) return;
    reloadUsers().catch(() => {});
  }, [isLoggedIn, reloadUsers]);
  useEffect(() => {
    const map: Record<number, string> = {};
    for (const row of allUsers) {
      if (row.Foto) map[row.ID_Usuario] = row.Foto;
    }
    setPhotoMap(map);
  }, [allUsers]);

  /** Foto de una sesion: la guardada o la fresca del backend. */
  const sessionPhoto = (s: UserType): string | null => s.photo ?? photoMap[s.id] ?? null;

  const { favorites: favoriteIds } = useFavoritesController(user?.id ?? null);
  const favoriteCount = favoriteIds.length;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--brand-yellow), var(--brand-red))' }}
            >
              <Store className="text-white" size={20} />
            </div>
            <div className="hidden sm:block">
              <span className="text-brand-red font-bold leading-none block" style={{ fontSize: '1rem' }}>Tienda</span>
              <span className="text-brand-yellow font-bold leading-none block" style={{ fontSize: '0.85rem' }}>Parque 100</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-brand-ink hover:text-brand-red transition-colors font-medium">Inicio</Link>
            <button onClick={handleCategoriesClick} className="text-brand-ink hover:text-brand-red transition-colors font-medium">Categorías</button>
            <Link to="/catalogo" className="text-brand-ink hover:text-brand-red transition-colors font-medium">Catálogo</Link>
            {isAdmin && (
              <Link to={userRole === 'domiciliario' ? '/admin/pedidos-pendientes' : '/admin'} className="flex items-center gap-1.5 text-brand-red hover:text-brand-red-dark transition-colors font-medium">
                <ShieldCheck size={15} />
                {userRole === 'domiciliario' ? 'Pedidos' : 'Admin'}
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full" ref={searchRef}>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                maxLength={100}
                placeholder="Buscar productos..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => searchValue.trim().length >= 2 && setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goSearch();
                }}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-brand-surface border border-gray-200 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red text-sm text-brand-ink"
              />
              {suggestOpen && suggestItems.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {suggestItems.map((p) => (
                    <button key={p.id} onClick={() => { setSuggestOpen(false); navigate(`/producto/${p.id}`); }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-brand-surface transition-colors text-left">
                      <ImageWithFallback src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-brand-ink" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.name}</span>
                        <span className="block text-brand-red font-bold" style={{ fontSize: '0.78rem' }}>{formatPrice(p.price)}</span>
                      </span>
                    </button>
                  ))}
                  <button onClick={goSearch} className="w-full px-3 py-2 text-center text-brand-red font-semibold hover:bg-red-50 transition-colors" style={{ fontSize: '0.8rem' }}>
                    Ver todos los resultados
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn && <UserNotifications userId={user?.id ?? null} />}
            <Link to="/favoritos" aria-label={`Favoritos${favoriteCount > 0 ? `, ${favoriteCount} productos` : ''}`} className="relative p-2 rounded-full hover:bg-red-50 transition-colors">
              <Heart size={22} className="text-brand-red" />
              {favoriteCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-red text-white flex items-center justify-center" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                  {favoriteCount}
                </span>
              )}
            </Link>
            <Link to="/cart" aria-label={`Carrito${cartCount > 0 ? `, ${cartCount} productos` : ''}`} className="relative p-2 rounded-full hover:bg-red-50 transition-colors">
              <ShoppingCart size={22} className="text-brand-ink" />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-red text-white flex items-center justify-center"
                  style={{ fontSize: '0.65rem', fontWeight: 700 }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {isLoggedIn && user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} aria-expanded={userMenuOpen} aria-haspopup="menu"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-red text-white font-medium hover:bg-brand-red-dark transition-colors"
                  style={{ fontSize: '0.875rem' }}
                >
                  <UserAvatar
                    photo={sessionPhoto(user)}
                    firstName={user.firstName}
                    lastName={user.lastName}
                    className="w-6 h-6 rounded-full bg-white/20"
                    textClassName="text-white font-bold"
                    textStyle={{ fontSize: '0.65rem' }}
                  />
                  <span className="max-w-[100px] truncate">{userRole === 'admin' ? 'Admin' : userRole === 'domiciliario' ? 'Domiciliario' : user.firstName}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                      <UserAvatar
                        photo={sessionPhoto(user)}
                        firstName={user.firstName}
                        lastName={user.lastName}
                        className="w-10 h-10 rounded-full bg-brand-red/10 text-brand-red"
                        textClassName="font-bold"
                        textStyle={{ fontSize: '0.85rem' }}
                      />
                      <div className="min-w-0">
                        <p className="text-brand-ink font-semibold truncate" style={{ fontSize: '0.9rem' }}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-400 truncate" style={{ fontSize: '0.8rem' }}>{user.email}</p>
                        {isAdmin && (
                          <span className="flex items-center gap-1 mt-1.5">
                            <ShieldCheck size={12} className="text-brand-red" />
                            <span className="text-brand-red font-medium" style={{ fontSize: '0.75rem' }}>{userRole === 'domiciliario' ? 'Domiciliario' : 'Administrador'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { setUserMenuOpen(false); navigate('/cuenta'); }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-600 hover:bg-brand-surface transition-colors"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <User size={16} />
                        Mi cuenta
                      </button>
                      <button onClick={() => { setUserMenuOpen(false); navigate('/compras'); }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-600 hover:bg-brand-surface transition-colors"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <ShoppingCart size={16} />
                        Mis compras
                      </button>
                      <button onClick={() => { setUserMenuOpen(false); navigate('/login?mode=switch'); }}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-600 hover:bg-brand-surface transition-colors"
                        style={{ fontSize: '0.875rem' }}
                      >
                        <RefreshCw size={16} />
                        Cambiar de usuario
                      </button>
                      {sessions.filter((s) => s.id !== user.id).length > 0 && (
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <p className="px-5 py-1.5 text-gray-400" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Otras sesiones activas</p>
                          {sessions.filter((s) => s.id !== user.id).map((s) => (
                            <button key={s.id} onClick={() => { setUserMenuOpen(false); onSwitchSession(s.id); }}
                              className="w-full flex items-center gap-3 px-5 py-2 text-gray-600 hover:bg-brand-surface transition-colors"
                              style={{ fontSize: '0.8rem' }}
                            >
                              <UserAvatar
                                photo={sessionPhoto(s)}
                                firstName={s.firstName}
                                lastName={s.lastName}
                                className="w-6 h-6 rounded-full bg-brand-yellow/30"
                                textClassName="font-bold"
                                textStyle={{ fontSize: '0.6rem' }}
                              />
                              <span className="truncate">{s.firstName} {s.lastName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-brand-red hover:bg-red-50 transition-colors"
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
                className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-red text-white font-medium hover:bg-brand-red-dark transition-colors"
                style={{ fontSize: '0.875rem' }}
              >
                <User size={15} />
                Iniciar Sesión
              </Link>
            )}

            <button className="md:hidden min-w-11 min-h-11 flex items-center justify-center" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-white border-t px-4 py-4 flex flex-col gap-3 shadow-lg">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              maxLength={100}
              placeholder="Buscar productos..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchValue.trim()) {
                  setMenuOpen(false);
                  navigate(`/catalogo?q=${encodeURIComponent(searchValue.trim())}`);
                }
              }}
              className="w-full pl-9 pr-4 py-2 rounded-full bg-brand-surface border border-gray-200 focus:outline-none focus:border-brand-red text-sm"
            />
          </div>
          <Link to="/" className="text-brand-ink font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <button onClick={() => { setMenuOpen(false); handleCategoriesClick(); }} className="text-left text-brand-ink font-medium py-2 border-b">Categorías</button>
          <Link to="/catalogo" className="text-brand-ink font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Catálogo</Link>
          <Link to="/mapa-sitio" className="text-brand-ink font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>Mapa del Sitio</Link>
          {isAdmin && (
            <Link to={userRole === 'domiciliario' ? '/admin/pedidos-pendientes' : '/admin'} className="flex items-center gap-1.5 text-brand-red font-medium py-2 border-b" onClick={() => setMenuOpen(false)}>
              <ShieldCheck size={15} />
              {userRole === 'domiciliario' ? 'Pedidos' : 'Admin'}
            </Link>
          )}
          {isLoggedIn && user ? (
            <>
              <div className="flex items-center gap-2 py-2 border-b border-gray-100">
                <UserAvatar
                  photo={sessionPhoto(user)}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  className="w-8 h-8 rounded-full bg-brand-red text-white"
                  textClassName="font-bold"
                  textStyle={{ fontSize: '0.7rem' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-brand-ink font-medium truncate" style={{ fontSize: '0.85rem' }}>{user.firstName} {user.lastName}</p>
                  <p className="text-gray-400 truncate" style={{ fontSize: '0.75rem' }}>{user.email}</p>
                </div>
              </div>
              <button onClick={() => { setMenuOpen(false); navigate('/cuenta'); }}
                className="text-left flex items-center gap-2 text-gray-600 font-medium py-2 border-b"
                style={{ fontSize: '0.85rem' }}
              >
                <User size={16} /> Mi cuenta
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/compras'); }}
                className="text-left flex items-center gap-2 text-gray-600 font-medium py-2 border-b"
                style={{ fontSize: '0.85rem' }}
              >
                <ShoppingCart size={16} /> Mis compras
              </button>
              <button onClick={() => { setMenuOpen(false); navigate('/login?mode=switch'); }}
                className="text-left flex items-center gap-2 text-gray-600 font-medium py-2 border-b"
                style={{ fontSize: '0.85rem' }}
              >
                <RefreshCw size={16} /> Cambiar de usuario
              </button>
              <button onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="text-left flex items-center gap-2 text-brand-red font-medium py-2 border-b"
                style={{ fontSize: '0.85rem' }}
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login" className="text-center py-2 rounded-full bg-brand-red text-white font-medium" onClick={() => setMenuOpen(false)}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
