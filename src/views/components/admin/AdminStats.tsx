import type { InventoryStatus } from '../../../models';
import { CircleCheck, CircleX, Package, TriangleAlert } from 'lucide-react';

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
  const stats = [
    { key: 'all' as const, label: 'Total productos', value: total, Icon: Package, color: 'bg-brand-yellow-soft text-brand-ink' },
    { key: 'in_stock' as const, label: 'En stock', value: inStock, Icon: CircleCheck, color: 'bg-brand-yellow-soft text-brand-red' },
    { key: 'low_stock' as const, label: 'Bajo stock', value: lowStock, Icon: TriangleAlert, color: 'bg-brand-yellow-soft text-brand-ink' },
    { key: 'out_of_stock' as const, label: 'Sin stock', value: outOfStock, Icon: CircleX, color: 'bg-brand-red-soft text-brand-red' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {stats.map(({ Icon, ...s }) => {
        const isActive = value === s.key;
        return (
          <button
            key={s.label}
            onClick={() => onSelect?.(s.key)}
            aria-pressed={isActive}
            title={`Mostrar: ${s.label}`}
            className={`bg-white rounded-xl border px-2 py-2 flex items-center gap-2 text-left transition-all hover:shadow-md hover:border-brand-red/40 active:scale-[0.98] ${isActive ? 'border-brand-red ring-2 ring-brand-red/25 shadow-md' : 'border-gray-100'}`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-current/10 ${s.color}`}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-brand-ink font-bold leading-none truncate" style={{ fontSize: '1.15rem' }}>{s.value}</p>
              <p className="text-gray-400 truncate" style={{ fontSize: '0.68rem' }}>{s.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
