import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  template: `
    <app-loading-spinner></app-loading-spinner>
    <app-notification-toast></app-notification-toast>
    <router-outlet></router-outlet>
  `,
  standalone: true,
  imports: [RouterOutlet, LoadingSpinnerComponent, NotificationToastComponent]
})
export class AppComponent {
  title = 'Apex Trading Bot';
}
