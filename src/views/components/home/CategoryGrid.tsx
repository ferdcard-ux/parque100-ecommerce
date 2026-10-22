import { ChevronRight } from 'lucide-react';
import type { Category } from '../../../models';
import { CategoryIllustration } from '../shared/CategoryIllustration';

interface CategoryGridProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
  onViewAllClick: () => void;
}

export function CategoryGrid({ categories, onCategoryClick, onViewAllClick }: CategoryGridProps) {
  return (
    <section id="categorias" className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-brand-ink" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Explorar Categorías ({categories.length})</h2>
            <p className="text-gray-500 mt-1" style={{ fontSize: '0.9rem' }}>Encuentra lo que necesitas</p>
          </div>
          <button onClick={onViewAllClick} className="flex items-center gap-1 text-brand-red hover:underline font-medium" style={{ fontSize: '0.9rem' }}>
            Ver todas <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => onCategoryClick(cat)} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border ${cat.color} ${cat.border} group-hover:-translate-y-1 group-hover:shadow-md transition-all shadow-sm`}>
                <CategoryIllustration icon={cat.icon} className="w-8 h-8" />
              </div>
              <span className="text-brand-ink text-center font-medium" style={{ fontSize: '0.75rem' }}>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
