export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  description: string;
}

export interface Category {
  id: number;
  name: string;
  emoji: string;
  color: string;
  border: string;
}

export interface AdminProduct {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: InventoryStatus;
}

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
