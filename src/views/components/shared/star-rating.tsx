/**
 * @fileoverview Selector y visualizacion de estrellas (1 a 5).
 */
import { Star } from 'lucide-react';

interface StarRatingProps {
  /** Valor actual (1 a 5, admite decimales en solo lectura). */
  value: number;
  /** Permite elegir el valor al hacer clic. */
  editable?: boolean;
  /** Llamado al elegir un valor (solo editable). */
  onChange?: (value: number) => void;
  /** Tamano del icono. */
  size?: number;
}

/** Estrellas de calificacion, editables o de solo lectura. */
export function StarRating({ value, editable = false, onChange, size = 18 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1" role={editable ? 'radiogroup' : 'img'} aria-label={`Calificacion ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = editable ? star <= Math.round(value) : star <= Math.round(value);
        return editable ? (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={Math.round(value) === star}
            aria-label={`${star} estrellas`}
            onClick={() => onChange?.(star)}
            className="p-0.5 hover:scale-110 transition-transform"
          >
            <Star size={size} className={filled ? 'fill-[#FBC02D] text-[#FBC02D]' : 'text-gray-300'} />
          </button>
        ) : (
          <Star key={star} size={size} className={filled ? 'fill-[#FBC02D] text-[#FBC02D]' : 'text-gray-300'} />
        );
      })}
    </div>
  );
}
