"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle email login (send one-time code)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Debug cookies before OTP initiation
      const cookiesBefore = document.cookie.split(";").map((c) => c.trim());
      console.log("Client-side cookies before OTP initiation:", cookiesBefore);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "http://localhost:3000/auth/callback",
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to send login code. Please check your email or try again.");
      }

      // Debug cookies after initiating OTP
      const cookiesAfter = document.cookie.split(";").map((c) => c.trim());
      console.log("Client-side cookies after OTP initiation:", cookiesAfter);

      localStorage.setItem("signupEmail", email);
      router.push("/auth/verify");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to send login code. Please try again.");
      setLoading(false);
    }
  };

  // Handle OAuth login (Google/GitHub)
  // const handleOAuthLogin = async (provider: "google" | "github") => {
  //   setLoading(true);
  //   setError(null);

  //   try {
  //     const { error } = await supabase.auth.signInWithOAuth({
  //       provider,
  //       options: {
  //         redirectTo: "http://localhost:3000/auth/callback",
  //       },
  //     });

  //     if (error) {
  //       throw new Error(error.message || `Failed to log in with ${provider}. Please try again.`);
  //     }
  //   } catch (err: unknown) {
  //     const error = err as Error;
  //     setError(error.message || `Failed to log in with ${provider}. Please try again.`);
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full max-w-md mx-auto p-6">
        <div className="p-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
            Log In
          </h1>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleEmailLogin} className="space-y-6">
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 cursor-pointer"
            >
              {loading ? "Sending..." : "Log In with Email"}
            </Button>
          </form>
          {/* <div className="mt-6 space-y-4">
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              Log In with Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOAuthLogin("github")}
              disabled={loading}
              className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              Log In with GitHub
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}