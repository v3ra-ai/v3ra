"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";

export default function VerifyCodePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const _router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem("signupEmail");
    setEmail(storedEmail);
  }, []);

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    setResendSuccess(false);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (error) {
      console.error("Failed to resend:", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full max-w-md mx-auto p-4 sm:p-6">
        <div className="p-8 sm:p-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-teal-100 dark:bg-teal-900/30">
              <Mail className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-4">
            Check your email
          </h1>
          
          <p className="mb-6 text-center text-zinc-600 dark:text-zinc-400">
            We sent a magic link to
            <br />
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {email || "your email"}
            </span>
          </p>
          
          <div className="space-y-4">
            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <p className="text-sm text-teal-800 dark:text-teal-200 text-center">
                Click the link in your email to sign in instantly
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-800 px-2 text-zinc-500">
                  Didn&apos;t receive it?
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleResend}
              disabled={resending || !email}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : resendSuccess ? (
                "Email sent! Check your inbox"
              ) : (
                "Resend magic link"
              )}
            </Button>
            
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              Magic links expire after 1 hour
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}