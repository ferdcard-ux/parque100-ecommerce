import type { Product, Category, AdminProduct } from '../models';

const API = 'http://localhost:3001/api';

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

const CATEGORY_MAP: Record<string, { emoji: string; color: string; border: string }> = {
  Verduras: { emoji: '🥦', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  Frutas: { emoji: '🍎', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
  Carnes: { emoji: '🥩', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  Granos: { emoji: '🌾', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  Lacteos: { emoji: '🥛', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  Panaderia: { emoji: '🍞', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  Bebidas: { emoji: '🥤', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  Limpieza: { emoji: '🧹', color: 'bg-cyan-100 text-cyan-700', border: 'border-cyan-200' },
};

function normalizeCategory(name: string): string {
  const accents: Record<string, string> = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U' };
  return name.replace(/[áéíóúÁÉÍÓÚ]/g, (ch) => accents[ch] || ch);
}

function mapProduct(row: any): Product {
  const rawCategory = row.Nombre_Categoria || row.category || '';
  const categoryName = normalizeCategory(rawCategory);
  const productName = row.Nombre || row.name || '';
  return {
    id: row.ID_Producto || row.id,
    name: productName,
    price: row.Precio_Venta || row.price,
    image: row.Imagen || PRODUCT_IMAGES[productName] || CATEGORY_IMAGES[categoryName] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: categoryName,
    stock: row.Stock_Minimo || row.stock || 0,
    description: row.Descripcion || row.description || '',
  };
}

function mapAdminProduct(row: any): AdminProduct {
  const stock = row.Stock_Minimo || row.stock || 0;
  const rawCategory = row.Nombre_Categoria || row.category || '';
  return {
    id: row.ID_Producto || row.id,
    name: row.Nombre || row.name,
    category: normalizeCategory(rawCategory),
    quantity: row.Stock_Minimo || row.quantity || 0,
    price: row.Precio_Venta || row.price,
    status: stock <= 0 ? 'out_of_stock' : stock < 10 ? 'low_stock' : 'in_stock',
  };
}

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      return data.map(mapProduct);
    } catch {
      return [];
    }
  },

  async getById(id: number): Promise<Product | null> {
    try {
      const res = await fetch(`${API}/products/${id}`);
      const data = await res.json();
      return data.error ? null : mapProduct(data);
    } catch {
      return null;
    }
  },

  async getByCategory(category: string): Promise<Product[]> {
    const all = await this.getAll();
    return all.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  },

  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API}/categories`);
      const data = await res.json();
      return data.map((row: any, i: number) => {
        const name = normalizeCategory(row.Nombre_Categoria);
        const style = CATEGORY_MAP[name] || { emoji: '📦', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' };
        return { id: i + 1, name, ...style };
      });
    } catch {
      return Object.entries(CATEGORY_MAP).map(([name, style], i) => ({ id: i + 1, name, ...style }));
    }
  },

  async getAdminProducts(): Promise<AdminProduct[]> {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      return data.map(mapAdminProduct);
    } catch {
      return [];
    }
  },

  async deleteAdminProduct(id: number): Promise<void> {
    try {
      await fetch(`${API}/products/${id}`, { method: 'DELETE' });
    } catch {
      // silent
    }
  },

  async createProduct(product: { ID_Producto: string; Nombre: string; Descripcion: string; Imagen?: string; Precio_Venta: number; Stock_Minimo: number; ID_Categoria: number }): Promise<void> {
    await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },

  async updateProduct(id: string, product: { Nombre: string; Descripcion: string; Imagen?: string; Precio_Venta: number; Stock_Minimo: number; ID_Categoria: number }): Promise<void> {
    await fetch(`${API}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
  },
};
