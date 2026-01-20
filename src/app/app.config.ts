import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { firstValueFrom, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { routes } from './app.routes';


import { baseUrlInterceptor } from './core/interceptors/base-url.interceptor';

import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { RuntimeConfigService } from './core/config/runtime-config.service';

/**
 * IMPORTANT:
 * - This initializer used to BLOCK the entire UI until /api/ui/config returned.
 * - On Render free tier the backend can be "cold" and the call can hang,
 *   resulting in a blank screen.
 *
 * Fix: add timeout + catchError so the app boots even if backend is slow/down.
 */
const runtimeConfigInitializer =
  (runtimeConfig: RuntimeConfigService) =>
    () =>
      firstValueFrom(
        runtimeConfig.load().pipe(
          timeout(4000), // ✅ don't block UI forever
          catchError((err) => {
            console.warn('[RuntimeConfig] load failed, continuing boot:', err);
            return of(null); // ✅ allow Angular to bootstrap
          })
        )
      );

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),

    // ✅ IMPORTANT: baseUrlInterceptor should be FIRST
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        authInterceptor,
        errorInterceptor
      ])
    ),

    {
      provide: APP_INITIALIZER,
      useFactory: runtimeConfigInitializer,
      deps: [RuntimeConfigService],
      multi: true
    }
  ]
};
