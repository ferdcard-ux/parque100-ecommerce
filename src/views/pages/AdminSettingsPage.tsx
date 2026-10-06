/**
 * @fileoverview Configuracion basica del panel admin (localStorage).
 */
import { useState } from 'react';
import { AdminPageShell } from '../components/admin/AdminPageShell';

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

/** Preferencias del panel persistidas en localStorage. */
export function AdminSettingsPage() {
  const [config, setConfig] = useState<AdminConfig>(loadConfig);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof AdminConfig) => setConfig((c) => ({ ...c, [key]: !c[key] }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const options: { key: keyof AdminConfig; label: string }[] = [
    { key: 'notifyLowStock', label: 'Notificar bajo stock' },
    { key: 'notifyPending', label: 'Notificar pedidos pendientes' },
    { key: 'compactLists', label: 'Listas compactas' },
  ];

  return (
    <AdminPageShell active="configuracion" title="Configuración" subtitle="Preferencias del panel">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-xl">
        {options.map((opt) => (
          <label key={opt.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 cursor-pointer">
            <span className="text-[#212121]" style={{ fontSize: '0.9rem' }}>{opt.label}</span>
            <input type="checkbox" checked={config[opt.key]} onChange={() => toggle(opt.key)} className="w-4 h-4 accent-[#C62828]" />
          </label>
        ))}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={save} className="bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full px-6 py-2.5 transition-colors" style={{ fontWeight: 600 }}>
            Guardar
          </button>
          {saved && <span className="text-green-600" style={{ fontSize: '0.85rem' }}>Guardado.</span>}
        </div>
      </div>
    </AdminPageShell>
  );
}
