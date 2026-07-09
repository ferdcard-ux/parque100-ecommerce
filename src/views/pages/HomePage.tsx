import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useProductController } from '../../controllers';
import { HeroBanner } from '../components/home/HeroBanner';
import { TrustBar } from '../components/home/TrustBar';
import { CategoryGrid } from '../components/home/CategoryGrid';
import { CategoryModal } from '../components/home/CategoryModal';
import { AllCategoriesModal } from '../components/home/AllCategoriesModal';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { PromoBanner } from '../components/home/PromoBanner';
import { Footer } from '../components/layout/Footer';
import type { Category } from '../../models';

interface HomePageProps {
  onAddToCart: (product: import('../../models').Product) => void;
}

export function HomePage({ onAddToCart }: HomePageProps) {
  const { products, categories, isLoading } = useProductController();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('scroll') === 'categorias') {
      setTimeout(() => {
        document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [searchParams]);

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
      <CategoryGrid categories={categories} onCategoryClick={setSelectedCategory} onViewAllClick={() => setShowAllCategories(true)} />
      <FeaturedProducts products={products} onAddToCart={onAddToCart} />
      <PromoBanner />
      <Footer />
      <CategoryModal category={selectedCategory} products={products} onClose={() => setSelectedCategory(null)} onAddToCart={onAddToCart} />
      {showAllCategories && <AllCategoriesModal categories={categories} onCategoryClick={setSelectedCategory} onClose={() => setShowAllCategories(false)} />}
    </div>
  );
}
