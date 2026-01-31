import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  RegimeStatus,
  ScoringSummary,
  StrategyConfig,
  StrategyService
} from '../../core/services/strategy.service';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { SettingsService, TradingSettings } from '../../core/services/settings.service';
import { SafetyStatusService, SystemMode } from '../../core/services/safety-status.service';
import { EMPTY_STATE_MESSAGES } from '../../shared/constants/empty-states';

@Component({
  selector: 'app-strategy',
  standalone: true,
  imports: [CommonModule, FormsModule, PercentFormatPipe],
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.scss']
})
export class StrategyComponent implements OnInit, OnDestroy {
  config?: StrategyConfig;
  regime?: RegimeStatus;
  scoring: ScoringSummary[] = [];
  configLoading = false;
  regimeLoading = false;
  scoringLoading = false;
  configError = '';
  regimeError = '';
  scoringError = '';
  settings?: TradingSettings;
  settingsLoading = false;
  settingsError = '';
  savingSettings = false;
  tradingLocked = false;
  lockReason = '';
  lockMode: SystemMode = 'NORMAL';
  readonly emptyStates = EMPTY_STATE_MESSAGES;
  private destroy$ = new Subject<void>();

  constructor(
    private strategyService: StrategyService,
    private settingsService: SettingsService,
    private safetyStatus: SafetyStatusService
  ) {}

  ngOnInit(): void {
    this.safetyStatus.lockState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.tradingLocked = state.locked;
        this.lockReason = state.reason;
        this.lockMode = state.mode;
      });
    this.loadConfig();
    this.loadRegime();
    this.loadScoring();
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfig(): void {
    this.configLoading = true;
    this.configError = '';
    this.strategyService.getConfig().pipe(
      finalize(() => (this.configLoading = false))
    ).subscribe({
      next: (config) => {
        this.config = config;
      },
      error: () => {
        this.configError = 'Unable to load strategy configuration.';
      }
    });
  }

  loadRegime(): void {
    this.regimeLoading = true;
    this.regimeError = '';
    this.strategyService.getRegime().pipe(
      finalize(() => (this.regimeLoading = false))
    ).subscribe({
      next: (regime) => {
        this.regime = regime;
      },
      error: () => {
        this.regimeError = 'Unable to load regime status.';
      }
    });
  }

  loadScoring(): void {
    this.scoringLoading = true;
    this.scoringError = '';
    this.strategyService.getScoringSummary().pipe(
      finalize(() => (this.scoringLoading = false))
    ).subscribe({
      next: (scoring) => {
        this.scoring = scoring ?? [];
      },
      error: () => {
        this.scoringError = 'Unable to load scoring breakdown.';
      }
    });
  }

  loadSettings(): void {
    this.settingsLoading = true;
    this.settingsError = '';
    this.settingsService.loadSettings().pipe(finalize(() => (this.settingsLoading = false))).subscribe({
      next: (settings) => {
        this.settings = settings;
      },
      error: () => {
        this.settingsError = 'Unable to load strategy settings.';
      }
    });
  }

  saveSettings(): void {
    if (this.tradingLocked) {
      this.settingsError = this.lockReason || 'Trading controls are locked.';
      return;
    }
    if (!this.settings) return;
    const validationError = this.validateSettings(this.settings);
    if (validationError) {
      this.settingsError = validationError;
      return;
    }
    this.savingSettings = true;
    this.settingsService.saveSettings(this.settings).pipe(finalize(() => (this.savingSettings = false))).subscribe({
      next: (saved) => {
        this.settings = saved;
      },
      error: () => {
        this.settingsError = 'Unable to save settings.';
      }
    });
  }

  private validateSettings(settings: TradingSettings): string | null {
    if (settings.maxPositions < 1) {
      return 'Max positions must be at least 1.';
    }
    if (settings.riskLimits.maxRiskPerTradePercent <= 0 || settings.riskLimits.maxDailyLossPercent <= 0) {
      return 'Risk limits must be greater than 0.';
    }
    return null;
  }
}
