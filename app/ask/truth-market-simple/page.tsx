"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Navbar } from "@/components/shared/navbar";
import { QueryModelSelector } from "@/components/ask/query/query-model-selector";
import { SelectedModelsDisplay } from "@/components/ask/query/selected-models-display";
import { useLLMStore } from "@/store/llm-store";
import { logger } from "@/lib/utils/client-logger";
import { sessionCache } from "@/lib/utils/cache";

// Dynamic imports for heavy components
const TruthResult = dynamic(() => import("@/components/truth-market/truth-result").then(mod => ({ default: mod.TruthResult })), {
  loading: () => <div className="animate-pulse h-96 bg-zinc-800/50 rounded-lg" />,
});

const LLMProvider = dynamic(() => import("@/components/llm-provider").then(mod => ({ default: mod.LLMProvider })), {
  ssr: false,
});

function SimpleTruthMarketPageContent() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [canClaimBonus, setCanClaimBonus] = useState(false);
  const [claiming, setClaiming] = useState(false);
  
  // Get selected LLMs from store
  const llms = useLLMStore((state) => state.llms);
  const selectedLLMIds = llms.filter(llm => llm.enabled).map(llm => llm.id);
  
  useEffect(() => {
    fetchUserPoints();
  }, []);
  
  const fetchUserPoints = async () => {
    try {
      // Check cache first for user session
      const cachedSession = sessionCache.get('user-session');
      const user = cachedSession?.user;
      
      if (!user) {
        // Fetch from Supabase if not cached
        const { data: { user: freshUser } } = await supabase.auth.getUser();
        if (freshUser) {
          const response = await fetch(`/api/user/points?userId=${freshUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setUserPoints(data.balance || 0);
            setCanClaimBonus(false); // TODO: Implement daily bonus check
          } else {
            // Fallback values
            setUserPoints(1000);
            setCanClaimBonus(true);
          }
        } else {
          // Not authenticated - use demo values
          setUserPoints(1000);
          setCanClaimBonus(true);
        }
      } else {
        // Use cached user
        const response = await fetch(`/api/user/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserPoints(data.balance || 0);
          setCanClaimBonus(false);
        } else {
          setUserPoints(1000);
          setCanClaimBonus(true);
        }
      }
    } catch (error) {
      logger.error("Failed to fetch points:", error);
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
      logger.error("Failed to claim bonus:", error);
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
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const { token: csrfToken } = await csrfResponse.json();
      
      const response = await fetch("/api/truth-market-v2", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(csrfToken && { "X-CSRF-Token": csrfToken })
        },
        body: JSON.stringify({
          query: query.trim(),
          selectedLLMIds: selectedLLMIds.length > 0 ? selectedLLMIds : undefined
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process query");
      }
      
      const data = await response.json();
      logger.debug('API Response:', data);
      
      // Debug alert for prediction
      if (data.isPrediction && data.predictionId) {
        logger.info('🎯 PREDICTION DETECTED!', {
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
      <Navbar 
        userPoints={userPoints}
        canClaimBonus={canClaimBonus}
        onClaimBonus={claimDailyBonus}
        claiming={claiming}
      />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8 mx-auto">
          <h1 className="text-4xl font-bold text-zinc-100 mb-4 text-center">
            Truth Market
          </h1>
          <p className="text-lg text-zinc-400 text-center">
            Every question becomes a probability. Every AI is a trader.
          </p>
        </div>
        
        {/* Main Query Card */}
        <Card className="backdrop-blur-sm bg-gradient-to-br from-zinc-900/80 to-black/90 border border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.25)] p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Ask anything - we&apos;ll assess its probability of being true
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
                    Querying {selectedLLMIds.length || 5} models...
                  </>
                ) : (
                  'Ask'
                )}
              </Button>
            </div>
          </form>
          
          {/* Model Selector - Below the form like in the second image */}
          <div className="mt-6 flex flex-col items-center">
            <QueryModelSelector />
          </div>
        </Card>
        
        {/* Selected Models Display */}
        <SelectedModelsDisplay />
        
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
          <div className="mt-8 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
            <h3 className="text-sm font-medium text-zinc-300 mb-2">🎲 How Prediction Markets Work:</h3>
            <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
              <li>Ask any question about the future</li>
              <li>AI models provide initial probability</li>
              <li>Stake 100 V3RA to activate the market</li>
              <li>Bet on YES or NO outcomes</li>
              <li>Win V3RA when predictions resolve!</li>
            </ol>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default function SimpleTruthMarketPage() {
  return (
    <LLMProvider>
      <SimpleTruthMarketPageContent />
    </LLMProvider>
  );
}