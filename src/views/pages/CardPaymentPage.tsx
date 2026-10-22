/**
 * @fileoverview Checkout en efectivo o flujo academico de pago DEMO.
 * Los metodos electronicos no solicitan datos ni se conectan a proveedores.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { CheckCircle2, ReceiptText, TriangleAlert } from 'lucide-react';
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
  onStartDemo: (method: Exclude<PaymentMethodType, 'cash'>) => Promise<string>;
  onCancelDemo: (reference: string) => Promise<void>;
  onPayDemo: (method: Exclude<PaymentMethodType, 'cash'>, reference: string) => Promise<void>;
}

export function CardPaymentPage({
  total,
  itemCount,
  isProcessing,
  paymentMode,
  onPayCash,
  onStartDemo,
  onCancelDemo,
  onPayDemo,
}: CardPaymentPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method');
  const isNequi = method === 'nequi';
  const isCash = method === 'cash';
  const isDemoMethod = method === 'card' || isNequi;
  const demoMethod: Exclude<PaymentMethodType, 'cash'> = isNequi ? 'nequi' : 'card';
  const [error, setError] = useState('');
  const [tendered, setTendered] = useState('');
  const [simulationId, setSimulationId] = useState<string | null>(null);
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

  const handleStartDemo = async () => {
    setError('');
    if (paymentMode !== 'demo' || !isDemoMethod) {
      setError('La simulacion no esta habilitada en este servidor.');
      return;
    }
    try {
      setSimulationId(await onStartDemo(demoMethod));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar la simulacion.');
    }
  };

  const handleConfirmDemo = async () => {
    setError('');
    if (!simulationId) {
      setError('Inicia la simulacion antes de confirmar.');
      return;
    }
    try {
      await onPayDemo(demoMethod, simulationId);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible completar la simulacion.');
    }
  };

  const handleCancelDemo = async () => {
    if (!simulationId) return;
    setError('');
    try {
      await onCancelDemo(simulationId);
      setSimulationId(null);
      navigate('/payment-method');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cancelar la simulacion.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CheckoutSteps current={3} />
        <CheckoutSummary itemCount={itemCount} total={total} />
        <PageHeader
          title={isNequi ? 'Simulacion de Nequi DEMO' : isCash ? 'Pago en efectivo' : 'Simulacion con tarjeta DEMO'}
          subtitle={`${isDemoMethod ? 'Total de referencia' : 'Total a pagar'}: ${formatPrice(total)}`}
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
                Pagas al recibir el pedido. Indica con que billete pagaras.
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
              title="Maximo 6 digitos"
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
          <section className="mx-auto max-w-xl rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950">
            <div className="flex gap-3 mb-5">
              <TriangleAlert size={22} className="shrink-0 mt-0.5 text-amber-700" />
              <div>
                <h2 className="mb-2 font-bold">SIMULACION ACADEMICA — sin cobros ni proveedores reales</h2>
                <p>No ingreses datos de tarjeta, claves, codigos, cuentas bancarias ni comprobantes. No abras otra aplicacion ni realices transferencias.</p>
                <p className="mt-2">Al confirmar, el sistema guardara una transaccion ficticia y un pedido DEMO. El stock y los estados del pedido se actualizaran localmente en la base de datos.</p>
              </div>
            </div>

            <ol className="flex flex-col gap-3 mb-5">
              <li className="flex items-start gap-3 rounded-xl bg-white/80 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C62828] text-white text-sm font-bold">1</span>
                <span><strong>Inicia el flujo.</strong> Se registra un intento DEMO sin importe cobrado ni datos financieros.</span>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-white/80 p-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${simulationId ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {simulationId ? <CheckCircle2 size={17} /> : '2'}
                </span>
                <span><strong>Revisa la confirmacion ficticia.</strong> No se conecta con {isNequi ? 'Nequi' : 'una entidad financiera'}.</span>
              </li>
              <li className="flex items-start gap-3 rounded-xl bg-white/80 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-sm font-bold">3</span>
                <span><strong>Confirma.</strong> El pedido, la referencia DEMO y el descuento de inventario se guardan juntos.</span>
              </li>
            </ol>

            {!simulationId ? (
              <button
                type="button"
                onClick={() => void handleStartDemo()}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all"
              >
                {isProcessing ? 'Iniciando...' : `1. Iniciar ${isNequi ? 'Nequi' : 'tarjeta'} DEMO`}
              </button>
            ) : (
              <div className="rounded-xl border border-amber-300 bg-white p-4">
                <p className="text-sm font-semibold text-[#212121]">Referencia ficticia</p>
                <p className="mt-1 break-all font-mono text-sm text-[#C62828]">{simulationId}</p>
                <p className="mt-3 text-sm">
                  {isNequi
                    ? 'Destino de prueba: CUENTA-NEQUI-DEMO. No uses un telefono real ni hagas una transferencia.'
                    : 'Autorizacion de prueba: TARJETA-DEMO. No se solicita ni se procesa numero, vencimiento o CVV.'}
                </p>
                <p className="mt-3 text-sm font-semibold">Importe de referencia: {formatPrice(total)} — no se cobrara.</p>
                <button
                  type="button"
                  onClick={() => void handleConfirmDemo()}
                  disabled={isProcessing}
                  className="mt-4 w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all"
                >
                  {isProcessing ? 'Confirmando...' : `3. Simular ${isNequi ? 'transferencia' : 'autorizacion'} y crear pedido`}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancelDemo()}
                  disabled={isProcessing}
                  className="mt-2 w-full py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancelar simulacion
                </button>
              </div>
            )}
          </section>
        ) : (
          <section role="status" className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <h2 className="mb-2 font-semibold">
              {isNequi ? 'Simulacion con Nequi no disponible' : 'Pago con tarjeta no disponible'}
            </h2>
            <p>
              {paymentMode === 'error'
                ? 'No fue posible verificar el modo de pago. Los metodos electronicos permanecen desactivados.'
                : isNequi
                  ? 'No envies transferencias ni comprobantes. El servidor no tiene habilitada la simulacion.'
                  : 'No ingreses datos de tarjeta. El servidor no tiene habilitada la simulacion ni una pasarela real.'}
            </p>
            <p className="mt-3">Puedes volver y elegir efectivo contra entrega.</p>
          </section>
        )}
      </div>
    </div>
  );
}
