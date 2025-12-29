import { Component, ElementRef, Input, OnChanges, OnInit, ViewChild, SimpleChanges } from '@angular/core';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <span class="symbol">{{ symbol }}</span>
        <span class="timeframe">5m</span>
      </div>
      <div #chartContainer class="chart-area"></div>
    </div>
  `,
  styles: [`
    .chart-container {
      background: #1e222d;
      border: 1px solid #363c4e;
      border-radius: 8px;
      padding: 1rem;
      height: 400px;
      display: flex;
      flex-direction: column;
    }
    .chart-header {
      color: #d1d4dc;
      font-weight: bold;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
    }
    .chart-area {
      flex: 1;
      width: 100%;
    }
  `]
})
export class PriceChartComponent implements OnInit, OnChanges {
  @Input() symbol: string = '';
  @Input() data: any[] = []; // Expecting { time: '2023-10-01', open: 100, high: 105, low: 98, close: 102 }

  @ViewChild('chartContainer', { static: true }) container!: ElementRef;

  private chart!: IChartApi;
  private candlestickSeries!: ISeriesApi<'Candlestick'>;

  ngOnInit() {
    this.initChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.candlestickSeries) {
      this.candlestickSeries.setData(this.data);
    }
    if (changes['symbol'] && this.chart) {
        // Reset or fetch new data logic here if needed
    }
  }

  private initChart() {
    this.chart = createChart(this.container.nativeElement, {
      width: this.container.nativeElement.clientWidth,
      height: 350,
      layout: {
        background: { color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#363c4e' },
        horzLines: { color: '#363c4e' },
      },
      timeScale: {
        borderColor: '#485c7b',
      },
    });

    this.candlestickSeries = this.chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Handle Resize
    new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== this.container.nativeElement) { return; }
      const newRect = entries[0].contentRect;
      this.chart.applyOptions({ width: newRect.width });
    }).observe(this.container.nativeElement);
  }
}
