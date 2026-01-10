import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StrategyConfig {
  name?: string;
  mode?: string;
  maxPositions?: number;
  scanIntervalSeconds?: number;
  riskPerTradePercent?: number;
  dailyLossLimitPercent?: number;
  universe?: string;
}

export interface RegimeStatus {
  regime?: string;
  confidence?: number;
  lastUpdated?: string;
  notes?: string;
}

export interface ScoringSummary {
  signalId?: number;
  symbol?: string;
  decision?: string;
  reason?: string;
  score?: number;
}

@Injectable({ providedIn: 'root' })
export class StrategyService {
  private readonly apiUrl = `${environment.apiUrl}/strategy`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<StrategyConfig> {
    return this.http.get<StrategyConfig>(`${this.apiUrl}/config`);
  }

  getRegime(): Observable<RegimeStatus> {
    return this.http.get<RegimeStatus>(`${this.apiUrl}/regime`);
  }

  getScoringSummary(): Observable<ScoringSummary[]> {
    return this.http.get<ScoringSummary[]>(`${this.apiUrl}/scoring-summary`);
  }
}
