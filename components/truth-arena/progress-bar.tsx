"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className = "" }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className={`w-full mb-8 ${className}`}>
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-pink-400/50 blur-sm" />
        </motion.div>
        
        {/* Subtle pulse effect on the progress */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-white/20 rounded-full"
          style={{ width: `${progress}%` }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Progress text */}
      <div className="flex justify-between items-center mt-2 text-xs text-zinc-400">
        <span>Refining truth...</span>
        <span>{current}/{total}</span>
      </div>
    </div>
  );
}