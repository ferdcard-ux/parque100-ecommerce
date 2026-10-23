import type ExcelJS from 'exceljs';
import type { Category, UnitOfMeasure } from '../models';

export const INVENTORY_HEADERS = [
  'ID_Producto', 'Nombre', 'Descripcion', 'Precio_Venta', 'Precio_Anterior', 'Marca',
  'Contenido_Cantidad', 'Contenido_Unidad', 'Embalaje', 'Ingredientes', 'Conservacion',
  'Promo_Desde', 'Promo_Hasta', 'Stock_Minimo', 'ID_Categoria',
] as const;

export type InventorySpreadsheetRow = Record<(typeof INVENTORY_HEADERS)[number], unknown>;

export interface ParsedInventoryRow {
  excelRow: number;
  values: InventorySpreadsheetRow;
}

const MAX_IMPORT_ROWS = 5000;
const FIRST_DATA_ROW = 2;
const LAST_DATA_ROW = FIRST_DATA_ROW + MAX_IMPORT_ROWS - 1;

const columnWidths = [18, 32, 42, 17, 18, 20, 20, 20, 24, 42, 42, 16, 16, 16, 16];
const headerFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFC62828' } };
const invalidStyle = {
  fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFE4E6' } },
  font: { color: { argb: 'FF9F1239' } },
};

