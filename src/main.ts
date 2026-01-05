import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { baseUrlInterceptor } from './app/core/interceptors/base-url.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(
      withInterceptors([
        baseUrlInterceptor,
        jwtInterceptor,
        errorInterceptor,
        loadingInterceptor
      ])
    )
  ]
}).catch(err => console.error(err));
