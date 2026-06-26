import { useNavigate } from 'react-router';
import type { DeliveryAddress } from '../../models';
import { AddressForm } from '../components/checkout/AddressForm';

interface AddressPageProps {
  onAddressSubmit: (address: DeliveryAddress) => void;
}

export function AddressPage({ onAddressSubmit }: AddressPageProps) {
  const navigate = useNavigate();

  const handleSubmit = (address: DeliveryAddress) => {
    onAddressSubmit(address);
    navigate('/payment-method');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AddressForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
