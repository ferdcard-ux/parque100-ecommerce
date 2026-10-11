/**
 * @fileoverview Modal 2: formulario de calificacion de un producto.
 * Lado izquierdo con la info del producto y lado derecho con estrellas
 * (etiqueta dinamica), comentario y boton de envio. Sin multimedia.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { StarRating } from '../shared/star-rating';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ratingLabel, REVIEW_COMMENT_MAX, REVIEW_COMMENT_MIN } from '../../../utils/constants';

interface ReviewFormModalProps {
  /** Titulo del modal (crear o editar). */
  title: string;
  /** Imagen del producto. */
  productImage: string;
  /** Nombre del producto. */
  productName: string;
  /** Detalles del articulo (ej. cantidad). */
  productDetails: string;
  /** Estrellas iniciales (0 = sin seleccionar, edicion = valor previo). */
  initialStars?: number;
  /** Comentario inicial (edicion). */
  initialComment?: string;
  /** Texto del boton de envio. */
  submitLabel: string;
  /** true mientras se guarda. */
  saving: boolean;
  /** Error del servidor (opcional). */
  error: string | null;
  /** Cierra el modal. */
  onClose: () => void;
  /** Envia estrellas (1-5) y comentario. */
  onSubmit: (stars: number, comment: string) => void;
}

/** Formulario de resena: estrellas obligatorias, comentario opcional con minimo. */
export function ReviewFormModal({
  title,
  productImage,
  productName,
  productDetails,
  initialStars = 0,
  initialComment = '',
  submitLabel,
  saving,
  error,
  onClose,
  onSubmit,
}: ReviewFormModalProps) {
  const [stars, setStars] = useState(initialStars);
  const [hovered, setHovered] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment);
  const [warning, setWarning] = useState<string | null>(null);

  const shown = hovered ?? stars;
  const label = ratingLabel(shown);
  const commentLen = comment.trim().length;
  const commentTooShort = commentLen > 0 && commentLen < REVIEW_COMMENT_MIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1 || stars > 5) {
      setWarning('Debes escoger la cantidad de estrellas para el producto.');
      return;
    }
    if (commentTooShort) {
      setWarning(`Si escribes un comentario, usa al menos ${REVIEW_COMMENT_MIN} caracteres.`);
      return;
    }
    setWarning(null);
    onSubmit(stars, comment.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#212121] font-bold" style={{ fontSize: '1rem' }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
            aria-label="Cerrar"
          >
            <X size={15} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5">
          <div>
            <ImageWithFallback
              src={productImage}
              alt={productName}
              className="w-full h-32 object-cover rounded-xl"
            />
            <p className="text-[#212121] mt-2" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{productName}</p>
            <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{productDetails}</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[#212121] mb-1.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Calificación <span className="text-[#C62828]">*</span>
              </p>
              <div className="flex items-center gap-2">
                <StarRating
                  value={shown}
                  editable
                  onChange={(v) => { setStars(v); setWarning(null); }}
                  onHover={setHovered}
                  size={22}
                />
                {label && (
                  <span className="text-[#f57f17]" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{label}</span>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="review-comment" className="block text-[#212121] mb-1.5" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Comentario <span className="text-gray-400" style={{ fontWeight: 400 }}>(opcional)</span>
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, REVIEW_COMMENT_MAX))}
                placeholder="Comparte tu opinión del producto"
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#C62828] resize-none"
                style={{ fontSize: '0.85rem' }}
              />
              <p className="text-right text-gray-400 mt-1" style={{ fontSize: '0.72rem' }}>
                {comment.length}/{REVIEW_COMMENT_MAX}
              </p>
            </div>
            {warning && <p className="text-[#C62828]" style={{ fontSize: '0.8rem' }}>{warning}</p>}
            {error && <p className="text-[#C62828]" style={{ fontSize: '0.8rem' }}>{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 text-white rounded-full py-2.5 transition-colors"
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              {saving ? 'Guardando...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
