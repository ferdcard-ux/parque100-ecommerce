/**
 * @fileoverview Resumen compacto de la compra para el flujo de checkout.
 */
import { ShoppingBag } from 'lucide-react';
import { formatPrice } from '../../../utils';

interface CheckoutSummaryProps {
  /** Unidades totales en el carrito. */
  itemCount: number;
  /** Valor total a pagar. */
  total: number;
}

/** Barra fija con cantidad de productos y valor total. */
export function CheckoutSummary({ itemCount, total }: CheckoutSummaryProps) {
  return (
    <div className="sticky top-16 z-10 bg-brand-ink text-white rounded-2xl px-5 py-3 mb-6 flex items-center justify-between shadow-md">
      <span className="flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
        <ShoppingBag size={16} className="text-brand-yellow" />
        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
      </span>
      <span className="font-bold" style={{ fontSize: '1rem' }}>
        Total: <span className="text-brand-yellow">{formatPrice(total)}</span>
      </span>
    </div>
  );
}
