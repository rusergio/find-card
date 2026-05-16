import { isUserRole, type UserRole } from '../models/user-role';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) {
      return null;
    }
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function authoritiesFromPayload(payload: Record<string, unknown>): string[] {
  const raw = payload['authorities'] ?? payload['roles'] ?? payload['scope'];
  if (typeof raw === 'string') {
    return raw.split(/[\s,]+/).filter(Boolean);
  }
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object' && 'authority' in item) {
        return String((item as { authority: unknown }).authority);
      }
      return '';
    })
    .filter(Boolean);
}

function mapAuthorityToRole(authority: string): UserRole | null {
  const a = authority.toUpperCase();
  if (a.includes('ADMIN')) {
    return 'ADMIN';
  }
  if (a.includes('EMPLOYEE') || a.includes('STAFF') || a.includes('FUNC')) {
    return 'EMPLOYEE';
  }
  if (a.includes('CLIENT') || a.includes('USER') || a.includes('CUSTOMER')) {
    return 'CLIENT';
  }
  return null;
}

export function tryUserRoleFromJwt(accessToken: string): UserRole | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }
  const direct = payload['role'];
  if (typeof direct === 'string') {
    const mappedDirect = mapAuthorityToRole(direct);
    if (mappedDirect) {
      return mappedDirect;
    }
    if (isUserRole(direct)) {
      return direct;
    }
  }
  const authorities = authoritiesFromPayload(payload);
  for (const auth of authorities) {
    const mapped = mapAuthorityToRole(auth);
    if (mapped) {
      return mapped;
    }
  }
  return null;
}

export function tryDisplayNameFromJwt(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }
  for (const key of ['name', 'displayName', 'given_name', 'preferred_username', 'sub']) {
    const v = payload[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  const email = payload['email'];
  if (typeof email === 'string' && email.includes('@')) {
    return email.split('@')[0] ?? email;
  }
  return null;
}
