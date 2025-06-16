'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  TrendingDown,
  Info
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LLMProviderCard } from './llm-provider-card';
import { LLMAlertPanel } from './llm-alert-panel';
import { cn } from '@/lib/utils';

interface ProviderHealthSummary {
  provider: string;
  totalModels: number;
  healthyModels: number;
  degradedModels: number;
  deprecatedModels: number;
  offlineModels: number;
  overallHealth: number;
}

interface ModelDeprecationAlert {
  id: string;
  modelName: string;
  providerName: string;
  deprecatedAt: Date;
  replacementModel: string | null;
  affectedValidators: number;
}

interface SystemHealthReport {
  overallScore: number;
  providers: ProviderHealthSummary[];
  activeIssues: ModelDeprecationAlert[];
  recentProbes: any[];
}

export function LLMHealthDashboard() {
  const [healthReport, setHealthReport] = useState<SystemHealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/llm-health');
      const data = await response.json();
      if (data.success) {
        setHealthReport(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/llm-health', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        // Refresh the dashboard data
        await fetchHealthData();
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to run health check:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    setLastRefresh(new Date());
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: JSX.Element }> = {
      healthy: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      degraded: { variant: 'secondary', icon: <TrendingDown className="h-3 w-3" /> },
      deprecated: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
      offline: { variant: 'outline', icon: <XCircle className="h-3 w-3" /> }
    };

    const config = variants[status] || variants.offline;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!healthReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Failed to load health data</p>
        <Button onClick={fetchHealthData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">LLM Health Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of all LLM providers and models
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          <Button
            onClick={runHealthCheck}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Run Health Check
          </Button>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              System Health
              {getHealthIcon(healthReport.overallScore)}
            </CardTitle>
            <CardDescription>Overall LLM system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Health</span>
                <span className={cn("text-2xl font-bold", getHealthColor(healthReport.overallScore))}>
                  {healthReport.overallScore}%
                </span>
              </div>
              <Progress value={healthReport.overallScore} className="h-3" />
            </div>

            {/* Provider Summary */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Provider Status</h4>
              {healthReport.providers.map((provider) => (
                <button
                  key={provider.provider}
                  onClick={() => setSelectedProvider(provider.provider)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    selectedProvider === provider.provider
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{provider.provider}</span>
                    <span className="text-sm text-muted-foreground">
                      {provider.healthyModels}/{provider.totalModels} models
                    </span>
                  </div>
                  <Progress value={provider.overallHealth} className="h-2" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Center Panel: Active Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active Issues
              {healthReport.activeIssues.length > 0 && (
                <Badge variant="destructive">{healthReport.activeIssues.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>Deprecated models and alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {healthReport.activeIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active issues</p>
                <p className="text-sm text-muted-foreground">All models are functioning properly</p>
              </div>
            ) : (
              <LLMAlertPanel alerts={healthReport.activeIssues} onResolve={fetchHealthData} />
            )}
          </CardContent>
        </Card>

        {/* Right Panel: Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/validators'}
            >
              <Activity className="h-4 w-4 mr-2" />
              Manage Validators
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => window.location.href = '/admin/keys'}
            >
              <Info className="h-4 w-4 mr-2" />
              API Key Management
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={runHealthCheck}
              disabled={isRefreshing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Health Check
            </Button>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
              <div className="space-y-2 text-sm">
                {healthReport.recentProbes.slice(0, 5).map((probe, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-muted-foreground truncate">
                      {probe.provider}/{probe.model}
                    </span>
                    {getStatusBadge(probe.status)}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Details */}
      {selectedProvider && (
        <LLMProviderCard 
          provider={selectedProvider} 
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}