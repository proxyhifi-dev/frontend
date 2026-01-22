import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RuntimeConfigService } from '../config/runtime-config.service';

export const baseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const runtimeConfig = inject(RuntimeConfigService);
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

  // ✅ Only prefix API-style relative URLs
  const path = url.startsWith('/') ? url : `/${url}`;
  if (!path.startsWith('/api/')) {
    return next(req);
  }

  // Remove ONLY the prefix "/api" to avoid duplicating when base already includes /api
  const normalizedPath = path.substring('/api'.length);

  const base = runtimeConfig.getApiBaseUrl().replace(/\/+$/, '');

  const apiReq = req.clone({
    url: `${base}${normalizedPath}`
  });

  return next(apiReq);
};
