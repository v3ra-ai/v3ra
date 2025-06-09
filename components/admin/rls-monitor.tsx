"use client";

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface RLSTable {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  has_service_role_policy?: boolean;
}

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  user_id?: string;
  metadata?: unknown;
  created_at: string;
}

export function RLSMonitor() {
  const [rlsTables, setRlsTables] = useState<RLSTable[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const fetchRLSStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/rls/status');
      if (!response.ok) {
        throw new Error('Failed to fetch RLS status');
      }
      
      const result = await response.json();
      if (result.success) {
        setRlsTables(result.data.tables || []);
        setAuditLogs(result.data.auditLogs || []);
      } else {
        throw new Error(result.error || 'Failed to get RLS status');
      }
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('RLS status error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRLSStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRLSStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getTableRiskLevel = (table: RLSTable) => {
    const criticalTables = ['User', 'UserCredit', 'PaymentLog'];
    const mediumRiskTables = ['Validator', 'ValidatorResponse', 'VoteSession'];
    
    if (criticalTables.includes(table.table_name)) return 'critical';
    if (mediumRiskTables.includes(table.table_name)) return 'medium';
    return 'low';
  };

  const tablesWithRLS = rlsTables.filter(t => t.rls_enabled);
  const tablesWithoutRLS = rlsTables.filter(t => !t.rls_enabled);
  const progress = rlsTables.length > 0 ? (tablesWithRLS.length / rlsTables.length) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">RLS Monitor</h2>
          <p className="text-muted-foreground">
            Row Level Security status and implementation progress
          </p>
        </div>
        <Button
          onClick={fetchRLSStatus}
          disabled={loading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Implementation Progress</CardTitle>
          <CardDescription>
            {tablesWithRLS.length} of {rlsTables.length} tables protected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-4" />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{tablesWithRLS.length}</div>
              <div className="text-sm text-muted-foreground">Protected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{tablesWithoutRLS.length}</div>
              <div className="text-sm text-muted-foreground">Unprotected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{rlsTables.length}</div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">Table Status</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="phases">Implementation Phases</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <div className="grid gap-4">
            {rlsTables.map((table) => {
              const risk = getTableRiskLevel(table);
              return (
                <Card key={table.table_name}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      {table.rls_enabled ? (
                        <Lock className="h-5 w-5 text-green-600" />
                      ) : (
                        <Unlock className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{table.table_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {table.policy_count} policies
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={risk === 'critical' ? 'destructive' : risk === 'medium' ? 'default' : 'secondary'}>
                        {risk} risk
                      </Badge>
                      <Badge variant={table.rls_enabled ? 'default' : 'outline'}>
                        {table.rls_enabled ? 'RLS Enabled' : 'RLS Disabled'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          {auditLogs.length > 0 ? (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{log.operation} on {log.table_name}</div>
                        <div className="text-sm text-muted-foreground">
                          User: {log.user_id || 'System'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No audit logs available
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Phase 1: Low Risk Tables </CardTitle>
                <CardDescription>Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  <li></li>
                  <li></li>
                  <li></li>
                  <li></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phase 2: Medium Risk Tables </CardTitle>
                <CardDescription>In Progress</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  <li></li>
                  <li></li>
                  <li></li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phase 3: Critical Tables </CardTitle>
                <CardDescription>Pending</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  <li></li>
                  <li></li>
                  <li></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
