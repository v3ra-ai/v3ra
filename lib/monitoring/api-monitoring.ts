import { NextRequest, NextResponse } from 'next/server';
import { trackApiCall } from './apm';

export function withApiMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>,
  apiName?: string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const endpoint = apiName || new URL(request.url).pathname;
    
    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      // Track the API call
      trackApiCall(endpoint, duration, response.status);
      
      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Api-Version', '1.0');
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed API call
      trackApiCall(endpoint, duration, 500);
      
      throw error;
    }
  };
}