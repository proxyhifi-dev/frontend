import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { RuntimeConfigService } from './core/config/runtime-config.service';

const runtimeConfigInitializer = (runtimeConfig: RuntimeConfigService) => () =>
  firstValueFrom(runtimeConfig.load());

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([loadingInterceptor, errorInterceptor, authInterceptor])
    ),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: runtimeConfigInitializer,
      deps: [RuntimeConfigService],
      multi: true
    }
  ]
};
