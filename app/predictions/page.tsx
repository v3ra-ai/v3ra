"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2,
  XCircle,
  Award,
  BarChart3,
  History,
  Plus
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";

interface PredictionData {
  id: string;
  statement: string;
  category: string;
  status: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  difficulty: string;
  userBet?: {
    position: string;
    stake: number;
    actualPayout?: number;
    isWinner?: boolean;
    profit: number;
  };
  market?: {
    currentProbability: number;
  };
}

interface PredictionStats {
  totalPredictions: number;
  activePredictions: number;
  wonPredictions: number;
  lostPredictions: number;
  totalStaked: number;
  totalWinnings: number;
  netProfit: number;
  winRate: number;
}

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'all'>('all');
  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadPredictions();
    }
  }, [userId, activeTab]);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadUserPoints(user.id);
      } else if (process.env.NODE_ENV === 'development') {
        setUserId('demo-user');
        loadUserPoints('demo-user');
      }
    } catch (error) {
      console.error('Failed to initialize user:', error);
      if (process.env.NODE_ENV === 'development') {
        setUserId('demo-user');
        loadUserPoints('demo-user');
      }
    }
  };

  const loadUserPoints = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/points?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPoints(data.balance || 0);
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    }
  };

  const loadPredictions = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/predictions?userId=${userId}&status=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-400/30 bg-green-400/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case 'hard': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-zinc-400 border-zinc-400/30 bg-zinc-400/10';
    }
  };

  const getOutcomeIcon = (prediction: PredictionData) => {
    if (prediction.status !== 'RESOLVED' || !prediction.userBet) {
      return <Clock className="w-5 h-5 text-zinc-400" />;
    }
    
    if (prediction.userBet.isWinner) {
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-cyan-400 animate-pulse mx-auto mb-4" />
          <p className="text-zinc-400">Loading your predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar userPoints={points} canClaimBonus={false} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100 mb-2">Your Predictions</h1>
            <p className="text-zinc-400">Track your prediction history and performance</p>
          </div>
          <div className="flex gap-3">
            <Link href="/headlines">
              <Button variant="outline">
                Daily Headlines
              </Button>
            </Link>
            <Link href="/ask/truth-market-simple">
              <Button className="bg-cyan-600 hover:bg-cyan-500">
                <Plus className="w-4 h-4 mr-2" />
                New Prediction
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-zinc-900/50 border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Predictions</p>
                  <p className="text-2xl font-bold text-zinc-100">{stats.totalPredictions}</p>
                </div>
                <History className="w-8 h-8 text-cyan-400" />
              </div>
            </Card>
            
            <Card className="bg-zinc-900/50 border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Win Rate</p>
                  <p className="text-2xl font-bold text-zinc-100">{stats.winRate.toFixed(1)}%</p>
                </div>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
            </Card>
            
            <Card className="bg-zinc-900/50 border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Net Profit</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    stats.netProfit >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit} V3RA
                  </p>
                </div>
                {stats.netProfit >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-400" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-400" />
                )}
              </div>
            </Card>
            
            <Card className="bg-zinc-900/50 border-zinc-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Active Bets</p>
                  <p className="text-2xl font-bold text-zinc-100">{stats.activePredictions}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
            </Card>
          </div>
        )}

        {/* Predictions List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-zinc-900">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            <div className="space-y-4">
              {predictions.length === 0 ? (
                <Card className="bg-zinc-900/50 border-zinc-800 p-8 text-center">
                  <p className="text-zinc-400 mb-4">No predictions found</p>
                  <Link href="/headlines">
                    <Button className="bg-cyan-600 hover:bg-cyan-500">
                      Try Daily Headlines
                    </Button>
                  </Link>
                </Card>
              ) : (
                predictions.map((prediction) => (
                  <Card key={prediction.id} className="bg-zinc-900/50 border-zinc-800 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getOutcomeIcon(prediction)}
                          <Badge className={getDifficultyColor(prediction.difficulty)}>
                            {prediction.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-zinc-400">
                            {prediction.category}
                          </Badge>
                        </div>
                        
                        <p className="text-zinc-100 mb-3">{prediction.statement}</p>
                        
                        <div className="flex items-center gap-6 text-sm">
                          {prediction.userBet && (
                            <>
                              <div>
                                <span className="text-zinc-400">Your bet: </span>
                                <span className={cn(
                                  "font-medium",
                                  prediction.userBet.position === 'YES' ? "text-green-400" : "text-red-400"
                                )}>
                                  {prediction.userBet.position} ({prediction.userBet.stake} V3RA)
                                </span>
                              </div>
                              
                              {prediction.status === 'RESOLVED' && (
                                <div>
                                  <span className="text-zinc-400">Result: </span>
                                  <span className={cn(
                                    "font-medium",
                                    prediction.userBet.profit >= 0 ? "text-green-400" : "text-red-400"
                                  )}>
                                    {prediction.userBet.profit >= 0 ? '+' : ''}{prediction.userBet.profit} V3RA
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          
                          <div className="text-zinc-500">
                            {formatDate(prediction.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      {prediction.status === 'PENDING' && prediction.market && (
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">AI Consensus</p>
                          <p className="text-lg font-medium text-zinc-100">
                            {prediction.market.currentProbability}%
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}