import { CreditCard, Smartphone, Banknote, CheckCircle2 } from 'lucide-react';
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
        ? 'SIMULACIÓN DEMO — sin cobro ni datos financieros'
        : 'Temporalmente no disponible';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Selecciona un método de pago:</p>

      <button
        type="button"
        onClick={() => onSelect('card')}
        disabled={!demoEnabled}
        aria-pressed={selectedMethod === 'card'}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          selectedMethod === 'card' ? 'border-[#FBC02D] bg-[#FBC02D]/5 shadow-md' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100">
              <CreditCard size={26} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Tarjeta de crédito / débito</h3>
              <p className={`mt-0.5 ${demoEnabled ? 'text-amber-800 font-semibold' : 'text-gray-500'}`} style={{ fontSize: '0.85rem' }}>{modeLabel}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded" style={{ fontSize: '0.65rem', fontWeight: 700 }}>VISA</span>
                <span className="px-2 py-0.5 bg-red-600 text-white rounded" style={{ fontSize: '0.65rem', fontWeight: 700 }}>MC</span>
                <span className="px-2 py-0.5 bg-blue-900 text-white rounded" style={{ fontSize: '0.65rem', fontWeight: 700 }}>AMEX</span>
              </div>
            </div>
          </div>
          {selectedMethod === 'card' && <CheckCircle2 size={24} className="text-[#FBC02D] shrink-0" />}
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('nequi')}
        disabled={!demoEnabled}
        aria-pressed={selectedMethod === 'nequi'}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          selectedMethod === 'nequi' ? 'border-[#FBC02D] bg-[#FBC02D]/5 shadow-md' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100">
              <Smartphone size={26} className="text-gray-500" />
            </div>
            <div>
              <h3 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Nequi</h3>
              <p className={`mt-0.5 ${demoEnabled ? 'text-amber-800 font-semibold' : 'text-gray-500'}`} style={{ fontSize: '0.85rem' }}>{modeLabel}</p>
              <div className="mt-2">
                <span className="px-2 py-0.5 rounded font-bold text-white" style={{ fontSize: '0.65rem', background: '#7B2FBE' }}>NEQUI</span>
              </div>
            </div>
          </div>
          {selectedMethod === 'nequi' && <CheckCircle2 size={24} className="text-[#FBC02D] shrink-0" />}
        </div>
      </button>

      <button
        onClick={() => onSelect('cash')}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
          selectedMethod === 'cash'
            ? 'border-[#FBC02D] bg-[#FBC02D]/5 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedMethod === 'cash' ? 'bg-[#FBC02D]' : 'bg-gray-100'}`}>
              <Banknote size={26} className={selectedMethod === 'cash' ? 'text-white' : 'text-gray-500'} />
            </div>
            <div>
              <h3 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Efectivo contra entrega</h3>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: '0.85rem' }}>Pagas al recibir; llevamos tu cambio</p>
            </div>
          </div>
          {selectedMethod === 'cash' && <CheckCircle2 size={24} className="text-[#FBC02D] shrink-0" />}
        </div>
      </button>

      <div role={demoEnabled || paymentMode === 'error' ? 'alert' : undefined} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <p className="text-[#212121] font-medium" style={{ fontSize: '0.875rem' }}>
            {demoEnabled ? 'Pagos electrónicos solo en modo demo' : 'Pago contra entrega'}
          </p>
          <p className="text-gray-500" style={{ fontSize: '0.8rem' }}>
            {demoEnabled
              ? 'La simulación no cobra ni reserva inventario. No ingreses ni envíes datos de tarjeta o transferencias.'
              : paymentMode === 'error'
                ? 'La verificación del modo de pago falló. Solo está disponible el efectivo contra entrega.'
                : 'Los pagos electrónicos requieren una pasarela verificada; por ahora solo está disponible el efectivo contra entrega.'}
          </p>
        </div>
      </div>
    </div>
  );
}
