/**
 * @fileoverview Carrusel de productos destacados del hero.
 * Replica el comportamiento del "slider full" de exito.com adaptado a la
 * tarjeta del hero: avance automatico, flechas, puntos, gestos tactiles y
 * enlaces reales al catalogo.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import useEmbla from 'embla-carousel-react';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '../../../models';
import { discountPercent, formatPrice, hasPromo } from '../../../utils';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface HeroProductSliderProps {
  /** Catalogo real cargado desde la API. */
  products: Product[];
  /** Agrega el producto al carrito desde la diapositiva. */
  onAddToCart?: (product: Product) => void;
}

const MAX_SLIDES = 6;
const AUTOPLAY_MS = 5000;

/**
 * Elige productos con imagen y stock, priorizando promociones y variedad
 * de categorias para que el carrusel no repita el mismo tipo de producto.
 */
function pickHeroProducts(products: Product[]): Product[] {
  const eligible = products.filter((product) => product.image && product.stock > 0);
  const ordered = [
    ...eligible.filter((product) => hasPromo(product.price, product.previousPrice)),
    ...eligible.filter((product) => !hasPromo(product.price, product.previousPrice)),
  ];
  const picked: Product[] = [];
  const categories = new Set<string>();

  for (const product of ordered) {
    if (picked.length >= MAX_SLIDES) break;
    if (categories.has(product.category)) continue;
    picked.push(product);
    categories.add(product.category);
  }

  for (const product of ordered) {
    if (picked.length >= MAX_SLIDES) break;
    if (!picked.some((item) => item.id === product.id)) picked.push(product);
  }

  return picked;
}

