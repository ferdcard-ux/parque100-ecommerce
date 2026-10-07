/**
 * @fileoverview Pagina de detalle de un producto.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Star, Minus, Plus, Truck, ShieldCheck, Leaf } from 'lucide-react';
import { useApp } from '../../App';
import { useFavoritesController, useProductController } from '../../controllers';
import { PageHeader } from '../components/shared/page-header';
import { ProductCard } from '../components/shop/product-card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { formatPrice } from '../../utils';

/** Detalle de producto con cantidad, stock y relacionados. */
export function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useApp();
  const { products, isLoading } = useProductController();
  const { toggleFavorite, isFavorite } = useFavoritesController();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const product = products.find((p) => String(p.id) === id);
  const related = product
    ? products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
    : [];

  const handleAdd = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
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
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center z-10"
            >
              <Star size={16} className={isFavorite(product.id) ? 'fill-[#FBC02D] text-[#FBC02D]' : 'text-gray-400'} />
            </button>
            <ImageWithFallback src={product.image} alt={product.name} className="w-full h-72 object-cover rounded-xl" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#C62828]/10 text-[#C62828] mb-3" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {product.category}
            </span>
            <h2 className="text-[#212121] mb-2" style={{ fontSize: '1.5rem', fontWeight: 700 }}>{product.name}</h2>
            <p className="text-[#C62828] font-bold mb-4" style={{ fontSize: '1.6rem' }}>{formatPrice(product.price)}</p>
            <p className="text-gray-500 mb-6" style={{ fontSize: '0.9rem' }}>{product.description}</p>
            <ul className="flex flex-col gap-3 text-gray-600" style={{ fontSize: '0.85rem' }}>
              <li className="flex items-center gap-2"><Truck size={16} className="text-[#C62828]" /> Entrega en 45-60 minutos</li>
              <li className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#C62828]" /> Calidad garantizada</li>
              <li className="flex items-center gap-2"><Leaf size={16} className="text-[#C62828]" /> Producto fresco del dia</li>
            </ul>
          </div>

          <aside className="bg-white rounded-2xl border border-gray-100 p-6 h-fit">
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
            <h2 className="text-[#212121] mb-6" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Tambien te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} isFavorite={isFavorite(p.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
