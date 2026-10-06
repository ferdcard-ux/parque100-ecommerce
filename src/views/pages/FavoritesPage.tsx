/**
 * @fileoverview Pagina de productos favoritos.
 */
import { Link } from 'react-router';
import { Heart } from 'lucide-react';
import { useApp } from '../../App';
import { useFavoritesController, useProductController } from '../../controllers';
import { PageHeader } from '../components/shared/page-header';
import { EmptyState } from '../components/shared/empty-state';
import { ProductCard } from '../components/shop/product-card';

/** Lista de productos marcados como favoritos. */
export function FavoritesPage() {
  const { addToCart } = useApp();
  const { products } = useProductController();
  const { favorites, toggleFavorite, isFavorite } = useFavoritesController();
  const favProducts = products.filter((p) => favorites.includes(p.id));

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Favoritos" subtitle="Productos guardados para comprar despues" backTo="/" />
        {favProducts.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Sin favoritos aun"
            description="Toca la estrella de cualquier producto para guardarlo aqui."
            action={<Link to="/catalogo" className="bg-[#C62828] text-white rounded-full px-6 py-2.5" style={{ fontWeight: 600 }}>Explorar catalogo</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favProducts.map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={isFavorite(p.id)} onToggleFavorite={toggleFavorite} onAddToCart={addToCart} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
