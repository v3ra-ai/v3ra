"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { logger } from "@/lib/utils/client-logger";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || null;

  useEffect(() => {
    if (searchParams.get("reason") === "auth_required") {
      toast.error("Please log in to continue", {
        description: "Authentication is required to access this page.",
        duration: 5000,
      });
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        logger.error("Supabase auth error", error, { context: "login" });
        throw error;
      }

      if (!data.user) {
        throw new Error("No user returned from login.");
      }

      // Create or get user via API route directly
      logger.info("Creating/getting user in database", { userId: data.user.id });
      
      const response = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: data.user.id,
          email: data.user.email || "",
          username: data.user.user_metadata?.username || data.user.email?.split("@")[0],
        }),
      });

      const result = await response.json();

      if (!result.success && result.code !== "USER_EXISTS") {
        throw new Error(result.error || "Failed to create user");
      }

      logger.info("Login successful, redirecting", { context: "login" });
      
      // Redirect to the return URL or /ask
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push("/ask");
      }
    } catch (err) {
      const error = err as Error & { code?: string; status?: number };

      let userMessage = "Failed to log in. Please try again.";
      if (error.message.includes("Invalid login credentials")) {
        userMessage = "Invalid email or password.";
      } else if (error.code === "429") {
        userMessage = "Too many attempts. Please wait a minute and try again.";
      } else if (error.message) {
        userMessage = error.message;
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 relative z-10 mt-20">
      <div className="relative">
        {/* Glass morphism card with glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
        <div className="relative p-8 md:p-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-8">
            Log In
          </h1>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </Button>
          </form>
          
          <div className="mt-8 space-y-3">
            <div className="text-center">
              <Link 
                href="/signup" 
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Don&apos;t have an account?{" "}
                <span className="text-purple-400 hover:text-purple-300 font-medium">Sign up</span>
              </Link>
            </div>
            <div className="text-center">
              <Link 
                href="/forgot-password" 
                className="text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}