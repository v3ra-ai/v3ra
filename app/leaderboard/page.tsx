"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Brain, Zap, Target, Activity, Home, Sparkles, Users, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface ModelPerformance {
  modelName: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  brierScore: number;
  calibrationScore: number;
  avgConfidence: number;
  bestCategory: string;
  worstCategory: string;
  streak: number;
}

export default function LeaderboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [models, setModels] = useState<ModelPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all");

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/predictions/metrics?timeframe=${timeframe}`);
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return "text-green-400";
    if (accuracy >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-cyan-400">Truth Market Beta</span>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 mb-4">
            <Link 
              href="/headlines"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-all",
                pathname === "/headlines"
                  ? "bg-zinc-800/50 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              <span className="flex items-center gap-1">
                <span>📰</span>
                Headlines
              </span>
            </Link>
            <Link 
              href="/ask/truth-market-simple"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-all",
                pathname === "/ask/truth-market-simple"
                  ? "bg-zinc-800/50 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              Ask
            </Link>
            <Link 
              href="/predictions"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-all",
                pathname === "/predictions"
                  ? "bg-zinc-800/50 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              Predictions
            </Link>
            <Link 
              href="/leaderboard"
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-all",
                pathname === "/leaderboard" || pathname === "/leaderboard/users"
                  ? "bg-zinc-800/50 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              Leaderboard
            </Link>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Leaderboard</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Track performance rankings for AI models and human predictors
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          <Card 
            className="backdrop-blur-sm bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 p-6 cursor-pointer hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-200"
            onClick={() => router.push('/leaderboard/users')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-100">User Rankings</h3>
                <p className="text-sm text-zinc-400">Top predictors by V3RA earnings</p>
              </div>
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
          </Card>
          
          <Card 
            className="backdrop-blur-sm bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6 opacity-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-100">AI Models</h3>
                <p className="text-sm text-zinc-400">Model accuracy & performance</p>
              </div>
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
          </Card>
        </div>
        
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">AI Model Performance</h2>
        
        {/* Timeframe Tabs */}
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
          <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard */}
      <div className="container mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Activity className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
            <span className="text-zinc-400">Loading leaderboard...</span>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {models.map((model, index) => (
              <motion.div
                key={model.modelName}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "p-6 bg-zinc-900/50 border-zinc-800/50 transition-all duration-200",
                  index === 0 && "border-yellow-500/30 shadow-lg shadow-yellow-500/10",
                  index === 1 && "border-zinc-400/30",
                  index === 2 && "border-orange-700/30"
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">
                        {getRankIcon(index + 1)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                          {model.modelName}
                          {model.streak > 3 && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                              🔥 {model.streak} streak
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {model.totalPredictions} predictions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-2xl font-bold", getAccuracyColor(model.accuracy))}>
                        {model.accuracy}%
                      </div>
                      <p className="text-xs text-zinc-500">accuracy</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Target className="w-3 h-3" />
                        Calibration
                      </div>
                      <div className="text-sm font-medium text-zinc-300">
                        {(model.calibrationScore * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Brain className="w-3 h-3" />
                        Brier Score
                      </div>
                      <div className="text-sm font-medium text-zinc-300">
                        {model.brierScore.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Best Category
                      </div>
                      <div className="text-sm font-medium text-green-400">
                        {model.bestCategory}
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <Zap className="w-3 h-3" />
                        Avg Confidence
                      </div>
                      <div className="text-sm font-medium text-zinc-300">
                        {model.avgConfidence}%
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Prediction Accuracy</span>
                      <span>{model.correctPredictions} / {model.totalPredictions} correct</span>
                    </div>
                    <div className="relative h-3 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full",
                          model.accuracy >= 80 ? "bg-gradient-to-r from-green-500 to-green-400" :
                          model.accuracy >= 60 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                          "bg-gradient-to-r from-red-500 to-red-400"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${model.accuracy}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {models.length === 0 && !loading && (
              <div className="text-center py-12 text-zinc-500">
                No model performance data available yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}