/** Carrusel de productos reales con controles accesibles y autoplay. */
export function HeroProductSlider({ products, onAddToCart }: HeroProductSliderProps) {
  const slides = useMemo(() => pickHeroProducts(products), [products]);
  const [emblaRef, emblaApi] = useEmbla({
    loop: slides.length > 1,
    align: 'start',
    duration: 24,
  });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [addedId, setAddedId] = useState<number | null>(null);
  const addedTimer = useRef<number | null>(null);

  const syncSelected = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    syncSelected();
    emblaApi.on('select', syncSelected);
    emblaApi.on('reInit', syncSelected);
    return () => {
      emblaApi.off('select', syncSelected);
      emblaApi.off('reInit', syncSelected);
    };
  }, [emblaApi, syncSelected]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, slides.length]);

  useEffect(() => {
    if (!emblaApi || paused || slides.length <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [emblaApi, paused, slides.length]);

  useEffect(() => () => {
    if (addedTimer.current != null) window.clearTimeout(addedTimer.current);
  }, []);

  const handleAdd = (product: Product) => {
    onAddToCart?.(product);
    setAddedId(product.id);
    if (addedTimer.current != null) window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setAddedId(null), 1600);
  };

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-[17rem] sm:h-[19rem] lg:h-[20rem] xl:h-[21rem] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-white/15 flex items-center justify-center">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 rounded-full bg-white text-brand-red px-5 py-2.5 font-bold hover:bg-gray-50 transition-colors"
          style={{ fontSize: '0.9rem' }}
        >
          Explorar catálogo <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[17rem] sm:h-[19rem] lg:h-[20rem] xl:h-[21rem] group"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Productos destacados del catálogo"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          emblaApi?.scrollPrev();
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          emblaApi?.scrollNext();
        }
      }}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-brand-surface">
        <div ref={emblaRef} className="h-full overflow-hidden">
          <div className="flex h-full touch-pan-y">
            {slides.map((product, index) => {
              const promo = hasPromo(product.price, product.previousPrice);
              const rating = product.ratingAverage != null ? Number(product.ratingAverage) : null;
              return (
                <div
                  key={product.id}
                  className="relative min-w-0 shrink-0 grow-0 basis-full h-full"
                  role="group"
                  aria-roledescription="diapositiva"
                  aria-label={`${index + 1} de ${slides.length}: ${product.name}`}
                >
                  <Link to={`/producto/${product.id}`} className="absolute inset-0 z-0" aria-label={`Ver ${product.name}`}>
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      sizes="(max-width: 1023px) 100vw, 640px"
                      eager={index === 0}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  <div className="absolute inset-x-0 bottom-0 z-10 h-3/5 md:h-[55%] bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2 pointer-events-none">
                    <span
                      className="rounded-full bg-white/90 text-brand-ink px-2.5 py-1 font-semibold shadow-sm md:px-3"
                      style={{ fontSize: 'clamp(0.68rem, 0.9vw, 0.8rem)' }}
                    >
                      {product.category}
                    </span>
                    {promo && (
                      <span
                        className="rounded-full bg-brand-orange text-white px-2.5 py-1 font-bold shadow-sm md:px-3"
                        style={{ fontSize: 'clamp(0.68rem, 0.9vw, 0.8rem)' }}
                      >
                        -{discountPercent(product.price, product.previousPrice)}%
                      </span>
                    )}
                  </div>

                  <div
                    className="absolute inset-x-0 bottom-0 z-20 p-4 pb-8 pt-16 text-white pointer-events-none md:p-6 md:pb-10 md:pt-24"
                    style={{ textShadow: '0 1px 3px rgba(0, 0, 0, 0.85)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="uppercase tracking-wide text-white/75" style={{ fontSize: 'clamp(0.65rem, 0.9vw, 0.78rem)' }}>
                        {product.brand ?? 'Parque 100'}
                      </p>
                      {rating != null && (
                        <span className="inline-flex items-center gap-1 text-white/80" style={{ fontSize: 'clamp(0.68rem, 0.9vw, 0.8rem)' }}>
                          <Star size={11} className="fill-brand-yellow text-brand-yellow" />
                          {rating.toFixed(1)} ({product.ratingCount ?? 0})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
                      <Link
                        to={`/producto/${product.id}`}
                        className="pointer-events-auto block min-w-0 md:max-w-[68%]"
                      >
                        <h2
                          className="font-bold leading-tight line-clamp-2 hover:text-brand-yellow transition-colors"
                          style={{ fontSize: 'clamp(1.05rem, 2.2vw, 1.65rem)' }}
                        >
                          {product.name}
                        </h2>
                      </Link>

                      <div className="flex items-end justify-between gap-3 md:shrink-0 md:justify-end md:gap-4">
                        <div className="md:text-right">
                          {promo && (
                            <span className="block text-white/60 line-through" style={{ fontSize: 'clamp(0.68rem, 0.9vw, 0.85rem)' }}>
                              {formatPrice(product.previousPrice as number)}
                            </span>
                          )}
                          <span className="font-extrabold" style={{ fontSize: 'clamp(1.15rem, 2.6vw, 1.85rem)' }}>
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        {onAddToCart && (
                          <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white text-brand-red px-3 py-1.5 font-bold hover:bg-brand-yellow transition-colors shadow-sm md:px-4 md:py-2"
                            style={{ fontSize: 'clamp(0.72rem, 1vw, 0.9rem)' }}
                            aria-label={`Añadir ${product.name} al carrito`}
                          >
                            <ShoppingCart size={14} />
                            {addedId === product.id ? '¡Añadido!' : 'Añadir'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label="Producto anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/35 hover:bg-black/55 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              aria-label="Producto siguiente"
            >
              <ChevronRight size={18} />
            </button>
            <div
              className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-0.5 rounded-full bg-black/30 px-1.5 py-1 backdrop-blur-sm"
              role="group"
              aria-label="Seleccionar producto"
            >
              {slides.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => emblaApi?.scrollTo(index)}
                  className="flex h-5 w-5 items-center justify-center"
                  aria-label={`Ir al producto ${index + 1}: ${product.name}`}
                  aria-current={index === selected ? 'true' : undefined}
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${index === selected ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
