import { X } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  if (!isOpen) return null;

  const fields = [
    { label: 'Nombre del producto', placeholder: 'Ej: Manzanas x5' },
    { label: 'Categoría', placeholder: 'Ej: Frutas' },
    { label: 'Cantidad inicial', placeholder: 'Ej: 50', type: 'number' },
    { label: 'Precio (COP)', placeholder: 'Ej: 4800', type: 'number' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#212121] font-bold" style={{ fontSize: '1.1rem' }}>Agregar Producto</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>{f.label}</label>
              <input type={f.type || 'text'} placeholder={f.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          ))}
          <div className="flex gap-3 mt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[#212121] font-medium hover:bg-gray-50 transition-colors"
              style={{ fontSize: '0.9rem' }}
            >
              Cancelar
            </button>
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-colors shadow-sm"
              style={{ fontSize: '0.9rem' }}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
