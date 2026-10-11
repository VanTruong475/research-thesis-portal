import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { AuthService, TokenResponse } from '../services/auth';

let refreshRequest$: Observable<ApiResponse<TokenResponse>> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isRefreshManagedEndpoint = isAuthEndpoint(req.url);
  const token = localStorage.getItem('access_token');
  const requestWithToken = token && !isRefreshManagedEndpoint ? addAuthHeader(req, token) : req;

  return next(requestWithToken).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isRefreshManagedEndpoint) {
        return throwError(() => error);
      }

      if (!localStorage.getItem('refresh_token')) {
        authService.clearLocalSession();
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authService.refreshSession().pipe(
          shareReplay(1),
          finalize(() => {
            refreshRequest$ = null;
          })
        );
      }

      const currentRefreshRequest$ = refreshRequest$;
      if (!currentRefreshRequest$) {
        authService.clearLocalSession();
        return throwError(() => error);
      }

      return currentRefreshRequest$.pipe(
        catchError(refreshError => {
          authService.clearLocalSession();
          return throwError(() => refreshError);
        }),
        switchMap(() => {
          const newToken = localStorage.getItem('access_token');
          if (!newToken) {
            authService.clearLocalSession();
            return throwError(() => error);
          }
          return next(addAuthHeader(req, newToken));
        })
      );
    })
  );
};

function addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function isAuthEndpoint(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}
