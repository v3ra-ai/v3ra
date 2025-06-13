"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient} from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import Navbar from "@/components/ask/navbar/navbar";

interface BetaInfoClientProps {
  initialIsLoggedIn: boolean;
}

export default function BetaInfoClient({ initialIsLoggedIn }: BetaInfoClientProps) {
  const betaSignupUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdIf4VDxZkQYJChBia-_kS7f0kxm-slwLozUVp0AzmFbT1JOg/viewform?usp=header";
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("Client-side Supabase configuration error: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? localStorage : undefined,
    },
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        await supabase.auth.refreshSession();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("Client-side session error:", sessionError.message);
          setIsLoggedIn(false);
          return;
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Client-side user error:", userError.message);
          setIsLoggedIn(false);
          return;
        }
        console.log("Client-side session status:", { session: !!session, user: !!user });
        setIsLoggedIn(!!user);
      } catch (err) {
        console.error("Unexpected client-side auth error:", err);
        setIsLoggedIn(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event:", event, "Session:", !!session);
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="p-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-6">
            Beta Testing Program
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center">
            Our beta testing program is currently invite-only. Join the waitlist to get early access to our platform and help shape its future!
          </p>
          <div className="space-y-4">
            <Button
              asChild
              className="w-full bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 cursor-pointer"
            >
              <Link href={betaSignupUrl} target="_blank">
                Join Beta Waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!isLoggedIn && (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <Link href="/login">Log In</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}