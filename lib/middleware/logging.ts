import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('middleware');

export function withLogging(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const method = request.method;
    const path = new URL(request.url).pathname;
    let userId: string | undefined;
    let statusCode = 200;
    let error: Error | undefined;

    try {
      // Try to get user ID from headers (set by auth middleware)
      userId = request.headers.get('x-user-id') || undefined;

      // Execute the handler
      const response = await handler(request);
      statusCode = response.status;

      // Log the request
      const duration = Date.now() - start;
      logger.info(`${method} ${path} ${statusCode} ${duration}ms`, { userId });

      return response;
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      statusCode = 500;
      
      // Log the error
      const duration = Date.now() - start;
      logger.error(`${method} ${path} ${statusCode} ${duration}ms - Error`, { 
        userId, 
        error: error.message,
        stack: error.stack 
      });

      // Return error response
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}