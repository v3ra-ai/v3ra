"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PageFeedback from "./ask-page-feedback";
import { supabase } from "@/lib/supabase-client";
import { FeedbackModal } from "../feedback-modal";
import { CircleHelp } from "lucide-react";

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Verafy Links */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Verafy
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="https://www.verafy.ai/mission"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      About Verafy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://www.verafy.ai/roadmap"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Roadmap
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://www.verafy.ai/tokenomics"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Tokenomics
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/faqs/" className=" cursor-pointer">
                      <div className="flex"><CircleHelp strokeWidth={1.5} /> <span className="ml-1">Help/FAQs</span></div>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="https://t.me/truth_chain"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Site Links */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Site
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/ask/fact-check"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Ask
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/validators"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Validators
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/credits-all"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Credits
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/leaders/feedback"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Feedback Leaderboard
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  Follow Us
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="https://x.com/verafyfoundtn"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Twitter
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://t.me/truth_chain"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Telegram
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="https://discord.gg/TBvndJPVkr"
                      className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      Discord
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center text-sm">
              <p>© {new Date().getFullYear()} Verafy. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
