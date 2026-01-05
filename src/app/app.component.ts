import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <app-loading-spinner></app-loading-spinner>
    <app-notification-toast></app-notification-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'Apex Trading Bot';
}
