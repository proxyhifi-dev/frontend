import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isLoading()) {
      <div class="spinner-container" [class.overlay]="overlay">
        <div class="spinner">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          @if (message) {
            <p class="loading-message">{{ message }}</p>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .spinner-container.overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    }

    .spinner {
      text-align: center;
    }

    .spinner-border {
      width: 3rem;
      height: 3rem;
      border: 0.25em solid rgba(255, 255, 255, 0.2);
      border-right-color: #fff;
      border-radius: 50%;
      animation: spinner-border 0.75s linear infinite;
    }

    .loading-message {
      color: white;
      margin-top: 10px;
      font-size: 14px;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    @keyframes spinner-border {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() message?: string;
  @Input() overlay: boolean = false;
  
  private loadingService = inject(LoadingService);

  // Use signal directly
  isLoading = this.loadingService.isLoading;
}
