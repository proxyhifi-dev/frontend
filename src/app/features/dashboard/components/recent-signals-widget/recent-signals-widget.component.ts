import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyInrPipe } from '../../../../shared/pipes/currency-inr-pipe';
import { Signal } from '../../../../core/models/domain.model';

@Component({
  selector: 'app-recent-signals-widget',
  standalone: true,
  imports: [CommonModule, CurrencyInrPipe],
  templateUrl: './recent-signals-widget.component.html'
})
export class RecentSignalsWidgetComponent {
  @Input() signals: Signal[] = [];
}
