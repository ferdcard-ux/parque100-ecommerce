/**
 * @fileoverview Titulo de seccion con barra amarilla lateral.
 */
import type { ReactNode } from 'react';

interface SectionTitleProps {
  /** Texto o nodos del titulo. */
  children: ReactNode;
}

/** Titulo de seccion con barra amarilla a la izquierda. */
export function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h2 className="flex items-center gap-2 text-brand-ink mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>
      <span className="w-1 h-5 rounded-full bg-brand-yellow" />
      {children}
    </h2>
  );
}
