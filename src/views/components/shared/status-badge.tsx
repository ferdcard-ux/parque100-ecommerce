/**
 * @fileoverview Etiqueta de estado de pedido.
 */
import { orderStatusMeta } from '../../../utils/constants';

interface StatusBadgeProps {
  /** Estado persistido del pedido. */
  estado: string;
}

/** Badge coloreado segun el estado del pedido. */
export function StatusBadge({ estado }: StatusBadgeProps) {
  const meta = orderStatusMeta(estado);
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border ${meta.badgeClass}`} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
      {meta.label}
    </span>
  );
}
