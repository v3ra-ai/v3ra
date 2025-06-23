"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Zap, TrendingUp, X } from "lucide-react";

interface ArenaOnboardingProps {
  onComplete: () => void;
}

export function ArenaOnboarding({ onComplete }: ArenaOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: Target,
      title: "Welcome to the Truth Arena",
      description: "Help refine truth by choosing the best AI responses to real questions",
      detail: "Every question you see was asked by a real user seeking answers"
    },
    {
      icon: Zap,
      title: "One Gesture, Maximum Impact",
      description: "Simply tap the response that feels most true to you",
      detail: "No complex ratings - just pick what feels right. It's that simple."
    },
    {
      icon: TrendingUp,
      title: "Build the Future of Truth",
      description: "Your choices help rank AI models and create consensus",
      detail: "See how much others agree with you and build your refinement streak"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const skip = () => {
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="bg-gradient-to-br from-zinc-900/95 to-black/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full border border-cyan-500/20"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Close button */}
        <button
          onClick={skip}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 flex items-center justify-center border border-cyan-500/30">
                {React.createElement(steps[currentStep].icon, { className: "h-8 w-8 text-cyan-400" })}
              </div>
            </div>

            {/* Content */}
            <h2 className="text-2xl font-bold text-zinc-100 mb-3">
              {steps[currentStep].title}
            </h2>
            <p className="text-lg text-zinc-300 mb-4">
              {steps[currentStep].description}
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {steps[currentStep].detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mt-8 mb-6">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-8 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? "bg-cyan-500" 
                  : index < currentStep 
                  ? "bg-cyan-500/50" 
                  : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={skip}
            className="flex-1 py-3 text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
          >
            Skip
          </button>
          <motion.button
            onClick={nextStep}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {currentStep === steps.length - 1 ? "Start Refining" : "Next"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}