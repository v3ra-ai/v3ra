"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/ask/navbar/navbar";
import Link from "next/link";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Password reset link sent!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-72px)] p-4">
          <div className="w-full max-w-md">
            <div className="p-8 bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-cyan-500/10 rounded-full">
                    <Mail className="h-12 w-12 text-cyan-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                    Check Your Email
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    We've sent a password reset link to
                  </p>
                  <p className="font-medium text-cyan-600 dark:text-cyan-400">
                    {email}
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-500">
                    Didn&apos;t receive the email? Check your spam folder or try again.
                  </p>
                  
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail("");
                    }}
                    variant="outline"
                    className="w-full border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Try Another Email
                  </Button>
                  
                  <Link href="/login" className="block">
                    <Button 
                      variant="ghost" 
                      className="w-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)] p-4">
        <div className="w-full max-w-md">
          <div className="p-8 bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-cyan-500" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
                  Reset Password
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="bg-white dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/25 dark:shadow-cyan-500/20"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center pt-4">
                  <Link
                    href="/login"
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors inline-flex items-center"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}