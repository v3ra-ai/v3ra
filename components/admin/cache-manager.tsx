'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Zap, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CacheStatus {
  isHit: boolean;
  lastUpdated: string | null;
  expiresAt: string | null;
  size: number;
  ttl: number;
}

interface CacheMetrics {
  hitRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
  averageResponseTime: number;
}

interface CacheHealth {
  metrics: CacheMetrics;
  status: CacheStatus;
  health: {
    isHealthy: boolean;
    recommendations: string[];
  };
}

export function CacheManager() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [cacheHealth, setCacheHealth] = useState<CacheHealth | null>(null);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchCacheStatus = async () => {
    try {
      const response = await fetch('/api/admin/cache/invalidate');
      const data = await response.json();
      if (data.success) {
        setCacheStatus(data.cache);
      }
    } catch (error) {
      console.error('Failed to fetch cache status:', error);
    }
  };

  const fetchCacheHealth = async () => {
    try {
      const response = await fetch('/api/admin/cache/health');
      const data = await response.json();
      if (data.success) {
        setCacheHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch cache health:', error);
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchCacheStatus(), fetchCacheHealth()]);
    setLastRefresh(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleInvalidateCache = async () => {
    setIsInvalidating(true);
    try {
      const response = await fetch('/api/admin/cache/invalidate', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // Refresh data after invalidation
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    } finally {
      setIsInvalidating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Validator Cache Management</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleInvalidateCache}
            disabled={isInvalidating}
          >
            {isInvalidating ? 'Invalidating...' : 'Invalidate Cache'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cache Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cache Status
            </CardTitle>
            <CardDescription>Current cache state and configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cacheStatus && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={cacheStatus.isHit ? 'default' : 'secondary'}>
                    {cacheStatus.isHit ? 'Active' : 'Empty'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Validators Cached</span>
                  <span className="text-sm">{cacheStatus.size}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">TTL</span>
                  <span className="text-sm">{formatDuration(cacheStatus.ttl)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Last Updated</span>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(cacheStatus.lastUpdated)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Expires At</span>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(cacheStatus.expiresAt)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Cache performance statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cacheHealth && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Hit Rate</span>
                    <span className="text-sm font-bold">
                      {cacheHealth.metrics.hitRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={cacheHealth.metrics.hitRate} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Total Requests</p>
                    <p className="text-2xl font-bold">{cacheHealth.metrics.totalRequests}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Avg Response Time</p>
                    <p className="text-2xl font-bold">
                      {cacheHealth.metrics.averageResponseTime.toFixed(1)}ms
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-600">Cache Hits</p>
                    <p className="text-xl font-bold">{cacheHealth.metrics.hits}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">Cache Misses</p>
                    <p className="text-xl font-bold">{cacheHealth.metrics.misses}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Status Card */}
      {cacheHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Health Status
            </CardTitle>
            <CardDescription>Cache health and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={cacheHealth.health.isHealthy ? 'default' : 'destructive'}
                  className="text-sm"
                >
                  {cacheHealth.health.isHealthy ? 'Healthy' : 'Needs Attention'}
                </Badge>
              </div>
              {cacheHealth.health.recommendations.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {cacheHealth.health.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground text-right">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
