import { NextResponse } from 'next/server';

export enum ErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  INVALID_CSRF_TOKEN = 'INVALID_CSRF_TOKEN',
}

export interface ErrorResponse {
  error: string;
  code: ErrorCode;
  details?: any;
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