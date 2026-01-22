import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../models/api-error.model';

export const mapHttpError = (error: HttpErrorResponse): ApiError => {
  const fallback = error.error?.message || `Error: ${error.status}`;
  let userMessage = 'An unexpected error occurred';

  if (error.error instanceof ErrorEvent) {
    userMessage = `Error: ${error.error.message}`;
  } else {
    switch (error.status) {
      case 0:
        userMessage =
          'No response from server. Ensure the backend is reachable and CORS allows the UI origin.';
        break;
      case 400:
        userMessage = error.error?.message || 'Invalid request';
        break;
      case 401:
        userMessage = 'Session expired. Please login again.';
        break;
      case 403:
        userMessage =
          'Access denied. Ensure your account is authorized and the backend CORS settings allow the UI origin.';
        break;
      case 404:
        userMessage = 'Resource not found';
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      case 503:
        userMessage = 'Service temporarily unavailable';
        break;
      default:
        userMessage = fallback || 'Unexpected error';
    }
  }

  return {
    status: error.status,
    message: fallback,
    userMessage,
    isRetryable: error.status === 0 || error.status >= 500
  };
};
