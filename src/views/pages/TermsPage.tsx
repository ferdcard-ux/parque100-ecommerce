/**
 * @fileoverview Terminos y condiciones del servicio.
 */
import { PageHeader } from '../components/shared/page-header';

/** Condiciones de uso de la tienda. */
export function TermsPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <PageHeader title="Términos y Condiciones" subtitle="Condiciones de uso de la tienda" backTo="/" />
        <div className="flex flex-col gap-4 text-gray-600" style={{ fontSize: '0.9rem' }}>
          <p>Al registrarte y comprar en Tienda Parque 100 aceptas estas condiciones: los pedidos se entregan dentro del conjunto en 45-60 minutos; los precios estan en pesos colombianos e incluyen el envio segun el umbral vigente.</p>
          <p>Puedes cancelar tus pedidos en estado pendiente desde "Mis compras". Tienes 24 horas desde la entrega para reportar novedades escribiendo a info@parque100.com.</p>
          <p>El tratamiento de tus datos personales se describe en la <a href="/privacidad" className="text-[#C62828] hover:underline">Política de Privacidad</a>.</p>
        </div>
      </div>
    </main>
  );
}
