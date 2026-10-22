import { useEffect, useState } from 'react';
import { User, Phone, Building, Hash, MapPin } from 'lucide-react';
import type { DeliveryAddress } from '../../../models';

interface AddressFormProps {
  initialAddress: DeliveryAddress;
  lockRecipient: boolean;
  isSaving: boolean;
  onSubmit: (address: DeliveryAddress) => Promise<void>;
  /** Texto del boton de envio. */
  submitLabel?: string;
}

export function AddressForm({ initialAddress, lockRecipient, isSaving, onSubmit, submitLabel = 'Guardar dirección y continuar' }: AddressFormProps) {
  const [form, setForm] = useState<DeliveryAddress>(initialAddress);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialAddress);
    setValidationError(null);
  }, [initialAddress]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: raw } = e.target;
    const value = name === 'phone'
      ? raw.replace(/\D/g, '').slice(0, 10)
      : name === 'tower' || name === 'floor' || name === 'apartment'
        ? raw.replace(/\D/g, '').slice(0, 20)
        : raw;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
    if (validationError && e.target.name === 'phone' && value.length === 10) {
      setValidationError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (`${form.firstName.trim()} ${form.lastName.trim()}`.trim().length > 50) {
      setValidationError('El nombre del destinatario no puede superar 50 caracteres.');
      return;
    }
    if (form.phone.length !== 10) {
      setValidationError('Ingresa un número de 10 dígitos.');
      return;
    }
    setValidationError(null);
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100 shadow-sm flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--brand-yellow-soft), var(--brand-red-soft))' }}
        >
          <MapPin size={38} strokeWidth={1.6} className="text-brand-red" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Ingresa tu dirección</h3>
          <p className="text-gray-500 mt-1" style={{ fontSize: '0.875rem' }}>
            Ingresa la torre, piso y apartamento donde deseas recibir tu pedido.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 rounded-full bg-brand-yellow" />
          <h2 className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Datos del destinatario</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Nombre *</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="firstName" required maxLength={50} autoComplete="given-name" readOnly={lockRecipient} value={form.firstName} onChange={handleChange} placeholder="Tu nombre" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
          <div>
            <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Apellido *</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="lastName" required maxLength={50} autoComplete="family-name" readOnly={lockRecipient} value={form.lastName} onChange={handleChange} placeholder="Tu apellido" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Teléfono *</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" name="phone" autoComplete="tel" inputMode="numeric" required minLength={10} maxLength={10} pattern="[0-9]{10}" title="Ingresa un número de 10 dígitos" aria-invalid={validationError !== null} aria-describedby={validationError ? 'address-validation-error' : undefined} value={form.phone} onChange={handleChange} placeholder="300 000 0000" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink" style={{ fontSize: '0.9rem' }} />
          </div>
          {validationError && <p id="address-validation-error" role="alert" className="text-brand-red mt-1.5" style={{ fontSize: '0.8rem' }}>{validationError}</p>}
        </div>

        <div className="flex items-center gap-2 mb-4 mt-6">
          <div className="w-1 h-6 rounded-full bg-brand-yellow" />
          <h2 className="text-brand-ink font-semibold" style={{ fontSize: '1rem' }}>Ubicación en el conjunto</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Torre / Bloque *</label>
            <div className="relative">
              <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="tower" required maxLength={20} inputMode="numeric" pattern="[0-9]{1,20}" title="Ingresa solo números (máximo 20 dígitos)" value={form.tower} onChange={handleChange} placeholder="1" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
          <div>
            <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Piso *</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="floor" required maxLength={20} inputMode="numeric" pattern="[0-9]{1,20}" title="Ingresa solo números (máximo 20 dígitos)" value={form.floor} onChange={handleChange} placeholder="4" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
          <div>
            <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Apartamento *</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="apartment" required maxLength={20} inputMode="numeric" pattern="[0-9]{1,20}" title="Ingresa solo números (máximo 20 dígitos)" value={form.apartment} onChange={handleChange} placeholder="401" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-brand-ink mb-1.5" style={{ fontSize: '0.875rem' }}>Notas adicionales (opcional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            maxLength={500}
            rows={2}
            placeholder="Indicaciones especiales para el domiciliario..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-brand-surface focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 text-brand-ink resize-none"
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="w-full py-3.5 rounded-xl bg-brand-red text-white font-semibold hover:bg-brand-red-dark transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          style={{ fontSize: '1rem' }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
