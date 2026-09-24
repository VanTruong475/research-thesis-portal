import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Lấy token từ LocalStorage
  const token = localStorage.getItem('access_token');
  
  let clonedRequest = req;
  
  // Nếu có token, đính kèm vào Header
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Bắt lỗi HTTP 401 (Unauthorized - Token hết hạn hoặc không hợp lệ)
  return next(clonedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Xóa thông tin cũ và đá về trang đăng nhập
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
