import { createLogger } from '@/lib/logger';

const logger = createLogger('metrics');

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private maxMetricsPerName = 1000; // Keep last 1000 data points per metric

  // Record a metric
  record(name: string, value: number, tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);

    // Keep only the last N metrics
    if (metricArray.length > this.maxMetricsPerName) {
      metricArray.shift();
    }

    // Log significant metrics
    if (name.includes('error') || name.includes('failure')) {
      logger.warn('Error metric recorded', { metric });
    }
  }

  // Increment a counter
  increment(name: string, tags?: Record<string, string>) {
    const current = this.getLatest(name)?.value || 0;
    this.record(name, current + 1, tags);
  }

  // Record a timing
  timing(name: string, duration: number, tags?: Record<string, string>) {
    this.record(`${name}.duration`, duration, tags);
    this.increment(`${name}.count`, tags);
  }

  // Get latest metric value
  getLatest(name: string): Metric | undefined {
    const metrics = this.metrics.get(name);
    return metrics?.[metrics.length - 1];
  }

  // Get metrics for a time range
  getMetrics(name: string, since?: number): Metric[] {
    const metrics = this.metrics.get(name) || [];
    if (!since) return metrics;
    
    return metrics.filter(m => m.timestamp >= since);
  }

  // Get all metric names
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  // Calculate statistics for a metric
  getStats(name: string, windowMs: number = 60000) {
    const metrics = this.getMetrics(name, Date.now() - windowMs);
    
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: metrics.length,
      sum,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
    };
  }

  // Export metrics in Prometheus format
  toPrometheus(): string {
    const lines: string[] = [];
    
    for (const [name, metrics] of this.metrics.entries()) {
      const latest = metrics[metrics.length - 1];
      if (!latest) continue;
      
      // Convert metric name to Prometheus format
      const promName = name.replace(/[.-]/g, '_');
      
      // Build labels string
      const labels = latest.tags
        ? '{' + Object.entries(latest.tags)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',') + '}'
        : '';
      
      lines.push(`# TYPE ${promName} gauge`);
      lines.push(`${promName}${labels} ${latest.value} ${latest.timestamp}`);
    }
    
    return lines.join('\n');
  }

  // Clear old metrics
  cleanup(olderThanMs: number = 3600000) { // Default 1 hour
    const cutoff = Date.now() - olderThanMs;
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp >= cutoff);
      if (filtered.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    }
  }
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

// Convenience functions
export const recordMetric = metrics.record.bind(metrics);
export const incrementCounter = metrics.increment.bind(metrics);
export const recordTiming = metrics.timing.bind(metrics);

// Auto-cleanup old metrics every hour
if (typeof window === 'undefined') {
  setInterval(() => {
    metrics.cleanup();
  }, 3600000);
}