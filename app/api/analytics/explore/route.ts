import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-client';
import { prisma } from '@/lib/db/client';
import { cache, getCacheKey } from '@/lib/cache/memory-cache';
import { apiLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    const category = searchParams.get('category') || 'overall';
    const startDate = getTimeframeDate(timeframe);
    
    // Try cache first
    const cacheKey = getCacheKey('analytics', timeframe, category);
    const cached = cache.get('voteAnalytics', cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get model rankings
    const { data: rankings, error: rankingsError } = await supabase
      .from('model_elo_ratings')
      .select('*')
      .eq('category', category)
      .order('elo_rating', { ascending: false })
      .limit(20);

    if (rankingsError && !rankingsError.message?.includes('relation') && !rankingsError.message?.includes('does not exist')) {
      apiLogger.warn('Rankings table not found', { error: rankingsError.message, category });
    }

    // Get comprehensive vote statistics with model performance
    let modelPerformance: Record<string, any> = {};
    let totalVotes = 0;
    let voteReasonsByModel: Record<string, Record<string, number>> = {};
    let validatorToModel = new Map<string, string>();
    
    try {
      // Get all votes with model details
      const votes = await prisma.voteDetails.findMany({
        where: {
          created_at: { gte: new Date(startDate) }
        },
        select: {
          id: true,
          winning_validator_id: true,
          losing_validator_id: true,
          vote_reason: true,
          created_at: true
        }
      });
      
      totalVotes = votes.length;
      
      // In this app, validator IDs in vote_details are actually model names like 'openai/gpt-4'
      // So we'll use them directly instead of looking up validators
      validatorToModel = new Map<string, string>();
      
      // Process votes to calculate model performance
      votes.forEach(vote => {
        // Use the validator IDs directly as model names
        const winningModel = vote.winning_validator_id;
        const losingModel = vote.losing_validator_id;
        
        // Track wins
        if (winningModel) {
          if (!modelPerformance[winningModel]) {
            modelPerformance[winningModel] = { wins: 0, losses: 0, total: 0 };
          }
          modelPerformance[winningModel].wins++;
          modelPerformance[winningModel].total++;
          
          // Track vote reasons by winning model
          if (!voteReasonsByModel[winningModel]) {
            voteReasonsByModel[winningModel] = {};
          }
          voteReasonsByModel[winningModel][vote.vote_reason] = 
            (voteReasonsByModel[winningModel][vote.vote_reason] || 0) + 1;
        }
        
        // Track losses
        if (losingModel) {
          if (!modelPerformance[losingModel]) {
            modelPerformance[losingModel] = { wins: 0, losses: 0, total: 0 };
          }
          modelPerformance[losingModel].losses++;
          modelPerformance[losingModel].total++;
        }
      });
      
      // Calculate win rates
      Object.keys(modelPerformance).forEach(model => {
        const stats = modelPerformance[model];
        stats.winRate = stats.total > 0 ? (stats.wins / stats.total * 100).toFixed(1) : '0';
      });
      
    } catch (error) {
      apiLogger.error('Error fetching vote details', {
        error: error instanceof Error ? error.message : String(error),
        timeframe,
        category
      });
    }

    // Get head to head matchups from vote_details
    let matchups: any[] = [];
    try {
      // Get unique model pairs and their outcomes
      const voteMatchups = await prisma.voteDetails.findMany({
        where: {
          created_at: { gte: new Date(startDate) }
        },
        select: {
          winning_validator_id: true,
          losing_validator_id: true
        }
      });
      
      // Process matchups
      const matchupMap: Record<string, { wins: number, total: number }> = {};
      
      voteMatchups.forEach(vote => {
        const winningModel = vote.winning_validator_id;
        const losingModel = vote.losing_validator_id;
        
        if (winningModel && losingModel) {
          const key = [winningModel, losingModel].sort().join(' vs ');
          if (!matchupMap[key]) {
            matchupMap[key] = { wins: 0, total: 0 };
          }
          matchupMap[key].total++;
          if (winningModel === key.split(' vs ')[0]) {
            matchupMap[key].wins++;
          }
        }
      });
      
      // Convert to array format
      matchups = Object.entries(matchupMap)
        .map(([matchup, stats]) => {
          const [model1, model2] = matchup.split(' vs ');
          return {
            model1,
            model2,
            total_comparisons: stats.total,
            model1_wins: stats.wins,
            model2_wins: stats.total - stats.wins,
            model1_win_rate: ((stats.wins / stats.total) * 100).toFixed(1)
          };
        })
        .sort((a, b) => b.total_comparisons - a.total_comparisons)
        .slice(0, 10);
    } catch (error) {
      apiLogger.error('Error processing matchups', {
        error: error instanceof Error ? error.message : String(error),
        timeframe,
        category
      });
    }
    
    // Try to get data from model_matchups table as fallback
    if (matchups.length === 0) {
      const { data: supabaseMatchups, error: matchupsError } = await supabase
        .from('model_matchups')
        .select('*')
        .eq('category', category)
        .order('total_comparisons', { ascending: false })
        .limit(10);

      if (matchupsError && !matchupsError.message?.includes('relation') && !matchupsError.message?.includes('does not exist')) {
        apiLogger.warn('Matchups table not found', { error: matchupsError.message, category });
      } else if (supabaseMatchups) {
        matchups = supabaseMatchups;
      }
    }

    // Get overall vote reasons distribution
    let reasonCounts: Record<string, number> = {};
    try {
      const voteReasons = await prisma.voteDetails.findMany({
        where: {
          created_at: { gte: new Date(startDate) }
        },
        select: {
          vote_reason: true
        }
      });
      
      reasonCounts = voteReasons.reduce((acc: Record<string, number>, vote) => {
        acc[vote.vote_reason] = (acc[vote.vote_reason] || 0) + 1;
        return acc;
      }, {});
    } catch (error) {
      apiLogger.error('Error fetching vote reasons', {
        error: error instanceof Error ? error.message : String(error),
        timeframe
      });
    }
    
    // Since we don't have ELO rankings, create rankings from vote performance
    const enhancedRankings = Object.entries(modelPerformance)
      .map(([modelName, perf]) => {
        const reasons = voteReasonsByModel[modelName] || {};
        const topReason = Object.entries(reasons).sort(([,a], [,b]) => b - a)[0];
        
        return {
          id: modelName,
          model_name: modelName,
          provider: modelName.split('/')[0] || 'Unknown',
          elo_rating: 1500 + (perf.wins - perf.losses) * 10, // Simple rating based on wins/losses
          games_played: perf.total,
          peak_rating: 1500 + (perf.wins - perf.losses) * 10,
          category: category,
          wins: perf.wins,
          losses: perf.losses,
          totalGames: perf.total,
          winRate: perf.winRate,
          topVoteReason: topReason ? topReason[0] : null,
          voteReasons: reasons
        };
      })
      .sort((a, b) => b.elo_rating - a.elo_rating);

    // Get trending models (most improved in last 24h)
    let trendingModels: any[] = [];
    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentVotes = await prisma.voteDetails.findMany({
        where: {
          created_at: { gte: dayAgo }
        },
        select: {
          winning_validator_id: true,
          created_at: true
        }
      });
      
      const recentWins: Record<string, number> = {};
      recentVotes.forEach(vote => {
        const winningModel = vote.winning_validator_id;
        if (winningModel) {
          recentWins[winningModel] = (recentWins[winningModel] || 0) + 1;
        }
      });
      
      trendingModels = Object.entries(recentWins)
        .map(([model, wins]) => ({ model, recentWins: wins }))
        .sort((a, b) => b.recentWins - a.recentWins)
        .slice(0, 5);
    } catch (error) {
      apiLogger.error('Error calculating trending models', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    const response = {
      rankings: enhancedRankings,
      totalVotes,
      totalModels: enhancedRankings?.length || 0,
      currentLeader: enhancedRankings?.[0]?.model_name || 'N/A',
      matchups,
      voteReasons: reasonCounts,
      voteReasonsByModel,
      modelPerformance,
      trendingModels,
      timeframe,
      category
    };
    
    // Cache the response
    cache.set('voteAnalytics', cacheKey, response);
    
    return NextResponse.json(response);

  } catch (error) {
    apiLogger.error('Analytics endpoint failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: '/api/analytics/explore'
    });
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function getTimeframeDate(timeframe: string): string {
  const now = new Date();
  const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 7;
  const date = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date.toISOString();
}