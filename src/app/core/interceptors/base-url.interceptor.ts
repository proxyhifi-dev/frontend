import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url || '';

  // ✅ Let asset requests pass (Angular static files)
  // Keep this STRICT to assets only (avoid accidentally skipping API calls)
  if (url.startsWith('/assets/') || url.includes('/assets/')) {
    return next(req);
  }

  // ✅ If already absolute (http/https), do not touch
  if (/^https?:\/\//i.test(url)) {
    return next(req);
  }

  // ✅ Only normalize leading "/api" prefix (not any "/api" in the middle)
  // We want final outgoing URL always like: https://host/api/<path>
  const path = url.startsWith('/') ? url : `/${url}`;
  const normalizedPath = path.startsWith('/api/')
    ? path.substring('/api'.length) // remove ONLY the prefix "/api"
    : path;

  // ✅ environment.apiUrl should already include "/api"
  const base = (environment.apiUrl || environment.apiBaseUrl || '').replace(/\/+$/, '');

  const apiReq = req.clone({
    url: `${base}${normalizedPath}`
  });

  return next(apiReq);
};
