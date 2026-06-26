import { Clock, ShieldCheck, Star } from 'lucide-react';

const TRUST_ITEMS = [
  { icon: <Clock size={18} />, text: 'Entrega en el día' },
  { icon: <ShieldCheck size={18} />, text: 'Pago 100% seguro' },
  { icon: <Star size={18} />, text: 'Calidad garantizada' },
];

export function TrustBar() {
  return (
    <section className="bg-[#212121] py-4">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between gap-4">
        {TRUST_ITEMS.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-white/80">
            <span className="text-[#FBC02D]">{item.icon}</span>
            <span style={{ fontSize: '0.85rem' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
