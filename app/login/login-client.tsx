"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { getAuthCallbackURL } from "@/lib/url-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function LoginClient() {
  const [email, setEmail] = useState("");
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("[login] Cookies before OTP:", document.cookie.split(";").map((c) => c.trim()));

      const redirectTo = getAuthCallbackURL();
      console.log("[login] Email:", email, "RedirectTo:", redirectTo);

      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      // Retry logic for signInWithOtp
      let attempts = 0;
      const maxAttempts = 3;
      let lastError: Error | null = null;

      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[login] Attempt ${attempts} of ${maxAttempts} for signInWithOtp`);

        try {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: redirectTo,
            },
          });

          if (error) {
            console.error("[login] Supabase OTP error:", {
              message: error.message,
              name: error.name,
              code: error.code,
              status: error.status,
              stack: error.stack,
            });
            lastError = error;
            if (!error.message.includes("fetch") && error.code !== "429") {
              throw error; // Non-retryable error
            }
          } else {
            lastError = null;
            break; // Success
          }
        } catch (err) {
          lastError = err as Error;
          console.error("[login] Fetch attempt error:", {
            message: lastError.message,
            name: lastError.name,
            stack: lastError.stack,
          });
        }

        if (attempts < maxAttempts) {
          console.log(`[login] Retrying after 1s delay...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (lastError) {
        throw lastError; // Throw the last error if all attempts fail
      }

      console.log("[login] Cookies after OTP:", document.cookie.split(";").map((c) => c.trim()));
      localStorage.setItem("signupEmail", email);
      
      // Store the return URL if provided
      if (returnTo) {
        localStorage.setItem("authReturnTo", returnTo);
      }
      
      console.log("[login] Redirecting to /auth/verify");
      router.push("/auth/verify");
    } catch (err) {
      const error = err as Error & { code?: string; status?: number };
      console.error("[login] Final error:", {
        message: error.message,
        name: error.name,
        code: error.code,
        status: error.status,
        cause: error.cause,
        stack: error.stack,
      });

      let userMessage = "Failed to send login code. Please try again.";
      if (error.message.includes("fetch") || error.message.includes("AuthRetryableFetchError")) {
        userMessage = "Network error connecting to authentication server. Please check your connection or try again later.";
        if (navigator.userAgent.includes("Chrome")) {
          toast.error("Login failed", {
            description: "A browser extension (e.g., a crypto wallet) may be interfering. Try in incognito mode or disable extensions.",
            duration: 10000,
            action: {
              label: "Learn More",
              onClick: () => window.open("https://support.google.com/chrome/answer/95464", "_blank"),
            },
          });
        }
      } else if (error.code === "429") {
        userMessage = "Too many requests. Please wait a minute and try again.";
      } else if (error.message.includes("invalid")) {
        userMessage = "Invalid email or configuration. Please check your email and try again.";
      }
      setError(userMessage);
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
      </div>
    </div>
  );
}