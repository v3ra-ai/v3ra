"use client";

import { PredictionHistory } from "@/components/predictions/prediction-history";
import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Activity } from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { supabase } from "@/lib/supabase-client";

export default function PredictionsPage() {
  const [userPoints, setUserPoints] = useState(0);
  
  useEffect(() => {
    loadUserPoints();
  }, []);
  
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
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar userPoints={userPoints} />
          
      {/* Page Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
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