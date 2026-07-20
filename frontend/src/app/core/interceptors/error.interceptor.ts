import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (req.url.includes('/auth/')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return from(auth.refreshTokenAsync()).pipe(
          switchMap((success) => {
            if (success) {
              const token = auth.getToken();
              const cloned = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
              });
              return next(cloned);
            }
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
