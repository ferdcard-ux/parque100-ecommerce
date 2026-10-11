/**
 * @fileoverview Etiqueta de estado de pedido.
 */
import { Clock, Package, Truck, CheckCircle2, XCircle } from 'lucide-react';
import { orderStatusMeta } from '../../../utils/constants';

interface StatusBadgeProps {
  /** Estado persistido del pedido. */
  estado: string;
}

/** Icono representativo por estado del pedido. */
const STATUS_ICONS: Record<string, typeof Clock> = {
  pendiente: Clock,
  preparando: Package,
  enviando: Truck,
  entregado: CheckCircle2,
  cancelado: XCircle,
};

/** Badge coloreado con icono segun el estado del pedido. */
export function StatusBadge({ estado }: StatusBadgeProps) {
  const meta = orderStatusMeta(estado);
  const Icon = STATUS_ICONS[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${meta.badgeClass}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
      {Icon && <Icon size={13} className="shrink-0" />}
      {meta.label}
    </span>
  );
}
