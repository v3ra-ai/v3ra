"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Crown, Medal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/navbar";
import { supabase } from "@/lib/supabase-client";
import { AILoadingSpinner } from "@/components/ai-loading-spinner";
import { logger } from "@/lib/utils/client-logger";

interface UserScore {
  rank: number;
  username: string;
  userId: string;
  totalPoints: number;
  votesCount: number;
  streak: number;
  isCurrentUser?: boolean;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all");
  const [userPoints, setUserPoints] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
    fetchLeaderboard();
  }, [timeframe]);
  
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const response = await fetch('/api/user/points');
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
        }
      }
    } catch (error) {
      logger.error('Failed to load user data', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const timeframeMap: Record<string, string> = {
          week: 'weekly',
          month: 'monthly',
          all: 'alltime',
        };
        const apiTimeframe = timeframeMap[timeframe] ?? 'weekly';
        const response = await fetch(`/api/leaderboard/users?timeframe=${apiTimeframe}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        const leaderboardUsers: UserScore[] = data.leaderboard.map((user: any) => ({
          rank: user.rank,
          username: user.username,
          userId: user.userId,
          totalPoints: user.balance,
          votesCount: user.totalBets, // This is now total votes
          streak: user.streak,
          isCurrentUser: user.userId === currentUserId
        }));
        
        setUsers(leaderboardUsers);
      } else {
        logger.error("Failed to fetch leaderboard");
      }
    } catch (error) {
      logger.error("Failed to fetch leaderboard", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />;
    return <span className="text-white/40 font-bold">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar userPoints={userPoints} />
      
      {/* Page Header */}
      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4"
          >
            Leaderboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg"
          >
            Top AI evaluators earning the most points
          </motion.p>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <div className="container mx-auto max-w-4xl px-4 mb-8">
        <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="w-full">
          <TabsList className="bg-black/50 border border-white/10 backdrop-blur">
            <TabsTrigger value="week" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              This Month
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400">
              All Time
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Leaderboard */}
      <div className="container mx-auto max-w-4xl px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <AILoadingSpinner message="Loading rankings..." />
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "p-6 bg-black/50 backdrop-blur border transition-all duration-200",
                  user.isCurrentUser && "border-purple-500/50 bg-purple-600/10",
                  index === 0 && "border-yellow-500/30 shadow-lg shadow-yellow-500/10",
                  index === 1 && "border-gray-400/30",
                  index === 2 && "border-orange-600/30",
                  !user.isCurrentUser && index > 2 && "border-white/10"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">
                        {getRankIcon(user.rank)}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                          {user.username}
                          {user.isCurrentUser && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                          {user.streak >= 7 && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                              🔥 {user.streak} days
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-white/40">
                          {user.votesCount} votes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
                        {user.totalPoints.toLocaleString()}
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      </div>
                      <p className="text-xs text-white/40">points</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
