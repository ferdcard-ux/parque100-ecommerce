import { useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Upload, Download, Plus, Edit2, Trash2, Package, ChevronLeft, ChevronRight as ChevRight, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { AdminProduct, Category, InventoryStatus, ProductCreate, ProductUpsert, UnitOfMeasure } from '../../../models';
import { formatPrice, STATUS_LABELS } from '../../../utils';
import {
  createInventoryWorkbook,
  inventoryDateValue,
  readInventoryWorkbook,
  type InventorySpreadsheetRow,
} from '../../../utils/inventory-spreadsheet';

interface ProductTableProps {
  products: AdminProduct[];
  onDelete: (id: number) => void;
  onAddClick: () => void;
  onEditClick: (product: AdminProduct) => void;
  /** Filtro controlado desde las tarjetas de AdminStats. */
  statusFilter?: 'all' | InventoryStatus;
  onStatusFilterChange?: (s: 'all' | InventoryStatus) => void;
  /** Recarga tras importar. */
  onImported?: () => Promise<void>;
  /** Lee las filas crudas del inventario (exportar/importar). */
  onFetchRows: () => Promise<any[]>;
  categories: Category[];
  units: UnitOfMeasure[];
  /** Crea un producto (importación masiva). */
  onCreateProduct: (data: ProductCreate) => Promise<void>;
  /** Actualiza un producto (importación masiva). */
  onUpdateProduct: (id: string, data: ProductUpsert) => Promise<void>;
}

const MAX_INT = 2147483647;
const MAX_CONTENT_QTY = 9999999999.99;

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toInventoryRow(r: any): InventorySpreadsheetRow {
  return {
    ID_Producto: r.ID_Producto ?? '',
    Nombre: r.Nombre ?? '',
    Descripcion: r.Descripcion ?? '',
    Precio_Venta: r.Precio_Venta ?? '',
    Precio_Anterior: r.Precio_Anterior ?? '',
    Marca: r.Marca ?? '',
    Contenido_Cantidad: r.Contenido_Cantidad ?? '',
    Contenido_Unidad: r.Contenido_Unidad ?? '',
    Embalaje: r.Embalaje ?? '',
    Ingredientes: r.Ingredientes ?? '',
    Conservacion: r.Conservacion ?? '',
    Promo_Desde: r.Promo_Desde ? String(r.Promo_Desde).slice(0, 10) : '',
    Promo_Hasta: r.Promo_Hasta ? String(r.Promo_Hasta).slice(0, 10) : '',
    Stock_Minimo: r.Stock_Minimo ?? '',
    ID_Categoria: r.ID_Categoria ?? '',
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProductTable({ products, onDelete, onAddClick, onEditClick, statusFilter, onStatusFilterChange, onImported, onFetchRows, categories, units, onCreateProduct, onUpdateProduct }: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [innerFilter, setInnerFilter] = useState<'all' | InventoryStatus>('all');
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState<'xlsx' | 'pdf' | 'template' | 'import' | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const perPage = 8;

  const filter = statusFilter ?? innerFilter;
  const setFilter = (v: 'all' | InventoryStatus) => {
    onStatusFilterChange?.(v);
    setInnerFilter(v);
    setPage(1);
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * perPage, safePage * perPage), [filtered, safePage]);

  const fetchRawRows = async (): Promise<any[]> => {
    return onFetchRows();
  };

  const downloadWorkbook = async (rows: InventorySpreadsheetRow[], filename: string) => {
    const bytes = await createInventoryWorkbook(rows, categories, units);
    downloadBlob(
      new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename,
    );
  };

  const handleExportWorkbook = async () => {
    setBusy('xlsx');
    setNotice(null);
    try {
      const rows = await fetchRawRows();
      await downloadWorkbook(rows.map(toInventoryRow), 'inventario-parque100.xlsx');
      setNotice({ kind: 'ok', text: `Libro Excel exportado (${rows.length} productos), con filtros, formatos y validaciones.` });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'No fue posible exportar.' });
    } finally {
      setBusy(null);
      setExportOpen(false);
    }
  };

  const handleExportTemplate = async () => {
    setBusy('template');
    setNotice(null);
    try {
      await downloadWorkbook([], 'plantilla-inventario-parque100.xlsx');
      setNotice({ kind: 'ok', text: 'Plantilla Excel descargada con listas, formatos y validaciones.' });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'No fue posible generar la plantilla.' });
    } finally {
      setBusy(null);
      setExportOpen(false);
    }
  };

  const handleExportPdf = async () => {
    setBusy('pdf');
    setNotice(null);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('Inventario — Tienda Parque 100', 14, 14);
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')} · ${filtered.length} productos${filter !== 'all' ? ` (filtro: ${STATUS_LABELS[filter].label})` : ''}`, 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [['PRODUCTO', 'CATEGORÍA', 'CANTIDAD', 'PRECIO', 'ESTADO']],
        body: filtered.map((p) => [p.name, p.category, String(p.quantity), formatPrice(p.price), STATUS_LABELS[p.status].label]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [198, 40, 40] },
      });
      doc.save('inventario-parque100.pdf');
      setNotice({ kind: 'ok', text: `PDF exportado (${filtered.length} productos) con el formato de la tabla.` });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'No fue posible exportar el PDF.' });
    } finally {
      setBusy(null);
      setExportOpen(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setBusy('import');
    setNotice(null);
    try {
      if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('Solo se admiten libros de Excel .xlsx. Descarga la plantilla oficial para importar.');
      if (file.size > 5 * 1024 * 1024) throw new Error('El libro de Excel no puede superar los 5 MB.');
      const rows = await readInventoryWorkbook(await file.arrayBuffer());
      const existing: any[] = await onFetchRows();
      const existingIds = new Set(existing.map((r) => String(r.ID_Producto).trim().toLocaleLowerCase()));
      const categoryIds = new Set(categories.map((category) => category.id));
      const unitNames = new Set(units.map((unit) => unit.name.trim().toLocaleLowerCase()));
      const errors: string[] = [];
      const incomingIds = new Set<string>();
      const validRows: Array<{ id: string; payload: ProductUpsert; createPayload: ProductCreate }> = [];
      for (const { excelRow, values: row } of rows) {
        const line = excelRow;
        try {
          if (typeof row.ID_Producto !== 'string') {
            throw new Error(`fila ${line}: ID_Producto debe estar guardado como texto para conservar el identificador`);
          }
          const id = row.ID_Producto.trim();
          const nombre = String(row.Nombre ?? '').trim();
          const descripcion = String(row.Descripcion ?? '').trim();
          if (!id || id.length > 30) throw new Error(`fila ${line}: ID_Producto es obligatorio y admite hasta 30 caracteres`);
          const normalizedId = id.toLocaleLowerCase();
          if (incomingIds.has(normalizedId)) throw new Error(`fila ${line}: ID_Producto está duplicado en el libro`);
          incomingIds.add(normalizedId);
          if (!nombre || nombre.length > 50) throw new Error(`fila ${line}: Nombre es obligatorio y admite hasta 50 caracteres`);
          if (descripcion.length > 255) throw new Error(`fila ${line}: Descripcion admite hasta 255 caracteres`);
          const parseInteger = (value: unknown, field: string, optional = false) => {
            const raw = String(value ?? '').trim();
            if (optional && !raw) return null;
            if (!/^\d{1,10}$/.test(raw) || Number(raw) > MAX_INT) {
              throw new Error(`fila ${line}: ${field} debe ser un entero entre 0 y ${MAX_INT}`);
            }
            return Number(raw);
          };
          const parseRequiredInteger = (value: unknown, field: string) => {
            const parsed = parseInteger(value, field);
            if (parsed === null) throw new Error(`fila ${line}: ${field} es obligatorio`);
            return parsed;
          };
          const precio = parseRequiredInteger(row.Precio_Venta, 'Precio_Venta');
          const precioAnterior = parseInteger(row.Precio_Anterior, 'Precio_Anterior', true);
          const stock = parseRequiredInteger(row.Stock_Minimo, 'Stock_Minimo');
          const cat = parseRequiredInteger(row.ID_Categoria, 'ID_Categoria');
          if (!categoryIds.has(cat)) throw new Error(`fila ${line}: ID_Categoria no existe en el catálogo actual`);
          const strOrNull = (v: unknown) => {
            const s = String(v ?? '').trim();
            return s ? s : null;
          };
          const unit = strOrNull(row.Contenido_Unidad);
          if (unit && !unitNames.has(unit.toLocaleLowerCase())) {
            throw new Error(`fila ${line}: Contenido_Unidad no existe en el catálogo actual`);
          }
          const contenidoRaw = String(row.Contenido_Cantidad ?? '').trim();
          if (contenidoRaw && (!/^\d{1,10}(\.\d{1,2})?$/.test(contenidoRaw) || Number(contenidoRaw) > MAX_CONTENT_QTY)) {
            throw new Error(`fila ${line}: Contenido_Cantidad admite hasta 10 enteros y 2 decimales`);
          }
          const textLimits: Array<[keyof InventorySpreadsheetRow, number]> = [
            ['Marca', 50], ['Contenido_Unidad', 30], ['Embalaje', 60],
            ['Ingredientes', 255], ['Conservacion', 255],
          ];
          for (const [field, max] of textLimits) {
            if (String(row[field] ?? '').length > max) {
              throw new Error(`fila ${line}: ${field} admite hasta ${max} caracteres`);
            }
          }
          const promoFrom = inventoryDateValue(row.Promo_Desde);
          const promoTo = inventoryDateValue(row.Promo_Hasta);
          if ((promoFrom && !isValidDate(promoFrom)) || (promoTo && !isValidDate(promoTo))) {
            throw new Error(`fila ${line}: las fechas promocionales deben ser fechas válidas`);
          }
          if (promoFrom && promoTo && promoFrom > promoTo) {
            throw new Error(`fila ${line}: Promo_Desde no puede ser posterior a Promo_Hasta`);
          }
          const payload: ProductUpsert = {
            Nombre: nombre,
            Precio_Venta: precio,
            Precio_Anterior: precioAnterior,
            Marca: strOrNull(row.Marca),
            Contenido_Cantidad: contenidoRaw ? Number(contenidoRaw) : null,
            Contenido_Unidad: unit,
            Embalaje: strOrNull(row.Embalaje),
            Ingredientes: strOrNull(row.Ingredientes),
            Conservacion: strOrNull(row.Conservacion),
            Promo_Desde: promoFrom || null,
            Promo_Hasta: promoTo || null,
            Stock_Minimo: stock,
            ID_Categoria: cat,
          };
          if (descripcion) payload.Descripcion = descripcion;
          validRows.push({
            id,
            payload,
            createPayload: { ID_Producto: id, ...payload, Descripcion: descripcion || nombre },
          });
        } catch (e) {
          errors.push(e instanceof Error ? e.message : `fila ${line}: error`);
        }
      }
      if (errors.length > 0) {
        setNotice({
          kind: 'err',
          text: `No se importó ningún producto. Corrige ${errors.length} error(es): ${errors.slice(0, 5).join(' | ')}${errors.length > 5 ? '…' : ''}`,
        });
        return;
      }

      let created = 0;
      let updated = 0;
      let saveFailure: string | null = null;
      for (const row of validRows) {
        try {
          if (existingIds.has(row.id.toLocaleLowerCase())) {
            await onUpdateProduct(row.id, row.payload);
            updated += 1;
          } else {
            await onCreateProduct(row.createPayload);
            created += 1;
          }
        } catch (e) {
          saveFailure = e instanceof Error ? e.message : 'Error desconocido al guardar el producto.';
          break;
        }
      }
      if (created + updated > 0) {
        try {
          await onImported?.();
        } catch (e) {
          const refreshError = e instanceof Error ? e.message : 'Error desconocido al recargar el inventario.';
          setNotice({
            kind: 'err',
            text: `Los cambios se guardaron (${created} creados y ${updated} actualizados), pero no se pudo recargar la tabla: ${refreshError}`,
          });
          return;
        }
      }
      if (saveFailure) {
        setNotice({
          kind: 'err',
          text: `Importación detenida por un error del servidor: ${created} creados y ${updated} actualizados antes de detenerse. ${saveFailure}`,
        });
      } else {
        setNotice({ kind: 'ok', text: `Importación completada: ${created} creados y ${updated} actualizados.` });
      }
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'No fue posible importar.' });
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Buscar producto o categoría..."
              maxLength={100}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink"
              style={{ fontSize: '0.875rem', width: '220px' }}
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="appearance-none pr-8 pl-4 py-2 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red text-brand-ink cursor-pointer"
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
          <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImportFile(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy === 'import'}
            title="Importar un libro Excel con la plantilla oficial"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-brand-ink hover:bg-gray-50 transition-colors font-medium disabled:opacity-50" style={{ fontSize: '0.875rem' }}>
            {busy === 'import' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Importar
          </button>
          <div className="relative">
            <button onClick={() => setExportOpen((v) => !v)} disabled={busy !== null}
              title="Exportar el inventario como libro Excel o PDF"
              aria-expanded={exportOpen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-brand-ink hover:bg-gray-50 transition-colors font-medium disabled:opacity-50" style={{ fontSize: '0.875rem' }}>
              {busy === 'xlsx' || busy === 'pdf' || busy === 'template' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Exportar
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30">
                <button onClick={handleExportWorkbook} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-surface text-left transition-colors">
                  <FileSpreadsheet size={16} className="text-green-600 shrink-0" />
                  <span><span className="block text-brand-ink font-semibold" style={{ fontSize: '0.82rem' }}>Inventario Excel (.xlsx)</span>
                  <span className="block text-gray-400" style={{ fontSize: '0.72rem' }}>Tabla con filtros y formatos</span></span>
                </button>
                <button onClick={handleExportTemplate} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-surface text-left transition-colors border-t border-gray-50">
                  <FileSpreadsheet size={16} className="text-blue-500 shrink-0" />
                  <span><span className="block text-brand-ink font-semibold" style={{ fontSize: '0.82rem' }}>Plantilla Excel (.xlsx)</span>
                  <span className="block text-gray-400" style={{ fontSize: '0.72rem' }}>Listas y validación de celdas</span></span>
                </button>
                <button onClick={handleExportPdf} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-surface text-left transition-colors border-t border-gray-50">
                  <FileText size={16} className="text-brand-red shrink-0" />
                  <span><span className="block text-brand-ink font-semibold" style={{ fontSize: '0.82rem' }}>PDF</span>
                  <span className="block text-gray-400" style={{ fontSize: '0.72rem' }}>Igual que la tabla en pantalla</span></span>
                </button>
              </div>
            )}
          </div>
          <button onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red text-white font-medium hover:bg-brand-red-dark transition-colors shadow-sm"
            style={{ fontSize: '0.875rem' }}
          >
            <Plus size={15} /> Agregar producto
          </button>
        </div>
      </div>

      {notice && (
        <p role={notice.kind === 'err' ? 'alert' : 'status'} className={`mb-3 px-4 py-2.5 rounded-xl border ${notice.kind === 'err' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`} style={{ fontSize: '0.82rem' }}>
          {notice.text}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-100 hidden sm:block">
        <table className="w-full min-w-[640px]" style={{ fontSize: '0.875rem' }}>
          <thead>
            <tr className="bg-brand-surface">
              <th className="text-left px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>PRODUCTO</th>
              <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell" style={{ fontSize: '0.78rem' }}>CATEGORÍA</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>CANTIDAD</th>
              <th className="text-right px-4 py-3 text-gray-500 font-semibold hidden md:table-cell" style={{ fontSize: '0.78rem' }}>PRECIO</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>ESTADO</th>
              <th className="text-center px-4 py-3 text-gray-500 font-semibold" style={{ fontSize: '0.78rem' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((product) => (
              <tr key={product.id} className={`border-t border-gray-100 hover:bg-brand-surface/50 transition-colors`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                    <span className="text-brand-ink font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-gray-500">{product.category}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${product.quantity === 0 ? 'text-brand-red' : product.quantity <= 8 ? 'text-brand-orange' : 'text-brand-ink'}`}>
                    {product.quantity}
                  </span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell text-brand-ink font-medium">
                  {formatPrice(product.price)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_LABELS[product.status].class}`}>
                    {STATUS_LABELS[product.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onEditClick(product)} aria-label={`Editar ${product.name}`} className="relative p-2.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors before:absolute before:-inset-1 before:content-['']">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(product.id)} aria-label={`Eliminar ${product.name}`}
                      className="relative p-2.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-brand-red transition-colors before:absolute before:-inset-1 before:content-['']"
                    >
                      <Trash2 size={15} />
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

      <div className="flex flex-col gap-3 sm:hidden">
        {paginated.map((product) => (
          <article key={product.id} className="rounded-xl border border-gray-100 p-3.5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Package size={15} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-brand-ink font-medium truncate" style={{ fontSize: '0.88rem' }}>{product.name}</p>
                <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>{product.category}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_LABELS[product.status].class}`}>
                {STATUS_LABELS[product.status].label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-brand-ink font-bold" style={{ fontSize: '0.95rem' }}>
                {formatPrice(product.price)} <span className="text-gray-400 font-normal" style={{ fontSize: '0.75rem' }}>· {product.quantity} disp.</span>
              </p>
              <div className="flex gap-1">
                <button onClick={() => onEditClick(product)} aria-label={`Editar ${product.name}`} className="relative p-2.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors before:absolute before:-inset-1 before:content-['']">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => onDelete(product.id)} aria-label={`Eliminar ${product.name}`} className="relative p-2.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-brand-red transition-colors before:absolute before:-inset-1 before:content-['']">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </article>
        ))}
        {paginated.length === 0 && (
          <p className="px-4 py-10 text-center text-gray-400">No se encontraron productos</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>
          Mostrando {filtered.length === 0 ? 0 : ((safePage - 1) * perPage) + 1}–{Math.min(safePage * perPage, filtered.length)} de {filtered.length} productos
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} aria-label="Página anterior"
            className="relative p-2.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors before:absolute before:-inset-1 before:content-['']"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} aria-label={`Página ${p}`}
              className={`relative min-w-11 min-h-11 rounded-lg text-sm font-medium transition-colors ${p === safePage ? 'bg-brand-red text-white' : 'border border-gray-200 text-brand-ink hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} aria-label="Página siguiente"
            className="relative p-2.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors before:absolute before:-inset-1 before:content-['']"
          >
            <ChevRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
