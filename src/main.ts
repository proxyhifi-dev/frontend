import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { baseUrlInterceptor } from './app/core/interceptors/base-url.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    // ✅ This registers both your Base URL and Error handler
    provideHttpClient(
      withInterceptors([baseUrlInterceptor, errorInterceptor])
    )
  ]
}).catch((err) => console.error(err));
