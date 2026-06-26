import { CreditCard, Smartphone, CheckCircle2 } from 'lucide-react';
import type { PaymentMethodType } from '../../../models';

interface PaymentOptionsProps {
  selectedMethod: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
}

export function PaymentOptions({ selectedMethod, onSelect }: PaymentOptionsProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Selecciona un método de pago:</p>

      <button
        onClick={() => onSelect('card')}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
          selectedMethod === 'card'
            ? 'border-[#FBC02D] bg-[#FBC02D]/5 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedMethod === 'card' ? 'bg-[#FBC02D]' : 'bg-gray-100'}`}>
              <CreditCard size={26} className={selectedMethod === 'card' ? 'text-white' : 'text-gray-500'} />
            </div>
            <div>
              <h3 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Tarjeta de crédito / débito</h3>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: '0.85rem' }}>Visa, Mastercard, American Express</p>
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
        onClick={() => onSelect('nequi')}
        className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
          selectedMethod === 'nequi'
            ? 'border-[#FBC02D] bg-[#FBC02D]/5 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedMethod === 'nequi' ? 'bg-[#FBC02D]' : 'bg-gray-100'}`}>
              <Smartphone size={26} className={selectedMethod === 'nequi' ? 'text-white' : 'text-gray-500'} />
            </div>
            <div>
              <h3 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Nequi</h3>
              <p className="text-gray-400 mt-0.5" style={{ fontSize: '0.85rem' }}>Paga con tu cuenta Nequi</p>
              <div className="mt-2">
                <span className="px-2 py-0.5 rounded font-bold text-white" style={{ fontSize: '0.65rem', background: '#7B2FBE' }}>NEQUI</span>
              </div>
            </div>
          </div>
          {selectedMethod === 'nequi' && <CheckCircle2 size={24} className="text-[#FBC02D] shrink-0" />}
        </div>
      </button>

      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <p className="text-[#212121] font-medium" style={{ fontSize: '0.875rem' }}>Pago 100% seguro</p>
          <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>Tus datos están protegidos con encriptación SSL de 256 bits</p>
        </div>
      </div>
    </div>
  );
}
