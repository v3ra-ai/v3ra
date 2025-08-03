import * as Sentry from '@sentry/nextjs';

interface TrackingEvent {
  name: string;
  properties?: Record<string, any>;
}

class Analytics {
  /**
   * Track a custom event in Hotjar and add breadcrumb to Sentry
   */
  track(event: TrackingEvent) {
    const { name, properties = {} } = event;
    
    // Track in Hotjar if available
    if (typeof window !== 'undefined' && window.hj) {
      window.hj('event', name);
      
      // For important properties, use virtual pageviews
      if (properties.page) {
        window.hj('vpv', properties.page);
      }
    }
    
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      message: name,
      category: 'user-action',
      level: 'info',
      data: properties,
      timestamp: Date.now() / 1000,
    });
    
    // Track in Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, properties);
    }
  }
  
  /**
   * Track page views
   */
  pageView(path: string, title?: string) {
    this.track({
      name: 'page_view',
      properties: {
        page: path,
        title: title || document.title,
      },
    });
  }
  
  /**
   * Track user interactions
   */
  interaction(action: string, category: string, label?: string, value?: number) {
    this.track({
      name: 'interaction',
      properties: {
        action,
        category,
        label,
        value,
      },
    });
  }
  
  /**
   * Track conversions
   */
  async conversion(type: string, value?: number, currency?: string) {
    this.track({
      name: 'conversion',
      properties: {
        type,
        value,
        currency,
      },
    });
    
    // Also track as Sentry span for performance monitoring
    await Sentry.startSpan({
      name: `conversion.${type}`,
      op: 'conversion',
    }, async (span) => {
      if (value) {
        span.setAttribute('value', value);
        span.setAttribute('currency', currency || 'points');
      }
    });
  }
  
  /**
   * Track errors with context
   */
  error(error: Error, context?: Record<string, any>) {
    // Track error event
    this.track({
      name: 'error',
      properties: {
        message: error.message,
        ...context,
      },
    });
    
    // Also capture in Sentry with context
    Sentry.captureException(error, {
      contexts: {
        analytics: context,
      },
    });
  }
  
  /**
   * Track feature usage
   */
  feature(featureName: string, action: 'view' | 'use' | 'complete', metadata?: Record<string, any>) {
    this.track({
      name: `feature_${action}`,
      properties: {
        feature: featureName,
        ...metadata,
      },
    });
  }
  
  /**
   * Track performance metrics
   */
  performance(metric: string, value: number, unit: string = 'ms') {
    this.track({
      name: 'performance_metric',
      properties: {
        metric,
        value,
        unit,
      },
    });
    
    // Also track in Sentry
    const span = Sentry.getActiveSpan();
    if (span) {
      span.setAttribute(metric, value);
      if (unit) {
        span.setAttribute(`${metric}.unit`, unit);
      }
    }
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Export convenience functions
export const trackEvent = analytics.track.bind(analytics);
export const trackPageView = analytics.pageView.bind(analytics);
export const trackInteraction = analytics.interaction.bind(analytics);
export const trackConversion = analytics.conversion.bind(analytics);
export const trackError = analytics.error.bind(analytics);
export const trackFeature = analytics.feature.bind(analytics);
export const trackPerformance = analytics.performance.bind(analytics);