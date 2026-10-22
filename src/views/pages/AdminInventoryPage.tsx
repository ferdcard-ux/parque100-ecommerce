import { useState } from 'react';
import type { AdminProduct, InventoryStatus, ProductCreate, ProductUpsert } from '../../models';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { AdminStats } from '../components/admin/AdminStats';
import { ProductTable } from '../components/admin/ProductTable';
import { AddProductModal } from '../components/admin/AddProductModal';
import { EditProductModal } from '../components/admin/EditProductModal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { CatalogOptionsModal } from '../components/admin/CatalogOptionsModal';
import type { Category, Product, UnitOfMeasure } from '../../models';

interface AdminInventoryPageProps {
  products: AdminProduct[];
  catalogProducts: Product[];
  categories: Category[];
  units: UnitOfMeasure[];
  unitCatalogError: string | null;
  onDelete: (id: number) => Promise<void>;
  onCreate: (data: ProductCreate) => Promise<void>;
  onUpdate: (id: string, data: ProductUpsert) => Promise<void>;
  /** Recarga el catalogo tras una importación masiva. */
  onImported?: () => Promise<void>;
  /** Lee las filas crudas del inventario (exportar/importar). */
  onFetchRows: () => Promise<any[]>;
  onCreateCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: number, name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onCreateUnit: (name: string) => Promise<void>;
  onUpdateUnit: (id: number, name: string) => Promise<void>;
  onDeleteUnit: (id: number) => Promise<void>;
}

export function AdminInventoryPage({ products, catalogProducts, categories, units, unitCatalogError, onDelete, onCreate, onUpdate, onImported, onFetchRows, onCreateCategory, onUpdateCategory, onDeleteCategory, onCreateUnit, onUpdateUnit, onDeleteUnit }: AdminInventoryPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [catalogModal, setCatalogModal] = useState<'category' | 'unit' | null>(null);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | InventoryStatus>('all');

  const handleDelete = async () => {
    if (!deletingProduct || deleting) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await onDelete(deletingProduct.id);
      setDeletingProduct(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No fue posible eliminar el producto.');
    } finally {
      setDeleting(false);
    }
  };

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.status === 'in_stock').length,
    lowStock: products.filter((p) => p.status === 'low_stock').length,
    outOfStock: products.filter((p) => p.status === 'out_of_stock').length,
  };

  return (
    <>
      <AdminPageShell active="inventario" title="Gestión de Inventario" subtitle="Administra tus productos y existencias">
        <div className="sticky top-[60px] z-10 bg-[#F5F5F5] -mt-3 pt-1 pb-2">
          <AdminStats
            total={stats.total}
            inStock={stats.inStock}
            lowStock={stats.lowStock}
            outOfStock={stats.outOfStock}
            value={stockFilter}
            onSelect={(s) => setStockFilter((prev) => (prev === s ? 'all' : s))}
          />
        </div>
        <div className="mb-3 flex flex-wrap justify-end gap-2">
          <button onClick={() => setCatalogModal('category')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#212121] hover:bg-gray-50">
            Administrar categorías de productos
          </button>
          <button onClick={() => setCatalogModal('unit')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#212121] hover:bg-gray-50">
            Administrar unidades de medida
          </button>
        </div>
        {unitCatalogError && (
          <p role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No se pudo cargar el catálogo de unidades de medida. En una base existente, ejecuta la migración indicada en la guía de despliegue y vuelve a cargar la página. Detalle: {unitCatalogError}
          </p>
        )}
        <ProductTable products={products} onDelete={(id) => {
          const product = products.find((item) => item.id === id);
          if (product) {
            setDeleteError(null);
            setDeletingProduct(product);
          }
        }} onAddClick={() => setShowAddModal(true)} onEditClick={(p) => setEditingProduct(p)} statusFilter={stockFilter} onStatusFilterChange={setStockFilter} onImported={onImported} onFetchRows={onFetchRows} onCreateProduct={onCreate} onUpdateProduct={onUpdate} />
      </AdminPageShell>

      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreate={onCreate} categories={categories} units={units} onManageCategories={() => setCatalogModal('category')} />
      <EditProductModal product={editingProduct} products={catalogProducts} categories={categories} units={units} onClose={() => setEditingProduct(null)} onUpdate={onUpdate} onManageCategories={() => setCatalogModal('category')} />
      {catalogModal && (
        <CatalogOptionsModal
          kind={catalogModal}
          items={catalogModal === 'category' ? categories : units}
          onClose={() => setCatalogModal(null)}
          onCreate={catalogModal === 'category' ? onCreateCategory : onCreateUnit}
          onUpdate={catalogModal === 'category' ? onUpdateCategory : onUpdateUnit}
          onDelete={catalogModal === 'category' ? onDeleteCategory : onDeleteUnit}
        />
      )}
      {deletingProduct && (
        <DeleteConfirmModal
          title="Eliminar producto"
          description={<>¿Eliminar <strong>{deletingProduct.name}</strong> del inventario? Esta acción no se puede deshacer.</>}
          error={deleteError}
          busy={deleting}
          onClose={() => {
            if (!deleting) {
              setDeletingProduct(null);
              setDeleteError(null);
            }
          }}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
