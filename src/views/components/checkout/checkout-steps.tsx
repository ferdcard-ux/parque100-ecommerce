/**
 * @fileoverview Indicador de progreso del flujo de compra.
 */
import { Link } from 'react-router';
import { Check, ShoppingCart, MapPin, CreditCard, Flag } from 'lucide-react';

const STEPS = [
  { label: 'Carrito', short: 'Carrito', to: '/cart', icon: ShoppingCart },
  { label: 'Dirección', short: 'Dirección', to: '/address', icon: MapPin },
  { label: 'Método de pago', short: 'Pago', to: '/payment-method', icon: CreditCard },
  { label: 'Confirmación', short: 'Listo', to: '/payment-success', icon: Flag },
];

interface CheckoutStepsProps {
  /** Paso actual (1-4). */
  current: number;
}

/** Progreso Carrito → Dirección → Método → Confirmación. Los pasos completados enlazan atrás. */
export function CheckoutSteps({ current }: CheckoutStepsProps) {
  return (
    <ol className="flex items-start w-full mb-6" aria-label="Progreso de la compra">
      {STEPS.map(({ label, short, to, icon: Icon }, index) => {
        const step = index + 1;
        const done = step < current;
        const active = step === current;
        const circle = (
          <span
            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
              done
                ? 'bg-[#22C55E] border-[#22C55E] text-white'
                : active
                  ? 'bg-[#C62828] border-[#C62828] text-white'
                  : 'bg-white border-gray-200 text-gray-300'
            }`}
          >
            {done ? <Check size={16} /> : <Icon size={16} />}
          </span>
        );
        const caption = (
          <span
            className={`mt-1.5 text-center leading-tight ${active ? 'text-[#212121] font-semibold' : done ? 'text-gray-500' : 'text-gray-300'}`}
            style={{ fontSize: '0.68rem' }}
          >
            <span className="sm:hidden">{short}</span>
            <span className="hidden sm:inline">{label}</span>
          </span>
        );
        return (
          <li key={label} className="flex-1 flex items-start last:flex-none">
            <div className="flex flex-col items-center w-full">
              {done ? (
                <Link to={to} aria-label={`Volver a ${label}`} className="flex flex-col items-center hover:opacity-80 transition-opacity">
                  {circle}
                  {caption}
                </Link>
              ) : (
                <div className="flex flex-col items-center" aria-current={active ? 'step' : undefined}>
                  {circle}
                  {caption}
                </div>
              )}
            </div>
            {step < STEPS.length && (
              <span className={`h-0.5 flex-1 mt-4 mx-1 rounded ${done ? 'bg-[#22C55E]' : 'bg-gray-200'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
