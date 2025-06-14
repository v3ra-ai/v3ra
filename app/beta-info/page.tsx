"use client";

import BetaNavbar from "./beta-navbar"; // Updated import
import BetaButtons from "./beta-buttons";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";

export default function BetaInfoPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInterfaceImageEnlarged, setIsInterfaceImageEnlarged] = useState(false);
  const [isLLMsImageEnlarged, setIsLLMsImageEnlarged] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

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
      } catch {
        console.error("Unexpected session error");
        setIsLoggedIn(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", { event, session });
        setIsLoggedIn(!!session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toggleInterfaceImageSize = () => {
    setIsInterfaceImageEnlarged(!isInterfaceImageEnlarged);
  };

  const toggleLLMsImageSize = () => {
    setIsLLMsImageEnlarged(!isLLMsImageEnlarged);
  };

  const handleImageError = (
    type: "interface-light" | "interface-dark" | "llms-light" | "llms-dark"
  ) => {
    setImageError(`Failed to load ${type} image`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <BetaNavbar />
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="p-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-6">
            Swarm Explorer <br />
            Beta Testing Program
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center">
            <span className="dark:text-zinc-100">
              Our beta testing program is currently invite-only.{" "}
            </span>
            Join the waitlist to get early access to our platform and help shape
            its future!
          </p>

          <BetaButtons isLoggedIn={isLoggedIn} />

          <p className="text-center text-zinc-800 dark:text-zinc-300 mb-4 mt-6">
            {isLoggedIn ? (
              <p>
                You are signed in as a site user, but not on the Beta Tester
                list yet.
              </p>
            ) : (
              ""
            )}
          </p>

          <div className="mt-6 flex flex-col items-center">
            <div className="">
              <h3 className="text-2xl">About Verafy AI Swarm Explorer</h3>
            </div>
            <div className="">
              <p className="text-lg text-zinc-500">
                Learn about our cutting edge AI app
              </p>
            </div>

            <div className="mt-4">
              <ul className="list-disc pl-5 space-y-0 text-zinc-600 dark:text-zinc-400">
                <li>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    Submit a query to multiple AIs.
                  </span>{" "}
                </li>
                <li>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    AI-powered consensus response network.
                  </span>{" "}
                </li>
                <li>
                  <span className="text-zinc-800 dark:text-zinc-200">
                    Choose the validators (AI LLMs) you wish to query.
                  </span>{" "}
                </li>
              </ul>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 mt-4">
              Verafy Swarm Explorer query form (sample image)
            </p>
            <motion.div
              className="relative cursor-pointer"
              onClick={toggleInterfaceImageSize}
              animate={{
                scale: isInterfaceImageEnlarged ? 1.5 : 1,
                zIndex: isInterfaceImageEnlarged ? 50 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Image
                src="/Verafy-Interface-whitebg.jpg"
                alt="Verafy Interface Preview (Light)"
                width={600}
                height={400}
                className="rounded-lg shadow-md dark:hidden"
                priority
                onError={() => handleImageError("interface-light")}
              />
              <Image
                src="/Verafy-Interface-blackbg.jpg"
                alt="Verafy Interface Preview (Dark)"
                width={600}
                height={400}
                className="rounded-lg shadow-md hidden dark:block"
                priority
                onError={() => handleImageError("interface-dark")}
              />
            </motion.div>
          </div>
          <div className="mt-4 flex flex-col items-center">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
              Verafy Swarm Explorer AI LLM selection (sample image)
            </p>
            <motion.div
              className="relative cursor-pointer"
              onClick={toggleLLMsImageSize}
              animate={{
                scale: isLLMsImageEnlarged ? 1.5 : 1,
                zIndex: isLLMsImageEnlarged ? 50 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Image
                src="/Verafy-UI-LLMs-whitebg@0.75x.jpg"
                alt="Verafy UI LLMs Preview (Light)"
                width={600}
                height={400}
                className="rounded-lg shadow-md dark:hidden"
                priority
                onError={() => handleImageError("llms-light")}
              />
              <Image
                src="/Verafy-UI-LLMs-blackbg@0.75x.jpg"
                alt="Verafy UI LLMs Preview (Dark)"
                width={600}
                height={400}
                className="rounded-lg shadow-md hidden dark:block"
                priority
                onError={() => handleImageError("llms-dark")}
              />
            </motion.div>
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              Features include:
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-600 dark:text-zinc-400">
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Submit a query to multiple AIs.
                </span>{" "}
                Ask a question to multiple AIs in different modes to fact-check
                (predict and shop are being worked on).
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  AI-powered response network.
                </span>{" "}
                Responses are generated by a decentralized network of AI
                validators from providers like OpenAI, Google, Meta, Anthropic
                and more! Over 50 available, more being added.
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Consensus display.
                </span>{" "}
                The system shows whether validators agree or disagree on a query
                result. Shows the percentage of agreement and quality report.
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Choose the validators (AI LLMs) you wish to query.
                </span>{" "}
                Create profiles, choose the exact LLMs and batches you wish to
                query.
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Expert mode.
                </span>{" "}
                Unlock advanced views like validator vote history, network
                visualization, and staking charts.
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Validator profiles.
                </span>{" "}
                See individual validator names, sources, rationales, and vote
                history.
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Favorite a query.
                </span>{" "}
                Mark important queries and view them later via a Favorites
                filter or your profile.
              </li>
              <li>
                <span className="text-zinc-800 dark:text-zinc-200">
                  Pay with Crypto.
                </span>{" "}
                You can pay with Solana or $truth tokens to get extra credits.
              </li>
            </ul>
          </div>
          {imageError && (
            <p className="text-red-500 dark:text-zinc-400 text-center mt-2">
              {imageError}
            </p>
          )}
          <div className="mt-6">
            <BetaButtons isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>
    </div>
  );
}