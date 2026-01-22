import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-feature-unavailable',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="feature-unavailable">
      <div class="card glass-card">
        <h2>Feature not available</h2>
        <p>
          <strong>{{ featureLabel || 'This feature' }}</strong>
          is not exposed by the current backend deployment.
        </p>
        <p class="hint">
          If you expected this feature, confirm /api/ui/config lists the endpoint and refresh.
        </p>
        <div class="actions">
          <a routerLink="/dashboard" class="btn btn-primary">Go to Dashboard</a>
          <a routerLink="/status" class="btn btn-outline">View Status</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .feature-unavailable {
        min-height: calc(100vh - 160px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
      }

      .card {
        max-width: 520px;
        padding: 28px;
        text-align: center;
      }

      h2 {
        margin-bottom: 12px;
      }

      .hint {
        color: var(--text-secondary);
        margin-top: 6px;
      }

      .actions {
        margin-top: 20px;
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
    `
  ]
})
export class FeatureUnavailableComponent {
  featureLabel = '';

  constructor(private route: ActivatedRoute) {
    this.route.queryParamMap.subscribe((params) => {
      this.featureLabel = params.get('feature') ?? '';
    });
  }
}
