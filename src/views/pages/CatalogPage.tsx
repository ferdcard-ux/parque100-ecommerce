/**
 * @fileoverview Pagina de catalogo de productos.
 */
import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import { useApp } from '../../App';
import { useCatalogController, CATALOG_SORT_OPTIONS, useFavoritesController, type CatalogSort } from '../../controllers';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { ProductCard } from '../components/shop/product-card';

/** Productos por pagina del catalogo. */
const PAGE_SIZE = 12;

/** Catalogo con sidebar de filtros, busqueda, ordenamiento y paginacion. */
export function CatalogPage() {
  const { addToCart } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') ?? 'Todos';
  const initialQ = searchParams.get('q') ?? '';
  const initialBrand = searchParams.get('marca') ?? '';
  const initialPromo = searchParams.get('promo') === '1';
  const [category, setCategory] = useState(initialCat);
  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState<CatalogSort>('relevance');
  const [page, setPage] = useState(1);
  // Filtros aplicados + borrador (botones Aplicar/Limpiar).
  const [brand, setBrand] = useState(initialBrand);
  const [draftBrand, setDraftBrand] = useState(initialBrand);
  const [promoOnly, setPromoOnly] = useState(initialPromo);
  const [draftPromo, setDraftPromo] = useState(initialPromo);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [draftMin, setDraftMin] = useState('');
  const [draftMax, setDraftMax] = useState('');
  const { products, categories, isLoading, error, reload, brands } = useCatalogController(category, query, sort, {
    brand,
    promoOnly,
    minPrice,
    maxPrice,
  });
  const { toggleFavorite, isFavorite } = useFavoritesController();

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (category !== 'Todos') next.set('cat', category);
      else next.delete('cat');
      if (query) next.set('q', query);
      else next.delete('q');
      if (brand) next.set('marca', brand);
      else next.delete('marca');
      if (promoOnly) next.set('promo', '1');
      else next.delete('promo');
      return next;
    }, { replace: true });
  }, [category, query, brand, promoOnly, setSearchParams]);

  /** Vuelve a la primera pagina al cambiar filtros. */
  useEffect(() => {
    setPage(1);
  }, [category, query, sort, brand, promoOnly, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allCategories = useMemo(() => ['Todos', ...categories.map((c) => c.name)], [categories]);
  const title = query ? `Resultados para "${query}" (${products.length})` : `${category === 'Todos' ? 'Catalogo' : category} (${products.length})`;

  const applyFilters = () => {
    setBrand(draftBrand);
    setPromoOnly(draftPromo);
    setMinPrice(draftMin ? Number(draftMin) : undefined);
    setMaxPrice(draftMax ? Number(draftMax) : undefined);
  };

  const clearFilters = () => {
    setDraftBrand('');
    setDraftPromo(false);
    setDraftMin('');
    setDraftMax('');
    setBrand('');
    setPromoOnly(false);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setCategory('Todos');
    setQuery('');
  };

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
          <Link to="/" className="hover:text-[#C62828]">Inicio</Link> / {category === 'Todos' ? 'Catalogo' : category}
        </p>
        <PageHeader title={title} subtitle={`${products.length} productos encontrados`} />

        {query && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-[#FBC02D]/40 bg-[#FBC02D]/10 px-5 py-4">
            <p className="text-[#212121] font-semibold" style={{ fontSize: '0.9rem' }}>Ofertas relacionadas con “{query}”</p>
            <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>Activa “Solo promociones” en los filtros para ver precios felices.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full border transition-colors ${
                category === cat
                  ? 'bg-[#C62828] text-white border-[#C62828]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#C62828] hover:text-[#C62828]'
              }`}
              style={{ fontSize: '0.8rem', fontWeight: 500 }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          <aside className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
            <div>
              <p className="text-[#212121] font-semibold mb-2" style={{ fontSize: '0.85rem' }}>Precio</p>
              <div className="flex items-center gap-2">
                <input type="number" min={0} placeholder="Min" value={draftMin} onChange={(e) => setDraftMin(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828]" style={{ fontSize: '0.8rem' }} />
                <span className="text-gray-400">-</span>
                <input type="number" min={0} placeholder="Max" value={draftMax} onChange={(e) => setDraftMax(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828]" style={{ fontSize: '0.8rem' }} />
              </div>
            </div>
            <div>
              <p className="text-[#212121] font-semibold mb-2" style={{ fontSize: '0.85rem' }}>Marca</p>
              <select value={draftBrand} onChange={(e) => setDraftBrand(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-2 py-1.5 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828]" style={{ fontSize: '0.8rem' }}>
                <option value="">Todas</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-gray-600" style={{ fontSize: '0.85rem' }}>
              <input type="checkbox" checked={draftPromo} onChange={(e) => setDraftPromo(e.target.checked)} className="accent-[#C62828] w-4 h-4" />
              Solo promociones
            </label>
            <div className="flex gap-2">
              <button onClick={clearFilters}
                className="flex-1 py-2 rounded-xl border border-gray-200 text-[#212121] font-medium hover:bg-gray-50 transition-colors" style={{ fontSize: '0.8rem' }}>
                Limpiar
              </button>
              <button onClick={applyFilters}
                className="flex-1 py-2 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-colors" style={{ fontSize: '0.8rem' }}>
                Aplicar
              </button>
            </div>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-6 bg-white rounded-2xl border border-gray-100 px-4 py-3">
              <span className="text-gray-500" style={{ fontSize: '0.85rem' }}>Mostrando {products.length} productos</span>
              <label className="flex items-center gap-2 text-gray-600" style={{ fontSize: '0.8rem' }}>
                <SlidersHorizontal size={14} />
                Ordenar por
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as CatalogSort)}
                  className="border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#C62828]"
                >
                  {CATALOG_SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 max-[380px]:grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Cargando productos">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                    <div className="h-40 bg-gray-100 animate-pulse" />
                    <div className="p-3 flex flex-col gap-2">
                      <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                      <div className="h-5 w-1/2 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                icon={SearchX}
                title="No fue posible cargar el catálogo"
                description={error}
                action={
                  <button
                    onClick={reload}
                    className="bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-6 py-2.5 transition-colors"
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    Reintentar
                  </button>
                }
              />
            ) : products.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Sin productos con estos filtros"
                description="Prueba limpiar los filtros o buscar otro término."
                action={
                  <button
                    onClick={clearFilters}
                    className="bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-6 py-2.5 transition-colors"
                    style={{ fontSize: '0.875rem', fontWeight: 600 }}
                  >
                    Limpiar filtros
                  </button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-2 max-[380px]:grid-cols-1 sm:grid-cols-3 gap-4">
                  {visible.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorite={isFavorite(product.id)}
                      onToggleFavorite={toggleFavorite}
                      onAddToCart={addToCart}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-[#C62828] hover:text-[#C62828] transition-colors"
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Anterior
                    </button>
                    <span className="text-gray-500" style={{ fontSize: '0.8rem' }}>Página {safePage} de {totalPages}</span>
                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-600 disabled:opacity-40 hover:border-[#C62828] hover:text-[#C62828] transition-colors"
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
