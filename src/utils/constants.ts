export const FREE_SHIPPING_THRESHOLD = 30000;
export const SHIPPING_COST = 4000;
export const DELIVERY_ESTIMATE_MINUTES = '45-60';
export const ORDER_ID_PREFIX = 'TP';

export const APP_NAME = 'Tienda Parque 100';
export const APP_TAGLINE = 'Tu tienda de confianza';
export const APP_DESCRIPTION = 'Productos frescos a tu puerta';
export const APP_ADDRESS = 'Carrera 100 #42f-100, Barranquilla';
export const APP_PHONE = '(304) 606-8846';
export const APP_EMAIL = 'info@parque100.com';

export const STATUS_LABELS = {
  in_stock: { label: 'En stock', class: 'bg-green-100 text-green-700 border-green-200' },
  low_stock: { label: 'Bajo stock', class: 'bg-[#FBC02D]/20 text-[#f57f17] border-[#FBC02D]/40' },
  out_of_stock: { label: 'Sin stock', class: 'bg-[#C62828]/10 text-[#C62828] border-[#C62828]/20' },
} as const;
