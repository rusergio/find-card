import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import type { SessionUser } from '../models/session-user';
import { isUserRole, mapSpringRoleToUserRole, type UserRole } from '../models/user-role';
import { AuthApiService, type ApiCurrentUser } from './auth-api.service';

const SESSION_STORAGE_KEY = 'bm_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authApi = inject(AuthApiService);
  private readonly _user = signal<SessionUser | null>(null);

  readonly user = this._user.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.restoreSession();
    }
  }

  homeSegmentForRole(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'admin';
      case 'EMPLOYEE':
        return 'employee';
      case 'CLIENT':
        return 'client';
    }
  }

  /**
   * Inicia sessão: modo mock (`environment.auth.useMockLogin`) ou POST à API Spring.
   */
  signIn(credentials: { email: string; password: string; demoRole: UserRole }): Observable<void> {
    const { email, password, demoRole } = credentials;
    if (environment.auth.useMockLogin) {
      this.persistSession(this.buildMockUser(email, demoRole));
      return of(undefined);
    }
    return this.authApi.login(email, password).pipe(
      tap((session) => this._user.set(session)),
      switchMap((session) =>
        this.authApi.fetchCurrentUser().pipe(
          map((me) => this.mergeProfileIntoSession(session, me)),
          catchError(() => of(session)),
        ),
      ),
      tap((session) => this.persistSession(session)),
      map(() => undefined),
    );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    this._user.set(null);
  }

  /** Atualiza dados de perfil guardados localmente (nome, telefone, avatar). */
  updateLocalProfile(
    updates: Partial<Pick<SessionUser, 'displayName' | 'fullName' | 'avatarDataUrl' | 'phone'>>,
  ): void {
    const current = this._user();
    if (!current) {
      return;
    }
    this.persistSession({ ...current, ...updates });
  }

  private buildMockUser(email: string, role: UserRole): SessionUser {
    const displayName = email.split('@')[0] || email;
    return { email, displayName, role };
  }

  private persistSession(session: SessionUser): void {
    this._user.set(session);
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private restoreSession(): void {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }
      const obj = parsed as Record<string, unknown>;
      const email = typeof obj['email'] === 'string' ? obj['email'] : '';
      const displayName = typeof obj['displayName'] === 'string' ? obj['displayName'] : email;
      const roleRaw = obj['role'];
      if (!email || typeof roleRaw !== 'string' || !isUserRole(roleRaw)) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }
      const accessToken = typeof obj['accessToken'] === 'string' ? obj['accessToken'] : undefined;
      const refreshToken = typeof obj['refreshToken'] === 'string' ? obj['refreshToken'] : undefined;
      const fullName = typeof obj['fullName'] === 'string' ? obj['fullName'] : undefined;
      const avatarDataUrl = typeof obj['avatarDataUrl'] === 'string' ? obj['avatarDataUrl'] : undefined;
      const phone = typeof obj['phone'] === 'string' ? obj['phone'] : undefined;
      this._user.set({
        email,
        displayName,
        role: roleRaw,
        accessToken,
        refreshToken,
        fullName,
        ...(avatarDataUrl ? { avatarDataUrl } : {}),
        ...(phone ? { phone } : {}),
      });
      if (accessToken) {
        this.refreshProfileFromApi();
      }
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  private mergeProfileIntoSession(session: SessionUser, me: ApiCurrentUser): SessionUser {
    const fullName = `${me.firstName ?? ''} ${me.lastName ?? ''}`.replace(/\s+/g, ' ').trim();
    const displayName = fullName || session.displayName;
    const role = mapSpringRoleToUserRole(me.role) ?? session.role;
    return {
      ...session,
      email: me.email,
      ...(fullName ? { fullName } : {}),
      displayName,
      role,
    };
  }

  /** Atualiza nome/email a partir da API (útil após F5 com sessão guardada). */
  private refreshProfileFromApi(): void {
    this.authApi.fetchCurrentUser().subscribe({
      next: (me) => {
        const current = this._user();
        if (!current?.accessToken) {
          return;
        }
        this.persistSession(this.mergeProfileIntoSession(current, me));
      },
      error: () => {
        /* mantém sessão só com JWT */
      },
    });
  }
}
