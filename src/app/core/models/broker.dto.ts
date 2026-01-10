export interface BrokerConnectionStatus {
  connected: boolean;
  broker?: string;
  clientId?: string;
  tokenExpiresAt?: string;
  tokenStatus?: string;
  lastError?: string;
}

export interface BrokerErrorLog {
  message: string;
  code?: string;
  time?: string;
}
