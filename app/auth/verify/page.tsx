"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import Navbar from "@/components/ask/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function VerifyCodePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = localStorage.getItem("signupEmail");
      if (!email) throw new Error("No email found. Please try again.");

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "magiclink",
      });

      if (error) throw error;

      router.push("/profile");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full max-w-md mx-auto p-6">
        <div className="p-12 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-8">
            Verify Email
          </h1>
          <p className="mb-4 text-center text-zinc-600 dark:text-zinc-400">
            Enter the code sent to your email.
          </p>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <Label htmlFor="code" className="text-zinc-800 dark:text-zinc-200 mb-2">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
              {loading ? "Verifying..." : "Verify Code"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}