import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { inject } from '@angular/core';
import { ApiConfigService } from '../config/api-config.service';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const apiConfig = inject(ApiConfigService);
  const isApiRequest = req.url.startsWith(apiConfig.apiUrl);

  if (token && isApiRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
