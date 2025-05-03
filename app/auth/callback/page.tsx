"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { createOrGetUser } from "@/lib/server-actions";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Debug cookies before refresh
        const cookiesBefore = document.cookie.split(";").map((c) => c.trim());
        console.log("Client-side cookies before refresh:", cookiesBefore);

        // Refresh session to ensure magic link is processed
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        console.log("Session refresh:", { refreshData, refreshError });

        // Debug cookies after refresh
        const cookiesAfterRefresh = document.cookie.split(";").map((c) => c.trim());
        console.log("Client-side cookies after refresh:", cookiesAfterRefresh);

        const { data, error } = await supabase.auth.getSession();
        console.log("Session check:", { data, error });

        // Debug cookies after session check
        const cookiesAfterSession = document.cookie.split(";").map((c) => c.trim());
        console.log("Client-side cookies after session check:", cookiesAfterSession);

        if (error) {
          throw new Error("Failed to retrieve session. Please try logging in again.");
        }

        const user = data.session?.user;
        if (!user) {
          throw new Error("No user found in session. Please try logging in again.");
        }

        // Create or get user using Server Action
        const result = await createOrGetUser(
          user.id,
          user.email || "",
          user.user_metadata?.username
        );
        console.log("User creation result:", result);

        if (!result.success) {
          throw new Error(result.error || "Failed to process user.");
        }

        router.push(`/users/profile/${user.id}`);
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Auth callback error:", error.message);
        router.push(`/login?error=${encodeURIComponent(error.message || "Authentication failed. Please try again.")}`);
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