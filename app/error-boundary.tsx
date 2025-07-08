'use client';

import { useEffect } from 'react';
import { formatError } from '@/lib/utils/error-handler';

export default function GlobalErrorBoundary() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      const error = formatError(event);
      console.error('[Global Error]', error);
    };
    
    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const error = formatError(event.reason);
      console.error('[Unhandled Promise Rejection]', error);
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