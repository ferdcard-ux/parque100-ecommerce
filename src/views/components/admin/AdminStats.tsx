interface AdminStatsProps {
  total: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export function AdminStats({ total, inStock, lowStock, outOfStock }: AdminStatsProps) {
  const stats = [
    { label: 'Total productos', value: total, icon: '📦', color: 'bg-blue-50 text-blue-600' },
    { label: 'En stock', value: inStock, icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'Bajo stock', value: lowStock, icon: '⚠️', color: 'bg-[#FBC02D]/10 text-[#f57f17]' },
    { label: 'Sin stock', value: outOfStock, icon: '🚫', color: 'bg-[#C62828]/10 text-[#C62828]' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
            <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
          </div>
          <div>
            <p className="text-gray-400" style={{ fontSize: '0.75rem' }}>{s.label}</p>
            <p className="text-[#212121] font-bold" style={{ fontSize: '1.3rem' }}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
