/**
 * @fileoverview Confirmacion del pago segun el metodo elegido.
 * Tarjeta (formulario), Nequi (comprobante en imagen) o efectivo
 * (monto recibido con calculo del cambio).
 */
import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Upload, ReceiptText } from 'lucide-react';
import type { CardPaymentData } from '../../models';
import { CardForm } from '../components/checkout/CardForm';
import { CheckoutSteps } from '../components/checkout/checkout-steps';
import { CheckoutSummary } from '../components/checkout/checkout-summary';
import { PageHeader } from '../components/shared/page-header';
import { formatPrice } from '../../utils';

const MAX_RECEIPT_BYTES = 3 * 1024 * 1024;

interface CardPaymentPageProps {
  total: number;
  /** Unidades del carrito para el resumen superior. */
  itemCount: number;
  isProcessing: boolean;
  onPay: (data: CardPaymentData) => Promise<void>;
  onPayNequi: (receiptDataUrl: string) => Promise<void>;
  onPayCash: (tendered: number) => Promise<void>;
}

export function CardPaymentPage({ total, itemCount, isProcessing, onPay, onPayNequi, onPayCash }: CardPaymentPageProps) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method');
  const isNequi = method === 'nequi';
  const isCash = method === 'cash';

  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tendered, setTendered] = useState('');
  const tenderedValue = Number(tendered.replace(/\D/g, '')) || 0;
  const change = tenderedValue >= total ? tenderedValue - total : 0;

  const handleSubmit = async (data: CardPaymentData) => {
    setError('');
    try {
      await onPay(data);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el pedido.');
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El comprobante debe ser una imagen.');
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setError('La imagen supera los 3 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptData(typeof reader.result === 'string' ? reader.result : null);
      setReceiptPreview(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  };

  const handleNequiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!receiptData) {
      setError('Adjunta el comprobante de pago para continuar.');
      return;
    }
    try {
      await onPayNequi(receiptData);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el pedido.');
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tenderedValue < total) {
      setError(`El monto debe cubrir el total (${formatPrice(total)}).`);
      return;
    }
    try {
      await onPayCash(tenderedValue);
      navigate('/payment-success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el pedido.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <CheckoutSteps current={3} />
        <CheckoutSummary itemCount={itemCount} total={total} />
        <PageHeader
          title={isNequi ? 'Pago con Nequi' : isCash ? 'Pago en efectivo' : 'Pago con tarjeta'}
          subtitle={`Total a pagar: ${formatPrice(total)}`}
          backTo="/payment-method"
        />
        {error && (
          <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        {isNequi ? (
          <form onSubmit={handleNequiSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md mx-auto">
            <p className="text-gray-500 mb-4" style={{ fontSize: '0.85rem' }}>
              Realiza la transferencia en Nequi y adjunta el comprobante en imagen.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="hidden"
              aria-label="Adjuntar comprobante de pago"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 text-gray-500 hover:border-[#C62828] hover:text-[#C62828] transition-colors mb-4"
              style={{ fontSize: '0.9rem' }}
            >
              <Upload size={18} /> Adjuntar comprobante de pago
            </button>
            {receiptPreview && (
              <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                <img src={receiptPreview} alt="Comprobante de pago" className="w-full max-h-64 object-contain bg-[#F5F5F5]" />
              </div>
            )}
            <button type="submit" disabled={isProcessing || !receiptData} className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-40 disabled:cursor-not-allowed transition-all" style={{ fontSize: '1rem' }}>
              {isProcessing ? 'Procesando...' : 'Confirmar pago'}
            </button>
          </form>
        ) : isCash ? (
          <form onSubmit={handleCashSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-11 h-11 rounded-xl bg-[#FBC02D]/20 text-[#f57f17] flex items-center justify-center">
                <ReceiptText size={20} />
              </span>
              <p className="text-gray-500" style={{ fontSize: '0.85rem' }}>
                Pagas al recibir el pedido. Indica con qué billete pagarás.
              </p>
            </div>
            <label className="block text-[#212121] mb-1.5" style={{ fontSize: '0.875rem' }}>Monto en efectivo *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={tendered}
              onChange={(e) => setTendered(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="Ej. 50000"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#F5F5F5] focus:outline-none focus:border-[#C62828] mb-4"
            />
            <dl className="border-t border-gray-100 pt-3 mb-6 flex flex-col gap-1" style={{ fontSize: '0.9rem' }}>
              <div className="flex justify-between text-gray-500"><dt>Total compra</dt><dd>{formatPrice(total)}</dd></div>
              <div className="flex justify-between text-gray-500"><dt>Recibido</dt><dd>{formatPrice(tenderedValue)}</dd></div>
              <div className="flex justify-between text-green-700 font-bold"><dt>Tu cambio</dt><dd>{formatPrice(change)}</dd></div>
            </dl>
            <button type="submit" disabled={isProcessing} className="w-full py-3 rounded-xl text-white font-semibold bg-[#C62828] hover:bg-[#b71c1c] disabled:opacity-60 transition-all" style={{ fontSize: '1rem' }}>
              {isProcessing ? 'Procesando...' : 'Confirmar pedido'}
            </button>
          </form>
        ) : (
          <CardForm total={total} isProcessing={isProcessing} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
