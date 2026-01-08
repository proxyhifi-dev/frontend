import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-trade-logs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trade-logs.component.html'
})
export class TradeLogsComponent {
  @Input() results: any;
}
