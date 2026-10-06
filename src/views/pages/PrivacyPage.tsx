/**
 * @fileoverview Pagina de privacidad y cookies.
 */
import { PageHeader } from '../components/shared/page-header';

/** Informacion sobre tratamiento de datos y cookies. */
export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-8">
        <PageHeader title="Privacidad y Cookies" subtitle="Politica de tratamiento de datos" backTo="/" />
        <div className="flex flex-col gap-4 text-gray-600" style={{ fontSize: '0.9rem' }}>
          <p>Tus datos se usan unicamente para procesar pedidos dentro del conjunto Parque 100: nombre, correo, telefono y direccion de entrega.</p>
          <p>No compartimos tu informacion con terceros. Puedes solicitar actualizacion o eliminacion de tu perfil en cualquier momento escribiendo a info@parque100.com.</p>
          <h2 id="cookies" className="text-[#212121] font-bold">Cookies</h2>
          <p>Usamos almacenamiento local del navegador para recordar tu sesion (si elegiste "Recuerdame"), tus favoritos y la configuracion del panel. No rastreamos tu actividad fuera de la aplicacion.</p>
        </div>
      </div>
    </main>
  );
}
