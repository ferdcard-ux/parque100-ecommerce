export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\s/g, '');
  return digits.length === 16 && /^\d+$/.test(digits);
}

export function isValidExpiry(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 4) return false;
  const month = parseInt(digits.slice(0, 2), 10);
  if (month < 1 || month > 12) return false;
  return true;
}

export function isValidCvv(value: string): boolean {
  return /^\d{3,4}$/.test(value);
}

export function isValidPhone(value: string): boolean {
  return /^\d{7,10}$/.test(value.replace(/\s/g, ''));
}

export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}
