import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, Subject, timer } from 'rxjs';
import { map, scan, shareReplay, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { WebSocketService } from '../../core/websocket/websocket.service';
import { BotService } from '../../core/services/bot.service';
import { StoreService } from '../../core/services/store.service';
import { TradingStoreService } from '../../core/services/trading-store.service';
import { CurrencyInrPipe } from '../../shared/pipes/currency-inr-pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { PositionView } from '../../core/models/domain.model';
import { StrategyHealthWidgetComponent } from './components/strategy-health-widget.component';
import { ModeStore } from '../../core/services/mode-store.service';
import { SafetyStatusService, SafetyLockState } from '../../core/services/safety-status.service';

interface SortState {
  key: 'symbol' | 'pnl' | 'rMultiple' | 'stopDistance' | 'timeHeld';
  direction: 'asc' | 'desc';
}

interface PositionRow extends PositionView {
  stopDistance: number | null;
  timeHeldLabel: string;
  rMultiple: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CurrencyInrPipe,
    PercentFormatPipe,
    StrategyHealthWidgetComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {
  private wsService = inject(WebSocketService);
  private botService = inject(BotService);
  private store = inject(StoreService);
  private modeStore = inject(ModeStore);
  private tradingStore = inject(TradingStoreService);
  private safetyStatus = inject(SafetyStatusService);

  private readonly refreshTrigger$ = new Subject<void>();
  private readonly sortState$ = new BehaviorSubject<SortState>({ key: 'pnl', direction: 'desc' });
  private readonly tick$ = timer(0, 1000);

  readonly filterControl = new FormControl('', { nonNullable: true });
  readonly connectionStatus$ = this.wsService.connectionStatus$;
  readonly botControlSupported$ = this.botService.controlSupported$;

  readonly reloadSnapshot$ = this.refreshTrigger$.pipe(
    withLatestFrom(this.modeStore.mode$),
    switchMap(([, mode]) => this.tradingStore.refreshSnapshot(mode))
  );

  readonly scanCountdown$ = this.tick$.pipe(
    withLatestFrom(this.tradingStore.botStatus$),
    map(([, bot]) => bot),
    scan((countdown, bot) => {
      if (bot.isPaused) {
        return countdown || bot.scanInterval;
      }
      const interval = bot.scanInterval || 45;
      return countdown > 0 ? countdown - 1 : interval;
    }, 0),
    startWith(0),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly scanProgress$ = combineLatest([this.scanCountdown$, this.tradingStore.botStatus$]).pipe(
    map(([countdown, bot]) => {
      const interval = bot.scanInterval || 45;
      return interval ? ((interval - countdown) / interval) * 100 : 0;
    })
  );

  readonly positionsView$ = combineLatest([
    this.tradingStore.positions$,
    this.filterControl.valueChanges.pipe(startWith('')),
    this.sortState$
  ]).pipe(
    map(([positions, filter, sort]) => {
      const term = filter.trim().toLowerCase();
      const filtered = term
        ? positions.filter((position) => position.symbol.toLowerCase().includes(term))
        : positions;

      const rows = filtered.map((position) => this.toPositionRow(position));

      const sorted = [...rows].sort((a, b) => {
        const multiplier = sort.direction === 'asc' ? 1 : -1;
        switch (sort.key) {
          case 'symbol':
            return a.symbol.localeCompare(b.symbol) * multiplier;
          case 'rMultiple':
            return (a.rMultiple - b.rMultiple) * multiplier;
          case 'stopDistance':
            return ((a.stopDistance ?? 0) - (b.stopDistance ?? 0)) * multiplier;
          case 'timeHeld':
            return a.timeHeldLabel.localeCompare(b.timeHeldLabel) * multiplier;
          case 'pnl':
          default:
            return (a.pnl - b.pnl) * multiplier;
        }
      });

      return sorted;
    })
  );

  readonly vm$ = combineLatest({
    connectionStatus: this.connectionStatus$,
    account: this.tradingStore.accountOverview$,
    botStatus: this.tradingStore.botStatus$,
    riskSummary: this.tradingStore.riskSummary$,
    strategyHealth: this.tradingStore.strategyHealth$,
    lastUpdate: this.tradingStore.lastUpdate$,
    loading: this.tradingStore.dashboardLoading$,
    error: this.tradingStore.dashboardError$,
    alerts: this.tradingStore.alerts$,
    trades: this.tradingStore.trades$,
    positions: this.tradingStore.positions$,
    mode: this.modeStore.mode$,
    modeSupported: this.modeStore.modeSupported$,
    botControlSupported: this.botControlSupported$,
    lockState: this.safetyStatus.lockState$,
    // allow template to safely optional-chain user fields during initial load
    user: this.store.state$.pipe(map((state) => state.user ?? null))
  }).pipe(
    map((vm) => {
      const dailyPnlPercent = vm.account.totalCapital
        ? (vm.account.dailyPnl / vm.account.totalCapital) * 100
        : 0;
      const monthlyPnlPercent = vm.account.totalCapital
        ? (vm.account.monthlyPnl / vm.account.totalCapital) * 100
        : 0;
      const circuitUsage = vm.riskSummary.dailyLossLimit
        ? Math.min(100, (Math.abs(vm.riskSummary.dailyLossUsed) / vm.riskSummary.dailyLossLimit) * 100)
        : 0;

      return {
        ...vm,
        isLiveMode: vm.mode === 'LIVE',
        dailyPnlPercent,
        monthlyPnlPercent,
        circuitUsage
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  reloadDashboard(): void {
    this.refreshTrigger$.next();
  }

  setSort(key: SortState['key']): void {
    const current = this.sortState$.value;
    const direction = current.key === key && current.direction === 'desc' ? 'asc' : 'desc';
    this.sortState$.next({ key, direction });
  }

  toggleMode(isLiveMode: boolean, modeSupported: boolean, lockState: SafetyLockState): void {
    if (!modeSupported || lockState.locked) {
      return;
    }
    const nextMode = isLiveMode ? 'PAPER' : 'LIVE';
    this.modeStore.setMode(nextMode).subscribe();
  }

  toggleKillSwitch(isPaused: boolean, botControlSupported: boolean, lockState: SafetyLockState): void {
    if (lockState.locked) {
      this.tradingStore.addAlert({
        type: 'warning',
        message: lockState.reason || 'Trading controls are locked.',
        timestamp: new Date().toISOString()
      });
      return;
    }
    if (!botControlSupported) {
      this.tradingStore.addAlert({
        type: 'warning',
        message: 'Bot control is not supported by the current backend.',
        timestamp: new Date().toISOString()
      });
      return;
    }
    this.botService.setBotStatus(!isPaused).subscribe({
      next: () => this.tradingStore.updateBotStatus({ isPaused: !isPaused }),
      error: () => this.tradingStore.addAlert({
        type: 'error',
        message: 'Unable to update trading state',
        timestamp: new Date().toISOString()
      })
    });
  }

  trackBySymbol(index: number, item: PositionRow): string {
    return item.symbol;
  }

  trackByAlert(index: number, item: { id: string }): string {
    return item.id;
  }

  private toPositionRow(position: PositionView): PositionRow {
    const stopDistance = position.stopLoss && position.entryPrice
      ? ((position.entryPrice - position.stopLoss) / position.entryPrice) * 100
      : null;
    const entryTime = position.entryTime ?? position.openedAt ?? position.createdAt;
    const timeHeldLabel = entryTime ? this.formatDuration(Date.now() - new Date(entryTime).getTime()) : '—';

    return {
      ...position,
      stopDistance,
      timeHeldLabel,
      rMultiple: position.rMultiple ?? 0
    };
  }

  private formatDuration(milliseconds: number): string {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      return '—';
    }
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
