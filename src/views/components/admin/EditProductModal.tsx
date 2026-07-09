import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { AdminProduct } from '../../../models';
import { useScrollLock } from '../../../utils/useScrollLock';

interface EditProductModalProps {
  product: AdminProduct | null;
  onClose: () => void;
  onUpdate: (id: string, data: {
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => Promise<void>;
}

export function EditProductModal({ product, onClose, onUpdate }: EditProductModalProps) {
  useScrollLock(product !== null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagen, setImagen] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setNombre(product.name);
      setCategoria(product.category);
      setCantidad(String(product.quantity));
      setPrecio(String(product.price));
      setImagen('');
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = async () => {
    if (!nombre || !categoria || !cantidad || !precio) return;
    setSaving(true);
    try {
      const catMap: Record<string, number> = {
        verduras: 1, frutas: 2, carnes: 3, granos: 4,
        lácteos: 5, lacteos: 5, panadería: 6, panaderia: 6,
        bebidas: 7, limpieza: 8,
      };
      const catId = catMap[categoria.toLowerCase().trim()] || 1;
      const id = product.id.toString();
      await onUpdate(id, {
        Nombre: nombre.trim(),
        Descripcion: nombre.trim(),
        Imagen: imagen.trim() || undefined,
        Precio_Venta: parseInt(precio),
        Stock_Minimo: parseInt(cantidad),
        ID_Categoria: catId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#212121] font-bold" style={{ fontSize: '1.1rem' }}>Editar Producto</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Nombre del producto</label>
            <input type="text" placeholder="Ej: Manzanas x5" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Categoría</label>
            <input type="text" placeholder="Ej: Frutas" value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Cantidad</label>
            <input type="number" placeholder="Ej: 50" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Precio (COP)</label>
            <input type="number" placeholder="Ej: 4800" value={precio} onChange={(e) => setPrecio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>URL de imagen <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>(opcional)</span></label>
            <input type="url" placeholder="https://ejemplo.com/imagen.jpg" value={imagen} onChange={(e) => setImagen(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[#212121] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ fontSize: '0.9rem' }}
            >
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving || !nombre || !categoria || !cantidad || !precio}
              className="flex-1 py-2.5 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-colors shadow-sm disabled:opacity-50"
              style={{ fontSize: '0.9rem' }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}