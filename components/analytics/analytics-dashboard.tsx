'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Users, Brain, BarChart3, Target, Swords, Flame, ChevronUp, ChevronDown } from 'lucide-react';
import useSWR from 'swr';
import { getRatingTier } from '@/lib/analytics/elo';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ModelEloRating {
  id: string;
  model_name: string;
  provider: string;
  elo_rating: number;
  games_played: number;
  peak_rating: number;
  category: string;
}

interface ExtendedModelRating extends ModelEloRating {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: string;
  topVoteReason: string | null;
  voteReasons: Record<string, number>;
}

interface Matchup {
  model1: string;
  model2: string;
  total_comparisons: number;
  model1_wins: number;
  model2_wins: number;
  model1_win_rate: string;
}

interface TrendingModel {
  model: string;
  recentWins: number;
}

interface AnalyticsData {
  rankings: ExtendedModelRating[];
  totalVotes: number;
  totalModels: number;
  currentLeader: string;
  matchups: Matchup[];
  voteReasons: Record<string, number>;
  voteReasonsByModel: Record<string, Record<string, number>>;
  modelPerformance: Record<string, { wins: number; losses: number; total: number; winRate: string }>;
  trendingModels: TrendingModel[];
}

export function AnalyticsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const { data: analytics, error } = useSWR<AnalyticsData>(
    `/api/analytics/explore?category=${selectedCategory}&timeframe=${selectedTimeframe}`, 
    fetcher
  );
  const loading = !analytics && !error;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          AI Model Analytics
        </h1>
        <p className="text-gray-400 text-lg">
          Discover which AI models perform best across different categories
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="flex justify-center gap-2 mb-6">
        {['24h', '7d', '30d', 'all'].map((period) => (
          <button
            key={period}
            onClick={() => setSelectedTimeframe(period)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedTimeframe === period
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {period === '24h' ? 'Last 24 Hours' : 
             period === '7d' ? 'Last 7 Days' : 
             period === '30d' ? 'Last 30 Days' : 'All Time'}
          </button>
        ))}
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Votes</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : analytics?.totalVotes.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Brain className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Models Tracked</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : analytics?.totalModels || '0'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Current Leader</p>
              <p className="text-xl font-bold text-white truncate">
                {loading ? '...' : analytics?.currentLeader || 'N/A'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Top Elo Rating</p>
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : analytics?.rankings?.[0]?.elo_rating || '1500'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="bg-black/50 border-white/10">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="clarity">Clarity</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
          <TabsTrigger value="creativity">Creativity</TabsTrigger>
          <TabsTrigger value="depth">Depth</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Model Rankings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-bold text-white">Model Rankings</h2>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
                ))
              ) : analytics?.rankings && analytics.rankings.length > 0 ? (
                analytics.rankings.slice(0, 10).map((model, index) => {
                  const tier = getRatingTier(model.elo_rating);
                  return (
                    <div 
                      key={model.id} 
                      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <div className="text-2xl font-bold w-12 text-center">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{model.model_name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                            {model.provider}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-400">
                            {model.totalGames || model.games_played || 0} games
                          </span>
                          {model.winRate && (
                            <span className="text-sm font-medium text-green-400">
                              {model.winRate}% win rate
                            </span>
                          )}
                          <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: tier.color + '20', color: tier.color }}>
                            {tier.icon} {tier.name}
                          </span>
                        </div>
                        {model.topVoteReason && (
                          <div className="mt-1 text-xs text-gray-500">
                            Top reason: {model.topVoteReason}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-400">
                          {model.elo_rating}
                        </div>
                        {model.peak_rating > model.elo_rating && (
                          <div className="text-xs text-gray-500">
                            Peak: {model.peak_rating}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No model data available yet.</p>
                  <p className="text-sm mt-1">Start voting to see rankings!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Vote Reasons & Trending */}
        <div className="space-y-6">
          {/* Trending Models */}
          {analytics?.trendingModels && analytics.trendingModels.length > 0 && (
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Flame className="w-6 h-6 text-orange-400" />
                <h2 className="text-xl font-bold text-white">Trending Models</h2>
                <span className="text-xs text-gray-400">(Last 24h)</span>
              </div>
              
              <div className="space-y-3">
                {analytics.trendingModels.map((trending, index) => (
                  <div key={trending.model} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <ChevronUp className="w-4 h-4 text-green-400" />
                      <span className="text-white font-medium">{trending.model}</span>
                    </div>
                    <span className="text-sm text-gray-400">{trending.recentWins} wins</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Vote Reasons */}
          <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Vote Reasons</h2>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
                ))
              ) : analytics?.voteReasons && Object.keys(analytics.voteReasons).length > 0 ? (
                Object.entries(analytics.voteReasons)
                  .sort(([,a], [,b]) => b - a)
                  .map(([reason, count]) => {
                    const percentage = (count / analytics.totalVotes) * 100;
                    return (
                      <div key={reason} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white capitalize">{reason}</span>
                          <span className="text-gray-400">{count}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No vote data yet</p>
                </div>
              )}
            </div>
          </Card>
          
          {/* Head-to-Head Matchups */}
          {analytics?.matchups && analytics.matchups.length > 0 && (
            <Card className="bg-black/50 backdrop-blur border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Swords className="w-6 h-6 text-red-400" />
                <h2 className="text-xl font-bold text-white">Top Matchups</h2>
              </div>
              
              <div className="space-y-3">
                {analytics.matchups.slice(0, 5).map((matchup, index) => (
                  <div key={index} className="p-3 rounded-lg bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {matchup.model1} vs {matchup.model2}
                      </span>
                      <span className="text-xs text-gray-400">
                        {matchup.total_comparisons} battles
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300"
                          style={{ width: `${matchup.model1_win_rate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">
                        {matchup.model1_win_rate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}