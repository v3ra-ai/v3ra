"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageFeedback from "./ask-page-feedback";
import { supabase } from "@/lib/supabase-client";
import { FeedbackModal } from "../feedback-modal";
import { Twitter, Send } from "lucide-react";

export default function AskFooter() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check Supabase session to determine login status
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    }

    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <div className="">
        {isLoggedIn && (
          <div className="flex m-8 w-full items-center justify-center">
            <PageFeedback component="Page" />
          </div>
        )}
        <FeedbackModal /> {/* Add modal */}
        <footer className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 mt-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Social Media Icons */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 text-center">
                  Follow Us
                </h3>
                <div className="flex items-center space-x-6">
                  <Link
                    href="https://x.com/v3ra_ai"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    aria-label="Follow us on X (Twitter)"
                  >
                    <Twitter size={24} />
                  </Link>
                  <Link
                    href="https://t.me/v3ra_ai"
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    aria-label="Join us on Telegram"
                  >
                    <Send size={24} />
                  </Link>
                </div>
              </div>
              
              {/* Copyright with MIT License */}
              <div className="text-center text-sm">
                <p>© {new Date().getFullYear()} v3ra. Licensed under MIT License.</p>
                <p className="mt-1 text-xs">
                  <Link 
                    href="https://github.com/v3ra-ai/v3ra" 
                    className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    Open Source Project
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
