import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingCount = 0;
  private readonly _isLoading = signal(false);
  readonly isLoading = this._isLoading.asReadonly();

  show() {
    this.loadingCount++;
    queueMicrotask(() => this._isLoading.set(true));
  }

  hide() {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      queueMicrotask(() => this._isLoading.set(false));
    }
  }

  reset() {
    this.loadingCount = 0;
    queueMicrotask(() => this._isLoading.set(false));
  }
}
