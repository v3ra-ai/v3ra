"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { V3raLogo } from "@/components/v3ra-logo";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { useUserPoints } from "@/hooks/useUserPoints";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { userPoints } = useUserPoints();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* Navbar */}
      <Navbar userPoints={userPoints} />
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent" />
      
      {/* Floating particles effect - only render on client */}
      {mounted && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => {
            const xPos = (i * 37) % 100; // deterministic pseudo-random
            const yPos = (i * 53) % 100;
            const delay = (i * 7) % 10;
            const duration = 15 + (i % 5);
            return (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                initial={{ x: `${xPos}%`, y: `${yPos}%` }}
                animate={{ y: [null, -100], opacity: [0, 1, 0] }}
                transition={{ duration, repeat: Infinity, delay, ease: "linear" }}
              />
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mb-8"
          >
            <V3raLogo size="xl" variant="neon" />
          </motion.div>

          {/* Hero Text */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold mb-6"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-gradient">
              Which AI is actually smarter?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto"
          >
            Blind test AI responses. Pick the best answer. Discover the truth.
          </motion.p>

          {/* Single CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/ask">
              <Button
                size="lg"
                className="group relative px-8 py-6 text-lg font-semibold rounded-2xl
                           bg-gradient-to-r from-purple-600 to-pink-600
                           hover:from-purple-500 hover:to-pink-500
                           shadow-2xl shadow-purple-600/25
                           hover:shadow-purple-500/40
                           transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  Start Playing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              </Button>
            </Link>
          </motion.div>

          {/* Simple stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 flex items-center justify-center gap-8 text-white/40"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>52% pick Llama over GPT-4 blind</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div>
              <span>1,247 blind tests completed</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
