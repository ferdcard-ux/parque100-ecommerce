import { Link } from 'react-router';
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
      <h3 className="text-brand-ink font-semibold mb-3" style={{ fontSize: '1rem' }}>También te puede interesar</h3>
      <div className="grid grid-cols-2 max-[380px]:grid-cols-1 sm:grid-cols-4 gap-3">
        {products.map((p) => (
          <Link to={`/producto/${p.id}`} key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 block hover:shadow-md transition-shadow">
            <div className="aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-brand-surface">
              <ImageWithFallback
                src={p.image}
                alt={p.name}
                sizes="(max-width: 380px) 100vw, (max-width: 639px) 50vw, 25vw"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-brand-ink font-medium leading-tight mb-1" style={{ fontSize: '0.75rem' }}>{p.name}</p>
            <p className="text-brand-red font-bold" style={{ fontSize: '0.8rem' }}>{formatPrice(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
