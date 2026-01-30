import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, combineLatest, of, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import {
  CircuitBreakerStatus,
  EmergencyStatus,
  ReconciliationStatus,
  RiskService
} from './risk.service';

export type SystemMode = 'NORMAL' | 'SAFE MODE' | 'EMERGENCY';

export interface SafetyLockState {
  locked: boolean;
  mode: SystemMode;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class SafetyStatusService implements OnDestroy {
  private readonly emergencyStorageKey = 'emergencyMode';
  private readonly emergencyModeSubject = new BehaviorSubject<boolean>(this.loadEmergencyMode());
  private readonly emergencyStatusSubject = new BehaviorSubject<EmergencyStatus | null>(null);
  private readonly safeModeSubject = new BehaviorSubject<CircuitBreakerStatus | null>(null);
  private readonly reconciliationSubject = new BehaviorSubject<ReconciliationStatus | null>(null);
  private readonly destroy$ = new Subject<void>();

  readonly emergencyMode$ = this.emergencyModeSubject.asObservable();
  readonly emergencyStatus$ = this.emergencyStatusSubject.asObservable();
  readonly safeMode$ = this.safeModeSubject.asObservable();
  readonly reconciliation$ = this.reconciliationSubject.asObservable();

  readonly systemMode$ = combineLatest([
    this.emergencyMode$,
    this.safeMode$,
    this.reconciliation$
  ]).pipe(
    map(([emergency, safeMode, reconciliation]) => {
      if (emergency) {
        return 'EMERGENCY';
      }
      if (safeMode?.triggered || reconciliation?.mismatch) {
        return 'SAFE MODE';
      }
      return 'NORMAL';
    })
  );

  readonly lockState$ = combineLatest([
    this.emergencyMode$,
    this.safeMode$,
    this.reconciliation$
  ]).pipe(
    map(([emergency, safeMode, reconciliation]) => {
      if (emergency) {
        return {
          locked: true,
          mode: 'EMERGENCY',
          reason: 'Manual panic activated. Trading is locked until cleared by operations.'
        } as SafetyLockState;
      }
      if (reconciliation?.mismatch) {
        const symbols = reconciliation.affectedSymbols?.length
          ? ` Affected symbols: ${reconciliation.affectedSymbols.join(', ')}.`
          : '';
        return {
          locked: true,
          mode: 'SAFE MODE',
          reason: `${reconciliation.reason || 'Reconciliation mismatch detected.'}${symbols}`
        } as SafetyLockState;
      }
      if (safeMode?.triggered) {
        return {
          locked: true,
          mode: 'SAFE MODE',
          reason: safeMode.reason || 'Risk circuit breaker triggered.'
        } as SafetyLockState;
      }
      return { locked: false, mode: 'NORMAL', reason: '' } as SafetyLockState;
    })
  );

  readonly tradingLocked$ = this.lockState$.pipe(map((state) => state.locked));

  constructor(private riskService: RiskService) {
    timer(0, 10000)
      .pipe(
        switchMap(() => this.riskService.getCircuitBreakerStatus().pipe(catchError(() => of(null)))),
        takeUntil(this.destroy$)
      )
      .subscribe((status) => this.safeModeSubject.next(status));

    timer(0, 15000)
      .pipe(
        switchMap(() => this.riskService.getReconciliationStatus().pipe(catchError(() => of(null)))),
        takeUntil(this.destroy$)
      )
      .subscribe((status) => this.reconciliationSubject.next(status));

    combineLatest([this.emergencyMode$, timer(0, 5000)])
      .pipe(
        switchMap(([emergency]) =>
          emergency ? this.riskService.getEmergencyStatus().pipe(catchError(() => of(null))) : of(null)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((status) => this.emergencyStatusSubject.next(status));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isPanicSupported(): boolean {
    return this.riskService.isEmergencyStopSupported();
  }

  activateEmergencyMode(): void {
    this.emergencyModeSubject.next(true);
    this.persistEmergencyMode(true);
  }

  triggerGlobalPanic() {
    this.activateEmergencyMode();
    return this.riskService.triggerEmergencyStop();
  }

  private persistEmergencyMode(enabled: boolean): void {
    try {
      sessionStorage.setItem(this.emergencyStorageKey, enabled ? 'true' : 'false');
    } catch {
      // ignore storage failures
    }
  }

  private loadEmergencyMode(): boolean {
    try {
      return sessionStorage.getItem(this.emergencyStorageKey) === 'true';
    } catch {
      return false;
    }
  }
}
