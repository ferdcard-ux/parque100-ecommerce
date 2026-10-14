import { useState } from 'react';
import type { AdminProduct, InventoryStatus } from '../../models';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { AdminStats } from '../components/admin/AdminStats';
import { ProductTable } from '../components/admin/ProductTable';
import { AddProductModal } from '../components/admin/AddProductModal';
import { EditProductModal } from '../components/admin/EditProductModal';

interface AdminInventoryPageProps {
  products: AdminProduct[];
  onDelete: (id: number) => void;
  onCreate: (data: {
    ID_Producto: string;
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => Promise<void>;
  onUpdate: (id: string, data: {
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => Promise<void>;
  /** Recarga el catalogo tras una importación masiva. */
  onImported?: () => Promise<void>;
  /** Lee las filas crudas del inventario (exportar/importar). */
  onFetchRows: () => Promise<any[]>;
}

export function AdminInventoryPage({ products, onDelete, onCreate, onUpdate, onImported, onFetchRows }: AdminInventoryPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | InventoryStatus>('all');

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
        <ProductTable products={products} onDelete={onDelete} onAddClick={() => setShowAddModal(true)} onEditClick={(p) => setEditingProduct(p)} statusFilter={stockFilter} onStatusFilterChange={setStockFilter} onImported={onImported} onFetchRows={onFetchRows} onCreateProduct={onCreate} onUpdateProduct={onUpdate} />
      </AdminPageShell>

      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreate={onCreate} />
      <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={onUpdate} />
    </>
  );
}
