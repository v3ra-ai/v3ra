"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAuthCallbackURL } from "@/lib/url-utils";

export default function SignupClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || null;

  useEffect(() => {
    if (searchParams.get("reason") === "auth_required") {
      toast.error("Please sign up to continue", {
        description: "Create an account to access this page.",
        duration: 5000,
      });
    }
  }, [searchParams]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      // Validate username
      if (!username || username.length < 3) {
        throw new Error("Username must be at least 3 characters.");
      }

      // Validate password
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      // Validate password match
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      // Sign up with email and password
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: getAuthCallbackURL(),
        },
      });

      if (error) {
        console.error("[signup] Supabase auth error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user returned from signup.");
      }

      // Store the return URL if provided
      if (returnTo) {
        localStorage.setItem("authReturnTo", returnTo);
      }

      // Store email for verification page
      localStorage.setItem("signupEmail", email);
      
      // Show success message and redirect to verify email
      toast.success("Account created!", {
        description: "Please check your email to verify your account.",
        duration: 5000,
      });

      // Redirect to verify page
      router.push("/auth/verify");
    } catch (err) {
      const error = err as Error & { code?: string; status?: number };
      console.error("[signup] Signup error:", error);

      let userMessage = "Failed to create account. Please try again.";
      if (error.message.includes("already registered")) {
        userMessage = "An account with this email already exists.";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full max-w-md mx-auto p-6">
        <div className="p-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
            Sign Up
          </h1>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleSignup} className="space-y-6">
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
              <Label htmlFor="username" className="text-zinc-800 dark:text-zinc-200">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="mt-1 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200"
                placeholder="johndoe"
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
            <div>
              <Label htmlFor="confirmPassword" className="text-zinc-800 dark:text-zinc-200">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-500 dark:hover:text-teal-400"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}