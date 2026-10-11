/**
 * @fileoverview Panel principal del administrador (Dashboard).
 * Resumen del negocio: KPIs, accesos directos, pedidos recientes,
 * pedidos por estado y productos con stock bajo.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  DollarSign, ShoppingCart, Package, Users, ClipboardList,
  BarChart2, Settings, TriangleAlert, ChevronRight,
} from 'lucide-react';
import { useApp } from '../../App';
import { useAdminOrdersController, useProductController } from '../../controllers';
import { userService } from '../../services';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { StatusBadge } from '../components/shared/status-badge';
import { ORDER_ESTADOS, formatPrice } from '../../utils';

/** Resumen del negocio con accesos directos a cada seccion. */
export function AdminDashboardPage() {
  const { isAdmin } = useApp();
  const { orders, isLoading: loadingOrders } = useAdminOrdersController();
  const { adminProducts, isLoading: loadingProducts } = useProductController();
  const [clientCount, setClientCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isAdmin) return;
    userService.getAllUsers().then((users) => {
      if (!cancelled) setClientCount(users.length);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin]);

  const validOrders = useMemo(() => orders.filter((o) => o.Estado !== 'cancelado'), [orders]);
  const totalSales = validOrders.reduce((sum, o) => sum + Number(o.Total), 0);
  const pending = orders.filter((o) => o.Estado === 'pendiente');
  const lowStock = adminProducts.filter((p) => p.status !== 'in_stock');
  const recent = useMemo(
    () => [...orders].sort((a, b) => b.ID_Pedido - a.ID_Pedido).slice(0, 5),
    [orders],
  );
  const byStatus = ORDER_ESTADOS.filter((e) => e !== 'cancelado').map((estado) => ({
    estado,
    count: orders.filter((o) => o.Estado === estado).length,
  }));
  const maxStatus = Math.max(1, ...byStatus.map((b) => b.count));

  const kpis = isAdmin ? [
    { icon: DollarSign, label: 'Ventas totales', value: formatPrice(totalSales), tile: 'bg-[#C62828]/10 text-[#C62828]', to: '/admin/reportes' },
    { icon: ShoppingCart, label: 'Pedidos pendientes', value: String(pending.length), tile: 'bg-blue-100 text-blue-600', to: '/admin/pedidos-pendientes' },
    { icon: Package, label: 'Productos', value: String(adminProducts.length), tile: 'bg-[#FBC02D]/20 text-[#f57f17]', to: '/admin/inventario' },
    { icon: Users, label: 'Clientes', value: clientCount === null ? '…' : String(clientCount), tile: 'bg-green-100 text-green-700', to: '/admin/clientes' },
  ] : [
    { icon: ShoppingCart, label: 'Pedidos pendientes', value: String(pending.length), tile: 'bg-blue-100 text-blue-600', to: '/admin/pedidos-pendientes' },
    { icon: ClipboardList, label: 'En preparación', value: String(orders.filter((o) => o.Estado === 'preparando').length), tile: 'bg-orange-100 text-orange-700', to: '/admin/pedidos' },
    { icon: ClipboardList, label: 'En envío', value: String(orders.filter((o) => o.Estado === 'enviando').length), tile: 'bg-purple-100 text-purple-700', to: '/admin/pedidos' },
    { icon: Package, label: 'Entregados', value: String(orders.filter((o) => o.Estado === 'entregado').length), tile: 'bg-green-100 text-green-700', to: '/admin/pedidos' },
  ];

  const shortcuts = (isAdmin
    ? [
      { icon: Package, label: 'Inventario', description: 'Productos y existencias', to: '/admin/inventario', tile: 'bg-[#C62828]/10 text-[#C62828]' },
      { icon: ShoppingCart, label: 'Pedidos pendientes', description: `${pending.length} esperando`, to: '/admin/pedidos-pendientes', tile: 'bg-blue-100 text-blue-600' },
      { icon: ClipboardList, label: 'Administrar pedidos', description: 'Estados y cancelaciones', to: '/admin/pedidos', tile: 'bg-purple-100 text-purple-700' },
      { icon: BarChart2, label: 'Reportes', description: 'Analítica de ventas', to: '/admin/reportes', tile: 'bg-[#FBC02D]/20 text-[#f57f17]' },
      { icon: Users, label: 'Clientes', description: 'Usuarios y permisos', to: '/admin/clientes', tile: 'bg-green-100 text-green-700' },
      { icon: Settings, label: 'Configuración', description: 'Datos del negocio', to: '/admin/configuracion', tile: 'bg-gray-100 text-gray-600' },
    ]
    : [
      { icon: ShoppingCart, label: 'Pedidos pendientes', description: `${pending.length} esperando`, to: '/admin/pedidos-pendientes', tile: 'bg-blue-100 text-blue-600' },
      { icon: ClipboardList, label: 'Administrar pedidos', description: 'Tomar y avanzar pedidos', to: '/admin/pedidos', tile: 'bg-purple-100 text-purple-700' },
    ]);

  const isLoading = loadingOrders || (isAdmin && loadingProducts);

  return (
    <AdminPageShell active="dashboard" title="Dashboard" subtitle="Resumen del negocio">
      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
            {kpis.map(({ icon: Icon, label, value, tile, to }) => (
              <Link key={label} to={to} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-[#C62828]/20 transition-all">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tile}`}><Icon size={17} /></span>
                <p className="text-[#212121] truncate" style={{ fontSize: '1.15rem', fontWeight: 700 }}>{value}</p>
                <p className="text-gray-400 truncate" style={{ fontSize: '0.72rem' }}>{label}</p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
              <h2 className="text-[#212121] mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>Pedidos recientes</h2>
              {recent.length === 0 ? (
                <p className="text-gray-400 text-center py-6" style={{ fontSize: '0.85rem' }}>Sin pedidos todavía.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-gray-50">
                  {recent.map((o) => (
                    <li key={o.ID_Pedido}>
                      <Link to={`/admin/pedidos/${o.ID_Pedido}`} className="flex items-center justify-between py-2.5 hover:bg-gray-50 rounded-xl px-2 transition-colors">
                        <span>
                          <span className="block text-[#212121]" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Pedido #{o.ID_Pedido} · {o.Usuario_Nombre ?? 'Cliente'}
                          </span>
                          <span className="block text-gray-400" style={{ fontSize: '0.75rem' }}>{formatPrice(Number(o.Total))}</span>
                        </span>
                        <StatusBadge estado={o.Estado} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-[#212121] mb-4" style={{ fontSize: '1rem', fontWeight: 700 }}>Accesos directos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shortcuts.map(({ icon: Icon, label, description, to, tile }) => (
                  <Link key={label} to={to} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#C62828]/30 hover:shadow-sm transition-all">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tile}`}><Icon size={16} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[#212121] truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
                      <span className="block text-gray-400 truncate" style={{ fontSize: '0.72rem' }}>{description}</span>
                    </span>
                    <ChevronRight size={15} className="text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="text-[#212121] mb-6" style={{ fontSize: '1rem', fontWeight: 700 }}>Pedidos por estado</h2>
              <div className="flex items-end gap-4 h-40">
                {byStatus.map(({ estado, count }) => (
                  <div key={estado} className="flex-1 flex flex-col items-center justify-end gap-2">
                    <span className="text-gray-500" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{count}</span>
                    <div className="w-full max-w-14 rounded-t-lg bg-[#C62828]" style={{ height: `${(count / maxStatus) * 100}%`, minHeight: count > 0 ? 8 : 2, opacity: 0.85 }} />
                    <span className="text-gray-400 text-center" style={{ fontSize: '0.7rem' }}>{estado}</span>
                  </div>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[#212121]" style={{ fontSize: '1rem', fontWeight: 700 }}>Stock bajo</h2>
                  <Link to="/admin/inventario" className="text-[#C62828] hover:underline" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Ver inventario
                  </Link>
                </div>
                {lowStock.length === 0 ? (
                  <p className="text-gray-400 text-center py-6" style={{ fontSize: '0.85rem' }}>Todo el inventario está al día.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-gray-50">
                    {lowStock.slice(0, 5).map((p) => (
                      <li key={p.id} className="flex items-center gap-2 py-2.5">
                        <TriangleAlert size={15} className={p.status === 'out_of_stock' ? 'text-[#C62828] shrink-0' : 'text-[#f57f17] shrink-0'} />
                        <span className="flex-1 text-[#212121] truncate" style={{ fontSize: '0.85rem' }}>{p.name}</span>
                        <span className="text-gray-400" style={{ fontSize: '0.75rem' }}>{p.quantity} disp.</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
