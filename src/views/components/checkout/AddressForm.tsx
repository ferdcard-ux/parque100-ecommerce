import { useState } from 'react';
import { User, Phone, Building, Hash, MapPin } from 'lucide-react';
import type { DeliveryAddress } from '../../../models';

interface AddressFormProps {
  onSubmit: (address: DeliveryAddress) => void;
}

export function AddressForm({ onSubmit }: AddressFormProps) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    tower: '',
    floor: '',
    apartment: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100 shadow-sm flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FBC02D22, #C6282822)' }}
        >
          <span style={{ fontSize: '2.5rem' }}>📍</span>
        </div>
        <div>
          <h3 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Ingresa tu dirección</h3>
          <p className="text-gray-500 mt-1" style={{ fontSize: '0.875rem' }}>
            Ingresa la torre, piso y apartamento donde deseas recibir tu pedido.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-1 h-6 rounded-full bg-[#FBC02D]" />
          <h2 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Datos del destinatario</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Nombre *</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="firstName" required value={form.firstName} onChange={handleChange} placeholder="Tu nombre" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
          <div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Apellido *</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="lastName" required value={form.lastName} onChange={handleChange} placeholder="Tu apellido" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Teléfono *</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" name="phone" required value={form.phone} onChange={handleChange} placeholder="300 000 0000" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]" style={{ fontSize: '0.9rem' }} />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 mt-6">
          <div className="w-1 h-6 rounded-full bg-[#FBC02D]" />
          <h2 className="text-[#212121] font-semibold" style={{ fontSize: '1rem' }}>Ubicación en el conjunto</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Torre / Bloque *</label>
            <div className="relative">
              <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="tower" required value={form.tower} onChange={handleChange} placeholder="Torre 1" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
          <div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Piso *</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="floor" required value={form.floor} onChange={handleChange} placeholder="Piso 4" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
          <div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Apartamento *</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="apartment" required value={form.apartment} onChange={handleChange} placeholder="Apto 401" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]" style={{ fontSize: '0.9rem' }} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Notas adicionales (opcional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Indicaciones especiales para el domiciliario..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121] resize-none"
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-[#C62828] text-white font-semibold hover:bg-[#b71c1c] transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          style={{ fontSize: '1rem' }}
        >
          Guardar dirección y continuar
        </button>
      </div>
    </form>
  );
}
