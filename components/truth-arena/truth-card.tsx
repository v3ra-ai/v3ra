"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface AIResponse {
  id: string;
  modelName: string;
  answer: "YES" | "NO";
  rationale: string;
  provider: string;
}

interface TruthCardProps {
  response: AIResponse;
  index: number;
  total: number;
  isSelected: boolean;
  isOtherSelected: boolean;
  onSelect: () => void;
  showResults: boolean;
  agreementPercent: number;
}

export function TruthCard({
  response,
  index,
  total,
  isSelected,
  isOtherSelected,
  onSelect,
  showResults,
  agreementPercent,
}: TruthCardProps) {
  const getAnswerColor = (answer: string) => {
    return answer === "YES" 
      ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" 
      : "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]";
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.9,
      rotateY: -15
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      rotateY: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    }),
    selected: {
      scale: 1.05,
      y: -10,
      boxShadow: "0 20px 40px rgba(0, 255, 255, 0.3)",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    dimmed: {
      opacity: 0.3,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.3
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        delay: 0.5,
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  // Calculate stagger effect for card positioning
  const zIndex = total - index;
  const offsetY = index * 8;
  const offsetX = index * 2;

  return (
    <motion.div
      className="relative w-full max-w-lg"
      style={{ zIndex }}
      initial="hidden"
      animate={
        isSelected 
          ? "selected" 
          : isOtherSelected 
          ? "dimmed" 
          : "visible"
      }
      variants={cardVariants}
      custom={index}
    >
      <motion.div
        className={`
          relative p-6 rounded-xl border cursor-pointer
          bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-950/80 
          backdrop-blur-xl
          border-zinc-700/50
          hover:border-cyan-500/30 
          transition-all duration-300
          ${isSelected ? 'border-cyan-400/60' : ''}
          ${isOtherSelected ? 'border-zinc-700/30' : ''}
        `}
        style={{
          transform: `translateY(${offsetY}px) translateX(${offsetX}px)`,
          marginBottom: index < total - 1 ? `-${60 - offsetY}px` : '0'
        }}
        onClick={onSelect}
        whileHover={!isSelected && !isOtherSelected ? { 
          scale: 1.02,
          y: -5,
          boxShadow: "0 10px 30px rgba(0, 255, 255, 0.15)"
        } : {}}
        whileTap={{ scale: 0.98 }}
      >
        {/* Model Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 flex items-center justify-center border border-cyan-500/30">
              <span className="text-xs font-bold text-cyan-300">
                {response.modelName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-zinc-300 font-medium text-sm">{response.modelName}</div>
              <div className="text-zinc-500 text-xs">{response.provider}</div>
            </div>
          </div>
          {isSelected && showResults && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2"
            >
              <Check className="h-5 w-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium text-sm">Selected</span>
            </motion.div>
          )}
        </div>

        {/* Answer */}
        <div className="mb-4">
          <span className={`text-4xl font-bold ${getAnswerColor(response.answer)}`}>
            {response.answer}
          </span>
        </div>

        {/* Rationale */}
        <div className="text-zinc-300 text-sm leading-relaxed">
          {response.rationale.length > 150 
            ? `${response.rationale.substring(0, 150)}...`
            : response.rationale
          }
        </div>

        {/* Glow effect for selected card */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-pink-500/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* Agreement Overlay */}
      {isSelected && showResults && (
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm"
        >
          <div className="text-center">
            <motion.div
              className="text-3xl font-bold text-cyan-400 mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
            >
              {agreementPercent}%
            </motion.div>
            <div className="text-zinc-300 text-sm">
              agreed with you
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}