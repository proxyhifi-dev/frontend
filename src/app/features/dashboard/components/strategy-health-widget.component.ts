import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StrategyHealth } from '../../../core/services/trading-store.service';

@Component({
  selector: 'app-strategy-health-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="strategy-health" *ngIf="health">
      <div class="header">
        <div>
          <h3>Strategy Health</h3>
          <span class="badge" [class]="health.status.toLowerCase()">
            {{ health.status }}
          </span>
        </div>
        <span class="timestamp">Updated {{ health.updatedAt }}</span>
      </div>
      <ul class="reasons">
        <li *ngFor="let reason of health.reasons">{{ reason }}</li>
      </ul>
      <div class="actions">
        <button
          type="button"
          class="btn-outline"
          [disabled]="!health.canManage || health.isPaused"
          (click)="pause.emit()"
        >
          Pause Trading
        </button>
        <button
          type="button"
          class="btn-primary"
          [disabled]="!health.canManage || !health.isPaused"
          (click)="resume.emit()"
        >
          Resume Trading
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .strategy-health {
        padding: 16px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--bg-card-hover);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      h3 {
        margin: 0;
        font-size: 15px;
      }

      .badge {
        margin-left: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }

      .badge.ok {
        background: rgba(34, 197, 94, 0.15);
        color: var(--success);
      }

      .badge.degraded {
        background: rgba(245, 158, 11, 0.15);
        color: var(--warning);
      }

      .badge.broken {
        background: rgba(248, 113, 113, 0.2);
        color: var(--danger);
      }

      .timestamp {
        font-size: 11px;
        color: var(--text-muted);
      }

      .reasons {
        margin: 0 0 12px;
        padding-left: 16px;
        font-size: 12px;
        color: var(--text-secondary);
      }

      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .btn-outline,
      .btn-primary {
        padding: 6px 12px;
        border-radius: 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .btn-outline {
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-primary);
      }

      .btn-primary {
        border: none;
        background: rgba(59, 130, 246, 0.2);
        color: var(--text-primary);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StrategyHealthWidgetComponent {
  @Input() health: StrategyHealth | null = null;
  @Output() pause = new EventEmitter<void>();
  @Output() resume = new EventEmitter<void>();
}
