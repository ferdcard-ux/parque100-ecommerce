import { useState } from 'react';
import { CreditCard, Calendar, Lock, ShieldCheck } from 'lucide-react';
import type { CardPaymentData } from '../../../models';
import { formatPrice, formatCardNumber, formatExpiry, detectCardType } from '../../../utils';

interface CardFormProps {
  total: number;
  isProcessing: boolean;
  onSubmit: (data: CardPaymentData) => void;
}

export function CardForm({ total, isProcessing, onSubmit }: CardFormProps) {
  const [form, setForm] = useState({ cardNumber: '', holder: '', expiry: '', cvv: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') setForm((p) => ({ ...p, cardNumber: formatCardNumber(value) }));
    else if (name === 'expiry') setForm((p) => ({ ...p, expiry: formatExpiry(value) }));
    else if (name === 'cvv') setForm((p) => ({ ...p, cvv: value.replace(/\D/g, '').slice(0, 4) }));
    else setForm((p) => ({ ...p, [name]: value }));
  };

  const cardType = detectCardType(form.cardNumber);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <>
      <div
        className="relative w-full max-w-sm mx-auto mb-6 h-44 rounded-2xl overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_#ffffff44_0%,_transparent_60%)]" />
        <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
          <div className="w-9 h-7 bg-[#FBC02D] rounded-md opacity-90" />
          <div className="flex gap-1">
            {cardType === 'visa' && <span className="text-white font-black italic" style={{ fontSize: '1.1rem', letterSpacing: '-1px' }}>VISA</span>}
            {cardType === 'mastercard' && (
              <div className="flex">
                <div className="w-6 h-6 rounded-full bg-red-500 opacity-90" />
                <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-2.5" />
              </div>
            )}
            {cardType === 'unknown' && <CreditCard size={24} className="text-white/50" />}
          </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-white/60 mb-1 font-mono" style={{ fontSize: '0.7rem', letterSpacing: '2px' }}>NÚMERO DE TARJETA</p>
          <p className="text-white font-mono tracking-widest" style={{ fontSize: '1.05rem' }}>
            {form.cardNumber || '•••• •••• •••• ••••'}
          </p>
          <div className="flex justify-between items-end mt-3">
            <div>
              <p className="text-white/50" style={{ fontSize: '0.65rem' }}>TITULAR</p>
              <p className="text-white font-medium" style={{ fontSize: '0.85rem' }}>{form.holder || 'Nombre del titular'}</p>
            </div>
            <div className="text-right">
              <p className="text-white/50" style={{ fontSize: '0.65rem' }}>VENCE</p>
              <p className="text-white font-medium" style={{ fontSize: '0.85rem' }}>{form.expiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="mb-4">
          <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Número de tarjeta *</label>
          <div className="relative">
            <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" name="cardNumber" required value={form.cardNumber} onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] font-mono tracking-wider"
              style={{ fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Nombre del titular *</label>
          <input type="text" name="holder" required value={form.holder} onChange={handleChange} placeholder="Como aparece en la tarjeta"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] uppercase"
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Fecha de vencimiento *</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="expiry" required value={form.expiry} onChange={handleChange} placeholder="MM/AA"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] font-mono"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-[#212121] mb-1.5 flex items-center gap-1" style={{ fontSize: '0.875rem' }}>
              Código de seguridad (CVV) *
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="cvv" required value={form.cvv} onChange={handleChange} placeholder="123"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] font-mono tracking-widest"
                style={{ fontSize: '0.9rem' }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100 mb-6">
          <ShieldCheck size={18} className="text-green-600 shrink-0" />
          <p className="text-green-700" style={{ fontSize: '0.8rem' }}>
            Pago seguro con encriptación SSL. No almacenamos datos de tarjetas.
          </p>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full py-4 rounded-xl text-white font-bold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
          style={{ fontSize: '1.1rem' }}
        >
          {isProcessing ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Lock size={18} />
              Pagar {formatPrice(total)}
            </>
          )}
        </button>
      </form>
    </>
  );
}
