"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
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
        <h1 className="text-5xl md:text-6xl font-bold text-zinc-800 dark:text-zinc-200 mb-6">
          V3RA Truth Arena
        </h1>
        
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
          Evaluate AI responses to discover truth through human consensus. 
          Join the collective intelligence network.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white px-8"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-300 dark:border-zinc-700"
            >
              Log In
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto">
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Ask Questions
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Submit queries to multiple AI models and see how they respond
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Build Consensus
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Contribute to collective intelligence by evaluating responses
            </p>
          </div>
          
          <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg border border-zinc-200 dark:border-zinc-700">
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