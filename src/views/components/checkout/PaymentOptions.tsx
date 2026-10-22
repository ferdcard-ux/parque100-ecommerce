import { CreditCard, Smartphone, Banknote, CheckCircle2, LockKeyhole } from 'lucide-react';
import type { PaymentMethodType, PaymentModeState } from '../../../models';

interface PaymentOptionsProps {
  selectedMethod: PaymentMethodType | null;
  paymentMode: PaymentModeState;
  onSelect: (method: PaymentMethodType) => void;
}

export function PaymentOptions({ selectedMethod, paymentMode, onSelect }: PaymentOptionsProps) {
  const demoEnabled = paymentMode === 'demo';
  const modeLabel = paymentMode === 'loading'
    ? 'Verificando disponibilidad...'
    : paymentMode === 'error'
      ? 'No se pudo verificar; pagos electrónicos desactivados'
      : demoEnabled
        ? 'SIMULACION DEMO — sin cobro ni datos financieros'
        : 'Temporalmente no disponible';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Selecciona un método de pago:</p>

      <button
        type="button"
        onClick={() => onSelect('card')}
        disabled={!demoEnabled}
        aria-pressed={selectedMethod === 'card'}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          selectedMethod === 'card' ? 'border-brand-yellow bg-brand-yellow/5 shadow-md' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100">
              <CreditCard size={26} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Tarjeta (simulacion academica)</h3>
              <p className={`mt-0.5 ${demoEnabled ? 'text-amber-800 font-semibold' : 'text-gray-500'}`} style={{ fontSize: '0.85rem' }}>{modeLabel}</p>
            </div>
          </div>
          {selectedMethod === 'card' && <CheckCircle2 size={24} className="text-brand-yellow shrink-0" />}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('nequi')}
        disabled={!demoEnabled}
        aria-pressed={selectedMethod === 'nequi'}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          selectedMethod === 'nequi' ? 'border-brand-yellow bg-brand-yellow/5 shadow-md' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100">
              <Smartphone size={26} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Nequi (simulacion academica)</h3>
              <p className={`mt-0.5 ${demoEnabled ? 'text-amber-800 font-semibold' : 'text-gray-500'}`} style={{ fontSize: '0.85rem' }}>{modeLabel}</p>
            </div>
          </div>
          {selectedMethod === 'nequi' && <CheckCircle2 size={24} className="text-brand-yellow shrink-0" />}
        </div>
      </button>

      <button
        onClick={() => onSelect('cash')}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
          selectedMethod === 'cash'
            ? 'border-brand-yellow bg-brand-yellow/5 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedMethod === 'cash' ? 'bg-brand-yellow' : 'bg-gray-100'}`}>
              <Banknote size={26} className={selectedMethod === 'cash' ? 'text-white' : 'text-gray-500'} />
            </div>
            <div>
              <h3 className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Efectivo contra entrega</h3>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: '0.85rem' }}>Pagas al recibir; llevamos tu cambio</p>
            </div>
          </div>
          {selectedMethod === 'cash' && <CheckCircle2 size={24} className="text-brand-yellow shrink-0" />}
        </div>
      </button>

      <div role={demoEnabled || paymentMode === 'error' ? 'alert' : undefined} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <LockKeyhole size={22} className="shrink-0 text-brand-red" aria-hidden="true" />
        <div>
          <p className="text-brand-ink font-medium" style={{ fontSize: '0.875rem' }}>
            {demoEnabled ? 'Pagos electronicos solo en modo DEMO' : 'Pago contra entrega'}
          </p>
          <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>
            {demoEnabled
              ? 'El flujo solo guarda datos ficticios: transaccion, pedido e inventario en la base academica. No es un cobro real; no ingreses datos financieros ni hagas transferencias.'
              : paymentMode === 'error'
                ? 'La verificación del modo de pago falló. Solo está disponible el efectivo contra entrega.'
                : 'Los pagos electronicos requieren una pasarela verificada; por ahora solo esta disponible el efectivo contra entrega.'}
          </p>
        </div>
      </div>
    </div>
  );
}