function excelDate(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : String(value);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const dateText = value.slice(0, 10);
  const date = new Date(`${dateText}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === dateText
    ? date
    : value;
}

function createInstructionsSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('Instrucciones');
  sheet.columns = [{ width: 30 }, { width: 105 }];
  sheet.mergeCells('A1:B1');
  sheet.getCell('A1').value = 'Guía para editar e importar el inventario';
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A1').fill = headerFill;
  sheet.getRow(1).height = 30;
  sheet.addRows([
    ['Antes de editar', 'Trabaja en la hoja Inventario. Conserva los encabezados y no elimines ni cambies el orden de las columnas.'],
    ['Importación', 'El sistema crea productos con un ID_Producto nuevo y actualiza los que ya existen. Primero valida todas las filas; si hay errores no aplica ningún cambio.'],
    ['Límite', `Se aceptan hasta ${MAX_IMPORT_ROWS} filas de productos. Las filas vacías se ignoran.`],
    ['Campos obligatorios', 'ID_Producto, Nombre, Precio_Venta, Stock_Minimo e ID_Categoria.'],
    ['Identificador', 'ID_Producto es texto, admite hasta 30 caracteres y debe ser único dentro del libro. No lo conviertas en número.'],
    ['Precios y stock', 'Precio_Venta y Precio_Anterior son enteros en pesos colombianos. Stock_Minimo es un entero no negativo.'],
    ['Categoría y unidad', 'Selecciona ID_Categoria y Contenido_Unidad desde sus listas cuando estén disponibles. Consulta la hoja Catalogos para relacionar los IDs con sus nombres.'],
    ['Fechas de promoción', 'Usa fechas reales de Excel o el formato AAAA-MM-DD. Promo_Desde no puede ser posterior a Promo_Hasta.'],
    ['Alertas visuales', 'Las celdas resaltadas en rojo indican campos incompletos, IDs duplicados, números o catálogos inválidos y fechas de promoción inconsistentes. Corrígelas antes de importar.'],
    ['Seguridad', 'No agregues fórmulas ni enlaces en las celdas de datos. La importación solo admite valores simples.'],
  ]);
  sheet.getColumn(1).font = { bold: true, color: { argb: 'FF7F1D1D' } };
  sheet.getColumn(1).alignment = { vertical: 'top', wrapText: true };
  sheet.getColumn(2).alignment = { vertical: 'top', wrapText: true };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.height = 34;
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return sheet;
}

function addCatalogSheet(workbook: ExcelJS.Workbook, categories: Category[], units: UnitOfMeasure[]) {
  const sheet = workbook.addWorksheet('Catalogos');
  sheet.addTable({
    name: 'CatalogoCategorias',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: [{ name: 'ID_Categoria' }, { name: 'Nombre_Categoria' }],
    rows: categories.length ? categories.map((category) => [category.id, category.name]) : [[null, 'Sin categorías']],
  });
  sheet.addTable({
    name: 'CatalogoUnidades',
    ref: 'D1',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: [{ name: 'Contenido_Unidad' }],
    rows: units.length ? units.map((unit) => [unit.name]) : [['Sin unidades']],
  });
  sheet.columns = [{ width: 18 }, { width: 32 }, { width: 4 }, { width: 24 }];
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return sheet;
}

function addValidationAndWarnings(sheet: ExcelJS.Worksheet, hasCategories: boolean, hasUnits: boolean) {
  const range = (column: string) => `${column}${FIRST_DATA_ROW}:${column}${LAST_DATA_ROW}`;
  const inputPrompt = (prompt: string) => ({
    showInputMessage: true,
    promptTitle: 'Dato del inventario',
    prompt,
    showErrorMessage: true,
    errorTitle: 'Valor no válido',
    error: 'Corrige el valor o selecciona una opción válida.',
    errorStyle: 'stop' as const,
  });

  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row += 1) {
    sheet.getCell(`A${row}`).dataValidation = {
      type: 'textLength', operator: 'between', formulae: [1, 30], allowBlank: false,
      ...inputPrompt('ID único de producto, como P001. Mantén este campo como texto.'),
    };
    sheet.getCell(`B${row}`).dataValidation = {
      type: 'textLength', operator: 'between', formulae: [1, 50], allowBlank: false,
      ...inputPrompt('Nombre del producto, máximo 50 caracteres.'),
    };
    sheet.getCell(`C${row}`).dataValidation = {
      type: 'textLength', operator: 'lessThanOrEqual', formulae: [255], allowBlank: true,
      ...inputPrompt('Descripción opcional, máximo 255 caracteres.'),
    };
    for (const column of ['D', 'E', 'N']) {
      sheet.getCell(`${column}${row}`).dataValidation = {
        type: 'whole',
        operator: 'between',
        formulae: [0, 2147483647],
        allowBlank: column === 'E',
        ...inputPrompt(column === 'N' ? 'Stock disponible: entero no negativo.' : 'Precio en pesos colombianos: entero no negativo.'),
      };
    }
    sheet.getCell(`G${row}`).dataValidation = {
      type: 'decimal', operator: 'between', formulae: [0, 9999999999.99], allowBlank: true,
      ...inputPrompt('Cantidad de contenido: hasta 10 enteros y 2 decimales.'),
    };
    if (hasUnits) {
      sheet.getCell(`H${row}`).dataValidation = {
        type: 'list', formulae: ['=UnidadesInventario'], allowBlank: true,
        ...inputPrompt('Selecciona una unidad de la lista de Catálogos.'),
      };
    }
    if (hasCategories) {
      sheet.getCell(`O${row}`).dataValidation = {
        type: 'list', formulae: ['=CategoriasInventario'], allowBlank: false,
        ...inputPrompt('Selecciona el ID de una categoría existente. Consulta la hoja Catalogos.'),
      };
    }
    for (const column of ['L', 'M']) {
      sheet.getCell(`${column}${row}`).dataValidation = {
        type: 'date',
        operator: 'between',
        formulae: [new Date('2000-01-01T00:00:00.000Z'), new Date('2100-12-31T00:00:00.000Z')],
        allowBlank: true,
        ...inputPrompt('Fecha válida de promoción, entre 2000 y 2100.'),
      };
    }
  }

  sheet.addConditionalFormatting({
    ref: `A${FIRST_DATA_ROW}:A${LAST_DATA_ROW}`,
    rules: [
      { type: 'expression', formulae: ['AND(COUNTA($A2:$O2)>0,$A2="")'], priority: 1, style: invalidStyle },
      { type: 'expression', formulae: [`AND($A2<>"",COUNTIF($A$${FIRST_DATA_ROW}:$A$${LAST_DATA_ROW},$A2)>1)`], priority: 2, style: invalidStyle },
    ],
  });
  for (const column of ['B', 'D', 'N', 'O']) {
    sheet.addConditionalFormatting({
      ref: range(column),
      rules: [{ type: 'expression', formulae: [`AND(COUNTA($A2:$O2)>0,${column}2="")`], priority: 3, style: invalidStyle }],
    });
  }
  for (const column of ['D', 'E', 'N']) {
    sheet.addConditionalFormatting({
      ref: range(column),
      rules: [{
        type: 'expression',
        formulae: [`AND(${column}2<>"",OR(NOT(ISNUMBER(${column}2)),${column}2<0,${column}2<>INT(${column}2)))`],
        priority: 5,
        style: invalidStyle,
      }],
    });
  }
  sheet.addConditionalFormatting({
    ref: range('G'),
    rules: [{
      type: 'expression',
      formulae: ['AND(G2<>"",OR(NOT(ISNUMBER(G2)),G2<0,G2>9999999999.99,ROUND(G2,2)<>G2))'],
      priority: 6,
      style: invalidStyle,
    }],
  });
  sheet.addConditionalFormatting({
    ref: range('A'),
    rules: [{ type: 'expression', formulae: ['AND(A2<>"",LEN(A2)>30)'], priority: 7, style: invalidStyle }],
  });
  sheet.addConditionalFormatting({
    ref: range('B'),
    rules: [{ type: 'expression', formulae: ['AND(B2<>"",LEN(B2)>50)'], priority: 8, style: invalidStyle }],
  });
  sheet.addConditionalFormatting({
    ref: range('C'),
    rules: [{ type: 'expression', formulae: ['AND(C2<>"",LEN(C2)>255)'], priority: 9, style: invalidStyle }],
  });
  if (hasCategories) {
    sheet.addConditionalFormatting({
      ref: range('O'),
      rules: [{
        type: 'expression',
        formulae: ['AND(O2<>"",COUNTIF(CategoriasInventario,O2)=0)'],
        priority: 10,
        style: invalidStyle,
      }],
    });
  }
  if (hasUnits) {
    sheet.addConditionalFormatting({
      ref: range('H'),
      rules: [{
        type: 'expression',
        formulae: ['AND(H2<>"",COUNTIF(UnidadesInventario,H2)=0)'],
        priority: 11,
        style: invalidStyle,
      }],
    });
  }
  for (const column of ['L', 'M']) {
    sheet.addConditionalFormatting({
      ref: range(column),
      rules: [{
        type: 'expression',
        formulae: [`AND(${column}2<>"",NOT(ISNUMBER(${column}2)))`],
        priority: 12,
        style: invalidStyle,
      }],
    });
  }
  sheet.addConditionalFormatting({
    ref: `L${FIRST_DATA_ROW}:M${LAST_DATA_ROW}`,
    rules: [{
      type: 'expression',
      formulae: ['AND($L2<>"",$M2<>"",$L2>$M2)'],
      priority: 4,
      style: invalidStyle,
    }],
  });
}

export async function createInventoryWorkbook(
  rows: InventorySpreadsheetRow[],
  categories: Category[],
  units: UnitOfMeasure[],
): Promise<ArrayBuffer> {
  const { default: ExcelJSRuntime } = await import('exceljs');
  const workbook = new ExcelJSRuntime.Workbook();
  workbook.creator = 'Tienda Parque 100';
  workbook.created = new Date();
  workbook.modified = new Date();
  const sheet = workbook.addWorksheet('Inventario');
  const tableRows = rows.length
    ? rows.map((row) => INVENTORY_HEADERS.map((header) => {
      const value = row[header];
      if (header === 'Promo_Desde' || header === 'Promo_Hasta') return excelDate(value);
      if (value === '' || value === null || value === undefined) return null;
      return value;
    }))
    : [INVENTORY_HEADERS.map(() => null)];

  sheet.addTable({
    name: 'InventarioParque100',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: INVENTORY_HEADERS.map((name) => ({ name, filterButton: true })),
    rows: tableRows,
  });
  sheet.columns = INVENTORY_HEADERS.map((header, index) => ({ header, width: columnWidths[index] }));
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (let column = 1; column <= INVENTORY_HEADERS.length; column += 1) {
    const cell = sheet.getRow(1).getCell(column);
    cell.fill = headerFill;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', wrapText: true };
  }
  sheet.getRow(1).height = 32;

  for (let row = FIRST_DATA_ROW; row <= Math.max(LAST_DATA_ROW, rows.length + 1); row += 1) {
    sheet.getCell(`A${row}`).numFmt = '@';
    sheet.getCell(`D${row}`).numFmt = '"$"#,##0';
    sheet.getCell(`E${row}`).numFmt = '"$"#,##0';
    sheet.getCell(`G${row}`).numFmt = '0.00';
    sheet.getCell(`L${row}`).numFmt = 'yyyy-mm-dd';
    sheet.getCell(`M${row}`).numFmt = 'yyyy-mm-dd';
    sheet.getCell(`N${row}`).numFmt = '#,##0';
    sheet.getCell(`O${row}`).numFmt = '0';
  }

  const catalogs = addCatalogSheet(workbook, categories, units);
  workbook.definedNames.add(`'${catalogs.name}'!$A$2:$A$${Math.max(2, categories.length + 1)}`, 'CategoriasInventario');
  workbook.definedNames.add(`'${catalogs.name}'!$D$2:$D$${Math.max(2, units.length + 1)}`, 'UnidadesInventario');
  createInstructionsSheet(workbook);
  addValidationAndWarnings(sheet, categories.length > 0, units.length > 0);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

function normalizedCellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  throw new Error('El libro no debe contener fórmulas, enlaces ni celdas enriquecidas en la tabla del inventario.');
}

export async function readInventoryWorkbook(buffer: ArrayBuffer): Promise<ParsedInventoryRow[]> {
  const { default: ExcelJSRuntime } = await import('exceljs');
  const workbook = new ExcelJSRuntime.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error('No se pudo abrir el libro. Verifica que sea un archivo .xlsx válido, que no esté dañado y que no tenga contraseña.');
  }
  const sheet = workbook.getWorksheet('Inventario');
  if (!sheet) throw new Error('No se encontró la hoja «Inventario». Descarga la plantilla oficial y conserva su nombre.');
  if (sheet.rowCount > LAST_DATA_ROW) {
    throw new Error(`El libro no puede superar las ${MAX_IMPORT_ROWS} filas de productos.`);
  }

  const headerRow = sheet.getRow(1);
  const headers = Array.from({ length: headerRow.cellCount }, (_, index) =>
    String(normalizedCellValue(headerRow.getCell(index + 1).value)).trim());
  const expected = new Set<string>(INVENTORY_HEADERS);
  const missing = INVENTORY_HEADERS.filter((header) => !headers.includes(header));
  const extra = headers.filter((header) => !expected.has(header));
  if (
    headers.length !== INVENTORY_HEADERS.length
    || new Set(headers).size !== INVENTORY_HEADERS.length
    || missing.length > 0
    || extra.length > 0
  ) {
    throw new Error(`La hoja Inventario debe conservar las 15 columnas oficiales. Faltan: ${missing.join(', ') || '—'}. Sobran: ${extra.join(', ') || '—'}.`);
  }

  const rowIndexByHeader = new Map(headers.map((header, index) => [header, index + 1]));
  const rows: ParsedInventoryRow[] = [];
  for (let rowNumber = FIRST_DATA_ROW; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    for (let column = INVENTORY_HEADERS.length + 1; column <= row.cellCount; column += 1) {
      const value = normalizedCellValue(row.getCell(column).value);
      if (value !== '' && value !== null && value !== undefined) {
        throw new Error(`La fila ${rowNumber} contiene datos fuera de las columnas oficiales.`);
      }
    }
    const values = Object.fromEntries(INVENTORY_HEADERS.map((header) => {
      const cell = row.getCell(rowIndexByHeader.get(header)!);
      return [header, normalizedCellValue(cell.value)];
    })) as InventorySpreadsheetRow;
    if (Object.values(values).every((value) => value === '' || value === null || value === undefined)) continue;
    rows.push({ excelRow: rowNumber, values });
  }
  if (rows.length === 0) throw new Error('La hoja Inventario no contiene productos para importar.');
  if (rows.length > MAX_IMPORT_ROWS) throw new Error(`El libro no puede superar las ${MAX_IMPORT_ROWS} filas de productos.`);
  return rows;
}

export function inventoryDateValue(value: unknown): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  return String(value ?? '').trim();
}
