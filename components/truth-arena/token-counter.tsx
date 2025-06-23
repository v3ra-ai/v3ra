"use client";

import { motion } from "framer-motion";
import { Coins, Plus } from "lucide-react";

interface TokenCounterProps {
  tokens: number;
  earnedThisSession?: number;
  isEarning?: boolean;
  className?: string;
}

export function TokenCounter({ 
  tokens, 
  earnedThisSession = 0, 
  isEarning = false,
  className = "" 
}: TokenCounterProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Token Balance */}
      <div className="flex items-center gap-2 bg-zinc-900/50 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-700/30">
        <Coins className="h-5 w-5 text-yellow-400" />
        <motion.span 
          className="text-zinc-100 font-semibold"
          key={tokens}
          initial={{ scale: 1.2, color: "#fbbf24" }}
          animate={{ scale: 1, color: "#f4f4f5" }}
          transition={{ duration: 0.3 }}
        >
          {tokens}
        </motion.span>
      </div>

      {/* Earning Animation */}
      {isEarning && (
        <motion.div
          className="flex items-center gap-1 text-emerald-400"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.4 }}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm font-bold">1</span>
        </motion.div>
      )}

      {/* Session Earnings */}
      {earnedThisSession > 0 && (
        <div className="text-xs text-emerald-400/70">
          +{earnedThisSession} today
        </div>
      )}
    </div>
  );
}