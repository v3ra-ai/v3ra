import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { AuthError } from "@supabase/supabase-js";
import type { User } from "@/lib/types";
import { ADMIN_EMAILS } from "@/lib/constants";

// Allowed emails for access to the protected section

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Supabase client for server-side
  const supabase = await createSupabaseServerClient();

  try {
    // Get the authenticated user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw new AuthError(error.message, error.status);
    }

    // If no user is authenticated or no email, redirect to login
    if (!user || !user.email) {
      redirect("/login?error=" + encodeURIComponent("Please log in to access this page."));
    }

    // Explicitly type the user for clarity
    const typedUser: User = user;

    // Check if the user's email is in the allowed list
    if (!ADMIN_EMAILS.includes(typedUser.email as typeof ADMIN_EMAILS[number])) {
      redirect(
        "/login?error=" +
          encodeURIComponent("You are not authorized to access this page.")
      );
    }

    // Render the children (protected pages) if the user is authorized
    return <>{children}</>;
  } catch (err: unknown) {
    const error = err as AuthError;
    redirect(
      "/login?error=" +
        encodeURIComponent(error.message || "Authentication failed. Please try again.")
    );
  }
}