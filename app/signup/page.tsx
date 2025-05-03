import { Suspense } from "react";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignupError from "@/components/signup-error";
import { createOrGetUser } from "@/lib/server-actions";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  async function handleEmailSignup(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: "http://localhost:3000/auth/callback",
          data: { username },
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to send signup code. Please try again.");
      }

      await createOrGetUser("", email, username);
      redirect("/auth/verify");
    } catch (err) {
      const error = err as Error;
      redirect(`/signup?error=${encodeURIComponent(error.message || "Signup failed. Please try again.")}`);
    }
  }

  async function handleOAuthSignup(provider: "google" | "github") {
    "use server";
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
    } catch (err) {
      const error = err as Error;
      redirect(`/signup?error=${encodeURIComponent(error.message || `Signup with ${provider} failed. Please try again.`)}`);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full max-w-md mx-auto p-6">
        <div className="p-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
            Sign Up
          </h1>
          <Suspense fallback={<div className="mb-4" />}>
            <SignupError />
          </Suspense>
          <form action={handleEmailSignup} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-zinc-800 dark:text-zinc-200">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div>
              <Label htmlFor="username" className="text-zinc-800 dark:text-zinc-200">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 cursor-pointer"
            >
              Sign Up with Email
            </Button>
          </form>
          <div className="mt-6 space-y-4">
            <form action={handleOAuthSignup.bind(null, "google")}>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                Sign Up with Google
              </Button>
            </form>
            <form action={handleOAuthSignup.bind(null, "github")}>
              <Button
                type="submit"
                variant="outline"
                className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                Sign Up with GitHub
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}