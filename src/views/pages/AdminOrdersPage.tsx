/**
 * @fileoverview Panel de administracion de pedidos.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { TriangleAlert, ChevronDown } from 'lucide-react';
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
    { label: 'Pendientes', value: counts.pendiente, estado: 'pendiente' as OrderEstado },
    { label: 'Preparando', value: counts.preparando, estado: 'preparando' as OrderEstado },
    { label: 'En envio', value: counts.enviando, estado: 'enviando' as OrderEstado },
    { label: 'Entregados', value: counts.entregado, estado: 'entregado' as OrderEstado },
    { label: 'Cancelados', value: counts.cancelado, estado: 'cancelado' as OrderEstado },
  ];
  const [estadoFilter, setEstadoFilter] = useState<OrderEstado | null>(null);

  const visibleOrders = estadoFilter ? orders.filter((o) => o.Estado === estadoFilter) : orders;

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
      for (const [key] of groups) next[key] = prev[key] ?? key !== todayKey;
      return next;
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
      <div className="sticky top-[60px] z-10 bg-[#F5F5F5]/95 backdrop-blur -mt-3 pt-1 pb-2">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {summary.map((s) => {
            const isActive = estadoFilter === s.estado;
            return (
              <button
                key={s.label}
                onClick={() => setEstadoFilter((prev) => (prev === s.estado ? null : s.estado))}
                aria-pressed={isActive}
                title={isActive ? `Quitar filtro: ${s.label}` : `Filtrar: ${s.label}`}
                className={`bg-white rounded-xl border px-2 py-2 text-left transition-all hover:shadow-md hover:border-[#C62828]/40 active:scale-[0.98] ${isActive ? 'border-[#C62828] ring-2 ring-[#C62828]/25 shadow-md' : 'border-gray-100'}`}
              >
                <p className="text-[#C62828] leading-none truncate" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{s.value}</p>
                <p className="text-gray-500 truncate" style={{ fontSize: '0.68rem' }}>{s.label}</p>
              </button>
            );
          })}
        </div>
        {estadoFilter ? (
          <div className="flex items-center justify-between mt-2 h-[18px]">
            <p className="text-gray-500" style={{ fontSize: '0.75rem' }}>
              Filtrando por <strong className="text-[#212121]">{estadoFilter}</strong> ({visibleOrders.length} de {orders.length})
            </p>
            <button onClick={() => setEstadoFilter(null)} className="text-[#C62828] hover:underline" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
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
              <button onClick={() => setCollapsed(Object.fromEntries(groups.map(([k]) => [k, false])))} className="text-gray-400 hover:text-[#C62828] hover:underline" style={{ fontSize: '0.75rem' }}>
                Expandir todo
              </button>
              <button onClick={() => setCollapsed(Object.fromEntries(groups.map(([k]) => [k, true])))} className="text-gray-400 hover:text-[#C62828] hover:underline" style={{ fontSize: '0.75rem' }}>
                Colapsar
              </button>
            </div>
          </div>
        )}
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
          {groups.map(([dateKey, list]) => {
            const isCollapsed = collapsed[dateKey] ?? dateKey !== todayKey;
            return (
              <section key={dateKey} aria-label={formatGroupTitle(dateKey)}>
                <button
                  onClick={() => setCollapsed((prev) => ({ ...prev, [dateKey]: !isCollapsed }))}
                  aria-expanded={!isCollapsed}
                  className="sticky top-[154px] z-[5] w-full flex items-center justify-between gap-3 bg-white/95 backdrop-blur border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm hover:border-[#C62828]/40 transition-colors text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-[#212121] font-bold truncate" style={{ fontSize: '0.85rem' }}>{formatGroupTitle(dateKey)}</span>
                    <span className="block text-gray-400" style={{ fontSize: '0.7rem' }}>{list.length} pedido{list.length === 1 ? '' : 's'}</span>
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>
                {!isCollapsed && (
                  <div className="flex flex-col gap-4 mt-3">
                    {list.map((order) => (
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
                )}
              </section>
            );
          })}
          {visibleOrders.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
              <p className="text-[#212121] font-semibold" style={{ fontSize: '0.9rem' }}>Sin pedidos en “{estadoFilter}”</p>
              <button onClick={() => setEstadoFilter(null)} className="text-[#C62828] hover:underline mt-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
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
