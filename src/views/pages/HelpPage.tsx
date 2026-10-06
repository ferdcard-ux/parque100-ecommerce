/**
 * @fileoverview Centro de ayuda con preguntas frecuentes.
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PageHeader } from '../components/shared/page-header';

const FAQS = [
  { q: '¿Como comprar?', a: 'Explora el catalogo, agrega productos al carrito y confirma el pago desde el carrito.' },
  { q: 'Seguimiento de pedido', a: 'Inicia sesion, entra a "Mi cuenta" > "Tus compras" y revisa el estado de cada pedido.' },
  { q: 'Politica de devolucion', a: 'Tienes 24 horas desde la entrega para reportar novedades escribiendo a info@parque100.com.' },
  { q: 'Terminos y condiciones', a: 'Al comprar en Tienda Parque 100 aceptas nuestras condiciones de uso y politica de tratamiento de datos.' },
  { q: 'Preguntas frecuentes', a: 'Las respuestas mas comunes estan listadas en esta misma pagina.' },
];

/** Pagina /ayuda con acordeon de preguntas frecuentes. */
export function HelpPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Centro de ayuda" subtitle="Preguntas frecuentes" backTo="/" />
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-[#212121] font-semibold" style={{ fontSize: '0.9rem' }}>{faq.q}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              {open === i && (
                <p className="px-5 pb-4 text-gray-500" style={{ fontSize: '0.85rem' }}>{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
