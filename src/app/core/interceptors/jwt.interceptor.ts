import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // --- DEBUG LOG ---
  console.log('JWT Interceptor - URL:', req.url);
  console.log('JWT Interceptor - Token found:', !!token);
  // ----------------

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
