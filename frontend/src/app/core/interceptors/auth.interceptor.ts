import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

const REFRESH_SKIPPED_AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = authService.accessToken;
  const authRequest = accessToken ? withBearerToken(request, accessToken) : request;

  return next(authRequest).pipe(
    catchError((error: unknown) => {
      if (!shouldAttemptRefresh(error, request)) {
        return throwError(() => error);
      }

      return authService.refreshSession().pipe(
        switchMap((tokens) => next(withBearerToken(request, tokens.access_token))),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function withBearerToken(request: HttpRequest<unknown>, accessToken: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

function shouldAttemptRefresh(error: unknown, request: HttpRequest<unknown>): boolean {
  if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }

  return !REFRESH_SKIPPED_AUTH_PATHS.some((path) => request.url.includes(path));
}
