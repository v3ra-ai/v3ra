'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { formatError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/client-logger';

export default function GlobalErrorBoundary() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      const error = formatError(event);
      logger.error('[Global Error]', error);
      
      // Report to Sentry
      Sentry.captureException(event.error || new Error(event.message), {
        tags: {
          errorType: 'unhandledError',
        },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };
    
    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const error = formatError(event.reason);
      logger.error('[Unhandled Promise Rejection]', error);
      
      // Report to Sentry
      Sentry.captureException(event.reason || new Error('Unhandled promise rejection'), {
        tags: {
          errorType: 'unhandledRejection',
        },
      });
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
  
  return null;
}