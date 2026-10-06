/**
 * @fileoverview Estado vacio generico.
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icono principal. */
  icon: LucideIcon;
  /** Titulo. */
  title: string;
  /** Descripcion. */
  description: string;
  /** Accion opcional (boton o enlace). */
  action?: ReactNode;
}

/** Bloque centrado para listas vacias. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-300" />
      </div>
      <h3 className="text-[#212121] mb-2" style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
      <p className="text-gray-400 mb-6 max-w-sm" style={{ fontSize: '0.85rem' }}>{description}</p>
      {action}
    </div>
  );
}
