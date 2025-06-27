"use client";

import { useState } from "react";
import { MessageSquarePlus, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase-client";

type FeedbackType = "bug" | "feature" | "ux" | "other";

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Get user email if logged in
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setEmail(user.email);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    checkUser();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Gather browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message,
          email,
          userId: user?.id,
          browserInfo,
        }),
      });

      if (!response.ok) throw new Error("Failed to send feedback");

      toast.success("Thank you for your feedback!");
      setIsOpen(false);
      setMessage("");
      setType("bug");
    } catch (_error) {
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 p-4 bg-zinc-900/90 dark:bg-zinc-800/90 backdrop-blur-xl border border-zinc-700 dark:border-cyan-500/30 rounded-full shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300 group"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5 text-zinc-300 group-hover:text-cyan-400 transition-colors" />
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-zinc-800 dark:bg-zinc-900 text-white text-sm rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Send Feedback
          <div className="absolute top-full right-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-zinc-800 dark:border-t-zinc-900" />
        </div>
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
            >
              <div className="bg-white dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.7)]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
                      Send Feedback
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Help us improve v3ra
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Feedback Type */}
                  <div className="space-y-3">
                    <Label className="text-zinc-700 dark:text-zinc-300">
                      Feedback Type
                    </Label>
                    <RadioGroup value={type} onValueChange={(value) => setType(value as FeedbackType)}>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "bug", label: "Bug Report", icon: "🐛" },
                          { value: "feature", label: "Feature Request", icon: "✨" },
                          { value: "ux", label: "UX Improvement", icon: "🎨" },
                          { value: "other", label: "Other", icon: "💬" },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              type === option.value
                                ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10"
                                : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                            }`}
                          >
                            <RadioGroupItem value={option.value} className="sr-only" />
                            <span className="text-lg">{option.icon}</span>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
                      Email
                    </Label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 transition-colors text-zinc-800 dark:text-zinc-200 placeholder-zinc-500"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-zinc-700 dark:text-zinc-300">
                      Your Feedback
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      rows={4}
                      required
                      className="w-full bg-white dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 focus:border-cyan-500 dark:focus:border-cyan-400 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Feedback
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}