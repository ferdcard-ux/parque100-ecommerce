import { useNavigate } from 'react-router';
import type { PaymentMethodType, PaymentModeState } from '../../models';
import { PaymentOptions } from '../components/checkout/PaymentOptions';
import { CheckoutSteps } from '../components/checkout/checkout-steps';
import { CheckoutSummary } from '../components/checkout/checkout-summary';
import { PageHeader } from '../components/shared/page-header';

interface PaymentMethodPageProps {
  selectedMethod: PaymentMethodType | null;
  paymentMode: PaymentModeState;
  onSelectMethod: (method: PaymentMethodType) => void;
  /** Unidades del carrito para el resumen superior. */
  itemCount: number;
  /** Total de la compra para el resumen superior. */
  total: number;
}

export function PaymentMethodPage({ selectedMethod, paymentMode, onSelectMethod, itemCount, total }: PaymentMethodPageProps) {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selectedMethod === 'cash') {
      navigate('/payment-card?method=cash');
      return;
    }
    if (paymentMode === 'demo' && (selectedMethod === 'card' || selectedMethod === 'nequi')) {
      navigate(`/payment-card?method=${selectedMethod}`);
    }
  };
  const canContinue = selectedMethod === 'cash'
    || (paymentMode === 'demo' && (selectedMethod === 'card' || selectedMethod === 'nequi'));

  return (
    <div className="min-h-screen bg-brand-surface pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CheckoutSteps current={3} />
        <CheckoutSummary itemCount={itemCount} total={total} />
        <PageHeader title="Método de pago" subtitle="¿Cómo quieres pagar?" backTo="/address" />
        <PaymentOptions selectedMethod={selectedMethod} paymentMode={paymentMode} onSelect={onSelectMethod} />

        <button onClick={handleContinue} disabled={!canContinue}
          className="mt-6 w-full py-3.5 rounded-xl bg-brand-red text-white font-semibold hover:bg-brand-red-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          style={{ fontSize: '1rem' }}
        >
          Continuar con el pago
        </button>
      </div>
    </div>
  );
}
