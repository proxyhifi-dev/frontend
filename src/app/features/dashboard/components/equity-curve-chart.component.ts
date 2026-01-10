import { ChangeDetectionStrategy, Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexStroke,
  ApexDataLabels,
  ApexYAxis,
  ApexFill,
  ApexTooltip,
  ApexLegend
} from 'ng-apexcharts';

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  fill: ApexFill;
  tooltip: ApexTooltip;
  colors: string[];
  legend?: ApexLegend;
}

@Component({
  selector: 'app-equity-curve-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './equity-curve-chart.component.html',
  styleUrls: ['./equity-curve-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquityCurveChartComponent implements OnInit, OnChanges {
  @Input() data: any[] = [];
  @Input() timeRange: string = '1D';

  public chartOptions: Partial<ChartOptions> = {};

  ngOnInit(): void {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['timeRange']) {
      this.updateChart();
    }
  }

  private initializeChart(): void {
    this.chartOptions = {
      series: [{
        name: 'Equity',
        data: []
      }],
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: true,
          type: 'x'
        },
        toolbar: {
          show: true
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false
        }
      },
      yaxis: {
        title: {
          text: 'Equity (₹)'
        },
        labels: {
          formatter: (value) => {
            return '₹' + value.toFixed(2);
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100]
        }
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy HH:mm'
        },
        y: {
          formatter: (value) => {
            return '₹' + value.toFixed(2);
          }
        }
      },
      colors: ['#00E396']
    };

    this.updateChart();
  }

  private updateChart(): void {
    if (this.data && this.data.length > 0) {
      const filteredData = this.filterDataByTimeRange(this.data, this.timeRange);
      
      this.chartOptions.series = [{
        name: 'Equity',
        data: filteredData.map((item: any) => ({
          x: new Date(item.timestamp).getTime(),
          y: item.equity
        }))
      }];
    }
  }

  private filterDataByTimeRange(data: any[], timeRange: string): any[] {
    const now = new Date();
    const ranges: { [key: string]: number } = {
      '1D': 1,
      '5D': 5,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      'ALL': 0
    };

    const days = ranges[timeRange] || 0;
    
    if (days === 0) {
      return data;
    }

    const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return data.filter((item: any) => new Date(item.timestamp) >= cutoffDate);
  }
}
