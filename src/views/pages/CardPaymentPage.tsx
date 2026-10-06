import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import type { CardPaymentData, CartItem } from '../../models';
import { CardForm } from '../components/checkout/CardForm';

interface CardPaymentPageProps {
  total: number;
  isProcessing: boolean;
  onPay: (data: CardPaymentData) => Promise<void>;
  onPayNequi: (phone: string) => Promise<void>;
}

export function CardPaymentPage({ total, isProcessing, onPay, onPayNequi }: CardPaymentPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const isNequi = searchParams.get('method') === 'nequi';
  const [phone, setPhone] = useState('');

  const handleSubmit = async (data: CardPaymentData) => {
    setError('');
    try {
      await onPay(data);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el pedido.');
    }
  };

  const handleNequiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Ingresa un numero de telefono valido (10 digitos).');
      return;
    }
    try {
      await onPayNequi(phone);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el pedido.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        {isNequi ? (
          <form onSubmit={handleNequiSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md mx-auto">
            <h2 className="text-[#212121] font-bold mb-2" style={{ fontSize: '1.2rem' }}>Pago con Nequi</h2>
            <p className="text-gray-400 mb-6" style={{ fontSize: '0.85rem' }}>Total a pagar: ${total.toLocaleString('es-CO')}</p>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Telefono Nequi</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="3001234567"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] mb-6"
            />
            <button type="submit" disabled={isProcessing} className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all" style={{ fontSize: '1rem' }}>
              {isProcessing ? 'Procesando...' : 'Confirmar pago'}
            </button>
          </form>
        ) : (
          <CardForm total={total} isProcessing={isProcessing} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
