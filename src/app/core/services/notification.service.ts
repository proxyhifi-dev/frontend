import { Injectable } from '@angular/core';
import { StoreService } from './store.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  constructor(private store: StoreService) {}

  success(title: string, message: string) {
    this.store.notify(title, message, 'success');
  }

  error(title: string, message: string) {
    this.store.notify(title, message, 'error');
  }

  warning(title: string, message: string) {
    this.store.notify(title, message, 'warning');
  }

  info(title: string, message: string) {
    this.store.notify(title, message, 'info');
  }
}
