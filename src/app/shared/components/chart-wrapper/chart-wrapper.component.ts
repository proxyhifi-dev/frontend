import { Component, AfterViewInit, Input } from '@angular/core';

declare const TradingView: { widget: (config: Record<string, unknown>) => void };

@Component({
  selector: 'app-tv-chart',
  template: `<div id="tv_chart_container"></div>`,
  styles: [`#tv_chart_container { height: 500px; width: 100%; }`]
})
export class ChartWrapperComponent implements AfterViewInit {
  @Input() symbol: string = 'NSE:NIFTY';

  ngAfterViewInit() {
    new TradingView.widget({
      "autosize": true,
      "symbol": this.symbol,
      "interval": "5",
      "timezone": "Asia/Kolkata",
      "theme": "dark",
      "style": "1",
      "locale": "in",
      "toolbar_bg": "#f1f3f6",
      "enable_publishing": false,
      "hide_side_toolbar": false,
      "allow_symbol_change": true,
      "container_id": "tv_chart_container"
    });
  }
}
