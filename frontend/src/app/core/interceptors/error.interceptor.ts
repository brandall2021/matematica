import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        const refreshed = auth.refreshTokenSync();
        if (refreshed) {
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${auth.getToken()}` }
          });
          return next(cloned);
        }
        auth.logout();
      }
      return throwError(() => error);
    })
  );
};
