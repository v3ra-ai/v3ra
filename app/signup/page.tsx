import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-client";
import { getBaseUrl } from "@/lib/constants";
import { redirect } from "next/navigation";
import SignupClient from "./signup-client";

export default async function SignupPage() {
  async function handleEmailSignup(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;

    try {
      const supabaseServer = await createSupabaseServerClient();

      const { error: otpError } = await supabaseServer.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getBaseUrl()}/auth/callback`,
          data: { username },
        },
      });

      if (otpError) {
        if (otpError.message.includes("rate limit")) {
          redirect(
            `/signup?error=${encodeURIComponent(
              "Too many signup attempts. Please wait 60 seconds and try again."
            )}`
          );
        }
        redirect(
          `/signup?error=${encodeURIComponent(
            otpError.message || "Failed to send signup code. Please try again."
          )}`
        );
      }

      console.log("OTP sent for email:", email);
      redirect("/auth/verify?from=signup");
    } catch (err) {
      const error = err as Error;
      console.error("Signup error:", error.message, error.stack);
      redirect(
        `/signup?error=${encodeURIComponent(
          error.message || "Signup failed. Please try again."
        )}`
      );
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupClient handleEmailSignup={handleEmailSignup} />
    </Suspense>
  );
}