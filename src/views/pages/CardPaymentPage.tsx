/**
 * @fileoverview Confirmacion del pedido con pago en efectivo contra
 * entrega; los pagos electronicos permanecen bloqueados sin pasarela
 * verificada.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ReceiptText, TriangleAlert } from 'lucide-react';
import type { PaymentModeState, PaymentMethodType } from '../../models';
import { CheckoutSteps } from '../components/checkout/checkout-steps';
import { CheckoutSummary } from '../components/checkout/checkout-summary';
import { PageHeader } from '../components/shared/page-header';
import { formatPrice } from '../../utils';

interface CardPaymentPageProps {
  total: number;
  itemCount: number;
  isProcessing: boolean;
  paymentMode: PaymentModeState;
  onPayCash: (tendered: number) => Promise<void>;
  onPayDemo: (method: Exclude<PaymentMethodType, 'cash'>) => Promise<void>;
}

export function CardPaymentPage({ total, itemCount, isProcessing, paymentMode, onPayCash, onPayDemo }: CardPaymentPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method');
  const isNequi = method === 'nequi';
  const isCash = method === 'cash';
  const isDemoMethod = method === 'card' || isNequi;
  const [error, setError] = useState('');
  const [tendered, setTendered] = useState('');
  const tenderedValue = Number(tendered.replace(/\D/g, '')) || 0;
  const change = tenderedValue >= total ? tenderedValue - total : 0;

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tenderedValue < total) {
      setError(`El monto debe cubrir el total (${formatPrice(total)}).`);
      return;
    }
    try {
      await onPayCash(tenderedValue);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el pedido.');
    }
  };

  const handleDemoSubmit = async () => {
    setError('');
    if (paymentMode !== 'demo' || !isDemoMethod) {
      setError('La simulación no está habilitada en este servidor.');
      return;
    }
    try {
      await onPayDemo(isNequi ? 'nequi' : 'card');
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible completar la simulación.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CheckoutSteps current={3} />
        <CheckoutSummary itemCount={itemCount} total={total} />
        <PageHeader
          title={isNequi ? 'Simulación de Nequi' : isCash ? 'Pago en efectivo' : 'Simulación con tarjeta'}
          subtitle={`${isDemoMethod ? 'Total del pedido' : 'Total a pagar'}: ${formatPrice(total)}`}
          backTo="/payment-method"
        />
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        {isCash ? (
          <form onSubmit={handleCashSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-11 h-11 rounded-xl bg-[#FBC02D]/20 text-[#f57f17] flex items-center justify-center">
                <ReceiptText size={20} />
              </span>
              <p className="text-gray-500" style={{ fontSize: '0.85rem' }}>
                Pagas al recibir el pedido. Indica con qué billete pagarás.
              </p>
            </div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Monto en efectivo *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={tendered}
              onChange={(e) => setTendered(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              title="Máximo 6 dígitos"
              placeholder="Ej. 500000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] mb-4"
            />
            <dl className="border-t border-gray-100 pt-3 mb-6 flex flex-col gap-1" style={{ fontSize: '0.9rem' }}>
              <div className="flex justify-between text-gray-500"><dt>Total compra</dt><dd>{formatPrice(total)}</dd></div>
              <div className="flex justify-between text-gray-500"><dt>Recibido</dt><dd>{formatPrice(tenderedValue)}</dd></div>
              <div className="flex justify-between text-green-700 font-bold"><dt>Tu cambio</dt><dd>{formatPrice(change)}</dd></div>
            </dl>
            <button type="submit" disabled={isProcessing} className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all" style={{ fontSize: '1rem' }}>
              {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
            </button>
          </form>
        ) : isDemoMethod && paymentMode === 'demo' ? (
          <section className="mx-auto max-w-md rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950">
            <div className="flex gap-3">
              <TriangleAlert size={22} className="shrink-0 mt-0.5 text-amber-700" />
              <div>
                <h2 className="mb-2 font-bold">SIMULACIÓN — no se realizará ningún cobro</h2>
                <p>No ingreses datos de tarjeta ni realices transferencias. Este flujo solo registra un pedido demo marcado como no pagado.</p>
                <p className="mt-2">El pedido no reserva ni descuenta inventario y no puede ser preparado ni despachado.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleDemoSubmit()}
              disabled={isProcessing}
              className="mt-5 w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all"
            >
              {isProcessing ? 'Simulando...' : 'Registrar pedido de demostración'}
            </button>
          </section>
        ) : (
          <section role="status" className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="mb-2 font-semibold">
              {isNequi ? 'Simulación con Nequi no disponible' : 'Pago con tarjeta no disponible'}
            </h2>
            <p>
              {paymentMode === 'error'
                ? 'No fue posible verificar el modo de pago. Los métodos electrónicos permanecen desactivados.'
                : isNequi
                  ? 'No envíes transferencias ni comprobantes. El servidor no tiene habilitada la simulación.'
                  : 'No ingreses datos de tarjeta. El servidor no tiene habilitada la simulación ni una pasarela real.'}
            </p>
            <p className="mt-3">Puedes volver y elegir efectivo contra entrega.</p>
          </section>
        )}
      </div>
    </div>
  );
}
