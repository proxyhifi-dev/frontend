import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recent-signals-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recent-signals-widget.component.html'
})
export class RecentSignalsWidgetComponent {
  @Input() signals: any[] = [];
}
