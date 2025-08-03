import * as Sentry from '@sentry/nextjs';
import { createLogger } from '@/lib/logger';

const logger = createLogger('apm');

// Custom performance metrics
export const APM = {
  // Track API response times
  trackApiCall(endpoint: string, duration: number, status: number) {
    const span = Sentry.getActiveSpan();
    if (span) {
      span.setAttribute('api.duration', duration);
      span.setAttribute('api.endpoint', endpoint);
      span.setAttribute('api.status', status);
    }
    
    // Log slow APIs
    if (duration > 1000) {
      logger.warn('Slow API response', {
        endpoint,
        duration,
        status,
      });
    }
  },

  // Track database query performance
  trackDatabaseQuery(operation: string, table: string, duration: number) {
    Sentry.startSpan({
      op: 'db.query',
      name: `${operation} ${table}`,
    }, (span) => {
      span.setAttribute('db.operation', operation);
      span.setAttribute('db.table', table);
      span.setAttribute('db.duration', duration);
    });
    
    // Log slow queries
    if (duration > 100) {
      logger.warn('Slow database query', {
        operation,
        table,
        duration,
      });
    }
  },

  // Track cache performance
  trackCacheOperation(operation: 'hit' | 'miss' | 'set', key: string, duration?: number) {
    const span = Sentry.getActiveSpan();
    if (span) {
      span.setAttribute(`cache.${operation}`, true);
      if (duration) {
        span.setAttribute(`cache.${operation}.duration`, duration);
      }
    }
  },

  // Track custom business metrics
  trackBusinessMetric(metric: string, value: number, unit: string = 'none') {
    const span = Sentry.getActiveSpan();
    if (span) {
      span.setAttribute(metric, value);
      if (unit !== 'none') {
        span.setAttribute(`${metric}.unit`, unit);
      }
    }
    
    // Also send to logger for aggregation
    logger.info('Business metric', {
      metric,
      value,
      unit,
    });
  },

  // Track user actions
  trackUserAction(action: string, metadata?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message: action,
      category: 'user',
      level: 'info',
      data: metadata,
    });
  },

  // Track errors with context
  captureError(error: Error, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('error_context', context);
      }
      Sentry.captureException(error);
    });
  },

  // Create span for monitoring
  async startSpan<T>(name: string, op: string, callback: () => Promise<T>) {
    return Sentry.startSpan({
      name,
      op,
    }, callback);
  },

  // Monitor async operations
  async monitorAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return this.startSpan(name, 'function', async () => {
      const startTime = Date.now();
      
      try {
        const result = await operation();
        return result;
      } catch (error) {
        this.captureError(error as Error, { operation: name, ...metadata });
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        logger.info('Operation completed', {
          operation: name,
          duration,
          ...metadata,
        });
      }
    });
  },
};

// Export convenience functions
export const trackApiCall = APM.trackApiCall.bind(APM);
export const trackDatabaseQuery = APM.trackDatabaseQuery.bind(APM);
export const trackCacheOperation = APM.trackCacheOperation.bind(APM);
export const trackBusinessMetric = APM.trackBusinessMetric.bind(APM);
export const trackUserAction = APM.trackUserAction.bind(APM);
export const captureError = APM.captureError.bind(APM);
export const monitorAsync = APM.monitorAsync.bind(APM);