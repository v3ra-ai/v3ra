"use client";

import Navbar from "@/components/ask/navbar/navbar";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { useEffect, useState } from "react";

export default function BetaInfoPage() {
  const betaSignupUrl =
    "https://docs.google.com/forms/d/e/1FAIpQLSdIf4VDxZkQYJChBia-_kS7f0kxm-slwLozUVp0AzmFbT1JOg/viewform?usp=header";
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log("BetaInfoPage session check:", { data, error });
        if (error) {
          console.error("Error checking session:", error.message);
          setIsLoggedIn(false);
          return;
        }
        setIsLoggedIn(!!data.session);
      } catch (err) {
        console.error("Unexpected session error:", err);
        setIsLoggedIn(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", { event, session });
      setIsLoggedIn(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
          <p className="text-center text-zinc-800 dark:text-zinc-200 mb-4">
            {isLoggedIn ? "You are logged in already" : ""}
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