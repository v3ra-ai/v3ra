"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TruthStatement, 
  MarketConsensus, 
  MarketPosition,
  formatProbability,
  isHighCertainty 
} from "@/lib/truth-market";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle,
  Brain,
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart2,
  CheckCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
// import { useAuth } from "@/contexts/auth-context";
import { Coins, Users, TrendingUp as TrendingUpIcon } from "lucide-react";
import { MarketBetting } from "./market-betting";

// Separate component for each position to handle its own state
function PositionItem({ position, index }: { position: MarketPosition; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div 
        className="flex items-center justify-between p-4 bg-black/20 dark:bg-black/40 rounded-lg border border-zinc-800/50 dark:border-cyan-400/10 hover:border-cyan-400/20 dark:hover:border-cyan-400/30 transition-all duration-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1">
          <Brain className="w-5 h-5 text-cyan-500/60" />
          <div className="flex-1">
            <div className="text-sm font-medium text-zinc-200 dark:text-zinc-300">
              {position.modelName}
            </div>
            <div className={cn(
              "text-xs font-medium",
              position.position === 'YES' ? 'text-green-400' :
              position.position === 'NO' ? 'text-red-400' : 'text-amber-400'
            )}>
              {position.position} · {position.confidence}% confident
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-600">
            {position.responseTime}ms
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-zinc-500 transition-transform duration-200",
            isExpanded && "rotate-180"
          )} />
        </div>
      </div>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 p-4 bg-black/10 rounded-lg border border-zinc-800/30"
        >
          <h5 className="text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
            Reasoning
          </h5>
          <p className="text-xs text-zinc-500 leading-relaxed">
            {position.reasoning}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

interface TruthResultProps {
  statement: TruthStatement;
  consensus: MarketConsensus;
  positions: MarketPosition[];
  onTrackPrediction?: () => void;
  predictionTracked?: boolean;
  predictionId?: string;
}

