import { Link } from 'react-router';
import { CheckCircle2, Package, Clock, MapPin, Store } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { generateOrderId } from '../../utils';

export function PaymentSuccessPage() {
  const orderId = generateOrderId();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, #FBC02D, #C62828)' }} />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5" style={{ background: '#FBC02D', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-5" style={{ background: '#C62828', transform: 'translate(-20%, 20%)' }} />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FBC02D, #C62828)' }}>
              <Store className="text-white" size={20} />
            </div>
            <span className="font-bold text-[#212121]" style={{ fontSize: '1.1rem' }}>Tienda Parque 100</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 rounded-full bg-green-100 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full bg-green-100" />
          <CheckCircle2 size={72} className="relative z-10 text-[#C62828]" strokeWidth={1.5} />
        </div>

        <h1 className="text-[#212121] mb-2" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          ¡Pago exitoso!
        </h1>
        <p className="text-gray-500 mb-2" style={{ fontSize: '1rem' }}>
          Tu pedido ha sido confirmado
        </p>
        <div className="inline-block bg-[#FBC02D]/10 border border-[#FBC02D]/30 rounded-full px-4 py-1 mb-8">
          <span className="text-[#212121] font-semibold" style={{ fontSize: '0.875rem' }}>
            Pedido #{orderId}
          </span>
        </div>

        <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 shadow-md relative">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1685640206182-c51b8aa9b686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
            alt="Entrega a domicilio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>

        <div className="bg-[#F5F5F5] rounded-2xl p-5 mb-6 text-left">
          <h3 className="text-[#212121] font-semibold mb-4" style={{ fontSize: '0.95rem' }}>Estado de tu pedido</h3>
          <div className="flex flex-col gap-0">
            {[
              { icon: <CheckCircle2 size={18} />, label: 'Pago confirmado', sub: 'Hace un momento', done: true },
              { icon: <Package size={18} />, label: 'Preparando tu pedido', sub: 'En proceso', active: true },
              { icon: <Clock size={18} />, label: 'En camino', sub: 'Aprox. 30 minutos', pending: true },
              { icon: <MapPin size={18} />, label: 'Entregado', sub: 'Tu apartamento', pending: true },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-[#FBC02D] text-[#212121]' : 'bg-gray-200 text-gray-400'}`}>
                    {step.icon}
                  </div>
                  {i < 3 && <div className={`w-0.5 h-5 ${step.done || step.active ? 'bg-gray-300' : 'bg-gray-200'}`} />}
                </div>
                <div className="pt-1.5">
                  <p className={`font-medium ${step.done ? 'text-green-600' : step.active ? 'text-[#212121]' : 'text-gray-400'}`} style={{ fontSize: '0.875rem' }}>
                    {step.label}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '0.78rem' }}>{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link to="/">
          <button className="w-full py-3.5 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-all shadow-md hover:shadow-lg active:scale-[0.98]" style={{ fontSize: '1rem' }}>
            Volver a la tienda
          </button>
        </Link>
      </div>
    </div>
  );
}
