/**
 * @fileoverview Encabezado de pagina con boton de regreso.
 */
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

interface PageHeaderProps {
  /** Titulo principal. */
  title: string;
  /** Subtitulo explicativo (opcional). */
  subtitle?: string;
  /** Ruta del boton de regreso (opcional). */
  backTo?: string;
}

/** Encabezado estandar de las paginas de cuenta, tienda y admin. */
export function PageHeader({ title, subtitle, backTo }: PageHeaderProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {backTo && (
        <Link to={backTo} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0">
          <ArrowLeft size={18} className="text-[#212121]" />
        </Link>
      )}
      <div>
        <h1 className="text-[#212121]" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{title}</h1>
        {subtitle && <p className="text-gray-400" style={{ fontSize: '0.85rem' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
