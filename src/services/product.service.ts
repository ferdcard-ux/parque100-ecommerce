import type { Product, Category, AdminProduct, InventoryStatus } from '../models';

const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Tomates Cherry 500g', price: 3500, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Verduras', stock: 45, description: 'Tomates cherry frescos y jugosos del campo' },
  { id: 2, name: 'Bananos x6 und', price: 2800, image: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Frutas', stock: 32, description: 'Bananos maduros de la mejor calidad' },
  { id: 3, name: 'Fresas Frescas 500g', price: 4200, image: 'https://images.unsplash.com/photo-1585590853943-67022b1d8fe8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Frutas', stock: 8, description: 'Fresas frescas de temporada' },
  { id: 4, name: 'Canasta de Frutas', price: 12000, image: 'https://images.unsplash.com/photo-1498579397066-22750a3cb424?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Frutas', stock: 10, description: 'Canasta con variedad de frutas frescas' },
  { id: 5, name: 'Verduras Mixtas 1kg', price: 6500, image: 'https://images.unsplash.com/photo-1557844352-761f2565b576?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Verduras', stock: 3, description: 'Selección de verduras frescas del día' },
  { id: 6, name: 'Manzanas Rojas x5', price: 4800, image: 'https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Frutas', stock: 25, description: 'Manzanas rojas importadas y dulces' },
  { id: 7, name: 'Surtido Verduras Fridge', price: 7200, image: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Verduras', stock: 15, description: 'Verduras variadas conservadas en frío' },
  { id: 8, name: 'Mix de Frutas Tropicales', price: 5500, image: 'https://images.unsplash.com/photo-1560761098-21f5722ecb14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400', category: 'Frutas', stock: 20, description: 'Mix de frutas tropicales frescas' },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Verduras', emoji: '🥦', color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  { id: 2, name: 'Frutas', emoji: '🍎', color: 'bg-red-100 text-red-700', border: 'border-red-200' },
  { id: 3, name: 'Carnes', emoji: '🥩', color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  { id: 4, name: 'Granos', emoji: '🌾', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  { id: 5, name: 'Lácteos', emoji: '🥛', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { id: 6, name: 'Panadería', emoji: '🍞', color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  { id: 7, name: 'Bebidas', emoji: '🥤', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  { id: 8, name: 'Limpieza', emoji: '🧹', color: 'bg-cyan-100 text-cyan-700', border: 'border-cyan-200' },
];

const MOCK_ADMIN_PRODUCTS: AdminProduct[] = [
  { id: 1, name: 'Tomates Cherry 500g', category: 'Verduras', quantity: 45, price: 3500, status: 'in_stock' },
  { id: 2, name: 'Bananos x6 und', category: 'Frutas', quantity: 32, price: 2800, status: 'in_stock' },
  { id: 3, name: 'Fresas Frescas 500g', category: 'Frutas', quantity: 8, price: 4200, status: 'low_stock' },
  { id: 4, name: 'Canasta de Frutas', category: 'Frutas', quantity: 10, price: 12000, status: 'low_stock' },
  { id: 5, name: 'Verduras Mixtas 1kg', category: 'Verduras', quantity: 3, price: 6500, status: 'low_stock' },
  { id: 6, name: 'Manzanas Rojas x5', category: 'Frutas', quantity: 25, price: 4800, status: 'in_stock' },
  { id: 7, name: 'Surtido Verduras Fridge', category: 'Verduras', quantity: 15, price: 7200, status: 'in_stock' },
  { id: 8, name: 'Mix de Frutas Tropicales', category: 'Frutas', quantity: 20, price: 5500, status: 'in_stock' },
  { id: 9, name: 'Leche Entera 1L', category: 'Lácteos', quantity: 5, price: 3200, status: 'low_stock' },
  { id: 10, name: 'Pan Tajado 500g', category: 'Panadería', quantity: 18, price: 4500, status: 'in_stock' },
  { id: 11, name: 'Agua Cristal 1.5L', category: 'Bebidas', quantity: 60, price: 1800, status: 'in_stock' },
  { id: 12, name: 'Jabón de Piso 1L', category: 'Limpieza', quantity: 0, price: 5200, status: 'out_of_stock' },
  { id: 13, name: 'Arroz Premium 1kg', category: 'Granos', quantity: 28, price: 3800, status: 'in_stock' },
  { id: 14, name: 'Huevos x12', category: 'Lácteos', quantity: 2, price: 8500, status: 'low_stock' },
];

export const productService = {
  async getAll(): Promise<Product[]> {
    return MOCK_PRODUCTS;
  },

  async getById(id: number): Promise<Product | null> {
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  },

  async getByCategory(category: string): Promise<Product[]> {
    return MOCK_PRODUCTS.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  },

  async getCategories(): Promise<Category[]> {
    return MOCK_CATEGORIES;
  },

  async getAdminProducts(): Promise<AdminProduct[]> {
    return MOCK_ADMIN_PRODUCTS;
  },

  async deleteAdminProduct(id: number): Promise<void> {
    const index = MOCK_ADMIN_PRODUCTS.findIndex((p) => p.id === id);
    if (index !== -1) MOCK_ADMIN_PRODUCTS.splice(index, 1);
  },
};
