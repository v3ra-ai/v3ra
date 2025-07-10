import { NextResponse } from 'next/server';

export enum ErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_CSRF_TOKEN = 'INVALID_CSRF_TOKEN',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: any;
}

export class ApiError extends Error {
  constructor(
    public code: keyof typeof ErrorCode,
    message?: string,
    public details?: any
  ) {
    super(message || code);
    this.name = 'ApiError';
  }
}

export function createErrorResponse(
  error: string,
  code: ErrorCode,
  status: number,
  details?: any
): NextResponse {
  const body: ErrorResponse = {
    error,
    code,
    ...(details && { details }),
  };

  return NextResponse.json(body, { status });
}

// Alias for backwards compatibility
export const errorResponse = createErrorResponse;

export const validate = {
  enum: <T>(value: any, allowedValues: T[], fieldName: string): T => {
    if (!allowedValues.includes(value)) {
      throw new ApiError('BAD_REQUEST', `Invalid ${fieldName}: ${value}`);
    }
    return value;
  },
  
  positiveNumber: (value: any, fieldName: string): number => {
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      throw new ApiError('BAD_REQUEST', `${fieldName} must be a positive number`);
    }
    return num;
  },
  
  string: (value: any, fieldName: string): string => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new ApiError('BAD_REQUEST', `${fieldName} must be a non-empty string`);
    }
    return value.trim();
  },
  
  uuid: (value: any, fieldName: string): string => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof value !== 'string' || !uuidRegex.test(value)) {
      throw new ApiError('BAD_REQUEST', `${fieldName} must be a valid UUID`);
    }
    return value;
  }
};