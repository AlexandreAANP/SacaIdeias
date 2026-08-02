import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { LoginModalService } from '../services/login-modal.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  // Must be here, synchronously inside the interceptor function.
  const loginModalService = inject(LoginModalService);
  

  const token = localStorage.getItem('sacaideias_token');

  const authenticatedRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403) &&
        !request.url.includes('/api/v1/auth/google')
      ) {
        loginModalService.open();
      }

      return throwError(() => error);
    }),
  );
};