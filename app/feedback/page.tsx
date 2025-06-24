"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Bug, Lightbulb, MessageCircle, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Navbar from "@/components/ask/navbar/navbar";

type FeedbackType = "bug" | "feature" | "general";

interface FeedbackCategory {
  type: FeedbackType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const categories: FeedbackCategory[] = [
  { type: "bug", label: "Bug Report", icon: Bug, color: "text-red-500 dark:text-red-400" },
  { type: "feature", label: "Feature Request", icon: Lightbulb, color: "text-blue-500 dark:text-blue-400" },
  { type: "general", label: "General Feedback", icon: MessageCircle, color: "text-green-500 dark:text-green-400" },
];

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("feedback")
        .insert({
          user_id: user?.id,
          type: feedbackType,
          message: message.trim(),
          url: document.referrer || "/feedback",
          user_agent: navigator.userAgent,
        });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Thank you for your feedback!");
      
      // Reset form after delay
      setTimeout(() => {
        setMessage("");
        setFeedbackType("general");
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">
          Help Us Improve
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Your feedback helps us make v3ra better for everyone
        </p>

        {submitted ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-green-700 dark:text-green-300">
              We appreciate you taking the time to help us improve.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-6 sm:p-8">
            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                What type of feedback do you have?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.type}
                      onClick={() => setFeedbackType(category.type)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                        feedbackType === category.type
                          ? "border-primary bg-primary/10 dark:border-cyan-500 dark:bg-cyan-500/10"
                          : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${category.color}`} />
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Your feedback
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  feedbackType === "bug"
                    ? "Please describe the bug you encountered. Include steps to reproduce if possible..."
                    : feedbackType === "feature"
                    ? "What feature would you like to see? How would it help you?"
                    : "Share your thoughts with us..."
                }
                className="min-h-[150px] resize-none"
                maxLength={1000}
              />
              <p className="mt-2 text-xs text-zinc-500">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-between items-center">
              {!isAuthenticated && (
                <p className="text-sm text-zinc-500">
                  Please{" "}
                  <button
                    onClick={() => router.push("/login")}
                    className="text-primary hover:underline"
                  >
                    sign in
                  </button>{" "}
                  to submit feedback
                </p>
              )}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !message.trim() || !isAuthenticated}
                className="bg-primary text-primary-foreground dark:bg-cyan-600 dark:hover:bg-cyan-500 ml-auto"
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Quick tips */}
        <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
          <h3 className="font-semibold text-sm mb-2">Tips for great feedback:</h3>
          <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
            <li>• Be specific about what happened or what you&apos;d like to see</li>
            <li>• Include steps to reproduce bugs when possible</li>
            <li>• One topic per submission helps us track better</li>
          </ul>
        </div>
      </div>
    </div>
  );
}