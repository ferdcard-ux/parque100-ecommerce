/**
 * @fileoverview Controlador del catalogo de tienda.
 * Envuelve el controlador de productos aplicando busqueda,
 * filtro por categoria y ordenamiento sobre los datos reales.
 */
import { useMemo } from 'react';
import type { Product } from '../models';
import { useProductController } from './use-product-controller';

export type CatalogSort = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc';

/** Ordenamiento visible en la barra superior del catalogo. */
export const CATALOG_SORT_OPTIONS: { value: CatalogSort; label: string }[] = [
  { value: 'relevance', label: 'Mas relevantes' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name_asc', label: 'Nombre A-Z' },
];

/** Normaliza un texto para comparaciones sin tildes ni mayusculas. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Controlador del catalogo.
 *
 * @param {string} category - Categoria activa ('Todos' o nombre).
 * @param {string} query - Texto de busqueda.
 * @param {CatalogSort} sort - Orden seleccionado.
 * @returns Productos filtrados, categorias y estado de carga.
 */
export function useCatalogController(category: string, query: string, sort: CatalogSort, opts?: { brand?: string; promoOnly?: boolean; minPrice?: number; maxPrice?: number }) {
  const { products, categories, isLoading } = useProductController();

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const brand = normalize((opts?.brand ?? '').trim());
    let list = products.filter((p) => {
      const matchCategory = category === 'Todos' || normalize(p.category) === normalize(category);
      const matchQuery = q === '' || normalize(p.name).includes(q) || normalize(p.description).includes(q) || normalize(p.brand ?? '').includes(q);
      const matchBrand = brand === '' || normalize(p.brand ?? '') === brand;
      const matchPromo = !opts?.promoOnly || (p.previousPrice != null && p.previousPrice > p.price);
      const matchMin = opts?.minPrice == null || p.price >= opts.minPrice;
      const matchMax = opts?.maxPrice == null || p.price <= opts.maxPrice;
      return matchCategory && matchQuery && matchBrand && matchPromo && matchMin && matchMax;
    });
    switch (sort) {
      case 'price_asc':
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [products, category, query, sort, opts?.brand, opts?.promoOnly, opts?.minPrice, opts?.maxPrice]);

  const brands = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of products) {
      if (p.brand) set.set(normalize(p.brand), p.brand);
    }
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [products]);

  return { products: filtered, categories, isLoading, brands };
}

/** Cuenta por categoria para la cabecera del catalogo. */
export function countByCategory(products: Product[], category: string): number {
  if (category === 'Todos') return products.length;
  return products.filter((p) => normalize(p.category) === normalize(category)).length;
}
