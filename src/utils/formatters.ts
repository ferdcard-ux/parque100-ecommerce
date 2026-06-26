import { FREE_SHIPPING_THRESHOLD } from './constants';

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
}

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 4000;
}

export function calculateTotal(subtotal: number): number {
  return subtotal + calculateShipping(subtotal);
}

export function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

export function detectCardType(number: string): 'visa' | 'mastercard' | 'unknown' {
  const clean = number.replace(/\s/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (clean.startsWith('5')) return 'mastercard';
  return 'unknown';
}

export function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `TP${num}`;
}
