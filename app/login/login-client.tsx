"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

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
        password,
      });

      if (error) {
        console.error("[login] Supabase auth error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user returned from login.");
      }

      // Store the return URL if provided
      if (returnTo) {
        localStorage.setItem("authReturnTo", returnTo);
      }

      // Redirect to callback to handle user creation/retrieval
      router.push("/auth/callback");
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
    <div className="w-full max-w-md mx-auto p-6">
      <div className="p-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
        <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
          Log In
        </h1>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-zinc-800 dark:text-zinc-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="mt-1 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-zinc-800 dark:text-zinc-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="mt-1 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200"
              placeholder="••••••••"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <Link 
            href="/signup" 
            className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-500 dark:hover:text-teal-400"
          >
            Don&apos;t have an account? Sign up
          </Link>
          <div>
            <Link 
              href="/forgot-password" 
              className="text-sm text-zinc-600 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}