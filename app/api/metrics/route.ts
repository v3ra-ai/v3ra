import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/monitoring/metrics-collector';
import { rateLimitModerate } from '@/lib/rate-limit/index';
import { createLogger } from '@/lib/logger';

const logger = createLogger('metrics-api');

export const GET = rateLimitModerate(async (request: NextRequest) => {
  try {
    // Check for authorization (optional - implement based on your security needs)
    const authHeader = request.headers.get('authorization');
    if (process.env.METRICS_AUTH_TOKEN && authHeader !== `Bearer ${process.env.METRICS_AUTH_TOKEN}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const metric = searchParams.get('metric');
    const window = parseInt(searchParams.get('window') || '300000'); // Default 5 minutes

    // If specific metric requested
    if (metric) {
      const stats = metrics.getStats(metric, window);
      if (!stats) {
        return NextResponse.json(
          { error: 'Metric not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        metric,
        window,
        stats,
        latest: metrics.getLatest(metric),
        history: metrics.getMetrics(metric, Date.now() - window),
      });
    }

    // Return metrics in requested format
    if (format === 'prometheus') {
      const prometheusData = metrics.toPrometheus();
      return new NextResponse(prometheusData, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
        },
      });
    }

    // Return all metrics summary in JSON
    const allMetrics = metrics.getMetricNames().map(name => ({
      name,
      latest: metrics.getLatest(name),
      stats: metrics.getStats(name, window),
    }));

    // Add some system metrics
    const memUsage = process.memoryUsage();
    const systemMetrics = {
      process: {
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
        },
        pid: process.pid,
        version: process.version,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      metrics: allMetrics,
      system: systemMetrics,
    });
    
  } catch (error) {
    logger.error({ error }, 'Failed to retrieve metrics');
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
});