import type { Product, Category, UnitOfMeasure, AdminProduct, ProductUpsert, ProductCreate } from '../models';
import { API_BASE as API, authHeaders } from './api';

const PEXELS = (id: number, file?: string) =>
  `https://images.pexels.com/photos/${id}/${file || `pexels-photo-${id}.jpeg`}?auto=compress&cs=tinysrgb&w=400`;

const PRODUCT_IMAGES: Record<string, string> = {
  'Tomates Cherry 500g': 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Bananos x6 und': 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Fresas Frescas 500g': 'https://images.unsplash.com/photo-1585590853943-67022b1d8fe8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Canasta de Frutas': 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Verduras Mixtas 1kg': 'https://images.unsplash.com/photo-1557844352-761f2565b576?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Manzanas Rojas x5': 'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Surtido Verduras': 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Mix Frutas Tropicales': 'https://images.unsplash.com/photo-1560761098-21f5722ecb14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Leche Entera 1L': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  'Pan Tajado 500g': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  // Fotos Pexels verificadas (una por producto, sin repeticiones).
  'Carne Molida 500g': PEXELS(128401),
  'Pechuga de Pollo 1kg': PEXELS(3688, 'food-dinner-lunch-chicken.jpg'),
  'Chorizos x5 und': PEXELS(10794112),
  'Arroz Blanco 1kg': PEXELS(31555431),
  'Lentejas 500g': PEXELS(6086414),
  'Frijoles Rojos 500g': PEXELS(7717469),
  'Pan Integral 500g': PEXELS(12284683),
  'Croissants x4 und': PEXELS(11675765),
  'Torta Casera 500g': PEXELS(7966511),
  'Jugo de Naranja 1L': PEXELS(14510445),
  'Cafe Molido 500g': PEXELS(5908468),
  'Avena 1L': PEXELS(33874707),
  'Jabon Liquido 1L': PEXELS(7262480),
  'Detergente 1kg': PEXELS(10566513),
  'Papel Higienico x4': PEXELS(3958205),
};

const CATEGORY_IMAGES: Record<string, string> = {
  Verduras: 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Frutas: 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Carnes: 'https://images.unsplash.com/photo-1559742811-822f4580b12e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Granos: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Lacteos: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Panaderia: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Bebidas: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
  Limpieza: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
};

const CATEGORY_MAP: Record<string, Pick<Category, 'icon' | 'color' | 'border'>> = {
  Verduras: { icon: 'vegetables', color: 'bg-brand-yellow-soft text-brand-red', border: 'border-brand-yellow/40' },
  Frutas: { icon: 'fruit', color: 'bg-brand-red-soft text-brand-red', border: 'border-brand-red/20' },
  Carnes: { icon: 'meat', color: 'bg-brand-red-soft text-brand-red', border: 'border-brand-red/20' },
  Granos: { icon: 'grains', color: 'bg-brand-yellow-soft text-brand-ink', border: 'border-brand-yellow/40' },
  Lacteos: { icon: 'dairy', color: 'bg-brand-yellow-soft text-brand-red', border: 'border-brand-yellow/40' },
  Panaderia: { icon: 'bakery', color: 'bg-brand-yellow-soft text-brand-ink', border: 'border-brand-yellow/40' },
  Bebidas: { icon: 'drink', color: 'bg-brand-red-soft text-brand-red', border: 'border-brand-red/20' },
  Limpieza: { icon: 'cleaning', color: 'bg-brand-yellow-soft text-brand-ink', border: 'border-brand-yellow/40' },
};

function normalizeCategory(name: string): string {
  const accents: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
  return name.replace(/[áéíóúÁÉÍÓÚ]/g, (ch) => accents[ch] || ch);
}

function mapProduct(row: any): Product {
  const rawCategory = row.Nombre_Categoria || row.category || '';
  const categoryName = normalizeCategory(rawCategory);
  const productName = row.Nombre || row.name || '';
  const price = row.Precio_Venta ?? row.price;
  const prev = row.Precio_Anterior ?? row.previousPrice ?? null;
  const contentQty = row.Contenido_Cantidad ?? row.contentQty ?? null;
  const contentUnit = row.Contenido_Unidad ?? row.contentUnit ?? null;
  const ratingAverage = row.Promedio_Calificacion ?? row.ratingAverage ?? null;
  const ratingCount = row.Total_Calificaciones ?? row.ratingCount ?? 0;
  return {
    id: row.ID_Producto || row.id,
    name: productName,
    price,
    previousPrice: prev != null ? Number(prev) : null,
    brand: row.Marca ?? row.brand ?? null,
    sku: row.ID_Producto || row.sku || row.id || null,
    contentQty: contentQty != null ? Number(contentQty) : null,
    contentUnit: contentUnit || null,
    packaging: row.Embalaje ?? row.packaging ?? null,
    ingredients: row.Ingredientes ?? row.ingredients ?? null,
    storage: row.Conservacion ?? row.storage ?? null,
    promoFrom: row.Promo_Desde ?? row.promoFrom ?? null,
    promoTo: row.Promo_Hasta ?? row.promoTo ?? null,
    image: row.Imagen || PRODUCT_IMAGES[productName] || CATEGORY_IMAGES[categoryName] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: categoryName,
    stock: row.Stock_Minimo || row.stock || 0,
    description: row.Descripcion || row.description || '',
    ratingAverage: ratingAverage != null ? Number(ratingAverage) : null,
    ratingCount: Number(ratingCount) || 0,
  };
}

