import { useState, useEffect, useCallback } from 'react';
import type { Product, Category, AdminProduct } from '../models';
import { productService } from '../services';

export function useProductController() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const deleteProduct = useCallback(async (id: number) => {
    await productService.deleteAdminProduct(id);
    setAdminProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

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
    reload: loadProducts,
  };
}
