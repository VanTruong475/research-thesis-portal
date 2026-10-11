import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

const canAccessAuthenticatedRoute = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const hasAccessToken = !!localStorage.getItem('access_token');

  if (hasAccessToken && authService.currentUser()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};

export const authGuard: CanActivateFn = () => canAccessAuthenticatedRoute();
export const authChildGuard: CanActivateChildFn = () => canAccessAuthenticatedRoute();
