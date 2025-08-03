// Performance monitoring utilities
import { createLogger } from '@/lib/logger';

const logger = createLogger('performance');
interface CoreWebVitals {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface PerformanceMetrics {
  customMetrics: Record<string, number>;
  coreWebVitals: CoreWebVitals;
  userAgent: string;
  isMobile: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private isBrowser = typeof window !== 'undefined';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Mark the start of a performance measurement
  mark(name: string): void {
    if (!this.isBrowser) return;
    
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
    this.metrics.set(`${name}-start`, Date.now());
  }

  // Mark the end and calculate duration
  measure(name: string): number {
    if (!this.isBrowser) return 0;
    
    const startTime = this.metrics.get(`${name}-start`);
    const endTime = Date.now();
    
    if (startTime) {
      const duration = endTime - startTime;
      this.metrics.set(name, duration);
      
      if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
      
      return duration;
    }
    
    return 0;
  }

  // Get Core Web Vitals
  getCoreWebVitals(): Promise<CoreWebVitals> {
    return new Promise((resolve) => {
      if (!this.isBrowser) {
        resolve({});
        return;
      }

      const vitals: CoreWebVitals = {};
      
      // Get LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lcpEntry = entries[entries.length - 1];
            vitals.lcp = lcpEntry.startTime;
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (_error) {
          // LCP not supported
        }
      }

      // Get FCP (First Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              vitals.fcp = fcpEntry.startTime;
            }
          });
          observer.observe({ type: 'paint', buffered: true });
        } catch (_error) {
          // FCP not supported
        }
      }

      // Get TTFB (Time to First Byte)
      if ('performance' in window && 'navigation' in performance) {
        try {
          const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navEntry) {
            vitals.ttfb = navEntry.responseStart - navEntry.requestStart;
          }
        } catch (_error) {
          // Navigation timing not supported
        }
      }

      // Return after a short delay to collect metrics
      setTimeout(() => resolve(vitals), 100);
    });
  }

  // Report performance metrics
  async reportMetrics(): Promise<void> {
    if (!this.isBrowser || process.env.NODE_ENV !== 'production') {
      return;
    }

    try {
      const vitals = await this.getCoreWebVitals();
      
      // Log to console for debugging
      const metrics: PerformanceMetrics = {
        customMetrics: Object.fromEntries(this.metrics),
        coreWebVitals: vitals,
        userAgent: navigator?.userAgent || 'unknown',
        isMobile: this.isMobile()
      };
      
      logger.info('Performance Metrics', metrics);

      // You can send these to an analytics service like Sentry or custom endpoint
      // await fetch('/api/performance', {
      //   method: 'POST',
      //   body: JSON.stringify({ metrics: this.metrics, vitals }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
    } catch (error) {
      logger.warn('Failed to report performance metrics:', error);
    }
  }

  // Check if device is mobile
  isMobile(): boolean {
    if (!this.isBrowser || !navigator?.userAgent) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Check if connection is slow
  isSlowConnection(): boolean {
    if (!this.isBrowser || !('connection' in navigator)) return false;
    try {
      const connection = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
      return connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g';
    } catch (_error) {
      return false;
    }
  }

  // Preload critical resources
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font' = 'script'): void {
    if (!this.isBrowser) return;
    
    try {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = type;
      if (type === 'font') {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    } catch (_error) {
      logger.warn(`Failed to preload resource: ${url}`, { error: _error });
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility function to measure component render time
export function measureComponentRender<T>(componentName: string, renderFn: () => T): T {
  performanceMonitor.mark(`component-${componentName}`);
  const result = renderFn();
  const duration = performanceMonitor.measure(`component-${componentName}`);
  
  if (duration > 100) {
    logger.warn(`Slow component render: ${componentName} took ${duration}ms`);
  }
  
  return result;
}

// Hook for React components
export function usePerformanceTracking(componentName: string) {
  const startTime = Date.now();
  
  return {
    measureAction: (actionName: string, action: () => void) => {
      performanceMonitor.mark(`${componentName}-${actionName}`);
      action();
      performanceMonitor.measure(`${componentName}-${actionName}`);
    },
    
    onUnmount: () => {
      const duration = Date.now() - startTime;
      if (duration > 5000) {
        logger.warn(`Component ${componentName} was mounted for ${duration}ms`);
      }
    }
  };
} 