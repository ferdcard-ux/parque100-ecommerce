import type { InventoryStatus } from '../../../models';

interface AdminStatsProps {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  /** Filtro activo (null = todos). */
  value?: 'all' | InventoryStatus;
  /** Al clickear una tarjeta filtra los productos relacionados. */
  onSelect?: (status: 'all' | InventoryStatus) => void;
}

export function AdminStats({ total, inStock, lowStock, outOfStock, value = 'all', onSelect }: AdminStatsProps) {
  const stats: { key: 'all' | InventoryStatus; label: string; value: number; icon: string; color: string }[] = [
    { key: 'all', label: 'Total productos', value: total, icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { key: 'in_stock', label: 'En stock', value: inStock, icon: '✅', color: 'bg-green-50 text-green-600' },
    { key: 'low_stock', label: 'Bajo stock', value: lowStock, icon: '⚠️', color: 'bg-[#FBC02D]/10 text-[#f57f17]' },
    { key: 'out_of_stock', label: 'Sin stock', value: outOfStock, icon: '🚫', color: 'bg-[#C62828]/10 text-[#C62828]' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {stats.map((s) => {
        const isActive = value === s.key;
        return (
          <button
            key={s.label}
            onClick={() => onSelect?.(s.key)}
            aria-pressed={isActive}
            title={`Mostrar: ${s.label}`}
            className={`bg-white rounded-xl border px-2 py-2 flex items-center gap-2 text-left transition-all hover:shadow-md hover:border-[#C62828]/40 active:scale-[0.98] ${isActive ? 'border-[#C62828] ring-2 ring-[#C62828]/25 shadow-md' : 'border-gray-100'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
              <span style={{ fontSize: '1rem' }}>{s.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[#212121] font-bold leading-none truncate" style={{ fontSize: '1.15rem' }}>{s.value}</p>
              <p className="text-gray-400 truncate" style={{ fontSize: '0.68rem' }}>{s.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
