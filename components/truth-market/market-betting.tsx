"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Coins, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Zap,
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
// import { useAuth } from "@/contexts/auth-context";

interface MarketBettingProps {
  predictionId: string;
  initialProbability: number;
  isPrediction: boolean;
}

interface MarketData {
  id: string;
  status: "PENDING" | "ACTIVE";
  activationThreshold: number;
  currentStake: number;
  yesPool: number;
  noPool: number;
  initialProbability: number;
  currentProbability: number;
  totalVolume: number;
  participants: number;
  bets: Bet[];
}

interface Bet {
  id: string;
  position: "YES" | "NO";
  amount: number;
  odds: number;
  timestamp: Date;
  userId?: string;
}

export function MarketBetting({ predictionId, initialProbability, isPrediction }: MarketBettingProps) {
  // const { user } = useAuth();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<"YES" | "NO" | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [showActivity, setShowActivity] = useState(false);

  console.log('MarketBetting component:', { predictionId, initialProbability, isPrediction });

  // Calculate dynamic odds based on pool sizes
  const calculateOdds = (position: "YES" | "NO", betSize: number = 0) => {
    if (!market) return { odds: 2, impliedProb: 50 };
    
    // If market isn't active yet, use initial probability
    if (market.status !== "ACTIVE") {
      const prob = position === "YES" ? initialProbability : (100 - initialProbability);
      return {
        odds: prob > 0 ? 100 / prob : 2,
        impliedProb: prob
      };
    }
    
    const yesPool = market.yesPool || 1; // Prevent division by zero
    const noPool = market.noPool || 1;
    
    // If both pools are effectively empty, initialize based on probability
    if (market.yesPool === 0 && market.noPool === 0) {
      const prob = position === "YES" ? initialProbability : (100 - initialProbability);
      return {
        odds: prob > 0 ? 100 / prob : 2,
        impliedProb: prob
      };
    }
    
    // Calculate odds using constant product market maker (like Uniswap)
    // For a bet of size 'betSize' on 'position':
    if (betSize === 0) {
      // Just show current odds without a bet
      const totalPool = yesPool + noPool;
      const impliedProb = position === "YES" 
        ? (yesPool / totalPool) * 100 
        : (noPool / totalPool) * 100;
      const odds = position === "YES"
        ? (yesPool + noPool) / yesPool
        : (yesPool + noPool) / noPool;
      return { odds: Math.max(1.01, Math.min(odds, 100)), impliedProb };
    }
    
    // Calculate odds with the bet
    const k = yesPool * noPool; // constant product
    if (position === "YES") {
      const newYesPool = yesPool + betSize;
      const newNoPool = k / newYesPool;
      const payout = noPool - newNoPool;
      const odds = (betSize + payout) / betSize;
      const totalPool = yesPool + noPool;
      const impliedProb = (yesPool / totalPool) * 100;
      return { 
        odds: Math.max(1.01, Math.min(odds, 100)), // Cap between 1.01x and 100x
        impliedProb 
      };
    } else {
      const newNoPool = noPool + betSize;
      const newYesPool = k / newNoPool;
      const payout = yesPool - newYesPool;
      const odds = (betSize + payout) / betSize;
      const totalPool = yesPool + noPool;
      const impliedProb = (noPool / totalPool) * 100;
      return { 
        odds: Math.max(1.01, Math.min(odds, 100)), // Cap between 1.01x and 100x
        impliedProb 
      };
    }
  };

  useEffect(() => {
    if (isPrediction && predictionId) {
      fetchMarketData();
      fetchUserPoints();
    }
  }, [isPrediction, predictionId]);

  const fetchMarketData = async () => {
    try {
      // Demo mode: create mock market data
      const storedMarket = localStorage.getItem(`market-${predictionId}`);
      const mockMarket: MarketData = storedMarket ? JSON.parse(storedMarket) : {
        id: predictionId,
        status: "PENDING" as const,
        activationThreshold: 100,
        currentStake: 0,
        yesPool: 0,
        noPool: 0,
        initialProbability: initialProbability,
        currentProbability: initialProbability,
        totalVolume: 0,
        participants: 0,
        bets: []
      };
      
      setMarket(mockMarket);
    } catch (error) {
      console.error("Failed to fetch market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const response = await fetch(`/api/user/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
        } else {
          setUserPoints(1000); // Default
        }
      } else {
        setUserPoints(1000); // Default for non-authenticated
      }
    } catch (error) {
      console.error("Failed to fetch user points:", error);
      // Set default value
      setUserPoints(1000);
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;

    try {
      const amount = parseFloat(stakeAmount);
      if (amount > userPoints) {
        alert("Insufficient V3RA points!");
        return;
      }

      // Demo mode: simulate staking
      setUserPoints(prev => prev - amount);
      if (market) {
        const updatedMarket = {
          ...market,
          currentStake: market.currentStake + amount,
          status: (market.currentStake + amount) >= market.activationThreshold ? "ACTIVE" as const : "PENDING" as const,
          // Initialize pools with stake if activating
          yesPool: market.yesPool || (market.currentStake + amount >= market.activationThreshold ? amount * (initialProbability / 100) : 0),
          noPool: market.noPool || (market.currentStake + amount >= market.activationThreshold ? amount * ((100 - initialProbability) / 100) : 0)
        };
        setMarket(updatedMarket);
        localStorage.setItem(`market-${predictionId}`, JSON.stringify(updatedMarket));
      }
      setStakeAmount("");
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = `✓ Staked ${amount} V3RA!`;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 3000);
    } catch (error) {
      console.error("Failed to stake:", error);
    }
  };

  const handleBet = async () => {
    if (!betAmount || !selectedPosition || parseFloat(betAmount) <= 0) return;

    try {
      const amount = parseFloat(betAmount);
      if (amount > userPoints) {
        alert("Insufficient V3RA points!");
        return;
      }

      // Demo mode: simulate betting with dynamic odds
      const { odds } = calculateOdds(selectedPosition, amount);
      const potentialReturn = amount * odds;
      
      setUserPoints(prev => prev - amount);
      
      if (market) {
        const newBet: Bet = {
          id: `bet-${Date.now()}`,
          position: selectedPosition,
          amount,
          odds,
          timestamp: new Date(),
          userId: 'demo-user'
        };
        
        const updatedMarket = {
          ...market,
          yesPool: market.yesPool + (selectedPosition === "YES" ? amount : 0),
          noPool: market.noPool + (selectedPosition === "NO" ? amount : 0),
          totalVolume: market.totalVolume + amount,
          participants: market.participants + (market.bets.length === 0 ? 1 : 0),
          bets: [...market.bets, newBet]
        };
        
        // Update current probability based on pool sizes
        const totalPool = updatedMarket.yesPool + updatedMarket.noPool;
        if (totalPool > 0) {
          updatedMarket.currentProbability = (updatedMarket.yesPool / totalPool) * 100;
        }
        
        setMarket(updatedMarket);
        localStorage.setItem(`market-${predictionId}`, JSON.stringify(updatedMarket));
      }
      
      // Show success message with animation
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-slide-in';
      successDiv.innerHTML = `
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <div>
            <div class="font-semibold">Bet Placed!</div>
            <div class="text-sm opacity-90">${amount} V3RA on ${selectedPosition} • ${odds.toFixed(2)}x odds</div>
            <div class="text-xs opacity-75">Potential return: ${potentialReturn.toFixed(0)} V3RA</div>
          </div>
        </div>
      `;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 4000);
      
      setBetAmount("");
      setSelectedPosition(null);
    } catch (error) {
      console.error("Failed to place bet:", error);
    }
  };

  if (!isPrediction) {
    console.log('MarketBetting: Not showing because isPrediction is false');
    return null;
  }

  const isActive = market?.status === "ACTIVE";
  const progress = market ? (market.currentStake / market.activationThreshold) * 100 : 0;

  return (
    <Card className="mt-6 p-6 bg-gradient-to-br from-zinc-900/80 to-black/90 border border-zinc-800/50 shadow-[0_0_40px_rgba(255,215,0,0.2)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Prediction Market
        </h3>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
          <Coins className="w-3 h-3 mr-1" />
          {userPoints} V3RA
        </Badge>
      </div>

      {!isActive ? (
        // Market Activation UI
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-400">Activation Progress</span>
            <span className="text-zinc-300">
              {market?.currentStake || 0} / {market?.activationThreshold || 100} V3RA
            </span>
          </div>
          
          <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-yellow-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Market Needs Activation!
            </h4>
            <p className="text-xs text-zinc-400 mb-3">
              Be the first to stake V3RA and activate this prediction market. Early stakers get better odds!
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Stake amount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="bg-black/50 border-zinc-800"
            />
            <Button
              onClick={handleStake}
              disabled={!stakeAmount || parseFloat(stakeAmount) > userPoints}
              className="bg-yellow-600 hover:bg-yellow-500"
            >
              <Lock className="w-4 h-4 mr-2" />
              Stake
            </Button>
          </div>

          <p className="text-xs text-zinc-500">
            Stake V3RA to activate the market. Early stakers get better odds!
          </p>
        </div>
      ) : (
        // Active Betting UI
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Unlock className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Market is LIVE! Place your bets</span>
            </div>
            <p className="text-xs text-zinc-400">Choose your position and bet amount to participate</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedPosition("YES")}
              className={cn(
                "p-4 rounded-lg border-2 transition-all relative overflow-hidden",
                selectedPosition === "YES"
                  ? "border-green-500 bg-gradient-to-br from-green-500/20 to-emerald-500/10 shadow-lg shadow-green-500/20"
                  : "border-zinc-800 hover:border-green-500/50 bg-zinc-900/50"
              )}
            >
              {selectedPosition === "YES" && (
                <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent animate-pulse" />
              )}
              <TrendingUp className="w-8 h-8 text-green-400 mb-2 mx-auto relative z-10" />
              <div className="text-xl font-bold text-green-400 relative z-10">YES</div>
              <div className="text-sm text-zinc-300 font-medium relative z-10">
                {calculateOdds("YES", parseFloat(betAmount) || 0).odds.toFixed(2)}x odds
              </div>
              <div className="text-xs text-zinc-400 relative z-10">
                {calculateOdds("YES").impliedProb.toFixed(0)}% chance
              </div>
            </button>

            <button
              onClick={() => setSelectedPosition("NO")}
              className={cn(
                "p-4 rounded-lg border-2 transition-all relative overflow-hidden",
                selectedPosition === "NO"
                  ? "border-red-500 bg-gradient-to-br from-red-500/20 to-pink-500/10 shadow-lg shadow-red-500/20"
                  : "border-zinc-800 hover:border-red-500/50 bg-zinc-900/50"
              )}
            >
              {selectedPosition === "NO" && (
                <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent animate-pulse" />
              )}
              <TrendingDown className="w-8 h-8 text-red-400 mb-2 mx-auto relative z-10" />
              <div className="text-xl font-bold text-red-400 relative z-10">NO</div>
              <div className="text-sm text-zinc-300 font-medium relative z-10">
                {calculateOdds("NO", parseFloat(betAmount) || 0).odds.toFixed(2)}x odds
              </div>
              <div className="text-xs text-zinc-400 relative z-10">
                {calculateOdds("NO").impliedProb.toFixed(0)}% chance
              </div>
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4 space-y-3">
            <h5 className="text-sm font-medium text-zinc-200">💰 Enter Bet Amount</h5>
            <div className="relative">
              <Input
                type="number"
                placeholder="How much do you want to bet?"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bg-black/50 border-zinc-700 focus:border-cyan-500/50 pr-16 text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">V3RA</span>
            </div>
            
            {betAmount && selectedPosition && (
              <div className="bg-black/30 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Your bet:</span>
                  <span className="text-zinc-300 font-medium">{betAmount} V3RA</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Position:</span>
                  <span className={selectedPosition === "YES" ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{selectedPosition}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-zinc-800">
                  <span className="text-zinc-500">Potential win:</span>
                  <span className="text-yellow-400 font-bold">
                    {(parseFloat(betAmount) * calculateOdds(selectedPosition, parseFloat(betAmount)).odds).toFixed(0)} V3RA
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleBet}
              disabled={!betAmount || !selectedPosition || parseFloat(betAmount) > userPoints}
              className={cn(
                "w-full font-medium shadow-lg transition-all duration-200",
                selectedPosition === "YES" ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-600/20 hover:shadow-green-500/30" :
                selectedPosition === "NO" ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-red-600/20 hover:shadow-red-500/30" :
                "bg-zinc-700"
              )}
            >
              <Coins className="w-4 h-4 mr-2" />
              Place Bet {selectedPosition && `on ${selectedPosition}`}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {market?.participants || 0} participants
              </span>
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {market?.totalVolume || 0} V3RA volume
              </span>
            </div>
            
            {/* Betting Activity Toggle */}
            <Button
              onClick={() => setShowActivity(!showActivity)}
              variant="ghost"
              size="sm"
              className="w-full text-xs text-zinc-400 hover:text-zinc-200"
            >
              {showActivity ? "Hide" : "Show"} Betting Activity
              {market && market.bets.length > 0 && (
                <Badge className="ml-2 bg-zinc-700 text-zinc-300">{market.bets.length}</Badge>
              )}
            </Button>
            
            {/* Betting Activity List */}
            {showActivity && market && market.bets.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {market.bets.slice().reverse().map((bet, idx) => (
                  <div key={bet.id} className="flex items-center justify-between text-xs p-2 bg-black/30 rounded">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        bet.position === "YES" ? "bg-green-400" : "bg-red-400"
                      )} />
                      <span className="text-zinc-400">
                        {bet.amount} V3RA on {bet.position}
                      </span>
                    </div>
                    <div className="text-zinc-500">
                      {bet.odds.toFixed(2)}x • {new Date(bet.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showActivity && (!market || market.bets.length === 0) && (
              <div className="text-center text-xs text-zinc-500 py-4">
                No bets placed yet. Be the first!
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}