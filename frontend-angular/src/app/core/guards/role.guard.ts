import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { UserRole } from '../models/user-role';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowed: readonly UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return true;
    }
    const user = auth.user();
    if (!user) {
      return router.createUrlTree(['login']);
    }
    if (!allowed.includes(user.role)) {
      return router.createUrlTree([auth.homeSegmentForRole(user.role)]);
    }
    return true;
  };
}
