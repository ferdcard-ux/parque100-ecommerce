import { useState } from 'react';
import { Search, ChevronDown, Upload, Download, Plus, Edit2, Trash2, Package, ChevronLeft, ChevronRight as ChevRight } from 'lucide-react';
import type { AdminProduct, InventoryStatus } from '../../../models';
import { formatPrice, STATUS_LABELS } from '../../../utils';

interface ProductTableProps {
  products: AdminProduct[];
  onDelete: (id: number) => void;
  onAddClick: () => void;
  onEditClick: (product: AdminProduct) => void;
}

export function ProductTable({ products, onDelete, onAddClick, onEditClick }: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | InventoryStatus>('all');
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Buscar producto o categoría..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.875rem', width: '220px' }}
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(1); }}
              className="appearance-none pr-8 pl-4 py-2 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] text-[#212121] cursor-pointer"
              style={{ fontSize: '0.875rem' }}
            >
              <option value="all">Todos</option>
              <option value="in_stock">En stock</option>
              <option value="low_stock">Bajo stock</option>
              <option value="out_of_stock">Sin stock</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[#212121] hover:bg-gray-50 transition-colors font-medium" style={{ fontSize: '0.875rem' }}>
            <Upload size={15} /> Importar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[#212121] hover:bg-gray-50 transition-colors font-medium" style={{ fontSize: '0.875rem' }}>
            <Download size={15} /> Exportar
          </button>
          <button onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#b71c1c] transition-colors shadow-sm"
            style={{ fontSize: '0.875rem' }}
          >
            <Plus size={15} /> Agregar producto
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full" style={{ fontSize: '0.875rem' }}>
          <thead>
            <tr className="bg-[#F5F5F5]">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>PRODUCTO</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell" style={{ fontSize: '0.78rem' }}>CATEGORÍA</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>CANTIDAD</th>
              <th className="text-right px-4 py-3 text-gray-500 font-semibold hidden md:table-cell" style={{ fontSize: '0.78rem' }}>PRECIO</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>ESTADO</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product, i) => (
              <tr key={product.id} className={`border-t border-gray-100 hover:bg-[#F5F5F5]/50 transition-colors`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                    <span className="text-[#212121] font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-gray-500">{product.category}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${product.quantity === 0 ? 'text-[#C62828]' : product.quantity <= 8 ? 'text-[#f57f17]' : 'text-[#212121]'}`}>
                    {product.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell text-[#212121] font-medium">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_LABELS[product.status].class}`}>
                    {STATUS_LABELS[product.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEditClick(product)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(product.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-[#C62828] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No se encontraron productos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>
          Mostrando {((page - 1) * perPage) + 1}–{Math.min(page * perPage, filtered.length)} de {filtered.length} productos
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-7 h-7 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-[#C62828] text-white' : 'border border-gray-200 text-[#212121] hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
