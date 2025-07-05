"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TruthResult } from "@/components/truth-market/truth-result";
import { Sparkles, Loader2, Home, Coins, Newspaper, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SimpleTruthMarketPage() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [claiming, setClaiming] = useState(false);
  
  useEffect(() => {
    fetchUserPoints();
  }, []);
  
  const fetchUserPoints = async () => {
    try {
      // Use test endpoint for now
      const response = await fetch("/api/test-points");
      const data = await response.json();
      setUserPoints(data.balance || 0);
      setCanClaimBonus(data.canClaimDailyBonus || false);
    } catch (error) {
      console.error("Failed to fetch points:", error);
      // Set default values
      setUserPoints(1000);
      setCanClaimBonus(true);
    }
  };
  
  const claimDailyBonus = async () => {
    setClaiming(true);
    try {
      // Simulate claiming daily bonus (demo mode)
      setUserPoints(prev => prev + 50);
      setCanClaimBonus(false);
      alert('Claimed 50 V3RA points! (Demo mode)');
    } catch (error) {
      console.error("Failed to claim bonus:", error);
    } finally {
      setClaiming(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/truth-market-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim()
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process query");
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Debug alert for prediction
      if (data.isPrediction && data.predictionId) {
        console.warn('🎯 PREDICTION DETECTED!', {
          isPrediction: data.isPrediction,
          predictionId: data.predictionId,
          statement: data.statement
        });
      }
      
      setResult(data);
      
      // Refresh points after query (in case it created a market)
      fetchUserPoints();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Simple Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-zinc-300 hover:text-zinc-100">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" />
                  {userPoints.toLocaleString()} V3RA
                </Badge>
                {canClaimBonus && (
                  <Button
                    size="sm"
                    onClick={claimDailyBonus}
                    disabled={claiming}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs shadow-lg shadow-purple-600/20 hover:shadow-purple-500/30 transition-all duration-200"
                  >
                    {claiming ? "Claiming..." : "Claim Daily Bonus 🎁"}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-cyan-400">Truth Market Beta</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 justify-center">
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
                pathname === "/leaderboard"
                  ? "bg-zinc-800/50 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 mx-auto"
        >
          <h1 className="text-4xl font-bold text-zinc-100 mb-4 text-center">
            Truth Market
          </h1>
          <p className="text-lg text-zinc-400 text-center">
            Every question becomes a probability. Every AI is a trader.
          </p>
        </motion.div>
        
        {/* Daily Headlines Banner */}
        <Link href="/headlines">
          <Card className="backdrop-blur-sm bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.25)] p-6 mb-6 cursor-pointer hover:shadow-[0_0_40px_rgba(147,51,234,0.35)] transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Newspaper className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Tomorrow's Headlines</h3>
                  <p className="text-sm text-zinc-400">Daily prediction game • Earn 50 V3RA</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">NEW</Badge>
                <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>
        
        {/* Main Query Card */}
        <Card className="backdrop-blur-sm bg-gradient-to-br from-zinc-900/80 to-black/90 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)] p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Ask anything - we'll assess its probability of being true
              </label>
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Will AI achieve consciousness? Is climate change reversible? Who will win the 2025 election?"
                className="min-h-[120px] bg-black/50 border-2 border-cyan-500/30 focus:border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)] focus:shadow-[0_0_30px_rgba(6,182,212,0.4)] text-zinc-100 placeholder-zinc-500 transition-all duration-200 rounded-lg"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="px-8 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg shadow-lg shadow-cyan-600/20 hover:shadow-cyan-500/30 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Querying...
                  </>
                ) : (
                  'Ask'
                )}
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-500/30 bg-red-500/10 p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </Card>
        )}
        
        {/* Result Display */}
        {result && !error && (
          <TruthResult
            statement={result.statement}
            consensus={result.consensus}
            positions={result.positions}
            predictionTracked={result.predictionTracked}
            predictionId={result.predictionId}
          />
        )}
        
        {/* Example Questions */}
        {!result && !isLoading && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-zinc-300 mb-4">
              Try these examples:
            </h3>
            <div className="grid gap-2">
              <button
                onClick={() => setQuery("Will AI achieve AGI by 2030?")}
                className="text-left p-3 bg-black/30 border border-zinc-800/50 rounded-lg hover:border-cyan-500/50 hover:bg-black/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 text-sm text-zinc-300 hover:text-zinc-100"
              >
                <span className="text-yellow-400 text-xs">🎯 PREDICTION:</span> Will AI achieve AGI by 2030?
              </button>
              <button
                onClick={() => setQuery("Will Bitcoin reach $100,000 by December 2025?")}
                className="text-left p-3 bg-black/30 border border-zinc-800/50 rounded-lg hover:border-cyan-500/50 hover:bg-black/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 text-sm text-zinc-300 hover:text-zinc-100"
              >
                <span className="text-yellow-400 text-xs">🎯 PREDICTION:</span> Will Bitcoin reach $100,000 by December 2025?
              </button>
              <button
                onClick={() => setQuery("Will SpaceX successfully land humans on Mars before 2030?")}
                className="text-left p-3 bg-black/30 border border-zinc-800/50 rounded-lg hover:border-cyan-500/50 hover:bg-black/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-200 text-sm text-zinc-300 hover:text-zinc-100"
              >
                <span className="text-yellow-400 text-xs">🎯 PREDICTION:</span> Will SpaceX land humans on Mars before 2030?
              </button>
            </div>
          </div>
        )}
        
        {/* Quick Start Guide */}
        {!result && userPoints > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg"
          >
            <h3 className="text-sm font-medium text-zinc-300 mb-2">🎲 How Prediction Markets Work:</h3>
            <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
              <li>Ask any question about the future</li>
              <li>AI models provide initial probability</li>
              <li>Stake 100 V3RA to activate the market</li>
              <li>Bet on YES or NO outcomes</li>
              <li>Win V3RA when predictions resolve!</li>
            </ol>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
}