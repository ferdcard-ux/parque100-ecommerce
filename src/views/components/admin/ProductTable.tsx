import { useMemo, useRef, useState } from 'react';
import { Search, ChevronDown, Upload, Download, Plus, Edit2, Trash2, Package, ChevronLeft, ChevronRight as ChevRight, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { AdminProduct, InventoryStatus, ProductCreate, ProductUpsert } from '../../../models';
import { formatPrice, STATUS_LABELS } from '../../../utils';

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
  /** Crea un producto (importación masiva). */
  onCreateProduct: (data: ProductCreate) => Promise<void>;
  /** Actualiza un producto (importación masiva). */
  onUpdateProduct: (id: string, data: ProductUpsert) => Promise<void>;
}

/** Columnas exactas de la tabla `productos` (plantilla de importación). */
const TEMPLATE_HEADERS = [
  'ID_Producto', 'Nombre', 'Descripcion', 'Precio_Venta', 'Precio_Anterior', 'Marca',
  'Contenido_Cantidad', 'Contenido_Unidad', 'Embalaje', 'Ingredientes', 'Conservacion',
  'Promo_Desde', 'Promo_Hasta', 'Stock_Minimo', 'ID_Categoria',
] as const;

type TemplateRow = Record<(typeof TEMPLATE_HEADERS)[number], unknown>;
const MAX_INT = 2147483647;
const MAX_CONTENT_QTY = 9999999999.99;

function isValidCsvDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toTemplateRow(r: any): TemplateRow {
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

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      if (field.length > 0 || closedQuote) throw new Error('El archivo CSV tiene comillas invalidas.');
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
      closedQuote = false;
    } else if (char === '\n' || char === '\r') {
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = '';
      closedQuote = false;
      if (char === '\r' && text[i + 1] === '\n') i += 1;
    } else {
      if (closedQuote) throw new Error('El archivo CSV tiene contenido despues de una comilla de cierre.');
      field += char;
    }
  }

  if (quoted) throw new Error('El archivo CSV contiene una celda sin cerrar.');
  row.push(field);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function createCsv(rows: Record<string, unknown>[]): string {
  const escape = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const lines = [
    TEMPLATE_HEADERS.map(escape).join(','),
    ...rows.map((row) => TEMPLATE_HEADERS.map((header) => escape(row[header])).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function ProductTable({ products, onDelete, onAddClick, onEditClick, statusFilter, onStatusFilterChange, onImported, onFetchRows, onCreateProduct, onUpdateProduct }: ProductTableProps) {
  const [search, setSearch] = useState('');
  const [innerFilter, setInnerFilter] = useState<'all' | InventoryStatus>('all');
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [busy, setBusy] = useState<'csv' | 'pdf' | 'template' | 'import' | null>(null);
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

  const handleExportCsv = async () => {
    setBusy('csv');
    setNotice(null);
    try {
      const rows = await fetchRawRows();
      const csv = createCsv(rows.map(toTemplateRow));
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'inventario-parque100.csv');
      setNotice({ kind: 'ok', text: `CSV exportado (${rows.length} productos) con formato de la BD.` });
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
      const example = {
        ID_Producto: 'P011', Nombre: 'Ejemplo Café 500g', Descripcion: 'Descripción corta',
        Precio_Venta: 8500, Precio_Anterior: '', Marca: 'Parque100',
        Contenido_Cantidad: 500, Contenido_Unidad: 'g', Embalaje: '', Ingredientes: '', Conservacion: '',
        Promo_Desde: '', Promo_Hasta: '', Stock_Minimo: 20, ID_Categoria: 4,
      };
      const csv = createCsv([example]);
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'plantilla-inventario-parque100.csv');
      setNotice({ kind: 'ok', text: 'Plantilla CSV descargada. Úsala para importar sin errores.' });
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
      if (file.size > 5 * 1024 * 1024) throw new Error('El archivo CSV no puede superar los 5 MB.');
      const rows = parseCsvRows((await file.text()).replace(/^\uFEFF/, ''));
      const headers = rows.shift() || [];
      if (rows.length > 5000) throw new Error('El archivo CSV no puede superar las 5.000 filas.');
      if (headers.length !== TEMPLATE_HEADERS.length || new Set(headers).size !== headers.length) {
        throw new Error('La plantilla debe tener las 15 columnas oficiales, sin encabezados duplicados.');
      }
      const json = rows.map((values) => {
        if (values.length !== headers.length) throw new Error('Todas las filas deben tener la misma cantidad de columnas.');
        return Object.fromEntries(headers.map((header, index) => [header, values[index]])) as Record<string, unknown>;
      });
      if (json.length === 0) throw new Error('El archivo no tiene filas para importar.');
      const missing = TEMPLATE_HEADERS.filter((h) => !headers.includes(h));
      const extra = headers.filter((h) => !(TEMPLATE_HEADERS as readonly string[]).includes(h));
      if (missing.length > 0 || extra.length > 0) {
        throw new Error(`La plantilla no coincide. Faltan: ${missing.join(', ') || '—'}. Sobran: ${extra.join(', ') || '—'}. Descarga la plantilla oficial.`);
      }
      const existing: any[] = await onFetchRows();
      const existingIds = new Set(existing.map((r) => String(r.ID_Producto)));
      let created = 0;
      let updated = 0;
      const errors: string[] = [];
      for (let i = 0; i < json.length; i++) {
        const row = json[i] as TemplateRow;
        const line = i + 2;
        try {
          const id = String(row.ID_Producto ?? '').trim();
          const nombre = String(row.Nombre ?? '').trim();
          const descripcion = String(row.Descripcion ?? '').trim();
          if (!id || id.length > 30) throw new Error(`fila ${line}: ID_Producto es obligatorio y admite hasta 30 caracteres`);
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
          if (!cat || cat < 1) throw new Error(`fila ${line}: ID_Categoria debe ser mayor que cero`);
          const strOrNull = (v: unknown) => {
            const s = String(v ?? '').trim();
            return s ? s : null;
          };
          const contenidoRaw = String(row.Contenido_Cantidad ?? '').trim();
          if (contenidoRaw && (!/^\d{1,10}(\.\d{1,2})?$/.test(contenidoRaw) || Number(contenidoRaw) > MAX_CONTENT_QTY)) {
            throw new Error(`fila ${line}: Contenido_Cantidad admite hasta 10 enteros y 2 decimales`);
          }
          const textLimits: Array<[keyof TemplateRow, number]> = [
            ['Marca', 50], ['Contenido_Unidad', 30], ['Embalaje', 60],
            ['Ingredientes', 255], ['Conservacion', 255],
          ];
          for (const [field, max] of textLimits) {
            if (String(row[field] ?? '').length > max) {
              throw new Error(`fila ${line}: ${field} admite hasta ${max} caracteres`);
            }
          }
          const promoFrom = String(row.Promo_Desde ?? '').trim();
          const promoTo = String(row.Promo_Hasta ?? '').trim();
          if ((promoFrom && !isValidCsvDate(promoFrom)) || (promoTo && !isValidCsvDate(promoTo))) {
            throw new Error(`fila ${line}: las fechas promocionales deben tener formato YYYY-MM-DD y ser fechas válidas`);
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
            Contenido_Unidad: strOrNull(row.Contenido_Unidad),
            Embalaje: strOrNull(row.Embalaje),
            Ingredientes: strOrNull(row.Ingredientes),
            Conservacion: strOrNull(row.Conservacion),
            Promo_Desde: promoFrom || null,
            Promo_Hasta: promoTo || null,
            Stock_Minimo: stock,
            ID_Categoria: cat,
          };
          // La descripción solo se envía si el CSV trae un valor: así una
          // actualización sin descripción conserva la existente en vez de
          // reemplazarla por el nombre.
          if (descripcion) payload.Descripcion = descripcion;
          if (existingIds.has(id)) {
            await onUpdateProduct(id, payload);
            updated += 1;
          } else {
            await onCreateProduct({ ID_Producto: id, ...payload, Descripcion: descripcion || nombre });
            created += 1;
          }
        } catch (e) {
          errors.push(e instanceof Error ? e.message : `fila ${line}: error`);
        }
      }
      await onImported?.();
      setNotice({
        kind: errors.length > 0 ? 'err' : 'ok',
        text: `Importación: ${created} creados, ${updated} actualizados.${errors.length > 0 ? ` Errores (${errors.length}): ${errors.slice(0, 3).join(' | ')}${errors.length > 3 ? '…' : ''}` : ''}`,
      });
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
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
              style={{ fontSize: '0.875rem', width: '220px' }}
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
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
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImportFile(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={busy === 'import'}
            title="Importar CSV con la plantilla oficial"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[#212121] hover:bg-gray-50 transition-colors font-medium disabled:opacity-50" style={{ fontSize: '0.875rem' }}>
            {busy === 'import' ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Importar
          </button>
          <div className="relative">
            <button onClick={() => setExportOpen((v) => !v)} disabled={busy !== null}
              title="Exportar inventario en PDF o CSV"
              aria-expanded={exportOpen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-[#212121] hover:bg-gray-50 transition-colors font-medium disabled:opacity-50" style={{ fontSize: '0.875rem' }}>
              {busy === 'csv' || busy === 'pdf' || busy === 'template' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Exportar
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30">
                <button onClick={handleExportCsv} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] text-left transition-colors">
                  <FileSpreadsheet size={16} className="text-green-600 shrink-0" />
                  <span><span className="block text-[#212121] font-semibold" style={{ fontSize: '0.82rem' }}>CSV (.csv)</span>
                  <span className="block text-gray-400" style={{ fontSize: '0.72rem' }}>Columnas exactas de la BD</span></span>
                </button>
                <button onClick={handleExportTemplate} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] text-left transition-colors border-t border-gray-50">
                  <FileSpreadsheet size={16} className="text-blue-500 shrink-0" />
                  <span><span className="block text-[#212121] font-semibold" style={{ fontSize: '0.82rem' }}>Plantilla CSV</span>
                  <span className="block text-gray-400" style={{ fontSize: '0.72rem' }}>Formato oficial para importar</span></span>
                </button>
                <button onClick={handleExportPdf} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F5] text-left transition-colors border-t border-gray-50">
                  <FileText size={16} className="text-[#C62828] shrink-0" />
                  <span><span className="block text-[#212121] font-semibold" style={{ fontSize: '0.82rem' }}>PDF</span>
                  <span className="block text-gray-400" style={{ fontSize: '0.72rem' }}>Igual que la tabla en pantalla</span></span>
                </button>
              </div>
            )}
          </div>
          <button onClick={onAddClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C62828] text-white font-medium hover:bg-[#b71c1c] transition-colors shadow-sm"
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
            {paginated.map((product) => (
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
                    <button onClick={() => onEditClick(product)} aria-label={`Editar ${product.name}`} className="relative p-2.5 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors before:absolute before:-inset-1 before:content-['']">
                      <Edit2 size={15} />
                    </button>
                    <button onClick={() => onDelete(product.id)} aria-label={`Eliminar ${product.name}`}
                      className="relative p-2.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-[#C62828] transition-colors before:absolute before:-inset-1 before:content-['']"
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
                <p className="text-[#212121] font-medium truncate" style={{ fontSize: '0.88rem' }}>{product.name}</p>
                <p className="text-gray-400" style={{ fontSize: '0.72rem' }}>{product.category}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_LABELS[product.status].class}`}>
                {STATUS_LABELS[product.status].label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[#212121] font-bold" style={{ fontSize: '0.95rem' }}>
                {formatPrice(product.price)} <span className="text-gray-400 font-normal" style={{ fontSize: '0.75rem' }}>· {product.quantity} disp.</span>
              </p>
              <div className="flex gap-1">
                <button onClick={() => onEditClick(product)} aria-label={`Editar ${product.name}`} className="relative p-2.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors before:absolute before:-inset-1 before:content-['']">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => onDelete(product.id)} aria-label={`Eliminar ${product.name}`} className="relative p-2.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-[#C62828] transition-colors before:absolute before:-inset-1 before:content-['']">
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
              className={`relative min-w-11 min-h-11 rounded-lg text-sm font-medium transition-colors ${p === safePage ? 'bg-[#C62828] text-white' : 'border border-gray-200 text-[#212121] hover:bg-gray-50'}`}
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
