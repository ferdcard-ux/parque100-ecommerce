/**
 * @fileoverview Configuracion del panel admin y datos del negocio.
 * Preferencias locales (localStorage) + ficha del negocio (backend).
 */
import { useEffect, useState } from 'react';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { ProductImageInput } from '../components/admin/ProductImageInput';
import { useBusinessController } from '../../controllers';

const STORAGE_KEY = 'parque100-admin-config';

interface AdminConfig {
  notifyLowStock: boolean;
  notifyPending: boolean;
  compactLists: boolean;
}

const DEFAULT_CONFIG: AdminConfig = { notifyLowStock: true, notifyPending: true, compactLists: false };

function loadConfig(): AdminConfig {
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Configuracion del panel y edicion de datos del negocio. */
export function AdminSettingsPage() {
  const [config, setConfig] = useState<AdminConfig>(loadConfig);
  const [saved, setSaved] = useState(false);
  const { business, isLoading, error, isSaving, saveError, reload, save } = useBusinessController();
  const [form, setForm] = useState({ Nombre: '', NIT: '', Direccion: '', Telefono: '', Email: '', Horario: '', Descripcion: '', Imagen_QR: '' });
  const [businessSaved, setBusinessSaved] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        Nombre: business.Nombre ?? '',
        NIT: business.NIT ?? '',
        Direccion: business.Direccion ?? '',
        Telefono: business.Telefono ?? '',
        Email: business.Email ?? '',
        Horario: business.Horario ?? '',
        Descripcion: business.Descripcion ?? '',
        Imagen_QR: business.Imagen_QR ?? '',
      });
    }
  }, [business]);

  const toggle = (key: keyof AdminConfig) => setConfig((c) => ({ ...c, [key]: !c[key] }));

  const savePrefs = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // El telefono del negocio debe tener exactamente 10 digitos.
    const nextValue = name === 'Telefono' ? value.replace(/\D/g, '').slice(0, 10) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setBusinessSaved(false);
  };

  const phoneValid = /^\d{10}$/.test(form.Telefono);

  const saveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid) return;
    try {
      await save({
        Nombre: form.Nombre.trim(),
        NIT: form.NIT.trim(),
        Direccion: form.Direccion.trim(),
        Telefono: form.Telefono.trim(),
        Email: form.Email.trim(),
        Horario: form.Horario.trim(),
        Descripcion: form.Descripcion.trim(),
        Imagen_QR: form.Imagen_QR.trim(),
      });
      setBusinessSaved(true);
      setTimeout(() => setBusinessSaved(false), 2500);
    } catch {
      /* el error se muestra desde saveError */
    }
  };

  const options: { key: keyof AdminConfig; label: string }[] = [
    { key: 'notifyLowStock', label: 'Notificar bajo stock' },
    { key: 'notifyPending', label: 'Notificar pedidos pendientes' },
    { key: 'compactLists', label: 'Listas compactas' },
  ];

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-[#212121] focus:outline-none focus:border-[#C62828]';

  return (
    <AdminPageShell active="configuracion" title="Configuración" subtitle="Datos del negocio y preferencias del panel">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl mb-4">
        <h2 className="text-[#212121] font-bold mb-1" style={{ fontSize: '1rem' }}>Datos del negocio</h2>
        <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>Se muestran en la tienda y se comparten con el equipo vía la BD.</p>
        {isLoading ? (
          <p className="text-gray-400 py-6 text-center">Cargando datos del negocio...</p>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-[#C62828] mb-3" style={{ fontSize: '0.85rem' }}>{error}</p>
            <button onClick={reload} className="border border-gray-200 rounded-full px-5 py-2 hover:bg-gray-50" style={{ fontSize: '0.8rem' }}>
              Reintentar
            </button>
          </div>
        ) : (
          <form onSubmit={saveBusiness} className="flex flex-col gap-3">
            <label className="block">
              <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre *</span>
              <input name="Nombre" value={form.Nombre} onChange={handleBusinessChange} required maxLength={80} className={inputClass} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>NIT</span>
                <input name="NIT" value={form.NIT} onChange={handleBusinessChange} maxLength={30} pattern="[0-9-]{0,30}" title="Usa solo números y guiones" className={inputClass} />
              </label>
              <label className="block">
                <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Teléfono *</span>
                <input
                  name="Telefono"
                  value={form.Telefono}
                  onChange={handleBusinessChange}
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  title="Ingresa un número de teléfono de 10 dígitos"
                  placeholder="Ej. 3001234567"
                  aria-invalid={!phoneValid}
                  className={inputClass}
                />
                <span
                  className={`block mt-1 ${phoneValid ? 'text-gray-400' : 'text-[#C62828]'}`}
                  style={{ fontSize: '0.72rem' }}
                >
                  {phoneValid
                    ? '10 dígitos, solo números.'
                    : form.Telefono.length === 0
                      ? 'Debe tener exactamente 10 dígitos.'
                      : `Faltan ${10 - form.Telefono.length} dígito(s) para completar los 10.`}
                </span>
              </label>
            </div>
            <label className="block">
              <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Dirección *</span>
              <input name="Direccion" value={form.Direccion} onChange={handleBusinessChange} required maxLength={120} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Correo *</span>
              <input name="Email" type="email" autoComplete="email" value={form.Email} onChange={handleBusinessChange} required maxLength={80} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Horario de atención *</span>
              <input name="Horario" value={form.Horario} onChange={handleBusinessChange} required maxLength={80} placeholder="Lun–Sáb 8:00–18:00" className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-[#212121] mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Descripción *</span>
              <textarea name="Descripcion" value={form.Descripcion} onChange={handleBusinessChange} required maxLength={255} rows={2} className={inputClass} />
            </label>
            <div className="border-t border-gray-100 pt-3 mt-1">
              <h3 className="text-[#212121] font-bold mb-1" style={{ fontSize: '0.9rem' }}>QR de pago (Nequi)</h3>
              <p className="text-gray-400 mb-3" style={{ fontSize: '0.78rem' }}>
                Sube la imagen del QR que verán los clientes al pagar con Nequi. Si no hay imagen, se muestra un marcador.
              </p>
              <ProductImageInput
                value={form.Imagen_QR}
                onChange={(value) => {
                  setForm((prev) => ({ ...prev, Imagen_QR: value }));
                  setBusinessSaved(false);
                }}
                label="Imagen del QR"
                hint="(PNG/JPG o URL, máx. 2 MB, opcional)"
                previewAlt="Vista previa del QR de pago"
                placeholder="https://ejemplo.com/qr.png"
                previewClassName="object-contain p-3"
              />
            </div>
            {saveError && <p className="text-[#C62828]" style={{ fontSize: '0.8rem' }}>{saveError}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving || !phoneValid}
                className="bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 text-white rounded-full px-6 py-2.5 transition-colors"
                style={{ fontWeight: 600 }}
              >
                {isSaving ? 'Guardando...' : 'Guardar negocio'}
              </button>
              {businessSaved && <span className="text-green-600" style={{ fontSize: '0.85rem' }}>Guardado.</span>}
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl">
        <h2 className="text-[#212121] font-bold mb-2" style={{ fontSize: '1rem' }}>Preferencias del panel</h2>
        {options.map((opt) => (
          <label key={opt.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer">
            <span className="text-[#212121]" style={{ fontSize: '0.9rem' }}>{opt.label}</span>
            <input type="checkbox" checked={config[opt.key]} onChange={() => toggle(opt.key)} className="w-4 h-4 accent-[#C62828]" />
          </label>
        ))}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={savePrefs} className="bg-[#212121] hover:bg-black text-white rounded-full px-6 py-2.5 transition-colors" style={{ fontWeight: 600 }}>
            Guardar preferencias
          </button>
          {saved && <span className="text-green-600" style={{ fontSize: '0.85rem' }}>Guardado.</span>}
        </div>
      </div>
    </AdminPageShell>
  );
}
