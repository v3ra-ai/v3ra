"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { prisma } from "@/lib/db/client";
import Navbar from "@/components/ask/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle email signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { name: username }],
        },
      });

      if (existingUser) {
        setError(
          existingUser.email === email
            ? "Email already in use"
            : "Username already taken"
        );
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: { username },
          emailRedirectTo: "http://localhost:3000/auth/callback",
        },
      });

      if (error) throw error;

      localStorage.setItem("signupEmail", email);
      router.push("/auth/verify");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to sign up");
    } finally {
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

      if (error) throw error;
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || `Failed to sign up with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full md:max-w-md  mx-auto p-6">
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