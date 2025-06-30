"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, BarChart3, Sparkles } from "lucide-react";
import { ConsensusResult } from "@/lib/types/query-classifier";

interface PredictionCardProps {
  query: string;
  consensus: ConsensusResult;
  metadata: {
    modelsQueried: number;
    timestamp: string;
  };
}

export function PredictionCard({ query, consensus, metadata }: PredictionCardProps) {
  const predictions = consensus.predictions || [];
  const primaryPrediction = predictions[0];
  const otherPredictions = predictions.slice(1);
  
  // Calculate total probability to ensure it equals 100%
  const totalProbability = predictions.reduce((sum, pred) => sum + pred.probability, 0);
  
  return (
    <Card className="w-full max-w-4xl mx-auto bg-gradient-to-br from-emerald-950/20 via-zinc-900/95 to-black/90 backdrop-blur-2xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
      <CardHeader className="pb-4">
        <div className="space-y-4">
          {/* Header with category and meta */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Prediction Analysis
            </Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {metadata.modelsQueried} models
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {Math.round(consensus.confidence * 100)}% consensus
              </span>
            </div>
          </div>

          {/* Query */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-200">{query}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Prediction - Featured */}
        {primaryPrediction && (
          <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-emerald-400 mb-1">Most Likely Outcome</h4>
                  <p className="text-zinc-200">{primaryPrediction.outcome}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-400">
                    {(primaryPrediction.probability * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">probability</div>
                </div>
              </div>
              
              {/* Probability Bar */}
              <div className="relative h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${primaryPrediction.probability * 100}%` }}
                />
              </div>
              
              {primaryPrediction.reasoning && (
                <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                  {primaryPrediction.reasoning}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Other Predictions */}
        {otherPredictions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Alternative Outcomes</h4>
            <div className="space-y-2">
              {otherPredictions.map((pred, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-300">{pred.outcome}</span>
                    <span className="text-lg font-semibold text-zinc-400">
                      {(pred.probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={pred.probability * 100} 
                    className="h-1.5 bg-zinc-700"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Date */}
        {consensus.resolutionDate && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Calendar className="w-4 h-4 text-amber-500" />
            <div className="text-sm">
              <span className="text-amber-500 font-medium">Resolution Expected:</span>
              <span className="text-zinc-300 ml-2">{consensus.resolutionDate}</span>
            </div>
          </div>
        )}

        {/* Model Agreement Visualization */}
        <div className="pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Model Agreement</span>
            <span className="text-zinc-300">{Math.round(consensus.modelAgreement * 100)}%</span>
          </div>
          <Progress 
            value={consensus.modelAgreement * 100} 
            className="mt-2 h-2"
          />
        </div>

        {/* Summary */}
        {consensus.summary && (
          <div className="text-sm text-zinc-400 leading-relaxed">
            {consensus.summary}
          </div>
        )}
      </CardContent>
    </Card>
  );
}