import { useProductController } from '../../controllers';
import { HeroBanner } from '../components/home/HeroBanner';
import { TrustBar } from '../components/home/TrustBar';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { PromoBanner } from '../components/home/PromoBanner';
import { Footer } from '../components/layout/Footer';

interface HomePageProps {
  onAddToCart: (product: import('../../models').Product) => void;
}

export function HomePage({ onAddToCart }: HomePageProps) {
  const { products, categories, isLoading } = useProductController();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C62828] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <HeroBanner />
      <TrustBar />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={products} onAddToCart={onAddToCart} />
      <PromoBanner />
      <Footer />
    </div>
  );
}
