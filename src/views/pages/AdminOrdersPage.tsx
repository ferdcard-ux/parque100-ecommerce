/**
 * @fileoverview Panel de administracion de pedidos.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { TriangleAlert, ChevronDown } from 'lucide-react';
import { useAdminOrdersController, useUsersController } from '../../controllers';
import { useApp } from '../../App';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { OrderTracker } from '../components/shared/order-tracker';
import { CancelOrderModal } from '../components/shared/cancel-order-modal';
import { ORDER_ESTADOS, ADMIN_CANCEL_REASONS, formatPrice, isApprovedDemoPayment, isDemoPaymentMethod } from '../../utils';
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
  const { getPermissions } = useUsersController({ autoLoad: false });

  useEffect(() => {
    if (isAdmin || !user) {
      setCanCancel(isAdmin);
      return;
    }
    getPermissions(user.id).then((p) => setCanCancel(p.puede_cancelar)).catch(() => setCanCancel(false));
  }, [isAdmin, user?.id, getPermissions]);

  const summary = [
    { label: 'Pendientes', value: counts.pendiente, estado: 'pendiente' as OrderEstado },
    { label: 'Preparando', value: counts.preparando, estado: 'preparando' as OrderEstado },
    { label: 'En envio', value: counts.enviando, estado: 'enviando' as OrderEstado },
    { label: 'Entregados', value: counts.entregado, estado: 'entregado' as OrderEstado },
    { label: 'Cancelados', value: counts.cancelado, estado: 'cancelado' as OrderEstado },
  ];
  const [estadoFilter, setEstadoFilter] = useState<OrderEstado | null>(null);

  const visibleOrders = useMemo(
    () => (estadoFilter ? orders.filter((o) => o.Estado === estadoFilter) : orders),
    [orders, estadoFilter],
  );

  /** Agrupa por fecha (YYYY-MM-DD). Solo el día actual inicia expandido. */
  const groups = useMemo(() => {
    const map = new Map<string, typeof visibleOrders>();
    for (const o of [...visibleOrders].sort((a, b) => b.ID_Pedido - a.ID_Pedido)) {
      const key = String(o.Fecha ?? '').slice(0, 10) || 'sin-fecha';
      const list = map.get(key);
      if (list) list.push(o);
      else map.set(key, [o]);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [visibleOrders]);

  const todayKey = useMemo(() => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }, []);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setCollapsed((prev) => {
      const next: Record<string, boolean> = {};
      let changed = false;
      for (const [key] of groups) {
        const value = prev[key] ?? key !== todayKey;
        next[key] = value;
        if (!(key in prev) || prev[key] !== value) changed = true;
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [groups, todayKey]);

  const formatGroupTitle = (key: string): string => {
    if (key === 'sin-fecha') return 'Sin fecha';
    const d = new Date(`${key}T12:00:00`);
    if (Number.isNaN(d.getTime())) return key;
    const label = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (key === todayKey) return `Hoy · ${label}`;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (key === yKey) return `Ayer · ${label}`;
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

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
      <div className="sticky top-[60px] z-10 bg-brand-surface -mt-3 pt-1 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
          {summary.map((s) => {
            const isActive = estadoFilter === s.estado;
            return (
              <button
                key={s.label}
                onClick={() => setEstadoFilter((prev) => (prev === s.estado ? null : s.estado))}
                aria-pressed={isActive}
                title={isActive ? `Quitar filtro: ${s.label}` : `Filtrar: ${s.label}`}
                className={`bg-white rounded-xl border px-2 py-2 text-left transition-all hover:shadow-md hover:border-brand-red/40 active:scale-[0.98] ${isActive ? 'border-brand-red ring-2 ring-brand-red/25 shadow-md' : 'border-gray-100'}`}
              >
                <p className="text-brand-red leading-none truncate" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{s.value}</p>
                <p className="text-gray-500 truncate" style={{ fontSize: '0.68rem' }}>{s.label}</p>
              </button>
            );
          })}
        </div>
        {estadoFilter ? (
          <div className="flex items-center justify-between mt-2 h-[18px]">
            <p className="text-gray-500" style={{ fontSize: '0.75rem' }}>
              Filtrando por <strong className="text-brand-ink">{estadoFilter}</strong> ({visibleOrders.length} de {orders.length})
            </p>
            <button onClick={() => setEstadoFilter(null)} className="text-brand-red hover:underline" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              Limpiar filtro
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-2 h-[18px]">
            <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>
              {visibleOrders.length} de {orders.length} pedidos
              {groups.length > 1 && ` · ${groups.length} fechas`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCollapsed(Object.fromEntries(groups.map(([k]) => [k, false])))} className="text-gray-400 hover:text-brand-red hover:underline" style={{ fontSize: '0.75rem' }}>
                Expandir todo
              </button>
              <button onClick={() => setCollapsed(Object.fromEntries(groups.map(([k]) => [k, true])))} className="text-gray-400 hover:text-brand-red hover:underline" style={{ fontSize: '0.75rem' }}>
                Colapsar
              </button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : error ? (
        <p className="text-center text-brand-red py-16">{error}</p>
      ) : (
        <>
          {statusError && (
            <p role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontSize: '0.85rem' }}>{statusError}</p>
          )}
        <div className="flex flex-col gap-4">
          {groups.map(([dateKey, list]) => {
            const isCollapsed = collapsed[dateKey] ?? dateKey !== todayKey;
            return (
              <section key={dateKey} aria-label={formatGroupTitle(dateKey)}>
                <button
                  onClick={() => setCollapsed((prev) => ({ ...prev, [dateKey]: !isCollapsed }))}
                  aria-expanded={!isCollapsed}
                  className="sticky top-[154px] z-[5] w-full flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm hover:border-brand-red/40 transition-colors text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-brand-ink font-bold truncate" style={{ fontSize: '0.85rem' }}>{formatGroupTitle(dateKey)}</span>
                    <span className="block text-gray-400" style={{ fontSize: '0.7rem' }}>{list.length} pedido{list.length === 1 ? '' : 's'}</span>
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>
                {!isCollapsed && (
                  <div className="flex flex-col gap-4 mt-3">
                    {list.map((order) => {
                      const isDemoOrder = isDemoPaymentMethod(order.Metodo_Pago);
                      const isApprovedDemo = isApprovedDemoPayment(order.Metodo_Pago, order.Estado_Pago_DEMO);
                      const allowedStatuses = ORDER_ESTADOS.filter((estado) => (
                        (canCancel || estado !== 'cancelado')
                        && (!isDemoOrder || isApprovedDemo || estado === 'pendiente' || estado === 'cancelado')
                      ));
                      return (
            <div key={order.ID_Pedido} className="bg-white rounded-2xl border border-gray-100 p-5">
              {isDemoOrder && (
                <p role="alert" className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                  {isApprovedDemo
                    ? 'SIMULACION: sin cobro real; transaccion DEMO e inventario registrados.'
                    : 'SIMULACION historica sin transaccion aprobada; no despachable.'}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <span className="text-brand-ink font-bold">Pedido #{order.ID_Pedido}</span>
                  <span className="text-gray-400 ml-3" style={{ fontSize: '0.8rem' }}>{order.Usuario_Nombre ?? order.Destinatario ?? ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge estado={order.Estado} />
                  {order.Metodo_Pago === 'Efectivo' && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                      Efectivo · cambio {formatPrice(Number(order.Cambio ?? 0))}
                    </span>
                  )}
                  <span className="text-brand-red font-bold">{formatPrice(order.Total)}</span>
                </div>
              </div>
              <p className="text-gray-400 mb-4" style={{ fontSize: '0.8rem' }}>
                Torre {order.Torre ?? '—'} · Piso {order.Piso ?? '—'} · Apto {order.Apartamento ?? '—'}
              </p>
              {order.Referencia_Pago_DEMO && (
                <p className="text-amber-800 mb-3" style={{ fontSize: '0.75rem' }}>
                  Referencia DEMO: <strong>{order.Referencia_Pago_DEMO}</strong>
                </p>
              )}
              {order.Estado === 'cancelado' ? (
                <div role="alert" className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-1">
                  <TriangleAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cancelado: {order.Motivo_Cancelacion ?? '—'}</p>
                    <p className="text-red-600 mt-0.5" style={{ fontSize: '0.75rem' }}>
                      {isDemoOrder
                        ? order.Referencia_Pago_DEMO
                          ? 'Transaccion ficticia anulada; stock reservado restablecido. No hay devolucion real.'
                          : 'Pedido historico demo; no hubo cobro ni reserva de inventario.'
                        : 'Proceder con la devolución del pago según lo acordado con el cliente.'}
                    </p>
                  </div>
                </div>
              ) : (
                <OrderTracker estado={order.Estado} compact />
              )}
              <div className="flex items-center justify-between mt-4">
                <Link to={`/admin/pedidos/${order.ID_Pedido}`} className="text-brand-red hover:underline" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Ver detalle
                </Link>
                <select
                  value={order.Estado}
                  disabled={order.Estado === 'cancelado'}
                  title={order.Estado === 'cancelado' ? 'Un pedido cancelado no se puede reanudar' : isDemoOrder && !isApprovedDemo ? 'La transaccion demo no esta aprobada' : undefined}
                  onChange={(e) => handleSelect(order.ID_Pedido, e.target.value as OrderEstado)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: '0.8rem' }}
                >
                  {allowedStatuses.map((estado) => (
                    <option key={estado} value={estado}>{estado === 'cancelado' ? 'cancelado (con motivo)' : estado}</option>
                  ))}
                </select>
              </div>
            </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
          {visibleOrders.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-brand-ink font-semibold" style={{ fontSize: '0.9rem' }}>Sin pedidos en “{estadoFilter}”</p>
              <button onClick={() => setEstadoFilter(null)} className="text-brand-red hover:underline mt-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Mostrar todos
              </button>
            </div>
          )}
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
