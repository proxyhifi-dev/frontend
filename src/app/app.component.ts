import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { GlobalLoadingComponent } from './shared/components/global-loading/global-loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, GlobalLoadingComponent],
  template: `
    <router-outlet />
    <app-toast-container />
    <app-global-loading />
  `,
  styles: []
})
export class AppComponent {
  title = 'Apex Trading Bot';
}
