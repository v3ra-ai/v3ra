"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { V3raLogo } from "@/components/v3ra-logo";

export default function Home() {
  const router = useRouter();
  const [_isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      
      // If logged in, redirect to /ask
      if (session) {
        router.push("/ask");
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <div className="flex justify-center mb-6">
          <V3raLogo size="lg" className="scale-150" />
        </div>
        
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
          Evaluate AI responses to discover truth through human consensus. 
          Join the collective intelligence network.
        </p>

        <div className="flex justify-center mb-16">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-12 shadow-lg shadow-cyan-500/20"
            >
              Sign Up
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
          <div className="bg-zinc-900/20 dark:bg-zinc-950/40 p-6 rounded-lg border border-zinc-800 dark:border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Ask Questions
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Submit queries to multiple AI models and see how they respond
            </p>
          </div>
          
          <div className="bg-zinc-900/20 dark:bg-zinc-950/40 p-6 rounded-lg border border-zinc-800 dark:border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Build Consensus
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Contribute to collective intelligence by evaluating responses
            </p>
          </div>
          
          <div className="bg-zinc-900/20 dark:bg-zinc-950/40 p-6 rounded-lg border border-zinc-800 dark:border-cyan-500/20 hover:border-cyan-500/30 transition-all duration-200">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Earn Rewards
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Get tokens for your contributions to the truth network
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}