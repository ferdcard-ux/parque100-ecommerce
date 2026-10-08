/**
 * @fileoverview Modal de cancelacion de pedido con motivo obligatorio.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { CANCEL_REASONS, CANCEL_REFUND_NOTICE } from '../../../utils/constants';

const CUSTOM_OPTION = 'Otro motivo';

interface CancelOrderModalProps {
  /** Identificador del pedido a cancelar. */
  orderId: number;
  /** true mientras se procesa la cancelacion. */
  saving: boolean;
  /** Error de la ultima tentativa (opcional). */
  error: string | null;
  /** Cierra el modal sin cancelar. */
  onClose: () => void;
  /** Confirma la cancelacion con el motivo elegido. */
  onConfirm: (motivo: string) => void;
  /** Lista de motivos a mostrar (por defecto los del cliente). */
  reasons?: readonly string[];
}

/** Modal que exige motivo (lista o texto personalizado) y advierte del reembolso. */
export function CancelOrderModal({ orderId, saving, error, onClose, onConfirm, reasons = CANCEL_REASONS }: CancelOrderModalProps) {
  const [reason, setReason] = useState<string>(reasons[0]);
  const [custom, setCustom] = useState('');

  const isCustom = reason === CUSTOM_OPTION;
  const motivo = isCustom ? custom.trim() : reason;
  const valid = motivo.length > 0 && motivo.length <= 255;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#212121] font-bold" style={{ fontSize: '1rem' }}>Cancelar pedido #{orderId}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" aria-label="Cerrar">
            <X size={15} />
          </button>
        </div>
        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>{error}</div>}
        <p className="text-gray-500 mb-3" style={{ fontSize: '0.85rem' }}>Indica el motivo de la cancelación (obligatorio):</p>
        <div className="flex flex-col gap-2 mb-3">
          {[...reasons, CUSTOM_OPTION].map((r) => (
            <label key={r} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer transition-colors ${reason === r ? 'border-[#C62828] bg-[#C62828]/5' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                name="cancel-reason"
                checked={reason === r}
                onChange={() => setReason(r)}
                className="w-4 h-4 accent-[#C62828]"
              />
              <span className="text-[#212121]" style={{ fontSize: '0.85rem' }}>{r}</span>
            </label>
          ))}
        </div>
        {isCustom && (
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            maxLength={255}
            placeholder="Describe el motivo"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#C62828] mb-3"
            style={{ fontSize: '0.9rem' }}
          />
        )}
        <p className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 mb-4" style={{ fontSize: '0.8rem' }}>
          {CANCEL_REFUND_NOTICE}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-200 rounded-full py-2.5 hover:bg-gray-50 transition-colors" style={{ fontWeight: 600 }}>Volver</button>
          <button onClick={() => valid && onConfirm(motivo)} disabled={!valid || saving} className="flex-1 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full py-2.5 disabled:opacity-40 transition-colors" style={{ fontWeight: 600 }}>
            {saving ? 'Cancelando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
