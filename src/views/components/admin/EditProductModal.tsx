import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { AdminProduct, Category, Product, ProductUpsert, UnitOfMeasure } from '../../../models';
import { useScrollLock } from '../../../utils/useScrollLock';
import { useDialogBehavior } from '../../../utils/useDialog';
import { isValidHttpUrl, limitNumericInput } from '../../../utils/validators';
import { ProductImageInput } from './ProductImageInput';

const MAX_INT = 2147483647;
const MAX_CONTENT_QTY = 9999999999.99;
const INTEGER_PATTERN = '[0-9]{1,10}';
const DECIMAL_PATTERN = '[0-9]{1,10}(\\.[0-9]{1,2})?';

interface EditProductModalProps {
  product: AdminProduct | null;
  products: Product[];
  categories: Category[];
  units: UnitOfMeasure[];
  onClose: () => void;
  onUpdate: (id: string, data: ProductUpsert) => Promise<void>;
  onManageCategories: () => void;
}

export function EditProductModal({ product, products, categories, units, onClose, onUpdate, onManageCategories }: EditProductModalProps) {
  useScrollLock(product !== null);
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(product !== null, onClose, panelRef);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
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
      const full = products.find((p) => String(p.id) === String(product.id));
      // Conserva la descripción real; si el resumen no la trae, usa la del catálogo.
      setDescripcion(product.description ?? full?.description ?? '');
      const selectedCategory = categories.find((item) => item.id === product.categoryId)
        ?? categories.find((item) => item.name.toLocaleLowerCase() === product.category.toLocaleLowerCase());
      setCategoria(selectedCategory ? String(selectedCategory.id) : '');
      setCantidad(String(product.quantity));
      setPrecio(String(product.price));
      setPrecioAnterior(full?.previousPrice != null ? String(full.previousPrice) : '');
      setMarca(full?.brand ?? '');
      setContQty(full?.contentQty != null ? String(full.contentQty) : '');
      setContUnit(full?.contentUnit || 'g');
      // Carga la imagen realmente guardada para no perderla al guardar.
      setImagen(product.image ?? '');
    }
  }, [product, products, categories]);

  if (!product) return null;

  const handleSubmit = async () => {
    if (!nombre || !descripcion.trim() || !categoria || !cantidad || !precio) return;
    const stockValue = Number(cantidad);
    const priceValue = Number(precio);
    const previousPriceValue = precioAnterior ? Number(precioAnterior) : null;
    const contentValue = contQty ? Number(contQty) : null;
    if (
      !Number.isInteger(stockValue) || stockValue < 0 || stockValue > MAX_INT ||
      !Number.isInteger(priceValue) || priceValue < 0 || priceValue > MAX_INT ||
      (previousPriceValue !== null && (
        !Number.isInteger(previousPriceValue) ||
        previousPriceValue < 0 || previousPriceValue > MAX_INT
      )) ||
      (contentValue !== null && (
        !Number.isFinite(contentValue) || contentValue < 0 ||
        contentValue > MAX_CONTENT_QTY
      )) ||
      (imagen && !imagen.startsWith('data:') && !isValidHttpUrl(imagen))
    ) return;
    setSaving(true);
    try {
      const id = product.id.toString();
      await onUpdate(id, {
        Nombre: nombre.trim(),
        Descripcion: descripcion.trim(),
        Imagen: imagen.trim(),
        Precio_Venta: priceValue,
        Precio_Anterior: previousPriceValue,
        Marca: marca.trim() || null,
        Contenido_Cantidad: contentValue,
        Contenido_Unidad: contQty ? contUnit : null,
        Stock_Minimo: stockValue,
        ID_Categoria: Number(categoria),
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
          <h2 className="text-brand-ink font-bold" style={{ fontSize: '1.1rem' }}>Editar Producto</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="edit-nombre" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Nombre del producto</label>
            <input id="edit-nombre" type="text" maxLength={50} placeholder="Ej: Manzanas x5" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label htmlFor="edit-descripcion" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Descripción</label>
            <textarea id="edit-descripcion" rows={2} maxLength={255} placeholder="Describe el producto (ej: frescas, unidad por libra)" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink resize-none"
              style={{ fontSize: '0.9rem' }}
            />
            <p className="text-gray-400 mt-1" style={{ fontSize: '0.72rem' }}>Máximo 255 caracteres.</p>
          </div>
          <div>
            <label htmlFor="edit-categoria" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Categoría</label>
            <select id="edit-categoria" value={categoria} onChange={(e) => {
              if (e.target.value === '__add_category__') {
                setCategoria('');
                onManageCategories();
              } else {
                setCategoria(e.target.value);
              }
            }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
              style={{ fontSize: '0.9rem' }}
            >
              <option value="">Selecciona una categoría</option>
              {[...new Map(categories.map((item) => [item.name.trim().toLocaleLowerCase(), item])).values()].map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
              <option value="__add_category__">+ Agregar categoría</option>
            </select>
          </div>
          <div>
            <label htmlFor="edit-cantidad" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Cantidad</label>
            <input id="edit-cantidad" type="text" inputMode="numeric" pattern={INTEGER_PATTERN} maxLength={10} title="Ingresa un entero entre 0 y 2147483647" placeholder="Ej: 50" value={cantidad} onChange={(e) => setCantidad(limitNumericInput(e.target.value, 10))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div>
            <label htmlFor="edit-precio" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Precio (COP)</label>
            <input id="edit-precio" type="text" inputMode="numeric" pattern={INTEGER_PATTERN} maxLength={10} title="Ingresa un precio entero entre 0 y 2147483647" placeholder="Ej: 4800" value={precio} onChange={(e) => setPrecio(limitNumericInput(e.target.value, 10))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-precio-ant" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Precio anterior (opcional)</label>
              <input id="edit-precio-ant" type="text" inputMode="numeric" pattern="[0-9]{0,10}" maxLength={10} title="Ingresa un precio entero entre 0 y 2147483647" placeholder="Ej: 5200" value={precioAnterior} onChange={(e) => setPrecioAnterior(limitNumericInput(e.target.value, 10))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label htmlFor="edit-marca" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Marca (opcional)</label>
              <input id="edit-marca" type="text" maxLength={50} placeholder="Ej: Colanta" value={marca} onChange={(e) => setMarca(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-contenido" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Contenido (opcional)</label>
              <input id="edit-contenido" type="text" inputMode="decimal" pattern={DECIMAL_PATTERN} maxLength={13} title="Hasta 10 enteros y 2 decimales" placeholder="Ej: 500" value={contQty} onChange={(e) => setContQty(limitNumericInput(e.target.value, 10, 2))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
            <div>
              <label htmlFor="edit-unidad" className="block text-brand-ink mb-1" style={{ fontSize: '0.875rem' }}>Unidad</label>
              <select id="edit-unidad" value={contUnit} onChange={(e) => setContUnit(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red text-brand-ink"
                style={{ fontSize: '0.9rem' }}>
                {[...new Map(units.map((item) => [item.name.trim().toLocaleLowerCase(), item])).values()].map((item) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>
          <ProductImageInput value={imagen} onChange={setImagen} />
          <div className="flex gap-3 mt-2">
            <button onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-brand-ink font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ fontSize: '0.9rem' }}
            >
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={saving || !nombre.trim() || !descripcion.trim() || !categoria || !cantidad || !precio || !Number.isInteger(Number(cantidad)) || Number(cantidad) > MAX_INT || !Number.isInteger(Number(precio)) || Number(precio) > MAX_INT || (precioAnterior !== '' && (!Number.isInteger(Number(precioAnterior)) || Number(precioAnterior) > MAX_INT)) || (contQty !== '' && (!Number.isFinite(Number(contQty)) || Number(contQty) > MAX_CONTENT_QTY)) || (imagen !== '' && !imagen.startsWith('data:') && !isValidHttpUrl(imagen))}
              className="flex-1 py-2.5 rounded-xl bg-brand-red text-white font-semibold hover:bg-brand-red-dark transition-colors shadow-sm disabled:opacity-50"
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