"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner-new";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      let attempts = 0;
      const maxAttempts = 3;

      // Check for email confirmation token first
      const urlParams = new URLSearchParams(window.location.search);
      const token_hash = urlParams.get('token_hash');
      const type = urlParams.get('type');
      
      // If we have a token_hash, verify it first
      if (token_hash && type) {
        try {
          console.log("[AuthCallback] Verifying email token...");
          
          // Exchange the token for a session
          const { data: { user }, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as "signup" | "recovery" | "invite" | "email_change" | "email",
          });

          if (error) {
            console.error("[AuthCallback] Token verification error:", error);
            router.push(`/login?error=${encodeURIComponent(error.message || "Invalid or expired link")}`);
            return;
          }

          if (!user) {
            router.push("/login?error=Verification failed");
            return;
          }

          console.log("[AuthCallback] Email verified successfully");
          
          // Create or get user via API route
          const response = await fetch("/api/auth/create-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email || "",
              username: user.user_metadata?.username || user.email?.split("@")[0],
            }),
          });

          const result = await response.json();

          if (!result.success && result.code !== "USER_EXISTS") {
            throw new Error(result.error || "Failed to create user");
          }

          // Check for stored return URL
          const returnTo = localStorage.getItem("authReturnTo");
          if (returnTo) {
            localStorage.removeItem("authReturnTo");
            router.push(returnTo);
          } else {
            router.push("/ask");
          }
          return;
        } catch (err: unknown) {
          const error = err as Error;
          console.error("[AuthCallback] Error:", error);
          router.push(`/login?error=${encodeURIComponent(error.message || "Authentication failed")}`);
          return;
        }
      }

      // Original OAuth/refresh flow
      while (attempts < maxAttempts) {
        try {

          // Refresh session
          const { error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            throw new Error(refreshError.message || "Failed to refresh session.");
          }


          // Get session
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            throw new Error(error.message || "Failed to retrieve session.");
          }


          const user = data.session?.user;
          if (!user) {
            throw new Error("No user found in session.");
          }

          // Create or get user via API route
          const response = await fetch("/api/auth/create-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: user.id,
              email: user.email || "",
              username: user.user_metadata?.username || user.email?.split("@")[0],
            }),
          });

          const result = await response.json();

          if (!result.success) {
            // Handle duplicate user case
            if (result.code !== "USER_EXISTS") {
              throw new Error(result.error || "Failed to process user.");
            }
          }

          // Check for stored return URL
          const returnTo = localStorage.getItem("authReturnTo");
          if (returnTo) {
            localStorage.removeItem("authReturnTo");
            router.push(returnTo);
          } else {
            router.push("/ask");
          }
          return; // Exit on success
        } catch (err: unknown) {
          attempts++;
          const error = err as Error;

          if (attempts >= maxAttempts) {
            router.push(`/login?error=${encodeURIComponent(error.message || "Authentication failed. Please try again.")}`);
          } else {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          }
        }
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <LoadingSpinner type="beat" message="Processing authentication..." />
    </div>
  );
}