import { useState } from 'react';
import { Link } from 'react-router';
import { Bell, Home } from 'lucide-react';
import type { AdminProduct } from '../../models';
import { AdminSidebar } from '../components/admin/AdminSidebar';
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
}

export function AdminInventoryPage({ products, onDelete, onCreate, onUpdate }: AdminInventoryPageProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  const stats = {
    total: products.length,
    inStock: products.filter((p) => p.status === 'in_stock').length,
    lowStock: products.filter((p) => p.status === 'low_stock').length,
    outOfStock: products.filter((p) => p.status === 'out_of_stock').length,
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      <AdminSidebar />

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-[#212121]" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Gestión de Inventario</h1>
            <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>Administra tus productos y existencias</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-[#212121] hover:bg-gray-50 transition-colors font-medium" style={{ fontSize: '0.8rem' }}>
              <Home size={14} /> Inicio
            </Link>
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#C62828] rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#C62828] flex items-center justify-center">
              <span className="text-white font-bold" style={{ fontSize: '0.75rem' }}>AD</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <AdminStats
            total={stats.total}
            inStock={stats.inStock}
            lowStock={stats.lowStock}
            outOfStock={stats.outOfStock}
          />
          <ProductTable products={products} onDelete={onDelete} onAddClick={() => setShowAddModal(true)} onEditClick={(p) => setEditingProduct(p)} />
        </div>
      </main>

      <AddProductModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onCreate={onCreate} />
      <EditProductModal product={editingProduct} onClose={() => setEditingProduct(null)} onUpdate={onUpdate} />
    </div>
  );
}
