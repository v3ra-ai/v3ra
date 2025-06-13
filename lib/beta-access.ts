import { createSupabaseServerClient } from "@/lib/supabase-client";
import { User } from "@supabase/supabase-js";

// List of allowed pages for non-beta users
export const ALLOWED_PAGES = [
  "/login",
  "/signup",
  "/auth/verify",
  "/auth/callback",
  "/beta-info",
];

// Check if email is on beta list
export function isEmailOnBetaList(email: string): boolean {
  const betaList = process.env.BETA_LIST_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];
  return betaList.includes(email.toLowerCase());
}

// Check if user is logged in and on beta list
export async function checkBetaAccess(): Promise<{ isAllowed: boolean; user: User | null }> {
  try {
    const supabaseServer = await createSupabaseServerClient();
    const { data: { user }, error } = await supabaseServer.auth.getUser();

    console.log("[beta-access] User check:", { user: user ? user.email : null, error });

    if (error) {
      console.error("[beta-access] Auth error:", error.message);
      return { isAllowed: false, user: null };
    }

    if (!user || !user.email) {
      console.log("[beta-access] No user or email, denying access");
      return { isAllowed: false, user: null };
    }

    const isAllowed = isEmailOnBetaList(user.email);
    console.log("[beta-access] Beta access check:", { email: user.email, isAllowed });
    return { isAllowed, user };
  } catch (err) {
    console.error("[beta-access] Unexpected error:", err);
    return { isAllowed: false, user: null };
  }
}