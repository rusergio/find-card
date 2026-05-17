import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isExpiryNotPast, passesLuhnCheck, sanitizeHolderName } from './card-input.util';

const HOLDER_PATTERN = /^[\p{L}][\p{L}\s'-]{2,119}$/u;

export function holderNameValidator(control: AbstractControl): ValidationErrors | null {
  const raw = String(control.value ?? '').trim();
  if (!raw) {
    return null;
  }
  const normalized = sanitizeHolderName(raw);
  if (normalized.length < 3) {
    return { holderNameMin: true };
  }
  if (!HOLDER_PATTERN.test(normalized)) {
    return { holderNameFormat: true };
  }
  if (/\d/.test(normalized)) {
    return { holderNameNoDigits: true };
  }
  return null;
}

export function cardNumberLuhnValidator(control: AbstractControl): ValidationErrors | null {
  const digits = String(control.value ?? '').replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  if (digits.length !== 16) {
    return { cardNumberLength: true };
  }
  if (!passesLuhnCheck(digits)) {
    return { cardNumberLuhn: true };
  }
  return null;
}

export function expiryGroupValidator(group: AbstractControl): ValidationErrors | null {
  const month = group.get('expiryMonth')?.value;
  const year = group.get('expiryYear')?.value;
  if (!month || !year) {
    return null;
  }
  const yy = String(year).slice(-2);
  const mmYy = `${month}/${yy}`;
  if (!isExpiryNotPast(mmYy)) {
    return { expiryPast: true };
  }
  return null;
}

export function cvcValidator(control: AbstractControl): ValidationErrors | null {
  const v = String(control.value ?? '');
  if (!v) {
    return null;
  }
  if (!/^\d{3}$/.test(v)) {
    return { cvcFormat: true };
  }
  return null;
}

export function fieldErrorMessage(
  control: AbstractControl | null,
  labels: Record<string, string>,
): string | null {
  if (!control || !control.touched || !control.errors) {
    return null;
  }
  const key = Object.keys(control.errors)[0];
  return labels[key] ?? 'Valor inválido.';
}