function mapAdminProduct(row: any): AdminProduct {
  const stock = row.Stock_Minimo || row.stock || 0;
  const rawCategory = row.Nombre_Categoria || row.category || '';
  return {
    id: row.ID_Producto || row.id,
    name: row.Nombre || row.name,
    category: normalizeCategory(rawCategory),
    categoryId: Number(row.ID_Categoria),
    quantity: row.Stock_Minimo || row.quantity || 0,
    price: row.Precio_Venta || row.price,
    status: stock <= 0 ? 'out_of_stock' : stock < 10 ? 'low_stock' : 'in_stock',
    image: row.Imagen || null,
    description: row.Descripcion || row.description || '',
  };
}

export const productService = {
  async getAll(): Promise<Product[]> {
    let res: Response;
    try {
      res = await fetch(`${API}/products`);
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) throw new Error('No fue posible cargar los productos.');
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');
    return data.map(mapProduct);
  },

  async getById(id: number): Promise<Product | null> {
    let res: Response;
    try {
      res = await fetch(`${API}/products/${id}`);
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('No fue posible cargar el producto.');
    const data = await res.json().catch(() => null);
    return data?.error ? null : mapProduct(data);
  },

  async getByCategory(category: string): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  },

  async getCategories(): Promise<Category[]> {
    let res: Response;
    try {
      res = await fetch(`${API}/categories`);
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) throw new Error('No fue posible cargar las categorias.');
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');
    const uniqueCategories = new Map<string, Category>();
    data.forEach((row: any) => {
      const name = normalizeCategory(row.Nombre_Categoria);
      const style = CATEGORY_MAP[name] || { icon: 'market', color: 'bg-brand-yellow-soft text-brand-red', border: 'border-brand-yellow/40' };
      const key = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
      if (!uniqueCategories.has(key)) {
        uniqueCategories.set(key, { id: Number(row.ID_Categoria), name, ...style });
      }
    });
    return [...uniqueCategories.values()];
  },

  async getUnits(): Promise<UnitOfMeasure[]> {
    let res: Response;
    try {
      res = await fetch(`${API}/units`);
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) throw new Error('No fue posible cargar las unidades de medida.');
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');
    const uniqueUnits = new Map<string, UnitOfMeasure>();
    data.forEach((row: any) => {
      const name = String(row.Nombre_Unidad);
      const key = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase();
      if (!uniqueUnits.has(key)) uniqueUnits.set(key, { id: Number(row.ID_Unidad), name });
    });
    return [...uniqueUnits.values()];
  },

  async createCategory(name: string): Promise<void> {
    await saveCatalogOption(`${API}/categories`, 'POST', { Nombre_Categoria: name }, 'No fue posible crear la categoría.');
  },

  async updateCategory(id: number, name: string): Promise<void> {
    await saveCatalogOption(`${API}/categories/${id}`, 'PUT', { Nombre_Categoria: name }, 'No fue posible actualizar la categoría.');
  },

  async deleteCategory(id: number): Promise<void> {
    await deleteCatalogOption(`${API}/categories/${id}`, 'No fue posible eliminar la categoría.');
  },

  async createUnit(name: string): Promise<void> {
    await saveCatalogOption(`${API}/units`, 'POST', { Nombre_Unidad: name }, 'No fue posible crear la unidad de medida.');
  },

  async updateUnit(id: number, name: string): Promise<void> {
    await saveCatalogOption(`${API}/units/${id}`, 'PUT', { Nombre_Unidad: name }, 'No fue posible actualizar la unidad de medida.');
  },

  async deleteUnit(id: number): Promise<void> {
    await deleteCatalogOption(`${API}/units/${id}`, 'No fue posible eliminar la unidad de medida.');
  },

  async getAdminProducts(): Promise<AdminProduct[]> {
    let res: Response;
    try {
      res = await fetch(`${API}/products`);
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) throw new Error('No fue posible cargar el inventario.');
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');
    return data.map(mapAdminProduct);
  },

  /**
   * Lee las filas crudas del inventario (exportacion/importacion).
   *
   * @returns {Promise<any[]>} Filas tal como las entrega la API.
   * @throws {Error} Si el servidor no responde correctamente.
   */
  async getRawRows(): Promise<any[]> {
    let res: Response;
    try {
      res = await fetch(`${API}/products`, { headers: authHeaders() });
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) throw new Error('No se pudo leer el inventario del servidor.');
    const data = await res.json().catch(() => null);
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');
    return data;
  },

  async deleteAdminProduct(id: number): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: authHeaders() });
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || 'No fue posible eliminar el producto.');
    }
  },

  async createProduct(product: ProductCreate): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(product),
      });
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || 'No fue posible crear el producto.');
    }
  },

  async updateProduct(id: string, product: ProductUpsert): Promise<void> {
    let res: Response;
    try {
      res = await fetch(`${API}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(product),
      });
    } catch {
      throw new Error('No fue posible conectar con el servidor.');
    }
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || 'No fue posible actualizar el producto.');
    }
  },
};

async function saveCatalogOption(url: string, method: 'POST' | 'PUT', data: object, fallback: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error('No fue posible conectar con el servidor.');
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || fallback);
  }
}

async function deleteCatalogOption(url: string, fallback: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
  } catch {
    throw new Error('No fue posible conectar con el servidor.');
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error || fallback);
  }
}
