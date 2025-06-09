"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface AllocationRecord {
  id: number;
  allocation_date: string;
  users_updated: number;
  users_failed: number;
  users_skipped: number;
  total_credits_allocated: number;
  execution_time_ms: number | null;
  error_details: unknown[] | null;
  created_at: string;
}

interface AllocationStats {
  total_users_updated: number;
  total_users_failed: number;
  total_users_skipped: number;
  total_credits_allocated: number;
}

export function CreditAllocationMonitor() {
  const [allocations, setAllocations] = useState<AllocationRecord[]>([]);
  const [stats, setStats] = useState<AllocationStats | null>(null);
  const [todayStatus, setTodayStatus] = useState<{
    allocated: boolean;
    users_updated?: number;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch allocation history
      const response = await fetch('/api/admin/credits/allocations?limit=10');
      if (!response.ok) throw new Error('Failed to fetch allocations');
      
      const data = await response.json();
      setAllocations(data.allocations || []);
      setStats(data.statistics || null);

      // Check today's status
      const statusResponse = await fetch('/api/admin/credits/allocations/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString().split('T')[0] }),
      });
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setTodayStatus(statusData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const triggerAllocation = async (force: boolean = false) => {
    setTriggering(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/credits/allocations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to trigger allocation');
      }
      
      const result = await response.json();
      
      // Show success message
      if (result.success) {
        await fetchAllocations(); // Refresh data
      } else {
        setError(result.message || 'Allocation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger allocation');
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Status */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Credit Allocation Status</CardTitle>
          <CardDescription>
            Monitor and manage the automated daily credit allocation system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Today&apos;s Allocation</p>
              <div className="flex items-center gap-2">
                {todayStatus?.allocated ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Completed</span>
                    <Badge variant="secondary">
                      {todayStatus.users_updated} users updated
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Pending</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAllocations()}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => triggerAllocation(false)}
                disabled={triggering || todayStatus?.allocated}
              >
                {triggering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Run Now
              </Button>
              {todayStatus?.allocated && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => triggerAllocation(true)}
                  disabled={triggering}
                >
                  Force Run
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users_updated.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Credits Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_credits_allocated.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Failed Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.total_users_failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Users Skipped</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.total_users_skipped}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Allocation History */}
      <Card>
        <CardHeader>
          <CardTitle>Allocation History</CardTitle>
          <CardDescription>
            Recent daily credit allocation runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Users Updated</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Skipped</TableHead>
                <TableHead>Execution Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell className="font-medium">
                    {new Date(allocation.allocation_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{allocation.users_updated.toLocaleString()}</TableCell>
                  <TableCell>{allocation.total_credits_allocated.toLocaleString()}</TableCell>
                  <TableCell>
                    {allocation.users_failed > 0 ? (
                      <Badge variant="destructive">{allocation.users_failed}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {allocation.users_skipped > 0 ? (
                      <Badge variant="secondary">{allocation.users_skipped}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {allocation.execution_time_ms ? (
                      <span className="text-sm text-muted-foreground">
                        {allocation.execution_time_ms}ms
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {allocation.error_details ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : allocation.users_failed > 0 ? (
                      <Badge variant="secondary">Partial</Badge>
                    ) : (
                      <Badge variant="default">Success</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {allocations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No allocation history found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}