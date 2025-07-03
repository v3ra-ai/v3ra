"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, TrendingUp, CheckCircle2, Clock, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { MarketBetting } from "@/components/truth-market/market-betting";

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

// Helper functions moved outside components
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
    sports: "text-green-400 bg-green-500/10",
    politics: "text-blue-400 bg-blue-500/10",
    finance: "text-emerald-400 bg-emerald-500/10",
    technology: "text-purple-400 bg-purple-500/10",
    crypto: "text-orange-400 bg-orange-500/10",
    climate: "text-teal-400 bg-teal-500/10",
    general: "text-zinc-400 bg-zinc-500/10",
  };
  return colors[category || "general"] || colors.general;
};

export function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionWithOutcomes[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "resolved">("pending");
  const [loading, setLoading] = useState(true);
  const [expandedMarketId, setExpandedMarketId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchPredictions}
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-200"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-zinc-800/50">
          <TabsTrigger value="pending" className="data-[state=active]:bg-zinc-800">Pending</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-zinc-800">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No pending predictions
            </div>
          ) : (
            predictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PredictionCard 
                  prediction={prediction} 
                  isMarketExpanded={expandedMarketId === prediction.id}
                  onToggleMarket={() => setExpandedMarketId(
                    expandedMarketId === prediction.id ? null : prediction.id
                  )}
                />
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Loading predictions...</div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No resolved predictions yet
            </div>
          ) : (
            predictions.map((prediction, index) => (
              <motion.div
                key={prediction.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <PredictionCard 
                  prediction={prediction} 
                  isMarketExpanded={expandedMarketId === prediction.id}
                  onToggleMarket={() => setExpandedMarketId(
                    expandedMarketId === prediction.id ? null : prediction.id
                  )}
                />
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PredictionCard({ 
  prediction, 
  isMarketExpanded, 
  onToggleMarket 
}: { 
  prediction: PredictionWithOutcomes;
  isMarketExpanded: boolean;
  onToggleMarket: () => void;
}) {
  const primaryOutcome = prediction.outcomes.sort(
    (a, b) => b.consensusProbability - a.consensusProbability
  )[0];

  const resolution = prediction.resolutions[0];
  const wasCorrect = resolution && primaryOutcome?.outcomeText === resolution.actualOutcome;

  return (
    <Card className="p-6 bg-zinc-900/50 border-zinc-800/50 hover:border-cyan-500/30 transition-all duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-base font-medium text-zinc-100">{prediction.queryText}</p>
            <div className="flex items-center gap-3 mt-2">
              {getStatusIcon(prediction.resolutionStatus)}
              <span className="text-xs text-zinc-500">
                {formatDistanceToNow(new Date(prediction.createdAt), { addSuffix: true })}
              </span>
              {prediction.category && (
                <Badge className={cn("text-xs font-medium", getCategoryColor(prediction.category))}>
                  {prediction.category}
                </Badge>
              )}
            </div>
          </div>
          {wasCorrect !== undefined && (
            <Badge 
              className={cn(
                "text-xs",
                wasCorrect 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              )}
            >
              {wasCorrect ? "Correct" : "Incorrect"}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">AI Consensus</div>
          {prediction.outcomes.map((outcome, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={cn(
                  "text-zinc-300",
                  resolution && resolution.actualOutcome === outcome.outcomeText && "text-cyan-400 font-medium"
                )}>
                  {outcome.outcomeText}
                </span>
                <span className="text-sm font-medium text-zinc-400">
                  {(outcome.consensusProbability * 100).toFixed(0)}%
                </span>
              </div>
              <div className="relative h-2 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${outcome.consensusProbability * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
        </div>

        {resolution && (
          <div className="border-t border-zinc-800/50 pt-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="font-medium text-zinc-300">Actual outcome:</span>
                <span className="text-zinc-100">{resolution.actualOutcome}</span>
              </div>
              {resolution.evidence && (
                <div className="text-xs text-zinc-500">
                  Evidence: {resolution.evidence}
                </div>
              )}
              <div className="text-xs text-zinc-500">
                Resolved {formatDistanceToNow(new Date(resolution.resolvedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        )}

        {prediction.resolutionDate && prediction.resolutionStatus === "pending" && (
          <div className="border-t border-zinc-800/50 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  Resolution expected: {new Date(prediction.resolutionDate).toLocaleDateString()}
                </span>
              </div>
              <Button
                onClick={onToggleMarket}
                size="sm"
                variant="ghost"
                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
              >
                <Zap className="w-4 h-4 mr-2" />
                {isMarketExpanded ? "Hide Market" : "Show Market"}
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Market Betting Section */}
      {isMarketExpanded && prediction.resolutionStatus === "pending" && (
        <div className="border-t border-zinc-800/50">
          <MarketBetting
            predictionId={prediction.id}
            initialProbability={primaryOutcome ? primaryOutcome.consensusProbability * 100 : 50}
            isPrediction={true}
          />
        </div>
      )}
    </Card>
  );
}