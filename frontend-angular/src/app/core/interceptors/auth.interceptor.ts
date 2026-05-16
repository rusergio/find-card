import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Caminho sem query (suporta URL absoluta do `HttpClient` + `withFetch`). */
function pathWithoutQuery(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
}

function isApiRequest(url: string): boolean {
  const base = environment.apiBaseUrl;
  if (url.startsWith(base)) {
    return true;
  }
  if (base.startsWith('/')) {
    try {
      const path = pathWithoutQuery(url);
      return path === base || path.startsWith(`${base}/`);
    } catch {
      return false;
    }
  }
  return false;
}

function isAuthAnonymousPath(url: string): boolean {
  const base = environment.apiBaseUrl;
  const login = `${base}${environment.auth.loginPath}`;
  const forgot = `${base}${environment.auth.forgotPasswordPath}`;
  const register = `${base}${environment.auth.registerPath}`;
  const { loginPath, forgotPasswordPath, registerPath } = environment.auth;
  const path = pathWithoutQuery(url);
  return (
    url === login ||
    url === forgot ||
    url === register ||
    path === login ||
    path === forgot ||
    path === register ||
    path.endsWith(loginPath) ||
    path.endsWith(forgotPasswordPath) ||
    path.endsWith(registerPath)
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiRequest(req.url)) {
    return next(req);
  }
  if (isAuthAnonymousPath(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = auth.user()?.accessToken;
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
