/**
 * @fileoverview Pagina de detalle de un producto.
 */
import { useState, useCallback, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import useEmbla from 'embla-carousel-react';
import { Heart, Minus, Plus, Truck, ShieldCheck, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../App';
import { useFavoritesController, useProductController, useRatingsController } from '../../controllers';
import type { Rating } from '../../models';
import { PageHeader } from '../components/shared/page-header';
import { ProductCard } from '../components/shop/product-card';
import { StarRating } from '../components/shared/star-rating';
import { ReviewCard } from '../components/ratings/review-card';
import { ReviewFormModal } from '../components/ratings/review-form-modal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatPrice, formatUnitPrice, hasPromo, savingsAmount } from '../../utils';

/** Detalle de producto con cantidad, stock y relacionados. */
export function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, user, isLoggedIn } = useApp();
  const { products, isLoading } = useProductController();
  const { toggleFavorite, isFavorite } = useFavoritesController();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { summary, ratings, isSaving, edit } = useRatingsController({ producto: id });
  const [editing, setEditing] = useState<Rating | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const product = products.find((p) => String(p.id) === id);
  const related = product
    ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 8)
    : [];
  const [emblaRef, emblaApi] = useEmbla({ align: 'start', containScroll: 'trimSnaps' });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const updateArrows = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);
  useEffect(() => {
    if (!emblaApi) return;
    updateArrows();
    emblaApi.on('select', updateArrows);
    emblaApi.on('reInit', updateArrows);
  }, [emblaApi, updateArrows]);
  const promo = product ? hasPromo(product.price, product.previousPrice) : false;
  const unit = product ? formatUnitPrice(product.price, product.contentQty, product.contentUnit) : null;

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleEdit = async (stars: number, comment: string) => {
    if (!editing || !user) return;
    setEditError(null);
    try {
      await edit(editing.ID_Calificacion, {
        ID_Usuario: user.id,
        Estrellas: stars,
        Comentario: comment,
      });
      setEditing(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'No fue posible guardar.');
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Cargando producto">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="w-full h-72 bg-gray-100 rounded-xl animate-pulse" />
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-6 w-1/4 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-8 w-3/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-1/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="h-8 w-1/2 bg-gray-100 rounded animate-pulse mb-4" />
            <div className="h-11 w-full bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <h1 className="text-[#212121] mb-2" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Producto no encontrado</h1>
          <p className="text-gray-400 mb-6">Es posible que este producto ya no este disponible.</p>
          <Link to="/catalogo" className="text-[#C62828] font-medium hover:underline">Volver al catalogo</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
          <Link to="/catalogo" className="hover:text-[#C62828]">Catálogo</Link> /{' '}
          <Link to={`/catalogo?cat=${encodeURIComponent(product.category)}`} className="hover:text-[#C62828]">{product.category}</Link> / {product.name}
        </p>
        <PageHeader title="Detalle del producto" backTo="/catalogo" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
            <button
              onClick={() => toggleFavorite(product.id)}
              aria-label="Favorito"
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center z-10 before:absolute before:-inset-2 before:content-['']"
            >
              <Heart size={16} className={isFavorite(product.id) ? 'fill-[#C62828] text-[#C62828]' : 'text-gray-400'} />
            </button>
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              sizes="(max-width: 1023px) 100vw, 33vw"
              className="w-full aspect-[4/3] object-cover rounded-xl"
            />
            <p className="text-gray-400 mt-2" style={{ fontSize: '0.7rem' }}>*Las imágenes del producto son de referencia.</p>
          </div>

          <div>
            {product.brand && (
              <Link to={`/catalogo?marca=${encodeURIComponent(product.brand)}`} className="inline-block underline underline-offset-2 text-gray-500 mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                {product.brand}
              </Link>
            )}
            <span className="inline-block px-3 py-1 rounded-full bg-[#C62828]/10 text-[#C62828] mb-3 ml-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {product.category}
            </span>
            <h2 className="text-[#212121] mb-1" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{product.name}</h2>
            {unit && <p className="text-gray-500 mb-1" style={{ fontSize: '0.85rem' }}>{unit}</p>}
            <p className="text-gray-400 mb-2" style={{ fontSize: '0.75rem' }}>SKU: {product.sku ?? product.id}</p>
            {promo ? (
              <div className="mb-4">
                <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>Antes <span className="line-through">{formatPrice(product.previousPrice as number)}</span></p>
                <p className="text-[#C62828] font-bold" style={{ fontSize: '1.6rem' }}>{formatPrice(product.price)}</p>
                <p className="text-green-700 font-semibold" style={{ fontSize: '0.85rem' }}>Ahorro {formatPrice(savingsAmount(product.price, product.previousPrice))}</p>
              </div>
            ) : (
              <p className="text-[#C62828] font-bold mb-4" style={{ fontSize: '1.6rem' }}>{formatPrice(product.price)}</p>
            )}
            <p className="text-gray-500 mb-6" style={{ fontSize: '0.9rem' }}>{product.description}</p>
            <ul className="flex flex-col gap-3 text-gray-600" style={{ fontSize: '0.85rem' }}>
              <li className="flex items-center gap-2"><Truck size={16} className="text-[#C62828]" /> Entrega en 45-60 minutos</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#C62828]" /> Calidad garantizada</li>
              <li className="flex items-center gap-2"><Leaf size={16} className="text-[#C62828]" /> Producto fresco del dia</li>
            </ul>
          </div>

          <aside className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
            {promo && (
              <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>Antes <span className="line-through">{formatPrice(product.previousPrice as number)}</span></p>
            )}
            <p className="text-[#C62828] font-bold mb-1" style={{ fontSize: '1.4rem' }}>{formatPrice(product.price)}</p>
            <p className="flex items-center gap-2 text-green-600 mb-6" style={{ fontSize: '0.85rem' }}>
              <span className="w-2 h-2 rounded-full bg-green-500" /> {product.stock} disponibles
            </p>
            <div className="flex items-center justify-between border border-gray-200 rounded-full px-2 py-1.5 mb-4">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Menos"><Minus size={16} /></button>
              <span className="font-semibold">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="p-1.5 hover:bg-gray-100 rounded-full" aria-label="Mas"><Plus size={16} /></button>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full py-3 transition-colors"
              style={{ fontWeight: 600 }}
            >
              {added ? 'Anadido!' : 'Anadir al carrito'}
            </button>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[#212121]" style={{ fontSize: '1.2rem', fontWeight: 700 }}>También puede interesarte</h2>
              <div className="flex gap-2">
                <button onClick={() => emblaApi?.scrollPrev()} disabled={!canPrev} className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-[#C62828] hover:text-[#C62828] disabled:opacity-40 transition-colors" aria-label="Anterior">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => emblaApi?.scrollNext()} disabled={!canNext} className="w-11 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-[#C62828] hover:text-[#C62828] disabled:opacity-40 transition-colors" aria-label="Siguiente">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <div ref={emblaRef} className="overflow-hidden pb-2">
              <div className="flex gap-4">
              {related.map((p) => (
                <div key={p.id} className="min-w-[220px] max-w-[220px] shrink-0">
                  <ProductCard key={p.id} product={p} isFavorite={isFavorite(p.id)} onToggleFavorite={toggleFavorite} />
                </div>
              ))}
              </div>
            </div>
          </section>
        )}

        {(product.brand || product.packaging || product.ingredients || product.storage) && (
          <section className="mt-8 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-[#212121] mb-4" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Descripción</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3" style={{ fontSize: '0.85rem' }}>
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Nombre</dt><dd className="text-[#212121] font-medium">{product.name}</dd></div>
              {product.brand && <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Marca</dt><dd className="text-[#212121] font-medium">{product.brand}</dd></div>}
              <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">SKU</dt><dd className="text-[#212121] font-medium">{product.sku ?? product.id}</dd></div>
              {product.packaging && <div className="flex gap-2"><dt className="text-gray-400 w-28 shrink-0">Embalaje</dt><dd className="text-[#212121]">{product.packaging}</dd></div>}
              {product.ingredients && <div className="flex gap-2 sm:col-span-2"><dt className="text-gray-400 w-28 shrink-0">Ingredientes</dt><dd className="text-[#212121]">{product.ingredients}</dd></div>}
              {product.storage && <div className="flex gap-2 sm:col-span-2"><dt className="text-gray-400 w-28 shrink-0">Conservación</dt><dd className="text-[#212121]">{product.storage}</dd></div>}
            </dl>
          </section>
        )}

        <section className="mt-12 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-[#212121] mb-2" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Calificaciones</h2>
          <div className="flex items-center gap-3 mb-4">
            <StarRating value={summary?.promedio ?? 0} />
            <span className="text-gray-500" style={{ fontSize: '0.85rem' }}>
              {summary && summary.total > 0 && summary.promedio !== null
                ? `${summary.promedio.toFixed(1)} · ${summary.total} calificaciones`
                : 'Sin calificaciones aun'}
            </span>
          </div>
          {isLoggedIn ? (
            <p className="bg-[#FBC02D]/10 border border-[#FBC02D]/40 rounded-xl px-4 py-3 mb-2" style={{ fontSize: '0.82rem' }}>
              Solo puedes reseñar productos que compraste en un pedido <strong>entregado</strong>. Ve a{' '}
              <Link to="/compras" className="text-[#C62828] font-medium hover:underline">Mis compras</Link>{' '}
              y usa el botón “Dejar una reseña”.
            </p>
          ) : (
            <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>
              <Link to="/login" className="text-[#C62828] hover:underline">Inicia sesion</Link> para dejar una reseña de este producto.
            </p>
          )}
          {ratings.length > 0 ? (
            <ul className="mt-4 flex flex-col divide-y divide-gray-50">
              {ratings.slice(0, 10).map((r) => (
                <ReviewCard
                  key={r.ID_Calificacion}
                  rating={r}
                  isOwn={user?.id != null && r.ID_Usuario === user.id}
                  onEdit={(review) => { setEditError(null); setEditing(review); }}
                />
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mt-4" style={{ fontSize: '0.85rem' }}>Aun no hay reseñas para este producto.</p>
          )}
        </section>
        {editing && product && (
          <ReviewFormModal
            title="Editar mi reseña"
            productImage={product.image}
            productName={product.name}
            productDetails={product.description}
            initialStars={editing.Estrellas}
            initialComment={editing.Comentario ?? ''}
            submitLabel="Guardar cambios"
            saving={isSaving}
            error={editError}
            onClose={() => { setEditing(null); setEditError(null); }}
            onSubmit={(stars, comment) => { void handleEdit(stars, comment); }}
          />
        )}
      </div>
    </main>
  );
}
