import { useNavigate } from 'react-router';
import type { PaymentMethodType } from '../../models';
import { PaymentOptions } from '../components/checkout/PaymentOptions';

interface PaymentMethodPageProps {
  selectedMethod: PaymentMethodType | null;
  onSelectMethod: (method: PaymentMethodType) => void;
}

export function PaymentMethodPage({ selectedMethod, onSelectMethod }: PaymentMethodPageProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selectedMethod) return;
    navigate('/payment-card');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PaymentOptions selectedMethod={selectedMethod} onSelect={onSelectMethod} />

        <button onClick={handleContinue} disabled={!selectedMethod}
          className="mt-6 w-full py-3.5 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          style={{ fontSize: '1rem' }}
        >
          Continuar con el pago
        </button>
      </div>
    </div>
  );
}
