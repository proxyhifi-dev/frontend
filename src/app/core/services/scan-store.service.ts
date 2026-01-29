import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ScanStoreService {
  private readonly isScanRunningSubject = new BehaviorSubject<boolean>(false);
  private readonly cooldownUntilSubject = new BehaviorSubject<number>(0);
  private readonly retryAfterSecondsSubject = new BehaviorSubject<number>(0);

  readonly isScanRunning$ = this.isScanRunningSubject.asObservable();
  readonly cooldownUntil$ = this.cooldownUntilSubject.asObservable();
  readonly retryAfterSeconds$ = this.retryAfterSecondsSubject.asObservable();

  get isScanRunning(): boolean {
    return this.isScanRunningSubject.value;
  }

  get cooldownUntil(): number {
    return this.cooldownUntilSubject.value;
  }

  get retryAfterSeconds(): number {
    return this.retryAfterSecondsSubject.value;
  }

  startScan(): void {
    this.isScanRunningSubject.next(true);
  }

  finishScan(): void {
    this.isScanRunningSubject.next(false);
  }

  setCooldown(seconds: number): void {
    const safeSeconds = Math.max(1, Math.floor(seconds || 0));
    const until = Date.now() + safeSeconds * 1000;
    this.cooldownUntilSubject.next(until);
    this.retryAfterSecondsSubject.next(safeSeconds);
  }

  clearCooldown(): void {
    this.cooldownUntilSubject.next(0);
    this.retryAfterSecondsSubject.next(0);
  }
}
