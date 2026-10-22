/**
 * @fileoverview Tarjeta de resena de producto.
 * Encabezado con avatar, nombre y fecha; lapiz de edicion solo para
 * el autor; estrellas con etiqueta destacada y cuerpo del comentario.
 */
import { Pencil } from 'lucide-react';
import type { Rating } from '../../../models';
import { ratingLabel } from '../../../utils/constants';
import { StarRating } from '../shared/star-rating';

interface ReviewCardProps {
  /** Resena a mostrar (incluye autor por join con usuario). */
  rating: Rating;
  /** true si la resena pertenece al usuario autenticado. */
  isOwn: boolean;
  /** Abre el modal de edicion (solo el autor). */
  onEdit: (rating: Rating) => void;
}

/** Iniciales para el avatar cuando el autor no tiene foto. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) ?? '' : '';
  return `${first}${last}`.toUpperCase() || 'U';
}

/** Fecha estilo "el 7 abr 2026". */
function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDate();
  const month = date
    .toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '')
    .toLowerCase();
  return `el ${day} ${month} ${date.getFullYear()}`;
}

/** Tarjeta de resena con la estructura de la pagina de detalle. */
export function ReviewCard({ rating, isOwn, onEdit }: ReviewCardProps) {
  const author = rating.Usuario_Nombre?.trim() || 'Usuario';
  const label = ratingLabel(rating.Estrellas);

  return (
    <li className="py-4 relative">
      <div className="flex items-center gap-3 mb-2">
        {rating.Usuario_Foto ? (
          <img
            src={rating.Usuario_Foto}
            alt={`Foto de ${author}`}
            className="w-9 h-9 rounded-full object-cover border border-gray-100"
          />
        ) : (
          <span className="w-9 h-9 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
            {initials(author)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-brand-ink truncate" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{author}</p>
          <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{formatReviewDate(rating.Fecha)}</p>
        </div>
        {isOwn && (
          <button
            type="button"
            onClick={() => onEdit(rating)}
            aria-label="Editar mi resena"
            title="Editar mi resena"
            className="absolute top-4 right-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-brand-red transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <StarRating value={rating.Estrellas} size={14} />
        {label && (
          <span className="text-brand-orange" style={{ fontSize: '0.8rem', fontWeight: 700 }}>{label}</span>
        )}
      </div>
      {rating.Comentario && (
        <p className="text-gray-600" style={{ fontSize: '0.85rem' }}>{rating.Comentario}</p>
      )}
    </li>
  );
}
