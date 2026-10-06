/**
 * @fileoverview Historial de compras del usuario.
 */
import { Link } from 'react-router';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { useApp } from '../../App';
import { useOrdersController } from '../../controllers';
import { PageHeader } from '../components/shared/page-header';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { EmptyState } from '../components/shared/empty-state';
import { formatPrice } from '../../utils';

/** Formatea la fecha ISO a estilo legible (ej. 10 de diciembre de 2024). */
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return value;
  }
}

/** Lista de pedidos del usuario con su tracker de estado. */
export function OrdersPage() {
  const { user, isLoggedIn } = useApp();
  const { orders, isLoading, error } = useOrdersController(user?.id ?? null);

  if (!isLoggedIn || !user) {
    return (
      <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
        <p className="text-center text-gray-400 py-16">Inicia sesion para ver tus compras.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F5] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Mis compras" subtitle="Revisa el estado de tus pedidos" backTo="/cuenta" />

        {isLoading ? (
          <p className="text-center text-gray-400 py-16">Cargando pedidos...</p>
        ) : error ? (
          <p className="text-center text-[#C62828] py-16">{error}</p>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Aun no tienes compras"
            description="Cuando realices un pedido aparecera aqui."
            action={<Link to="/catalogo" className="bg-[#C62828] text-white rounded-full px-6 py-2.5" style={{ fontWeight: 600 }}>Ir al catalogo</Link>}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <Link key={order.ID_Pedido} to={`/compras/${order.ID_Pedido}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-[#C62828]/20 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#212121] font-bold">Pedido #{order.ID_Pedido}</span>
                  <StatusBadge estado={order.Estado} />
                </div>
                <div className="flex items-center justify-between text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
                  <span>{formatDate(order.Fecha)}</span>
                  <span className="text-[#C62828] font-bold" style={{ fontSize: '1rem' }}>{formatPrice(order.Total)}</span>
                </div>
                <OrderTracker estado={order.Estado} />
                <div className="flex justify-end mt-3">
                  <span className="flex items-center gap-1 text-gray-400" style={{ fontSize: '0.75rem' }}>Ver detalle <ChevronRight size={14} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
