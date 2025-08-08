export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  API = 'API_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class ErrorService {
  private static isDevelopment = import.meta.env.DEV;

  static createError(
    type: ErrorType,
    message: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ): AppError {
    return {
      type,
      message,
      originalError,
      timestamp: new Date(),
      context,
    };
  }

  static handleError(error: AppError): void {
    // In development, log full error details
    if (this.isDevelopment) {
      console.error('Application Error:', {
        ...error,
        stack: error.originalError instanceof Error ? error.originalError.stack : undefined,
      });
    } else {
      // In production, log minimal info
      console.error(`${error.type}: ${error.message}`);
    }

    // Here you could also send errors to a monitoring service
    // this.sendToMonitoring(error);
  }

  static handleApiError(error: unknown, operation: string): AppError {
    let appError: AppError;

    if (error instanceof Error) {
      if (error.message.includes('Network')) {
        appError = this.createError(
          ErrorType.NETWORK,
          `Network error during ${operation}`,
          error,
          { operation }
        );
      } else {
        appError = this.createError(
          ErrorType.API,
          `API error during ${operation}: ${error.message}`,
          error,
          { operation }
        );
      }
    } else {
      appError = this.createError(
        ErrorType.UNKNOWN,
        `Unknown error during ${operation}`,
        error,
        { operation }
      );
    }

    this.handleError(appError);
    return appError;
  }

  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection.';
      case ErrorType.API:
        return 'Something went wrong. Please try again later.';
      case ErrorType.VALIDATION:
        return error.message; // Validation messages are usually user-friendly
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export const errorService = new ErrorService();