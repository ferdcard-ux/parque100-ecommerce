/**
 * @fileoverview Panel de administracion de pedidos.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { TriangleAlert } from 'lucide-react';
import { useAdminOrdersController } from '../../controllers';
import { useApp } from '../../App';
import { userService } from '../../services';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { CancelOrderModal } from '../components/shared/cancel-order-modal';
import { ORDER_ESTADOS, ADMIN_CANCEL_REASONS, formatPrice } from '../../utils';
import type { OrderEstado } from '../../models';

/** Resumen y gestion de pedidos en curso, finalizados y cancelados. */
export function AdminOrdersPage() {
  const { user, isAdmin } = useApp();
  const { orders, counts, isLoading, error, changeStatus, cancelOrder } = useAdminOrdersController();
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(isAdmin);

  useEffect(() => {
    if (isAdmin || !user) {
      setCanCancel(isAdmin);
      return;
    }
    userService.getPermissions(user.id).then((p) => setCanCancel(p.puede_cancelar)).catch(() => setCanCancel(false));
  }, [isAdmin, user?.id]);

  const summary = [
    { label: 'Pendientes', value: counts.pendiente },
    { label: 'Preparando', value: counts.preparando },
    { label: 'En envio', value: counts.enviando },
    { label: 'Entregados', value: counts.entregado },
    { label: 'Cancelados', value: counts.cancelado },
  ];

  const handleSelect = async (id: number, estado: OrderEstado) => {
    if (estado === 'cancelado') {
      if (!canCancel) {
        setStatusError('No tienes permiso para cancelar pedidos. Pide al administrador que te delegue el permiso.');
        return;
      }
      setCancelError(null);
      setCancelId(id);
      return;
    }
    setStatusError(null);
    try {
      await changeStatus(id, estado);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'No fue posible actualizar el estado.');
    }
  };

  const handleCancel = async (motivo: string) => {
    if (cancelId === null) return;
    setCancelError(null);
    setSaving(true);
    try {
      await cancelOrder(cancelId, motivo, isAdmin ? 'admin' : 'domiciliario', user?.id ?? null);
      setCancelId(null);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'No fue posible cancelar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell active="pedidos" title="Administrar Pedidos" subtitle="Gestiona el estado de cada pedido">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {summary.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-[#C62828]" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{s.value}</p>
            <p className="text-gray-400" style={{ fontSize: '0.8rem' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error ? (
        <p className="text-center text-[#C62828] py-16">{error}</p>
      ) : (
        <>
          {statusError && (
            <p role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>{statusError}</p>
          )}
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.ID_Pedido} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-[#212121] font-bold">Pedido #{order.ID_Pedido}</span>
                  <span className="text-gray-400 ml-3" style={{ fontSize: '0.8rem' }}>{order.Usuario_Nombre ?? order.Destinatario ?? ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge estado={order.Estado} />
                  {order.Metodo_Pago === 'Efectivo' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      Efectivo · cambio {formatPrice(Number(order.Cambio ?? 0))}
                    </span>
                  )}
                  <span className="text-[#C62828] font-bold">{formatPrice(order.Total)}</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
                Torre {order.Torre ?? '—'} · Piso {order.Piso ?? '—'} · Apto {order.Apartamento ?? '—'}
              </p>
              {order.Estado === 'cancelado' ? (
                <div role="alert" className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-1">
                  <TriangleAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cancelado: {order.Motivo_Cancelacion ?? '—'}</p>
                    <p className="text-red-600 mt-0.5" style={{ fontSize: '0.75rem' }}>Proceder con la devolución del pago según lo acordado con el cliente.</p>
                  </div>
                </div>
              ) : (
                <OrderTracker estado={order.Estado} compact />
              )}
              <div className="flex items-center justify-between mt-4">
                <Link to={`/admin/pedidos/${order.ID_Pedido}`} className="text-[#C62828] hover:underline" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Ver detalle
                </Link>
                <select
                  value={order.Estado}
                  disabled={order.Estado === 'cancelado'}
                  title={order.Estado === 'cancelado' ? 'Un pedido cancelado no se puede reanudar' : undefined}
                  onChange={(e) => handleSelect(order.ID_Pedido, e.target.value as OrderEstado)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#C62828] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '0.8rem' }}
                >
                  {ORDER_ESTADOS.filter((estado) => canCancel || estado !== 'cancelado').map((estado) => (
                    <option key={estado} value={estado}>{estado === 'cancelado' ? 'cancelado (con motivo)' : estado}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
      {cancelId !== null && canCancel && (
        <CancelOrderModal
          orderId={cancelId}
          saving={saving}
          error={cancelError}
          reasons={ADMIN_CANCEL_REASONS}
          onClose={() => setCancelId(null)}
          onConfirm={handleCancel}
        />
      )}
    </AdminPageShell>
  );
}
