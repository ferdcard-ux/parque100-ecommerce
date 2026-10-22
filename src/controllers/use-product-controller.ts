/**
 * @fileoverview Controlador del modulo principal: catalogo de productos.
 * Hook React que carga productos, categorias y filas admin desde el
 * backend (via productService) y expone las operaciones CRUD del
 * panel de inventario. Es la capa Controller entre las vistas y los
 * servicios.
 */
import { useState, useEffect, useCallback } from 'react';
import type { Product, Category, UnitOfMeasure, AdminProduct, ProductUpsert, ProductCreate } from '../models';
import { productService } from '../services';

/**
 * Controlador de productos.
 *
 * @returns Objeto con estado y acciones del catalogo.
 * @property {Product[]} products - Catalogo completo normalizado.
 * @property {Category[]} categories - Categorias con estilo visual.
 * @property {AdminProduct[]} adminProducts - Filas para la tabla admin.
 * @property {boolean} isLoading - true durante la carga inicial/recargas.
 * @property {string|null} error - Mensaje si la carga fallo (null si OK).
 * @property {Function} getFeaturedProducts - Productos destacados a mostrar.
 * @property {Function} deleteProduct - Elimina un producto y refresca.
 * @property {Function} createProduct - Crea un producto y refresca.
 * @property {Function} updateProduct - Actualiza un producto y refresca.
 * @property {Function} reload - Recarga todos los datos desde la API.
 */
export function useProductController() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [unitCatalogError, setUnitCatalogError] = useState<string | null>(null);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Carga en paralelo catalogo, categorias y datos de inventario. */
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allProducts, allCategories, allAdmin] = await Promise.all([
        productService.getAll(),
        productService.getCategories(),
        productService.getAdminProducts(),
      ]);
      setProducts(allProducts);
      setCategories(allCategories);
      setAdminProducts(allAdmin);
      try {
        setUnits(await productService.getUnits());
        setUnitCatalogError(null);
      } catch (unitError) {
        setUnits([]);
        setUnitCatalogError(unitError instanceof Error ? unitError.message : 'No fue posible cargar las unidades de medida.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar los productos.');
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
  const createProduct = useCallback(async (data: ProductCreate) => {
    await productService.createProduct(data);
    await loadProducts();
  }, [loadProducts]);

  const updateProduct = useCallback(async (id: string, data: ProductUpsert) => {
    await productService.updateProduct(id, data);
    await loadProducts();
  }, [loadProducts]);

  const createCategory = useCallback(async (name: string) => {
    await productService.createCategory(name);
    await loadProducts();
  }, [loadProducts]);

  const updateCategory = useCallback(async (id: number, name: string) => {
    await productService.updateCategory(id, name);
    await loadProducts();
  }, [loadProducts]);

  const deleteCategory = useCallback(async (id: number) => {
    await productService.deleteCategory(id);
    await loadProducts();
  }, [loadProducts]);

  const createUnit = useCallback(async (name: string) => {
    await productService.createUnit(name);
    await loadProducts();
  }, [loadProducts]);

  const updateUnit = useCallback(async (id: number, name: string) => {
    await productService.updateUnit(id, name);
    await loadProducts();
  }, [loadProducts]);

  const deleteUnit = useCallback(async (id: number) => {
    await productService.deleteUnit(id);
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

  /**
   * Sugiere productos por nombre para el buscador. Reusa el catalogo
   * cargado y solo consulta la API si aun no hay datos.
   *
   * @param {string} query - Texto de busqueda (minimo 2 caracteres).
   * @returns {Promise<Product[]>} Hasta 6 coincidencias.
   */
  const suggestProducts = useCallback(async (query: string): Promise<Product[]> => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const all = products.length > 0 ? products : await productService.getAll();
    return all.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [products]);

  /** Lee las filas crudas del inventario (exportacion/importacion). */
  const getInventoryRows = useCallback((): Promise<any[]> => {
    return productService.getRawRows();
  }, []);

  return {
    products,
    categories,
    units,
    unitCatalogError,
    adminProducts,
    isLoading,
    error,
    suggestProducts,
    getInventoryRows,
    getFeaturedProducts,
    deleteProduct,
    createProduct,
    updateProduct,
    createCategory,
    updateCategory,
    deleteCategory,
    createUnit,
    updateUnit,
    deleteUnit,
    reload: loadProducts,
  };
}
