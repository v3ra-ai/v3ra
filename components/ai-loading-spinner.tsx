"use client";

import React from "react";
import { motion } from "framer-motion";

interface AILoadingSpinnerProps {
  message?: string;
}

export const AILoadingSpinner = ({ 
  message = "Loading AI responses..." 
}: AILoadingSpinnerProps) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12">
      {/* Animated dots */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      
      {/* Message with gradient text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-light text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
      >
        {message}
      </motion.p>
    </div>
  );
};
