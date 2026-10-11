import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { DeliveryAddress, User, UserDeliveryDetails } from '../../models';
import { AddressForm } from '../components/checkout/AddressForm';
import { CheckoutSteps } from '../components/checkout/checkout-steps';
import { CheckoutSummary } from '../components/checkout/checkout-summary';
import { PageHeader } from '../components/shared/page-header';

interface AddressPageProps {
  user: User | null;
  deliveryDetails: UserDeliveryDetails | null;
  isLoadingProfile: boolean;
  isSaving: boolean;
  loadError: string | null;
  saveError: string | null;
  onRetryLoad: () => Promise<void>;
  onSaveDetails: (details: UserDeliveryDetails) => Promise<UserDeliveryDetails>;
  onAddressSubmit: (address: DeliveryAddress) => void;
  /** Unidades del carrito para el resumen superior. */
  itemCount: number;
  /** Total de la compra para el resumen superior. */
  total: number;
  /** 'checkout' sigue al metodo de pago; 'account' guarda y vuelve a Mi cuenta. */
  mode?: 'checkout' | 'account';
}

export function AddressPage({
  user,
  deliveryDetails,
  isLoadingProfile,
  isSaving,
  loadError,
  saveError,
  onRetryLoad,
  onSaveDetails,
  onAddressSubmit,
  itemCount,
  total,
  mode = 'checkout',
}: AddressPageProps) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const initialAddress = useMemo<DeliveryAddress>(() => ({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: deliveryDetails?.phone ?? '',
    tower: deliveryDetails?.tower ?? '',
    floor: deliveryDetails?.floor ?? '',
    apartment: deliveryDetails?.apartment ?? '',
    notes: '',
  }), [user?.firstName, user?.lastName, deliveryDetails]);

  const handleSubmit = async (address: DeliveryAddress) => {
    if (user) {
      try {
        await onSaveDetails({
          phone: address.phone,
          tower: address.tower,
          floor: address.floor,
          apartment: address.apartment,
        });
      } catch {
        return;
      }
    }
    if (mode === 'account') {
      setSaved(true);
      timer.current = window.setTimeout(() => navigate('/cuenta'), 1800);
      return;
    }
    onAddressSubmit(address);
    navigate('/payment-method');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {mode === 'checkout' && (
          <>
            <CheckoutSteps current={2} />
            <CheckoutSummary itemCount={itemCount} total={total} />
          </>
        )}
        {mode === 'checkout' ? (
          <PageHeader title="Dirección de entrega" subtitle="¿Dónde enviamos tu pedido?" backTo="/cart" />
        ) : (
          <PageHeader title="Mi dirección" subtitle="Actualiza tu dirección de entrega" backTo="/cuenta" />
        )}
        {isLoadingProfile ? (
          <p role="status" className="text-center text-gray-600">Cargando datos de entrega...</p>
        ) : loadError && user ? (
          <div role="alert" className="text-center text-[#C62828]">
            <p>{loadError}</p>
            <button type="button" onClick={() => void onRetryLoad()} className="mt-3 underline">
              Reintentar
            </button>
          </div>
        ) : (
          <>
            <AddressForm
              initialAddress={initialAddress}
              lockRecipient={user !== null}
              isSaving={isSaving}
              submitLabel={mode === 'account' ? 'Guardar cambios' : undefined}
              onSubmit={handleSubmit}
            />
            {isSaving && <p role="status" className="mt-3 text-center text-gray-600">Guardando datos de entrega...</p>}
            {saveError && user && <p role="alert" className="mt-3 text-center text-[#C62828]">{saveError}</p>}
            {saved && (
              <p role="status" className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-center" style={{ fontSize: '0.85rem' }}>
                Cambios guardados correctamente. Volviendo a Mi cuenta…
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
