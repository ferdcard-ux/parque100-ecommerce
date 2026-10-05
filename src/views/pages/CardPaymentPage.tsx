import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { CardPaymentData, CartItem } from '../../models';
import { CardForm } from '../components/checkout/CardForm';

interface CardPaymentPageProps {
  total: number;
  isProcessing: boolean;
  onPay: (data: CardPaymentData) => Promise<void>;
}

export function CardPaymentPage({ total, isProcessing, onPay }: CardPaymentPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (data: CardPaymentData) => {
    setError('');
    try {
      await onPay(data);
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
        <CardForm total={total} isProcessing={isProcessing} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
