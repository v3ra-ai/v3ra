"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user just signed up
    const signupEmail = localStorage.getItem("signupEmail");
    if (signupEmail) {
      setEmail(signupEmail);
      localStorage.removeItem("signupEmail");
    }
  }, []);

  const resendVerification = async () => {
    if (!email) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      
      alert("Verification email sent! Please check your inbox.");
    } catch (err) {
      setError("Failed to resend verification email. Please try again.");
      console.error("Resend error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">
            Check Your Email
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            We've sent you a verification email. Please click the link in the email to verify your account.
          </p>
          
          {email && (
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
              Email sent to: <span className="font-medium">{email}</span>
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="space-y-4">
            <Button
              onClick={resendVerification}
              disabled={loading || !email}
              variant="outline"
              className="w-full"
            >
              {loading ? "Sending..." : "Resend Verification Email"}
            </Button>
            
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}