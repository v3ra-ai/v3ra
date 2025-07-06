"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Newspaper, 
  TrendingUp, 
  Users,
  ArrowRight,
  Sparkles,
  Bot,
  Target
} from "lucide-react";
import { V3raLogo } from "@/components/v3ra-logo";
import { motion } from "framer-motion";

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
    } catch {
      // Handle auth check error silently
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      id: 'headlines',
      title: "Tomorrow's Headlines",
      description: "Daily predictions game. Swipe on tomorrow's news. Earn V3RA points.",
      icon: Newspaper,
      color: "from-purple-600 to-pink-600",
      shadowColor: "shadow-purple-600/20",
      href: "/headlines",
      tag: "NEW",
      tagColor: "bg-purple-500/20 text-purple-400 border-purple-500/30"
    },
    {
      id: 'truth-market',
      title: "Truth Market",
      description: "Bet on the probability of any statement. Create prediction markets.",
      icon: TrendingUp,
      color: "from-cyan-600 to-blue-600",
      shadowColor: "shadow-cyan-600/20",
      href: "/ask/truth-market-simple",
      tag: "BETA",
      tagColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    },
    {
      id: 'ask',
      title: "Multi-AI Consensus",
      description: "Ask multiple AI models. See where they agree and disagree.",
      icon: Bot,
      color: "from-green-600 to-emerald-600",
      shadowColor: "shadow-green-600/20",
      href: "/ask",
      tag: "CLASSIC",
      tagColor: "bg-green-500/20 text-green-400 border-green-500/30"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <V3raLogo size="sm" />
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs px-1.5 py-0.5">
                BETA
              </Badge>
              <p className="text-xs text-zinc-500 ml-2">Truth Discovery Engine</p>
            </div>
            
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      Profile
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="ghost" size="sm">
                      Leaderboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-zinc-100 mb-4"
            >
              Discover Truth Through Consensus
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-400 max-w-2xl mx-auto"
            >
              Three ways to explore AI predictions, verify facts, and earn rewards
            </motion.p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={feature.href}>
                  <Card className="h-full backdrop-blur-sm bg-gradient-to-br from-zinc-900/80 to-black/90 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] cursor-pointer group">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform`}>
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${feature.tagColor}`}>
                          {feature.tag}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-zinc-100 mb-2 group-hover:text-cyan-400 transition-colors">
                        {feature.title}
                      </h3>
                      
                      <p className="text-zinc-400 text-sm mb-4">
                        {feature.description}
                      </p>
                      
                      <div className="flex items-center text-cyan-400 text-sm font-medium">
                        <span>Try it now</span>
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">1,247</div>
              <div className="text-sm text-zinc-500">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">15,420</div>
              <div className="text-sm text-zinc-500">Predictions Made</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">78.3%</div>
              <div className="text-sm text-zinc-500">Consensus Accuracy</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800/50 bg-zinc-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <div>© 2024 V3RA. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-zinc-300">About</Link>
              <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-300">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}