export function TruthResult({ 
  statement, 
  consensus, 
  positions,
  onTrackPrediction,
  predictionTracked,
  predictionId
}: TruthResultProps) {
  const [showDetails, setShowDetails] = useState(false);
  const timeframe = statement.timeframe ? new Date(statement.timeframe) : undefined;
  const isPrediction = timeframe && timeframe > new Date();
  
  // Debug logging
  useEffect(() => {
    console.log('TruthResult Debug:', {
      isPrediction,
      predictionId,
      predictionTracked,
      statement,
      showMarketBetting: isPrediction && predictionId
    });
  }, [isPrediction, predictionId, predictionTracked, statement]);
  
  // Determine market sentiment
  const sentiment = consensus.probability > 65 ? 'bullish' :
                   consensus.probability < 35 ? 'bearish' : 'neutral';
  
  // Get sentiment icon and color
  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="w-5 h-5" />;
      case 'bearish': return <TrendingDown className="w-5 h-5" />;
      default: return <Minus className="w-5 h-5" />;
    }
  };
  
  const getSentimentColor = () => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="truth-market-result overflow-hidden backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-black/90 border border-zinc-800/50 hover:border-cyan-500/30 shadow-2xl hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800/40">
          <h3 className="text-xl font-medium text-white mb-2">
            {statement.statement}
          </h3>
          {statement.context && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              Context: {statement.context}
            </p>
          )}
          {isPrediction && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-500/60" />
                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                  By {timeframe!.toLocaleDateString()}
                </span>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-1 rounded-full"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Prediction Market Created!</span>
              </motion.div>
            </div>
          )}
        </div>
        
        {/* Probability Meter */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">
                Truth Probability
              </span>
              <div className={cn("flex items-center gap-2", getSentimentColor())}>
                {getSentimentIcon()}
                <span 
                  className="font-bold text-2xl"
                  style={{
                    textShadow: sentiment === 'bullish' ? '0 0 20px rgba(34,197,94,0.8)' :
                               sentiment === 'bearish' ? '0 0 20px rgba(239,68,68,0.8)' :
                               '0 0 20px rgba(251,191,36,0.8)'
                  }}
                >
                  {formatProbability(consensus.probability)}
                </span>
              </div>
            </div>
            
            {/* Visual probability bar */}
            <div className="relative h-12 bg-black/50 rounded-full overflow-hidden border border-zinc-800/40 shadow-inner">
              <motion.div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  sentiment === 'bullish' ? 'bg-gradient-to-r from-emerald-500 to-green-400' :
                  sentiment === 'bearish' ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                  'bg-gradient-to-r from-amber-500 to-yellow-400'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${consensus.probability}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                  boxShadow: sentiment === 'bullish' ? '0 0 30px rgba(16,185,129,0.6), inset 0 0 20px rgba(255,255,255,0.2)' :
                            sentiment === 'bearish' ? '0 0 30px rgba(239,68,68,0.6), inset 0 0 20px rgba(255,255,255,0.2)' :
                            '0 0 30px rgba(245,158,11,0.6), inset 0 0 20px rgba(255,255,255,0.2)'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {consensus.probability}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Consensus Strength Indicators */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-zinc-800/50 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
                {consensus.totalValidators}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">AI Traders</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-zinc-800/50 backdrop-blur-sm">
              <div className={cn(
                "text-3xl font-bold",
                consensus.confidence > 70 ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' :
                consensus.confidence > 40 ? 'bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent' : 
                'bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent'
              )}>
                {consensus.confidence}%
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Avg Confidence</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-zinc-800/50 backdrop-blur-sm">
              <div className={cn(
                "text-2xl font-bold uppercase tracking-wider",
                consensus.consensusStrength === 'STRONG' ? 'bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent' :
                consensus.consensusStrength === 'MODERATE' ? 'bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent' : 
                'bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent'
              )}>
                {consensus.consensusStrength}
              </div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Consensus</div>
            </div>
          </div>
          
          {/* Show/Hide Details Button */}
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-white border border-zinc-800/40 hover:border-zinc-700/60 bg-black/30 hover:bg-black/50 transition-all duration-200"
          >
            <BarChart2 className="w-4 h-4" />
            {showDetails ? 'Hide' : 'Show'} Market Positions
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Key Reasoning Points (TLDR) */}
        <div className="px-6 pb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-black/40 to-black/20 border border-zinc-800/50 backdrop-blur-sm">
            <h4 className="text-sm font-medium text-zinc-300 mb-3 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-500/60" />
              Key Reasoning Points
            </h4>
            <div className="space-y-2">
              {positions.slice(0, 3).map((position, index) => (
                <div key={`key-${position.validatorId}-${index}`} className="flex items-start gap-2">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    position.position === 'YES' ? 'bg-green-400' :
                    position.position === 'NO' ? 'bg-red-400' : 'bg-amber-400'
                  )} />
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    <span className="font-medium text-zinc-300">{position.modelName}:</span> {position.reasoning.slice(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Detailed Positions */}
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-zinc-800/50 dark:border-cyan-400/10"
          >
            <div className="p-6 space-y-3">
              <h4 className="text-sm font-medium text-zinc-300 dark:text-zinc-400 mb-3 uppercase tracking-wider">
                Individual AI Positions
              </h4>
              {positions.map((position, index) => (
                <PositionItem 
                  key={`${position.validatorId}-${index}`} 
                  position={position} 
                  index={index} 
                />
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Action Buttons */}
        {isPrediction && !predictionTracked && (
          <div className="p-6 border-t border-zinc-800/50 dark:border-cyan-400/10">
            <Button
              onClick={onTrackPrediction}
              className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-medium shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
            >
              Track This Prediction
            </Button>
          </div>
        )}
      </Card>
      
      {/* Market Betting Component - Show for all predictions */}
      {isPrediction && predictionId && (
        <MarketBetting
          predictionId={predictionId}
          initialProbability={consensus.probability}
          isPrediction={isPrediction}
        />
      )}
    </motion.div>
  );
}