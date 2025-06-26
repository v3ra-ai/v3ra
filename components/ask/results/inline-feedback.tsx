"use client";

import { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineFeedbackProps {
  queryId: string;
  onFeedback?: (queryId: string, feedback: "helpful" | "not-helpful") => void;
}

export function InlineFeedback({ queryId, onFeedback }: InlineFeedbackProps) {
  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not-helpful" | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // Load saved feedback from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`feedback-${queryId}`);
    if (saved === "helpful" || saved === "not-helpful") {
      setFeedbackGiven(saved);
    }
  }, [queryId]);

  const handleFeedback = (type: "helpful" | "not-helpful") => {
    if (feedbackGiven) return; // Prevent multiple submissions

    setFeedbackGiven(type);
    setShowThankYou(true);
    
    // Save to localStorage
    localStorage.setItem(`feedback-${queryId}`, type);
    
    // Call callback if provided
    onFeedback?.(queryId, type);
    
    // Track with analytics
    if (typeof window !== "undefined") {
      // Hotjar event
      if (window.hj) {
        window.hj("event", "inline_feedback_given");
        window.hj("event", `feedback_${type}`);
      }
      
      // You can add Sentry breadcrumb here
      // if (window.Sentry) {
      //   window.Sentry.addBreadcrumb({
      //     category: "feedback",
      //     message: `User gave ${type} feedback`,
      //     level: "info",
      //     data: { queryId }
      //   });
      // }
    }
    
    // Hide thank you after 3 seconds
    setTimeout(() => setShowThankYou(false), 3000);
  };

  return (
    <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800">
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">Was this helpful?</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFeedback("helpful")}
            disabled={feedbackGiven !== null}
            className={cn(
              "group flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200",
              "text-xs",
              feedbackGiven === "helpful"
                ? "bg-cyan-500/20 text-cyan-400 cursor-default"
                : feedbackGiven === "not-helpful"
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-cyan-500/10 hover:text-cyan-400 cursor-pointer"
            )}
            aria-label="This was helpful"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Yes</span>
          </button>
          <button
            onClick={() => handleFeedback("not-helpful")}
            disabled={feedbackGiven !== null}
            className={cn(
              "group flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200",
              "text-xs",
              feedbackGiven === "not-helpful"
                ? "bg-rose-500/20 text-rose-400 cursor-default"
                : feedbackGiven === "helpful"
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
            )}
            aria-label="This was not helpful"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>No</span>
          </button>
        </div>
      </div>
      
      {showThankYou && (
        <span className="text-xs text-cyan-400 animate-fade-in">
          Thanks for your feedback!
        </span>
      )}
    </div>
  );
}

// Add this to your global CSS for the fade-in animation
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(4px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in {
//   animation: fade-in 0.3s ease-out;
// }