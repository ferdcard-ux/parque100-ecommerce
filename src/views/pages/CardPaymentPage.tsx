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

  const handleSubmit = async (data: CardPaymentData) => {
    await onPay(data);
    navigate('/payment-success');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CardForm total={total} isProcessing={isProcessing} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
