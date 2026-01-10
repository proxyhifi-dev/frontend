import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import {
  RegimeStatus,
  ScoringSummary,
  StrategyConfig,
  StrategyService
} from '../../core/services/strategy.service';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';

@Component({
  selector: 'app-strategy',
  standalone: true,
  imports: [CommonModule, PercentFormatPipe],
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.scss']
})
export class StrategyComponent implements OnInit {
  config?: StrategyConfig;
  regime?: RegimeStatus;
  scoring: ScoringSummary[] = [];
  configLoading = false;
  regimeLoading = false;
  scoringLoading = false;
  configError = '';
  regimeError = '';
  scoringError = '';

  constructor(private strategyService: StrategyService) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadRegime();
    this.loadScoring();
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
}
