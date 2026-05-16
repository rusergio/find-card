import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, throwError, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { RawLoginResponse } from '../models/login-api.model';
import type { SessionUser } from '../models/session-user';
import { isUserRole, type UserRole } from '../models/user-role';
import { formatAuthHttpError } from '../utils/auth-error.util';
import { tryDisplayNameFromJwt, tryUserRoleFromJwt } from '../utils/jwt-claims';

const jsonAccept = new HttpHeaders({ Accept: 'application/json' });

/** Corpo de {@code GET /auth/me} (Spring {@code UserResponse}). */
export interface ApiCurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string): Observable<SessionUser> {
    const url = `${environment.apiBaseUrl}${environment.auth.loginPath}`;
    const login$ =
      environment.auth.loginTransport === 'get-query'
        ? this.http.get(url, {
            params: new HttpParams({ fromObject: { email, password } }),
            headers: jsonAccept,
            responseType: 'text',
          })
        : this.http.post(url, { email, password }, { headers: jsonAccept, responseType: 'text' });

    return login$.pipe(
      map((raw) => this.mapToSession(email, parseLoginJsonBody(raw))),
      catchError((err: unknown) =>
        throwError(() =>
          err instanceof HttpErrorResponse ? err : new Error(formatAuthHttpError(err)),
        ),
      ),
    );
  }

  /** POST alinhado a {@code RegisterRequest} no Spring: firstName, lastName, email, password. */
  register(body: {
    email: string;
    password: string;
    fullName?: string;
  }): Observable<void> {
    const url = `${environment.apiBaseUrl}${environment.auth.registerPath}`;
    const { firstName, lastName } = splitFullNameForRegister(body.fullName);
    const payload = {
      firstName,
      lastName,
      email: body.email.trim().toLowerCase(),
      password: body.password,
    };
    return this.http.post(url, payload, { responseType: 'text' }).pipe(
      map(() => undefined),
      catchError((err: unknown) =>
        throwError(() =>
          err instanceof HttpErrorResponse ? err : new Error(formatAuthHttpError(err)),
        ),
      ),
    );
  }

  /** Perfil do utilizador autenticado (requer {@code Authorization: Bearer}). */
  fetchCurrentUser(): Observable<ApiCurrentUser> {
    const url = `${environment.apiBaseUrl}/auth/me`;
    return this.http.get<ApiCurrentUser>(url, { headers: jsonAccept });
  }

  requestPasswordReset(email: string): Observable<void> {
    const url = `${environment.apiBaseUrl}${environment.auth.forgotPasswordPath}`;
    return this.http.post(url, { email }, { responseType: 'text' }).pipe(
      map(() => undefined),
      catchError((err: unknown) =>
        throwError(() =>
          err instanceof HttpErrorResponse ? err : new Error(formatAuthHttpError(err)),
        ),
      ),
    );
  }

  private mapToSession(fallbackEmail: string, body: RawLoginResponse): SessionUser {
    const accessToken =
      pickString(body.accessToken) ?? pickString(body.access_token) ?? pickString(body.token);
    if (!accessToken) {
      throw new Error('A API não devolveu um token de acesso (accessToken / access_token / token).');
    }

    const email = pickString(body.email) ?? fallbackEmail;
    const roleFromBody = pickRoleFromBody(body);
    const roleFromJwt = tryUserRoleFromJwt(accessToken);
    const role: UserRole = roleFromBody ?? roleFromJwt ?? 'CLIENT';

    const displayName =
      pickString(body.displayName) ??
      pickString(body.name) ??
      tryDisplayNameFromJwt(accessToken) ??
      (email.includes('@') ? (email.split('@')[0] ?? email) : email);

    const refreshToken = pickString(body.refreshToken) ?? pickString(body.refresh_token);
    const fullName = pickString(body.fullName) ?? pickString(body.full_name);

    return {
      email,
      displayName,
      role,
      accessToken,
      refreshToken,
      ...(fullName ? { fullName } : {}),
    };
  }
}

/** Parte "Nome completo" do formulário em firstName + lastName (obrigatórios na API Java). */
function splitFullNameForRegister(fullName: string | undefined): {
  firstName: string;
  lastName: string;
} {
  const t = fullName?.trim() ?? '';
  if (!t) {
    return { firstName: 'Cliente', lastName: 'Banco' };
  }
  const space = t.indexOf(' ');
  if (space === -1) {
    return { firstName: t, lastName: t };
  }
  const firstName = t.slice(0, space).trim();
  const lastName = t.slice(space + 1).trim() || firstName;
  return { firstName: firstName || t, lastName };
}

function pickString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/**
 * Evita o erro bruto `Unexpected token '<'...` quando o Spring (ou o proxy) devolve HTML.
 */
function parseLoginJsonBody(raw: string): RawLoginResponse {
  const text = raw.trim();
  if (!text) {
    throw new Error('Resposta vazia do servidor.');
  }
  if (text.startsWith('<!') || text.startsWith('<')) {
    throw new Error(
      'O servidor devolveu HTML em vez de JSON (erro 404/500 do Spring, página de login ou URL errada). Confirme o endpoint de login, use `ng serve` com proxy `/api` → `8080`, e que o controller devolve JSON com o token.',
    );
  }
  try {
    return JSON.parse(text) as RawLoginResponse;
  } catch {
    throw new Error('A resposta do login não é JSON válido. Confirme o contrato da API.');
  }
}

function normalizeAuthorities(raw: RawLoginResponse['authorities']): string[] {
  if (!raw) {
    return [];
  }
  if (typeof raw === 'string') {
    return [raw];
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

function pickRoleFromBody(body: RawLoginResponse): UserRole | null {
  if (typeof body.role === 'string' && isUserRole(body.role)) {
    return body.role;
  }
  const fromArrays = [...(body.roles ?? []), ...normalizeAuthorities(body.authorities)];
  for (const a of fromArrays) {
    const upper = a.toUpperCase();
    if (upper.includes('ADMIN')) {
      return 'ADMIN';
    }
    if (upper.includes('EMPLOYEE') || upper.includes('STAFF') || upper.includes('FUNC')) {
      return 'EMPLOYEE';
    }
    if (upper.includes('CLIENT') || upper.includes('USER') || upper.includes('CUSTOMER')) {
      return 'CLIENT';
    }
  }
  return null;
}
