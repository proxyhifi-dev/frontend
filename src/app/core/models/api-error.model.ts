export interface ApiError {
  status: number;
  message: string;
  userMessage: string;
  isRetryable: boolean;
}
