import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private toastIdCounter = 0;

  showSuccess(message: string, duration = 3000) {
    this.show('success', message, duration);
  }

  showError(message: string, duration = 5000) {
    this.show('error', message, duration);
  }

  showWarning(message: string, duration = 4000) {
    this.show('warning', message, duration);
  }

  showInfo(message: string, duration = 3000) {
    this.show('info', message, duration);
  }

  private show(type: Toast['type'], message: string, duration: number) {
    const id = `toast-${++this.toastIdCounter}`;
    const toast: Toast = { id, type, message, duration };

    queueMicrotask(() => {
      this._toasts.update(toasts => [...toasts, toast]);
    });

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: string) {
    queueMicrotask(() => {
      this._toasts.update(toasts => toasts.filter(t => t.id !== id));
    });
  }
}
