"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dispatch, SetStateAction } from "react";
import { QueryMode } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

interface QueryFormInputProps {
  queryText: string;
  setQueryText: Dispatch<SetStateAction<string>>;
  placeholderText?: string;
  handleSubmit: () => void;
  isSubmitting: boolean;
  isSubmitInteracted: boolean;
  queryMode: QueryMode;
  queriesRequested: number;
}

const QueryFormInputComponent = function QueryFormInput({
  queryText,
  setQueryText,
  placeholderText,
  handleSubmit,
  isSubmitting,
  isSubmitInteracted: _isSubmitInteracted,
  queryMode: _queryMode,
  queriesRequested: _queriesRequested,
}: QueryFormInputProps) {
  const onSubmit = () => {
    try {
      handleSubmit();
    } catch {
      toast.error("Failed to submit query, please try again", {
        style: { background: "#fee2e2", color: "#dc2626" },
      });
    }
  };

  const isSubmitDisabled = useMemo(
    () => isSubmitting || !queryText.trim(),
    [isSubmitting, queryText]
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <textarea
          className="w-full p-4 rounded-xl h-24 resize-none
            bg-transparent
            border-0
            text-2xl text-white placeholder-white/50
            focus:outline-none focus:placeholder-white/70
            transition-all duration-300
            font-medium"
          placeholder={placeholderText || "Ask me anything..."}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          style={{
            background: 'transparent',
            boxShadow: 'none',
          }}
        />
        
        {/* Subtle bottom border for definition */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="relative group px-8 py-4 rounded-xl
            bg-gradient-to-r from-purple-600 to-pink-600
            text-white font-semibold text-lg
            disabled:opacity-30 disabled:cursor-not-allowed
            shadow-2xl shadow-purple-500/50
            hover:shadow-purple-500/70
            transition-all duration-300"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
          
          {/* Button content */}
          <div className="relative flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Finding AI responses...</span>
              </>
            ) : (
              <>
                <span>Compare AI Responses</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export const QueryFormInput = QueryFormInputComponent;