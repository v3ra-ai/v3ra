"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PredictionWithOutcomes {
  id: string;
  queryText: string;
  category: string | null;
  createdAt: string;
  resolutionDate: string | null;
  resolutionStatus: string;
  outcomes: Array<{
    outcomeText: string;
    consensusProbability: number;
  }>;
  resolutions: Array<{
    actualOutcome: string;
    resolvedAt: string;
    evidence: string | null;
  }>;
}

export function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionWithOutcomes[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, [activeTab]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictions?status=${activeTab}`);
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error("Error fetching predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "disputed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      sports: "bg-blue-100 text-blue-800",
      politics: "bg-purple-100 text-purple-800",
      finance: "bg-green-100 text-green-800",
      technology: "bg-orange-100 text-orange-800",
      general: "bg-gray-100 text-gray-800",
    };
    return colors[category || "general"] || colors.general;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Prediction History</h2>
        <Button onClick={fetchPredictions} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending predictions
            </div>
          ) : (
            predictions.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No resolved predictions yet
            </div>
          ) : (
            predictions.map((prediction) => (
              <PredictionCard key={prediction.id} prediction={prediction} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: PredictionWithOutcomes }) {
  const primaryOutcome = prediction.outcomes.sort(
    (a, b) => b.consensusProbability - a.consensusProbability
  )[0];

  const resolution = prediction.resolutions[0];
  const wasCorrect = resolution && primaryOutcome?.outcomeText === resolution.actualOutcome;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-lg font-medium">{prediction.queryText}</p>
            <div className="flex items-center gap-2 mt-2">
              {getStatusIcon(prediction.resolutionStatus)}
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true })}
              </span>
              {prediction.category && (
                <Badge className={getCategoryColor(prediction.category)}>
                  {prediction.category}
                </Badge>
              )}
            </div>
          </div>
          {wasCorrect !== undefined && (
            <Badge variant={wasCorrect ? "success" : "destructive"}>
              {wasCorrect ? "Correct" : "Incorrect"}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Predictions:</div>
          {prediction.outcomes.map((outcome, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className={resolution && resolution.actualOutcome === outcome.outcomeText ? "font-semibold" : ""}>
                  {outcome.outcomeText}
                </span>
                <span className="text-muted-foreground">
                  {(outcome.consensusProbability * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={outcome.consensusProbability * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        {resolution && (
          <div className="border-t pt-4">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Actual outcome:</span>
                <span>{resolution.actualOutcome}</span>
              </div>
              {resolution.evidence && (
                <div className="text-muted-foreground">
                  Evidence: {resolution.evidence}
                </div>
              )}
              <div className="text-muted-foreground">
                Resolved {formatDistanceToNow(new Date(resolution.resolvedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        )}

        {prediction.resolutionDate && prediction.resolutionStatus === "pending" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>
              Resolution expected: {new Date(prediction.resolutionDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}