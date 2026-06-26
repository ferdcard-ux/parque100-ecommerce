import { ShoppingBag } from 'lucide-react';
import type { CartItem, PaymentMethodType } from '../../../models';
import { formatPrice } from '../../../utils';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod?: PaymentMethodType | null;
  showItems?: boolean;
}

export function OrderSummary({ items, subtotal, shipping, total, paymentMethod, showItems = true }: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-20">
      <h3 className="text-[#212121] font-bold mb-5 pb-4 border-b border-gray-100" style={{ fontSize: '1.1rem' }}>
        <ShoppingBag size={18} className="inline mr-2 text-[#C62828]" />
        Resumen del pedido
      </h3>

      {showItems && (
        <div className="flex flex-col gap-3 mb-5">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-gray-500">
              <span style={{ fontSize: '0.875rem' }}>{item.name} x{item.quantity}</span>
              <span style={{ fontSize: '0.875rem' }}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4 flex flex-col gap-2.5 mb-6">
        <div className="flex justify-between text-[#212121]">
          <span style={{ fontSize: '0.9rem' }}>Subtotal</span>
          <span style={{ fontSize: '0.9rem' }}>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500" style={{ fontSize: '0.9rem' }}>Envío</span>
          <span className={`font-medium ${shipping === 0 ? 'text-green-600' : 'text-[#212121]'}`} style={{ fontSize: '0.9rem' }}>
            {shipping === 0 ? 'Gratis' : formatPrice(shipping)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <span className="text-[#212121] font-bold" style={{ fontSize: '1.05rem' }}>Total</span>
          <span className="text-[#C62828] font-black" style={{ fontSize: '1.3rem' }}>{formatPrice(total)}</span>
        </div>
      </div>

      {paymentMethod && (
        <div className="mt-4 p-3 bg-[#FBC02D]/10 rounded-xl border border-[#FBC02D]/20">
          <p className="text-[#212121] font-medium" style={{ fontSize: '0.8rem' }}>
            ✅ Método: <strong>{paymentMethod === 'card' ? 'Tarjeta' : 'Nequi'}</strong>
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-[#FBC02D]/10 rounded-xl border border-[#FBC02D]/20">
        <p className="text-[#212121] font-medium" style={{ fontSize: '0.8rem' }}>
          🕐 Tiempo estimado de entrega: <strong>45-60 minutos</strong>
        </p>
      </div>
    </div>
  );
}
