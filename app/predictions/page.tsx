"use client";

import { PredictionHistory } from "@/components/predictions/prediction-history";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Activity, Home, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PredictionsPage() {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Clean Header */}
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
                pathname === "/leaderboard"
                  ? "bg-zinc-800/50 text-cyan-400 border-b-2 border-cyan-400"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              )}
            >
              Leaderboard
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Predictions</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Track AI predictions and their accuracy over time
              </p>
            </div>
            <Link href="/ask/truth-market-simple">
              <Button className="bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/20">
                <Plus className="w-4 h-4 mr-2" />
                New Prediction
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-12">
              <Activity className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
              <span className="text-zinc-400">Loading predictions...</span>
            </div>
          }>
            <PredictionHistory />
          </Suspense>
        </div>
      </div>
    </div>
  );
}