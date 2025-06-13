"use client";

import { Suspense, useEffect } from "react";
import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignupError from "@/components/signup-error";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface SignupClientProps {
  handleEmailSignup: (formData: FormData) => Promise<void>;
}

export default function SignupClient({ handleEmailSignup }: SignupClientProps) {
  const searchParams = useSearchParams();
  const betaSignupUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdIf4VDxZkQYJChBia-_kS7f0kxm-slwLozUVp0AzmFbT1JOg/viewform?usp=header";

  useEffect(() => {
    if (searchParams.get("reason") === "beta_access_denied") {
      toast.error("Access restricted to beta testers", {
        description: "Join the waitlist to get early access to our platform.",
        duration: 5000,
        action: {
          label: "Join Waitlist",
          onClick: () => window.open(betaSignupUrl, "_blank"),
        },
      });
    }
  }, [searchParams]);

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
            <Button
              asChild
              variant="outline"
              className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <a href={betaSignupUrl} target="_blank" rel="noopener noreferrer">
                Request Beta Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}