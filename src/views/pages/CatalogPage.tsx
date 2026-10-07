/**
 * @fileoverview Pagina de catalogo de productos.
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import { useApp } from '../../App';
import { useCatalogController, CATALOG_SORT_OPTIONS, useFavoritesController, type CatalogSort } from '../../controllers';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { ProductCard } from '../components/shop/product-card';

/** Productos por pagina del catalogo. */
const PAGE_SIZE = 12;

/** Catalogo con chips de categoria, busqueda, ordenamiento y paginacion. */
export function CatalogPage() {
  const { addToCart } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') ?? 'Todos';
  const initialQ = searchParams.get('q') ?? '';
  const [category, setCategory] = useState(initialCat);
  const [query, setQuery] = useState(initialQ);
  const [sort, setSort] = useState<CatalogSort>('relevance');
  const [page, setPage] = useState(1);
  const { products, categories, isLoading } = useCatalogController(category, query, sort);
  const { toggleFavorite, isFavorite } = useFavoritesController();

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (category !== 'Todos') next.set('cat', category);
      else next.delete('cat');
      if (query) next.set('q', query);
      else next.delete('q');
      return next;
    }, { replace: true });
  }, [category, query, setSearchParams]);

  /** Vuelve a la primera pagina al cambiar filtros. */
  useEffect(() => {
    setPage(1);
  }, [category, query, sort]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allCategories = ['Todos', ...categories.map((c) => c.name)];

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
          <Link to="/" className="hover:text-[#C62828]">Inicio</Link> / {category === 'Todos' ? 'Catalogo' : category}
        </p>
        <PageHeader title={category === 'Todos' ? 'Catalogo' : category} subtitle={`${products.length} productos encontrados`} />

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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" aria-label="Cargando productos">
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
        ) : products.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Sin productos en esta categoria"
            description="Estamos trabajando para traerte mas productos pronto."
            action={
              <button
                onClick={() => { setCategory('Todos'); setQuery(''); }}
                className="bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-6 py-2.5 transition-colors"
                style={{ fontSize: '0.875rem', fontWeight: 600 }}
              >
                Ver todos los productos
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
    </main>
  );
}
