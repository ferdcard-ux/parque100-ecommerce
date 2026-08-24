/**
 * @fileoverview Controlador del modulo principal: catalogo de productos.
 * Hook React que carga productos, categorias y filas admin desde el
 * backend (via productService) y expone las operaciones CRUD del
 * panel de inventario. Es la capa Controller entre las vistas y los
 * servicios.
 */
import { useState, useEffect, useCallback } from 'react';
import type { Product, Category, AdminProduct } from '../models';
import { productService } from '../services';

/**
 * Controlador de productos.
 *
 * @returns Objeto con estado y acciones del catalogo.
 * @property {Product[]} products - Catalogo completo normalizado.
 * @property {Category[]} categories - Categorias con estilo visual.
 * @property {AdminProduct[]} adminProducts - Filas para la tabla admin.
 * @property {boolean} isLoading - true durante la carga inicial/recargas.
 * @property {Function} getFeaturedProducts - Productos destacados a mostrar.
 * @property {Function} deleteProduct - Elimina un producto y refresca.
 * @property {Function} createProduct - Crea un producto y refresca.
 * @property {Function} updateProduct - Actualiza un producto y refresca.
 * @property {Function} reload - Recarga todos los datos desde la API.
 */
export function useProductController() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /** Carga en paralelo catalogo, categorias y datos de inventario. */
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allProducts, allCategories, allAdmin] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
        productService.getAdminProducts(),
      ]);
      setProducts(allProducts);
      setCategories(allCategories);
      setAdminProducts(allAdmin);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Carga inicial al montar cualquier vista que use este controlador. */
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /** Elimina un producto en el backend y lo quita del estado local. */
  const deleteProduct = useCallback(async (id: number) => {
    await productService.deleteAdminProduct(id);
    setAdminProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /** Crea un producto en el backend y recarga el catalogo. */
  const createProduct = useCallback(async (data: {
    ID_Producto: string;
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => {
    await productService.createProduct(data);
    await loadProducts();
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: string, data: {
    Nombre: string;
    Descripcion: string;
    Imagen?: string;
    Precio_Venta: number;
    Stock_Minimo: number;
    ID_Categoria: number;
  }) => {
    await productService.updateProduct(id, data);
    await loadProducts();
  }, [loadProducts]);

  /**
   * Productos destacados de la pagina principal. Hoy devuelve todo
   * el catalogo; si se agrega una marca `destacado` a la BD, bastaria
   * filtrar aqui sin tocar las vistas.
   */
  const getFeaturedProducts = useCallback(() => {
    return products;
  }, [products]);

  return {
    products,
    categories,
    adminProducts,
    isLoading,
    getFeaturedProducts,
    deleteProduct,
    createProduct,
    updateProduct,
    reload: loadProducts,
  };
}
