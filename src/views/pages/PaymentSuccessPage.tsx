import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { CheckCircle2, Package, Clock, MapPin, Store, TriangleAlert } from 'lucide-react';
import { useApp } from '../../App';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { DISPATCH_DELAY_WARNING } from '../../utils';
import { formatPrice } from '../../utils';

export function PaymentSuccessPage() {
  const { lastOrder } = useApp();
  const isDemo = lastOrder?.simulatedPayment === true;
  const orderLabel = lastOrder?.backendId ? `#${lastOrder.backendId}` : lastOrder ? lastOrder.id : null;
  const detailTo = lastOrder?.backendId ? `/compras/${lastOrder.backendId}` : '/compras';
  const statusSteps: Array<{ icon: ReactNode; label: string; sub: string; done?: boolean; active?: boolean; pending?: boolean }> = isDemo
    ? [
        { icon: <CheckCircle2 size={18} />, label: 'Transaccion DEMO aprobada', sub: 'Registro academico; no hubo cobro', done: true },
        { icon: <Package size={18} />, label: 'Pedido e inventario actualizados', sub: 'Cambios persistidos en la base demo', done: true },
        { icon: <Clock size={18} />, label: 'Seguimiento demostrativo', sub: 'El personal puede avanzar sus estados', active: true },
      ]
    : [
        { icon: <CheckCircle2 size={18} />, label: 'Pedido registrado', sub: 'Pago pendiente contra entrega', done: true },
        { icon: <Package size={18} />, label: 'Preparación pendiente', sub: 'Te avisaremos cuando avance', active: true },
        { icon: <Clock size={18} />, label: 'En camino', sub: 'Aprox. 30 minutos', pending: true },
        { icon: <MapPin size={18} />, label: 'Entregado', sub: 'Tu apartamento', pending: true },
      ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background: 'linear-gradient(90deg, var(--brand-yellow), var(--brand-red))' }} />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5" style={{ background: 'var(--brand-yellow)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-5" style={{ background: 'var(--brand-red)', transform: 'translate(-20%, 20%)' }} />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--brand-yellow), var(--brand-red))' }}>
              <Store className="text-white" size={20} />
            </div>
            <span className="font-bold text-brand-ink" style={{ fontSize: '1.1rem' }}>Tienda Parque 100</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 rounded-full bg-green-100 animate-ping opacity-30" />
          <div className="absolute w-24 h-24 rounded-full bg-green-100" />
          <CheckCircle2 size={72} className="relative z-10 text-brand-red" strokeWidth={1.5} />
        </div>

        <h1 className="text-brand-ink mb-2" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          {isDemo ? '¡Simulacion completa!' : '¡Pedido confirmado!'}
        </h1>
        <p className="text-gray-500 mb-2" style={{ fontSize: '1rem' }}>
          {isDemo ? 'El pago se aprobo unicamente dentro del flujo DEMO; no se realizo ningun cobro.' : 'El pago se realizará en efectivo al recibirlo'}
        </p>
        <div className="inline-block bg-brand-yellow/10 border border-brand-yellow/30 rounded-full px-4 py-1 mb-6">
          <span className="text-brand-ink font-semibold" style={{ fontSize: '0.875rem' }}>
            {orderLabel ? `Pedido ${orderLabel}` : 'Pedido confirmado'}
          </span>
        </div>
        {lastOrder?.cashChange != null && (
          <dl className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 text-left flex flex-col gap-1" style={{ fontSize: '0.9rem' }}>
            <div className="flex justify-between text-gray-500"><dt>Efectivo recibido</dt><dd>{formatPrice(lastOrder.cashTendered ?? 0)}</dd></div>
            <div className="flex justify-between text-green-700 font-bold"><dt>Tu cambio</dt><dd>{formatPrice(lastOrder.cashChange)}</dd></div>
          </dl>
        )}

        {isDemo && lastOrder.paymentSimulationId && (
          <p className="mb-4 text-gray-500" style={{ fontSize: '0.8rem' }}>
            Referencia de simulacion (no financiera): <strong>{lastOrder.paymentSimulationId}</strong>
          </p>
        )}

        <div role="alert" className="flex gap-3 text-left bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <TriangleAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800" style={{ fontSize: '0.85rem' }}>
            {isDemo
              ? 'No es una compra ni un pago real. El pedido y el descuento de inventario se guardaron para la demostracion; el personal puede avanzar sus estados dentro del sistema.'
              : DISPATCH_DELAY_WARNING}
          </p>
        </div>

        {!isDemo && <div className="w-full h-44 rounded-2xl overflow-hidden mb-6 shadow-md relative">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1685640206182-c51b8aa9b686?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"
            alt="Entrega a domicilio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>}

        <div className="bg-brand-surface rounded-2xl p-5 mb-6 text-left">
          <h3 className="text-brand-ink font-semibold mb-4" style={{ fontSize: '0.95rem' }}>{isDemo ? 'Estado de la simulación' : 'Estado de tu pedido'}</h3>
          <div className="flex flex-col gap-0">
            {statusSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-brand-yellow text-brand-ink' : 'bg-gray-200 text-gray-400'}`}>
                    {step.icon}
                  </div>
                  {i < statusSteps.length - 1 && <div className={`w-0.5 h-5 ${step.done || step.active ? 'bg-gray-300' : 'bg-gray-200'}`} />}
                </div>
                <div className="pt-1.5">
                  <p className={`font-medium ${step.done ? 'text-green-600' : step.active ? 'text-brand-ink' : 'text-gray-400'}`} style={{ fontSize: '0.875rem' }}>
                    {step.label}
                  </p>
                  <p className="text-gray-400" style={{ fontSize: '0.78rem' }}>{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link to={detailTo}>
          <button className="w-full py-3.5 rounded-xl bg-white border-2 border-brand-red text-brand-red font-semibold hover:bg-red-50 transition-all active:scale-[0.98] mb-3" style={{ fontSize: '1rem' }}>
            Ver mi pedido
          </button>
        </Link>
        <Link to="/">
          <button className="w-full py-3.5 rounded-xl bg-brand-red text-white font-semibold hover:bg-brand-red-dark transition-all shadow-md hover:shadow-lg active:scale-[0.98]" style={{ fontSize: '1rem' }}>
            Volver a la tienda
          </button>
        </Link>
      </div>
    </div>
  );
}
