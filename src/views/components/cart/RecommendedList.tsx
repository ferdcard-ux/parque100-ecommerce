import { ImageWithFallback } from '../figma/ImageWithFallback';
import type { Product } from '../../../models';
import { formatPrice } from '../../../utils';

interface RecommendedListProps {
  products: Product[];
}

export function RecommendedList({ products }: RecommendedListProps) {
  if (products.length === 0) return null;

  return (
    <div className="mt-2">
      <h3 className="text-[#212121] font-semibold mb-3" style={{ fontSize: '1rem' }}>También te puede interesar</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="h-20 rounded-lg overflow-hidden mb-2 bg-[#F5F5F5]">
              <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <p className="text-[#212121] font-medium leading-tight mb-1" style={{ fontSize: '0.75rem' }}>{p.name}</p>
            <p className="text-[#C62828] font-bold" style={{ fontSize: '0.8rem' }}>{formatPrice(p.price)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
