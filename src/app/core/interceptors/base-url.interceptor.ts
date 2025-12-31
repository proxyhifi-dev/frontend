import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // If the request is for an asset (like .svg, .json config), let it pass normally
  if (req.url.includes('/assets/') || req.url.includes('.json')) {
    return next(req);
  }

  // If the request already has http (external api), let it pass
  if (req.url.startsWith('http')) {
    return next(req);
  }

  // Otherwise, prepend the backend URL (e.g., /api/account -> http://localhost:8080/api/account)
  const apiReq = req.clone({
    url: `${environment.apiUrl}${req.url.replace('/api', '')}`
  });

  return next(apiReq);
};
