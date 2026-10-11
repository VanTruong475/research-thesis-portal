import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  const allowedRoles = route.data?.['roles'] as UserRole[] | undefined;

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (!allowedRoles || allowedRoles.includes(user.role)) {
    return true;
  }

  router.navigate(['/app/profile']);
  return false;
};
