import { X } from 'lucide-react';
import type { Category } from '../../../models';
import { useScrollLock } from '../../../utils/useScrollLock';

interface AllCategoriesModalProps {
  categories: Category[];
  onCategoryClick: (category: Category) => void;
  onClose: () => void;
}

export function AllCategoriesModal({ categories, onCategoryClick, onClose }: AllCategoriesModalProps) {
  useScrollLock(true);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[#212121] font-bold" style={{ fontSize: '1.1rem' }}>Todas las Categorías</h2>
            <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>{categories.length} categorías disponibles</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => { onCategoryClick(cat); onClose(); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl hover:bg-[#F5F5F5] transition-colors group"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ${cat.color} ${cat.border} group-hover:scale-110 transition-transform shadow-sm`}>
                  <span style={{ fontSize: '1.5rem' }}>{cat.emoji}</span>
                </div>
                <span className="text-[#212121] text-center font-medium" style={{ fontSize: '0.8rem' }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}