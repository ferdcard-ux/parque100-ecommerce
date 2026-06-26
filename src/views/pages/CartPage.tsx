import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react';
import type { CartItem, Product } from '../../models';
import { formatPrice } from '../../utils';
import { CartItemCard } from '../components/cart/CartItemCard';
import { RecommendedList } from '../components/cart/RecommendedList';

interface CartPageProps {
  items: CartItem[];
  products: Product[];
  subtotal: number;
  shipping: number;
  total: number;
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, qty: number) => void;
}

export function CartPage({ items, products, subtotal, shipping, total, onRemove, onUpdateQuantity }: CartPageProps) {
  const navigate = useNavigate();
  const recommended = products.filter((p) => !items.find((c) => c.id === p.id)).slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-[#212121] mb-2" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Carrito vacío</h2>
          <p className="text-gray-500 mb-6">Agrega productos desde la tienda para continuar</p>
          <Link to="/">
            <button className="px-8 py-3 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-all shadow-md">
              Ir a la tienda
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all">
            <ArrowLeft size={18} className="text-[#212121]" />
          </Link>
          <div>
            <h1 className="text-[#212121]" style={{ fontSize: '1.5rem', fontWeight: 700 }}>Mi Carrito</h1>
            <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>{items.length} {items.length === 1 ? 'producto' : 'productos'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {items.map((item) => (
              <CartItemCard key={item.id} item={item} onRemove={onRemove} onUpdateQuantity={onUpdateQuantity} />
            ))}
            <RecommendedList products={recommended} />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-20">
              <h3 className="text-[#212121] font-bold mb-5 pb-4 border-b border-gray-100" style={{ fontSize: '1.1rem' }}>
                <ShoppingBag size={18} className="inline mr-2 text-[#C62828]" />
                Resumen del pedido
              </h3>

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

              <button onClick={() => navigate('/address')}
                className="w-full py-3.5 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                style={{ fontSize: '1rem' }}
              >
                Continuar <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
