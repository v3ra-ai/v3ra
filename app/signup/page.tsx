"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { checkDuplicateUser } from "@/lib/server-actions";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error in query parameters (e.g., from /auth/callback)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam || "An error occurred during signup. Please try again.");
    }
  }, [searchParams]);

  // Validate email and username format
  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return false;
    }
    return true;
  };

  // Handle email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Client-side validation
      if (!validateInputs()) {
        setLoading(false);
        return;
      }

      // Check for duplicate email or username using Server Action
      const result = await checkDuplicateUser(email, username);

      if (!result.success) {
        setError(result.error || "Failed to check user availability. Please try again.");
        setLoading(false);
        return;
      }

      if (result.existingUser) {
        setError(
          result.field === "email"
            ? "This email is already registered. Please use a different email or log in."
            : "This username is already taken. Please choose a different username."
        );
        setLoading(false);
        return;
      }

      // Initiate email signup with Supabase (magic link)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { username },
          emailRedirectTo: "http://localhost:3000/auth/callback",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to send verification code. Please check your email or try again.");
      }

      localStorage.setItem("signupEmail", email);
      router.push("/auth/verify");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "An error occurred during signup. Please try again.");
      setLoading(false);
    }
  };

  // Handle OAuth signup
  const handleOAuthSignup = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });

      if (error) {
        throw new Error(error.message || `Failed to sign up with ${provider}. Please try again.`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || `Failed to sign up with ${provider}. Please try again.`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full md:max-w-md mx-auto p-6">
        <div className="p-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
            Sign Up
          </h1>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleEmailSignup} className="space-y-6">
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
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 cursor-pointer"
            >
              {loading ? "Sending..." : "Sign Up with Email"}
            </Button>
          </form>
          <div className="mt-6 space-y-4">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignup("google")}
              disabled={loading}
              className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              Sign Up with Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthSignup("github")}
              disabled={loading}
              className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              Sign Up with GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}