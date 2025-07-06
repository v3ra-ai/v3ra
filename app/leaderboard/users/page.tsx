"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Trophy, 
  TrendingUp, 
  Coins,
  Target,
  Flame,
  Crown,
  Medal,
  Star,
  Home,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { supabase } from "@/lib/supabase-client";

interface UserStats {
  userId: string;
  username: string;
  rank: number;
  balance: number;
  totalEarned: number;
  winRate: number;
  totalBets: number;
  wins: number;
  streak: number;
  level: number;
  avatar?: string;
}

export default function UserLeaderboardPage() {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [summary, setSummary] = useState({
    totalV3RAInPlay: 0,
    activeUsers: 0,
    avgWinRate: 0
  });

  useEffect(() => {
    loadUserPoints();
    loadLeaderboard();
    getCurrentUser();
  }, [timeframe]);
  
  const loadUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`/api/user/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load user points:', error);
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data.userId);
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard/users?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
        setSummary(data.summary);
      } else {
        console.error('Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch(rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-zinc-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-zinc-500 font-medium">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch(rank) {
      case 1: return "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30";
      case 2: return "from-zinc-500/20 to-zinc-600/20 border-zinc-500/30";
      case 3: return "from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default: return "from-zinc-900/50 to-black/50 border-zinc-800/50";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar userPoints={userPoints} />
      
      {/* Page Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            User Leaderboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Top predictors ranked by V3RA earnings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Timeframe Tabs */}
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="alltime">All Time</TabsTrigger>
            </TabsList>

            <TabsContent value={timeframe}>
              {isLoading ? (
                <div className="text-center py-12">
                  <Trophy className="w-8 h-8 text-zinc-600 animate-pulse mx-auto mb-4" />
                  <p className="text-zinc-500">Loading leaderboard...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((user, index) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={cn(
                        "backdrop-blur-sm bg-gradient-to-br border transition-all duration-200",
                        getRankColor(user.rank),
                        user.userId === currentUserId && "ring-2 ring-cyan-500/50"
                      )}>
                        <div className="p-6">
                          <div className="flex items-center justify-between">
                            {/* Left: Rank & User Info */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-12 h-12">
                                {getRankIcon(user.rank)}
                              </div>
                              
                              <div>
                                <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                                  {user.username}
                                  {user.userId === currentUserId && (
                                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                                      You
                                    </Badge>
                                  )}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    Level {user.level}
                                  </Badge>
                                  {user.streak > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-orange-400">
                                      <Flame className="w-3 h-3" />
                                      {user.streak} streak
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right: Stats */}
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                                  <Coins className="w-5 h-5" />
                                  {user.balance.toLocaleString()}
                                </p>
                                <p className="text-xs text-zinc-500">V3RA Balance</p>
                              </div>
                              
                              <div className="flex gap-4 text-center">
                                <div>
                                  <p className="text-lg font-semibold text-green-400 flex items-center gap-1">
                                    <Target className="w-4 h-4" />
                                    {user.winRate}%
                                  </p>
                                  <p className="text-xs text-zinc-500">Win Rate</p>
                                </div>
                                
                                <div>
                                  <p className="text-lg font-semibold text-cyan-400">
                                    {user.wins}/{user.totalBets}
                                  </p>
                                  <p className="text-xs text-zinc-500">W/L</p>
                                </div>
                                
                                <div>
                                  <p className="text-lg font-semibold text-purple-400 flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    +{user.totalEarned.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-zinc-500">Total Earned</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card className="bg-gradient-to-br from-zinc-900/50 to-black/50 border-zinc-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Total V3RA in Play</p>
                  <p className="text-2xl font-bold text-zinc-100">{(summary.totalV3RAInPlay / 1000).toFixed(1)}K</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-400/20" />
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-zinc-900/50 to-black/50 border-zinc-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Active Predictors</p>
                  <p className="text-2xl font-bold text-zinc-100">{summary.activeUsers.toLocaleString()}</p>
                </div>
                <Star className="w-8 h-8 text-cyan-400/20" />
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-zinc-900/50 to-black/50 border-zinc-800/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500">Avg Win Rate</p>
                  <p className="text-2xl font-bold text-zinc-100">{summary.avgWinRate}%</p>
                </div>
                <Target className="w-8 h-8 text-green-400/20" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}