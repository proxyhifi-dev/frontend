import { Component, Input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-recent-signals-widget',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './recent-signals-widget.component.html'
})
export class RecentSignalsWidgetComponent {
  @Input() signals: any[] = [];
}
