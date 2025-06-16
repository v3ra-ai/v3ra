'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Users,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModelDeprecationAlert {
  id: string;
  modelName: string;
  providerName: string;
  deprecatedAt: Date | string;
  replacementModel: string | null;
  affectedValidators: number;
}

interface LLMAlertPanelProps {
  alerts: ModelDeprecationAlert[];
  onResolve: () => void;
}

export function LLMAlertPanel({ alerts, onResolve }: LLMAlertPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<ModelDeprecationAlert | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [actionType, setActionType] = useState<'resolve' | 'migrate' | null>(null);

  const handleAction = async (alertId: string, action: 'resolve' | 'migrate') => {
    setIsResolving(true);
    try {
      const response = await fetch('/api/admin/llm-health/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedAlert(null);
        onResolve();
      } else {
        console.error('Failed to resolve alert:', data.error);
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="border border-destructive/50 bg-destructive/5 rounded-lg p-4 space-y-2"
          >
            {/* Alert Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    {alert.providerName}/{alert.modelName} deprecated
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(alert.deprecatedAt)}
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {alert.affectedValidators}
              </Badge>
            </div>

            {/* Replacement Suggestion */}
            {alert.replacementModel && (
              <div className="flex items-center gap-2 text-sm bg-background/50 rounded p-2">
                <span className="text-muted-foreground">Suggested replacement:</span>
                <code className="font-mono font-medium">{alert.replacementModel}</code>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {alert.replacementModel && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedAlert(alert);
                    setActionType('migrate');
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Auto-Migrate
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAlert(alert);
                  setActionType('resolve');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Resolved
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'migrate' ? 'Migrate Validators' : 'Resolve Alert'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'migrate' ? (
                <>
                  This will automatically update {selectedAlert?.affectedValidators} validators 
                  from <code className="font-mono">{selectedAlert?.modelName}</code> to{' '}
                  <code className="font-mono">{selectedAlert?.replacementModel}</code>.
                </>
              ) : (
                <>
                  Mark this deprecation alert as resolved. The affected validators will 
                  continue using the deprecated model until manually updated.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedAlert(null)}
              disabled={isResolving}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedAlert && handleAction(selectedAlert.id, actionType!)}
              disabled={isResolving}
            >
              {isResolving ? (
                <>Processing...</>
              ) : actionType === 'migrate' ? (
                <>Migrate All</>
              ) : (
                <>Mark Resolved</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}