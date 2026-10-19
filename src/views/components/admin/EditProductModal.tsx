import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { AdminProduct, ProductUpsert } from '../../../models';
import { useScrollLock } from '../../../utils/useScrollLock';
import { useDialogBehavior } from '../../../utils/useDialog';
import { useProductController } from '../../../controllers';
import { ProductImageInput } from './ProductImageInput';

interface EditProductModalProps {
  product: AdminProduct | null;
  onClose: () => void;
  onUpdate: (id: string, data: ProductUpsert) => Promise<void>;
}

export function EditProductModal({ product, onClose, onUpdate }: EditProductModalProps) {
  useScrollLock(product !== null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(product !== null, onClose, panelRef);
  const { products } = useProductController();
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [precioAnterior, setPrecioAnterior] = useState('');
  const [marca, setMarca] = useState('');
  const [contQty, setContQty] = useState('');
  const [contUnit, setContUnit] = useState('g');
  const [imagen, setImagen] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setNombre(product.name);
      setCategoria(product.category);
      setCantidad(String(product.quantity));
      setPrecio(String(product.price));
      const full = products.find((p) => String(p.id) === String(product.id));
      setPrecioAnterior(full?.previousPrice != null ? String(full.previousPrice) : '');
      setMarca(full?.brand ?? '');
      setContQty(full?.contentQty != null ? String(full.contentQty) : '');
      setContUnit(full?.contentUnit || 'g');
      // Carga la imagen realmente guardada para no perderla al guardar.
      setImagen(product.image ?? '');
    }
  }, [product, products]);

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
        Imagen: imagen.trim(),
        Precio_Venta: parseInt(precio),
        Precio_Anterior: precioAnterior ? parseInt(precioAnterior) : null,
        Marca: marca.trim() || null,
        Contenido_Cantidad: contQty ? Number(contQty) : null,
        Contenido_Unidad: contQty ? contUnit : null,
        Stock_Minimo: parseInt(cantidad),
        ID_Categoria: catId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto">
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Editar producto" className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[#212121] font-bold" style={{ fontSize: '1.1rem' }}>Editar Producto</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="edit-nombre" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Nombre del producto</label>
            <input id="edit-nombre" type="text" placeholder="Ej: Manzanas x5" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label htmlFor="edit-categoria" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Categoría</label>
            <input id="edit-categoria" type="text" placeholder="Ej: Frutas" value={categoria} onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label htmlFor="edit-cantidad" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Cantidad</label>
            <input id="edit-cantidad" type="number" placeholder="Ej: 50" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label htmlFor="edit-precio" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Precio (COP)</label>
            <input id="edit-precio" type="number" placeholder="Ej: 4800" value={precio} onChange={(e) => setPrecio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-precio-ant" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Precio anterior (opcional)</label>
              <input id="edit-precio-ant" type="number" placeholder="Ej: 5200" value={precioAnterior} onChange={(e) => setPrecioAnterior(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label htmlFor="edit-marca" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Marca (opcional)</label>
              <input id="edit-marca" type="text" placeholder="Ej: Colanta" value={marca} onChange={(e) => setMarca(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-contenido" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Contenido (opcional)</label>
              <input id="edit-contenido" type="number" placeholder="Ej: 500" value={contQty} onChange={(e) => setContQty(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label htmlFor="edit-unidad" className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>Unidad</label>
              <select id="edit-unidad" value={contUnit} onChange={(e) => setContUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] text-[#212121]"
                style={{ fontSize: '0.9rem' }}>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="un">un</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>
          <ProductImageInput value={imagen} onChange={setImagen} />
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