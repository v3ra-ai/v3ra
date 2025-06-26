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

      while (attempts < maxAttempts) {
        try {
          // Debug cookies before refresh
          const cookiesBefore = document.cookie.split(";").map((c) => c.trim());
          console.log("Client-side cookies before refresh (attempt", attempts + 1, "):", cookiesBefore);

          // Refresh session
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          console.log("Session refresh (attempt", attempts + 1, "):", { refreshData, refreshError });

          if (refreshError) {
            throw new Error(refreshError.message || "Failed to refresh session.");
          }

          // Debug cookies after refresh
          const cookiesAfterRefresh = document.cookie.split(";").map((c) => c.trim());
          console.log("Client-side cookies after refresh (attempt", attempts + 1, "):", cookiesAfterRefresh);

          // Get session
          const { data, error } = await supabase.auth.getSession();
          console.log("Session check (attempt", attempts + 1, "):", { data, error });

          if (error) {
            throw new Error(error.message || "Failed to retrieve session.");
          }

          // Debug cookies after session check
          const cookiesAfterSession = document.cookie.split(";").map((c) => c.trim());
          console.log("Client-side cookies after session check (attempt", attempts + 1, "):", cookiesAfterSession);

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
          console.log("User creation result:", result);

          if (!result.success) {
            // Handle duplicate user case
            if (result.code === "USER_EXISTS") {
              console.log("User already exists, proceeding with login");
            } else {
              throw new Error(result.error || "Failed to process user.");
            }
          }

          // Check for stored return URL
          const returnTo = localStorage.getItem("authReturnTo");
          if (returnTo) {
            localStorage.removeItem("authReturnTo");
            console.log("Redirecting to stored return URL:", returnTo);
            router.push(returnTo);
          } else {
            console.log("Redirecting to profile");
            router.push("/profile");
          }
          return; // Exit on success
        } catch (err: unknown) {
          attempts++;
          const error = err as Error;
          console.error("Auth callback error (attempt", attempts, "):", error.message, error.stack);

          if (attempts >= maxAttempts) {
            console.error("Max retry attempts reached. Redirecting to login.");
            router.push(`/login?error=${encodeURIComponent(error.message || "Authentication failed. Please try again.")}`);
          } else {
            console.log("Retrying session refresh...");
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