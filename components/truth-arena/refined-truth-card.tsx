"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";

interface CleanResponse {
  id: string;
  answer: "YES" | "NO";
  text: string; // Just the response text, no metadata
}

interface RefinedTruthCardProps {
  response: CleanResponse;
  index: number;
  isSelected: boolean;
  isOtherSelected: boolean;
  onSelect: () => void;
  showResults: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  revealData?: {
    modelName: string;
    provider: string;
    agreementPercent: number;
  };
}

export function RefinedTruthCard({
  response,
  index,
  isSelected,
  isOtherSelected,
  onSelect,
  showResults,
  isFocused,
  onFocus,
  onBlur: _onBlur,
  revealData,
}: RefinedTruthCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);

  const handlePressStart = (e: React.MouseEvent) => {
    if (isSelected) return;
    
    setIsPressed(true);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
    
    const timer = setTimeout(() => {
      onFocus();
    }, 300); // 300ms hold to focus
    setPressTimer(timer);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPressed || !isFocused) return;
    
    setIsDragging(true);
    setDragCurrentX(e.clientX);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    
    // If focused and dragging, check swipe direction
    if (isFocused && isDragging) {
      const dragDistance = dragCurrentX - dragStartX;
      const swipeThreshold = 50; // pixels
      
      if (Math.abs(dragDistance) > swipeThreshold) {
        onSelect(); // Any significant swipe selects
      }
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragStartX(0);
    setDragCurrentX(0);
  };

  const handleClick = () => {
    // Only handle click if not dragging and focused
    if (isFocused && !isDragging) {
      onSelect();
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
    };
  }, [pressTimer]);

  const getAnswerColor = (answer: string) => {
    return answer === "YES" 
      ? "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" 
      : "text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.8)]";
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    }),
    focused: {
      scale: 1.05,
      y: -20,
      zIndex: 50,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    selected: {
      scale: 1.03,
      y: -8,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    dimmed: {
      opacity: 0.4,
      scale: 0.97,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      className="w-full max-w-lg mx-auto"
      initial="hidden"
      animate={
        isSelected 
          ? "selected" 
          : isFocused
          ? "focused"
          : isOtherSelected 
          ? "dimmed" 
          : "visible"
      }
      variants={cardVariants}
      custom={index}
    >
      <motion.div
        className={`
          relative p-8 rounded-2xl cursor-pointer
          bg-gradient-to-br from-zinc-900/90 to-black/90 
          backdrop-blur-xl
          border-2 transition-all duration-300
          ${isSelected 
            ? 'border-cyan-400/60 shadow-[0_0_40px_rgba(0,255,255,0.3)]' 
            : 'border-zinc-700/40 hover:border-cyan-500/30'
          }
          ${isOtherSelected ? 'border-zinc-700/20' : ''}
        `}
        onClick={handleClick}
        onMouseDown={handlePressStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        whileHover={!isSelected && !isOtherSelected ? { 
          scale: 1.01,
          borderColor: "rgba(6, 182, 212, 0.4)"
        } : {}}
        animate={{
          scale: isPressed ? 0.98 : 1,
          x: isFocused && isDragging ? (dragCurrentX - dragStartX) * 0.3 : 0, // Subtle drag feedback
        }}
        transition={{ duration: 0.1 }}
        style={{ cursor: isFocused ? 'grab' : 'pointer' }}
      >
        {/* Answer - Compact but Bold */}
        <div className="text-center mb-4">
          <motion.span 
            className={`text-4xl font-black ${getAnswerColor(response.answer)}`}
            animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            {response.answer}
          </motion.span>
        </div>

        {/* Response Text - Clean and Simple */}
        <div className="text-zinc-200 text-sm leading-relaxed text-left relative px-2">
          {isFocused ? (
            // Full text when focused
            <motion.div 
              className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {response.text}
            </motion.div>
          ) : (
            // Truncated text with fade
            <div 
              className="max-h-20 overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
              }}
            >
              {response.text}
            </div>
          )}
        </div>

        {/* Focus Indicator */}
        {isFocused && !isSelected && (
          <>
            <motion.div
              className="absolute bottom-4 right-4"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <div className="text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/30">
                {isDragging ? "Release to select" : "Swipe left or right"}
              </div>
            </motion.div>
            
            {/* Swipe Direction Indicators */}
            {!isDragging && (
              <>
                <motion.div
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/50"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="text-2xl">←</div>
                </motion.div>
                <motion.div
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <div className="text-2xl">→</div>
                </motion.div>
              </>
            )}
          </>
        )}

        {/* Selection Indicator */}
        {isSelected && showResults && (
          <motion.div
            className="absolute top-4 right-4"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="h-5 w-5 text-white" />
            </div>
          </motion.div>
        )}

        {/* Glow effect for selected card */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-pink-500/5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* Reveal Data After Selection */}
      {isSelected && showResults && revealData && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {revealData.agreementPercent}%
          </div>
          <div className="text-zinc-400 text-sm mb-2">
            agreed with you
          </div>
          <div className="text-zinc-500 text-xs">
            This was <span className="text-cyan-300 font-medium">{revealData.modelName}</span> by {revealData.provider}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}