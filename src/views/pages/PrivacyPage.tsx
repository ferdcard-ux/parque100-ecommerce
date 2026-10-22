/**
 * @fileoverview Pagina de privacidad y cookies.
 */
import { PageHeader } from '../components/shared/page-header';

/** Informacion sobre tratamiento de datos y cookies. */
export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-brand-surface pt-8 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <PageHeader title="Privacidad y Cookies" subtitle="Politica de tratamiento de datos" backTo="/" />
        <div className="flex flex-col gap-4 text-gray-600" style={{ fontSize: '0.9rem' }}>
          <p>Usamos los datos de cuenta y entrega que proporcionas para administrar tu cuenta, preparar pedidos y coordinar la entrega. El sitio conserva tambien la informacion necesaria para gestionar pedidos y cumplir obligaciones aplicables.</p>
          <p>Algunas imagenes de productos pueden cargarse desde proveedores externos como Unsplash o Pexels. La solicitud directa a esos servidores puede revelar tu direccion IP y metadatos tecnicos de la solicitud; no enviamos intencionalmente tu contrasena ni los datos de tu perfil a esos proveedores.</p>
          <p>Los pagos con tarjeta y Nequi estan temporalmente deshabilitados. No ingreses ni envies datos de tarjeta, CVV, transferencias o comprobantes por este sitio. El pago disponible es en efectivo contra entrega.</p>
          <p>Puedes solicitar acceso, correccion o eliminacion de los datos de tu perfil escribiendo a info@parque100.com. La eliminacion puede estar sujeta a obligaciones legales de conservacion de pedidos.</p>
          <h2 id="cookies" className="text-brand-ink font-bold">Cookies</h2>
          <p>Usamos almacenamiento local del navegador para mantener la sesion, los favoritos y la configuracion del panel. No usamos cookies publicitarias propias ni rastreamos tu actividad fuera de la aplicacion. Para ejercer derechos o consultar plazos de conservacion, escribe a info@parque100.com.</p>
        </div>
      </div>
    </main>
  );
}
