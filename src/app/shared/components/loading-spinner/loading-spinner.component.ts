import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from 'src/app/core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div *ngIf="loading$ | async" class="loading-overlay">
      <div class="spinner-container">
        <div class="spinner-border" role="status"></div>
        <p>Loading...</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .spinner-container {
      background: white;
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .spinner-border {
      display: inline-block;
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    p { margin-top: 15px; color: #333; }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class LoadingSpinnerComponent {
  loading$ = this.loadingService.loading$;

  constructor(private loadingService: LoadingService) {}
}
