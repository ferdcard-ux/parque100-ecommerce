/**
 * @fileoverview Reportes de ventas del panel admin.
 */
import { useMemo, useState } from 'react';
import { DollarSign, ShoppingCart, Receipt, Package } from 'lucide-react';
import { useAdminOrdersController } from '../../controllers';
import { AdminPageShell } from '../components/admin/AdminPageShell';
import { ORDER_ESTADOS, formatPrice } from '../../utils';

type Period = 'hoy' | 'semana' | 'mes' | 'personalizado';

const PERIOD_LABELS: Record<Period, string> = {
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
  personalizado: 'Personalizado',
};

/** Filtra pedidos por el rango temporal seleccionado. */
function inRange(fecha: string, period: Period, from: string, to: string): boolean {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return true;
  const now = new Date();
  switch (period) {
    case 'hoy':
      return date.toDateString() === now.toDateString();
    case 'semana': {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    }
    case 'mes':
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case 'personalizado': {
      const fromOk = from === '' || date >= new Date(from);
      const toOk = to === '' || date <= new Date(`${to}T23:59:59`);
      return fromOk && toOk;
    }
  }
}

/** Dashboard de reportes: KPIs, top productos y pedidos por estado. */
export function AdminReportsPage() {
  const { orders, isLoading } = useAdminOrdersController();
  const [period, setPeriod] = useState<Period>('hoy');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(
    () => orders.filter((o) => inRange(o.Fecha, period, from, to)),
    [orders, period, from, to],
  );

  const totalSales = filtered.reduce((sum, o) => sum + Number(o.Total), 0);
  const avgTicket = filtered.length > 0 ? Math.round(totalSales / filtered.length) : 0;
  const byStatus = ORDER_ESTADOS.map((estado) => ({
    estado,
    count: filtered.filter((o) => o.Estado === estado).length,
  }));
  const maxStatus = Math.max(1, ...byStatus.map((b) => b.count));

  const kpis = [
    { icon: DollarSign, label: 'Ventas totales', value: formatPrice(totalSales), tile: 'bg-[#C62828]/10 text-[#C62828]' },
    { icon: ShoppingCart, label: 'Pedidos', value: String(filtered.length), tile: 'bg-blue-100 text-blue-600' },
    { icon: Receipt, label: 'Ticket promedio', value: formatPrice(avgTicket), tile: 'bg-[#FBC02D]/20 text-[#f57f17]' },
    { icon: Package, label: 'Pedidos entregados', value: String(byStatus.find((b) => b.estado === 'entregado')?.count ?? 0), tile: 'bg-green-100 text-green-700' },
  ];

  return (
    <AdminPageShell active="reportes" title="Reportes" subtitle="Analitica de ventas">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full border transition-colors ${
              period === p ? 'bg-[#C62828] text-white border-[#C62828]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#C62828]'
            }`}
            style={{ fontSize: '0.8rem', fontWeight: 500 }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
        {period === 'personalizado' && (
          <span className="flex items-center gap-2 ml-2" style={{ fontSize: '0.8rem' }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded-xl px-2 py-1.5" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded-xl px-2 py-1.5" />
          </span>
        )}
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-16">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map(({ icon: Icon, label, value, tile }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tile}`}><Icon size={18} /></span>
                <p className="text-[#212121]" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{value}</p>
                <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-[#212121] mb-6" style={{ fontSize: '1rem', fontWeight: 700 }}>Pedidos por estado</h2>
            <div className="flex items-end gap-6 h-48">
              {byStatus.map(({ estado, count }) => (
                <div key={estado} className="flex-1 flex flex-col items-center justify-end gap-2">
                  <span className="text-gray-500" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{count}</span>
                  <div className="w-full max-w-14 rounded-t-lg bg-[#C62828]" style={{ height: `${(count / maxStatus) * 100}%`, minHeight: count > 0 ? 8 : 2, opacity: 0.85 }} />
                  <span className="text-gray-400 text-center" style={{ fontSize: '0.7rem' }}>{estado}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminPageShell>
  );
}
