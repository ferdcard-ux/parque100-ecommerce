import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { isValidHttpUrl } from '../../../utils/validators';

const MAX_BYTES = 2 * 1024 * 1024;

interface ProductImageInputProps {
  /** URL web o dataURL de la imagen actual. */
  value: string;
  /** Actualiza la imagen (URL o dataURL). */
  onChange: (value: string) => void;
  /** Etiqueta visible. Por defecto "Imagen". */
  label?: string;
  /** Texto de ayuda junto a la etiqueta. */
  hint?: string;
  /** Texto alternativo de la vista previa. */
  previewAlt?: string;
  /** Placeholder del campo de URL. */
  placeholder?: string;
  /** Clases de ajuste para la vista previa (por defecto object-cover). */
  previewClassName?: string;
}

/** Entrada de imagen reutilizable: acepta URL web o archivo local (max. 2 MB). */
export function ProductImageInput({
  value,
  onChange,
  label = 'Imagen',
  hint = '(URL web o archivo local, opcional)',
  previewAlt = 'Vista previa del producto',
  placeholder = 'https://ejemplo.com/imagen.jpg',
  previewClassName = 'object-cover',
}: ProductImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('La imagen no puede superar 2 MB.');
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setReading(false);
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.onerror = () => {
      setReading(false);
      setError('No fue posible leer la imagen.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label className="block text-[#212121] mb-1" style={{ fontSize: '0.875rem' }}>
        {label} <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>{hint}</span>
      </label>
      <input
        type="url"
        maxLength={2048}
        title="Ingresa una URL web válida (máximo 2048 caracteres)"
        placeholder={placeholder}
        value={value.startsWith('data:') ? '' : value}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next);
          setError(next && !isValidHttpUrl(next)
            ? 'Ingresa una URL válida que comience con http:// o https://.'
            : null);
        }}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 text-[#212121]"
        style={{ fontSize: '0.9rem' }}
      />
      <div className="flex items-center gap-3 mt-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        />
        <button
          type="button"
          disabled={reading}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:border-[#C62828] hover:text-[#C62828] transition-colors disabled:opacity-50"
          style={{ fontSize: '0.8rem', fontWeight: 600 }}
        >
          <ImagePlus size={15} /> {reading ? 'Leyendo...' : 'Subir archivo'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { setError(null); onChange(''); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-[#C62828] transition-colors"
            style={{ fontSize: '0.8rem' }}
          >
            <Trash2 size={14} /> Quitar
          </button>
        )}
      </div>
      {value && (
        <img
          src={value}
          alt={previewAlt}
          className={`mt-3 w-full h-36 ${previewClassName} rounded-xl border border-gray-100 bg-[#F5F5F5]`}
        />
      )}
      {error && <p role="alert" className="text-[#C62828] mt-1.5" style={{ fontSize: '0.8rem' }}>{error}</p>}
    </div>
  );
}
