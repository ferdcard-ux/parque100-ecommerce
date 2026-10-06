/**
 * @fileoverview Indicador de progreso del pedido.
 */
import { Check } from 'lucide-react';
import { ORDER_TRACKER_STEPS, orderStatusMeta } from '../../../utils/constants';

interface OrderTrackerProps {
  /** Estado actual del pedido. */
  estado: string;
  /** Variante compacta (sin etiquetas) para el admin. */
  compact?: boolean;
}

/** Tracker de pasos del pedido: completados, activo y pendientes. */
export function OrderTracker({ estado, compact = false }: OrderTrackerProps) {
  const activeStep = orderStatusMeta(estado).step;
  return (
    <div className="flex items-center w-full">
      {ORDER_TRACKER_STEPS.map((label, index) => {
        const done = index < activeStep;
        const active = index === activeStep;
        return (
          <div key={label} className="flex-1 flex flex-col items-center relative">
            {index > 0 && (
              <span className={`absolute top-3.5 right-1/2 w-full h-0.5 ${done || active ? 'bg-[#22C55E]' : 'bg-gray-200'}`} />
            )}
            <span
              className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                done
                  ? 'bg-[#22C55E] border-[#22C55E] text-white'
                  : active
                    ? 'bg-white border-[#22C55E] text-[#22C55E]'
                    : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {done ? <Check size={14} /> : <span className="w-2 h-2 rounded-full bg-current" />}
            </span>
            {!compact && (
              <span className={`mt-2 text-center ${active ? 'text-[#212121] font-semibold' : 'text-gray-400'}`} style={{ fontSize: '0.65rem' }}>
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
