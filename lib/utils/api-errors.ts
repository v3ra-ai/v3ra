import { NextResponse } from "next/server";

export type ErrorCode = 
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: any;
}

const ERROR_MAP: Record<ErrorCode, { statusCode: number; defaultMessage: string }> = {
  BAD_REQUEST: { statusCode: 400, defaultMessage: 'Bad request' },
  UNAUTHORIZED: { statusCode: 401, defaultMessage: 'Authentication required' },
  FORBIDDEN: { statusCode: 403, defaultMessage: 'Access denied' },
  NOT_FOUND: { statusCode: 404, defaultMessage: 'Resource not found' },
  CONFLICT: { statusCode: 409, defaultMessage: 'Resource conflict' },
  UNPROCESSABLE_ENTITY: { statusCode: 422, defaultMessage: 'Validation failed' },
  RATE_LIMITED: { statusCode: 429, defaultMessage: 'Too many requests' },
  INTERNAL_ERROR: { statusCode: 500, defaultMessage: 'Internal server error' },
  SERVICE_UNAVAILABLE: { statusCode: 503, defaultMessage: 'Service temporarily unavailable' }
};

export class ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;

  constructor(code: ErrorCode, message?: string, details?: any) {
    const errorInfo = ERROR_MAP[code];
    super(message || errorInfo.defaultMessage);
    this.code = code;
    this.statusCode = errorInfo.statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  error: ApiError | Error | unknown,
  fallbackCode: ErrorCode = 'INTERNAL_ERROR'
): NextResponse {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details })
        }
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists',
            details: { field: prismaError.meta?.target }
          }
        },
        { status: 409 }
      );
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found'
          }
        },
        { status: 404 }
      );
    }
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    const errorInfo = ERROR_MAP[fallbackCode];
    return NextResponse.json(
      {
        error: {
          code: fallbackCode,
          message: process.env.NODE_ENV === 'production' 
            ? errorInfo.defaultMessage 
            : error.message
        }
      },
      { status: errorInfo.statusCode }
    );
  }

  // Handle unknown errors
  const errorInfo = ERROR_MAP[fallbackCode];
  return NextResponse.json(
    {
      error: {
        code: fallbackCode,
        message: errorInfo.defaultMessage
      }
    },
    { status: errorInfo.statusCode }
  );
}

/**
 * Wrap an async API handler with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Common validation helpers
 */
export const validate = {
  requiredString(value: any, fieldName: string): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      throw new ApiError('BAD_REQUEST', `${fieldName} is required`);
    }
    return value.trim();
  },

  requiredNumber(value: any, fieldName: string): number {
    const num = Number(value);
    if (isNaN(num)) {
      throw new ApiError('BAD_REQUEST', `${fieldName} must be a valid number`);
    }
    return num;
  },

  positiveNumber(value: any, fieldName: string): number {
    const num = this.requiredNumber(value, fieldName);
    if (num <= 0) {
      throw new ApiError('BAD_REQUEST', `${fieldName} must be greater than 0`);
    }
    return num;
  },

  enum<T extends string>(value: any, validValues: T[], fieldName: string): T {
    if (!validValues.includes(value)) {
      throw new ApiError(
        'BAD_REQUEST', 
        `${fieldName} must be one of: ${validValues.join(', ')}`
      );
    }
    return value as T;
  },

  uuid(value: any, fieldName: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const str = this.requiredString(value, fieldName);
    if (!uuidRegex.test(str)) {
      throw new ApiError('BAD_REQUEST', `${fieldName} must be a valid UUID`);
    }
    return str;
  }
};