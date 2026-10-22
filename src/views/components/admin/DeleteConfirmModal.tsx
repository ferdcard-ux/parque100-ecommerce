import { useRef, type ReactNode } from 'react';
import { useDialogBehavior } from '../../../utils/useDialog';

interface DeleteConfirmModalProps {
  title: string;
  description: ReactNode;
  error?: string | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({
  title,
  description,
  error,
  busy = false,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(true, () => {
    if (!busy) onClose();
  }, panelRef);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
      >
        <h3 className="text-[#212121] font-bold mb-2">{title}</h3>
        <div className="text-gray-500 mb-6" style={{ fontSize: '0.9rem' }}>
          {description}
        </div>
        {error && (
          <p role="alert" className="text-red-600 mb-4" style={{ fontSize: '0.85rem' }}>
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            data-autofocus
            className="flex-1 border border-gray-200 rounded-full py-2.5 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            style={{ fontWeight: 600 }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-[#C62828] hover:bg-[#b71c1c] text-white rounded-full py-2.5 disabled:opacity-60 transition-colors"
            style={{ fontWeight: 600 }}
          >
            {busy ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}
