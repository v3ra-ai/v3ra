'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelHealth {
  id: string;
  providerName: string;
  modelName: string;
  status: 'healthy' | 'degraded' | 'deprecated' | 'offline';
  errorRate: number | null;
  avgLatency: number | null;
  successRate: number | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  totalRequests: number;
  failedRequests: number;
  recentProbes: Array<{
    success: boolean;
    responseTimeMs: number | null;
    testedAt: string;
    error: string | null;
  }>;
}

interface LLMProviderCardProps {
  provider: string;
  onClose: () => void;
}

export function LLMProviderCard({ provider, onClose }: LLMProviderCardProps) {
  const [models, setModels] = useState<ModelHealth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProviderModels = async () => {
    try {
      const response = await fetch(`/api/admin/llm-health/models?provider=${provider}`);
      const data = await response.json();
      if (data.success) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch provider models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />;
      case 'deprecated':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      healthy: 'default',
      degraded: 'secondary',
      deprecated: 'destructive',
      offline: 'outline'
    };

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  const formatLatency = (ms: number | null | string) => {
    if (ms === null || ms === undefined) return 'N/A';
    // Convert string to number if needed
    const numValue = typeof ms === 'string' ? parseFloat(ms) : ms;
    if (isNaN(numValue) || numValue === 0) return 'N/A';
    if (numValue < 1000) return `${Math.round(numValue)}ms`;
    return `${(numValue / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number | null | string) => {
    if (value === null || value === undefined) return 'N/A';
    // Convert string to number if needed
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'N/A';
    return `${numValue.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{provider} Models</CardTitle>
            <CardDescription>
              Detailed health information for {models.length} models
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Activity className="h-8 w-8 animate-pulse text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className={cn(
                  "border rounded-lg p-4 space-y-3",
                  model.status === 'deprecated' && "border-destructive bg-destructive/5",
                  model.status === 'degraded' && "border-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"
                )}
              >
                {/* Model Header */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{model.modelName}</h4>
                  {getStatusBadge(model.status)}
                </div>

                {/* Model Stats */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Success Rate</span>
                    <p className="font-medium">{formatPercentage(model.successRate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Latency</span>
                    <p className="font-medium">{formatLatency(model.avgLatency)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Requests</span>
                    <p className="font-medium">{model.totalRequests}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Failed</span>
                    <p className="font-medium text-destructive">{model.failedRequests}</p>
                  </div>
                </div>

                {/* Error Message */}
                {model.lastErrorMessage && (
                  <div className="bg-destructive/10 text-destructive text-sm p-2 rounded">
                    <p className="font-medium">Last Error:</p>
                    <p className="text-xs mt-1 font-mono">{model.lastErrorMessage}</p>
                  </div>
                )}

                {/* Recent Probes */}
                {model.recentProbes.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Recent Health Checks</p>
                    <div className="flex gap-1">
                      {model.recentProbes.map((probe, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "w-8 h-8 rounded flex items-center justify-center text-xs",
                            probe.success 
                              ? "bg-green-100 text-green-700 dark:bg-green-950" 
                              : "bg-red-100 text-red-700 dark:bg-red-950"
                          )}
                          title={`${probe.success ? 'Success' : 'Failed'} - ${formatLatency(probe.responseTimeMs)}`}
                        >
                          {probe.success ? '✓' : '✗'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}