import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingSpinnerComponent, NotificationToastComponent],
  template: `
    <app-loading-spinner></app-loading-spinner>
    <app-notification-toast></app-notification-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'Apex Trading Bot';
}
