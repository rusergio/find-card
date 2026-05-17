/** Apenas letras (incl. acentos), espaços, hífen e apóstrofo. */
export function sanitizeHolderName(value: string): string {
  return value
    .replace(/[^\p{L}\s'-]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 120);
}

export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

/** Agrupa em blocos de 4: 1234 5678 9012 3456 */
export function formatCardNumberDisplay(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

/** Algoritmo de Luhn (ISO/IEC 7812). */
export function passesLuhnCheck(cardNumber: string): boolean {
  if (!/^\d{16}$/.test(cardNumber)) {
    return false;
  }
  let sum = 0;
  let alternate = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let n = Number(cardNumber.charAt(i));
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

/** Máscara de entrada MM/AA (máx. 5 caracteres). */
export function formatExpiryMmAaInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function buildExpiryMmYy(month: string, year: string): string {
  const mm = month.padStart(2, '0');
  const yy = year.length === 4 ? year.slice(-2) : year.padStart(2, '0');
  return `${mm}/${yy}`;
}

/** MM/YY não pode estar no passado. */
export function isExpiryNotPast(mmYy: string): boolean {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(mmYy);
  if (!match) {
    return false;
  }
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const expiryEnd = new Date(year, month, 0, 23, 59, 59, 999);
  return expiryEnd >= now;
}

export function expiryYearOptions(): string[] {
  const current = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => String(current + i));
}

export const EXPIRY_MONTHS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
] as const;
