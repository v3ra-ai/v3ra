"use client";

import { useEffect, useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Coins, Gift } from "lucide-react";
import { useCreditsStore } from "@/store/credit-store";
import CreditSlider from "@/components/credits/credit-slider";
import TruthSlider from "@/components/credits/truth-slider";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { Dispatch, SetStateAction } from "react";
import { LoadingSpinner } from "@/components/loading-spinner-new";

export function CreditsAllLayout() {
  const { publicKey } = useWallet();
  const {
    userFreeCredits,
    userPaidCredits,
    fetchAllCredits,
    setUserCreditsTotal,
    creditsLoading,
    savedCreditsTimestamp,
  } = useCreditsStore();
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Calculate total credits from store
  const totalCredits = userFreeCredits + userPaidCredits;

  // Define setCreditBalance to update store
  const setCreditBalance = useCallback<Dispatch<SetStateAction<number | null>>>(
    (value) => {
      if (typeof value === "function") {
        const newValue = value(totalCredits);
        if (newValue !== null) {
          setUserCreditsTotal(newValue);
          console.log("[CreditsAllLayout] setCreditBalance (functional):", {
            newValue,
            totalCredits,
          });
        }
      } else if (value !== null) {
        setUserCreditsTotal(value);
        console.log("[CreditsAllLayout] setCreditBalance (direct):", {
          value,
          totalCredits,
        });
      }
    },
    [totalCredits, setUserCreditsTotal]
  );

  // Fetch email on mount
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userEmail = session?.user?.email;
        setEmail(userEmail);
        console.log("[CreditsAllLayout] Fetched email:", userEmail, {
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[CreditsAllLayout] Error fetching email:", err, {
          timestamp: new Date().toISOString(),
        });
      }
    };
    fetchEmail();
  }, []);

  // Fetch credits when publicKey or email changes
  useEffect(() => {
    if (publicKey && email) {
      console.log("[CreditsAllLayout] Triggering fetchAllCredits:", {
        publicKey: publicKey.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
      fetchAllCredits(publicKey, email);
    } else {
      console.log("[CreditsAllLayout] Skipping fetchAllCredits:", {
        publicKey: publicKey?.toBase58(),
        email,
        timestamp: new Date().toISOString(),
      });
    }
  }, [publicKey, email, fetchAllCredits]);

  // Update initial loading state
  useEffect(() => {
    if (!creditsLoading && savedCreditsTimestamp !== null) {
      setIsInitialLoading(false);
      console.log("[CreditsAllLayout] Initial loading complete:", {
        userFreeCredits,
        userPaidCredits,
        totalCredits,
        timestamp: new Date(savedCreditsTimestamp).toISOString(),
      });
    }
  }, [
    creditsLoading,
    savedCreditsTimestamp,
    userFreeCredits,
    userPaidCredits,
    totalCredits,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto p-6 dark:bg-zinc-950 dark:border-zinc-700"
    >
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-4">
        Get Credits
      </h1>
      <div className="flex flex-col sm:flex-row gap-4 justify-center text-xl font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-8">
        <div className="flex flex-col items-center w-full sm:w-auto p-2">
          <div className="flex items-center">
            <Gift className="mr-1" strokeWidth={1} size={20} />
            {isInitialLoading || creditsLoading ? (
              <LoadingSpinner
                noWrapper
                type="pulse"
                color="#d946ef"
                size={5}
                message=""
              />
            ) : (
              <span>Free: {userFreeCredits}</span>
            )}
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-600">
            Free Credits
          </div>
        </div>
        <div className="flex flex-col items-center w-full sm:w-auto p-2">
          <div className="flex items-center">
            <Coins className="mr-1" strokeWidth={1} size={20}/>
            {isInitialLoading || creditsLoading ? (
              <LoadingSpinner
                noWrapper
                type="pulse"
                color="#d946ef"
                size={5}
                message=""
              />
            ) : (
              <div className="">
                <span className="">Paid: </span>
                <span className="">{userPaidCredits}</span>
              </div>
            )}
          </div>
          <div className="w-full text-xs mt-1 text-zinc-300 dark:text-zinc-600 text-center items-center justify-center">
            Paid Credits
          </div>
        </div>
        <div className="flex flex-col items-center w-full sm:w-auto border-2 p-2">
          <div className="flex items-center">
            {/* <Wallet className="mr-1" strokeWidth={1} size={20} /> */}
            {isInitialLoading || creditsLoading ? (
              <LoadingSpinner
                noWrapper
                type="pulse"
                color="#d946ef"
                size={5}
                message=""
              />
            ) : (
              <span>Total: {totalCredits}</span>
            )}
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-400">
            Current Total
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <TruthSlider
            creditBalance={totalCredits}
            setCreditBalance={setCreditBalance}
          />
        </div>
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <CreditSlider
            creditBalance={totalCredits}
            setCreditBalance={setCreditBalance}
          />
        </div>
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-center text-zinc-900 dark:text-zinc-100 mb-0">
            <div>Stake</div>
            <div>for Rewards</div>
          </h2>
          <div className="max-w-md mx-auto p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md">
            <div className="flex w-full justify-center items-center mb-2">
              <div className="justify-center mt-3 mb-7">
                <Link href="https://stakewiz.com/validator/TrutHUEykD2UsmAq7W3hA4r3XiQxGLqhENAwo9522xa">
                  <Image
                    src="/logos/truthnode.png"
                    alt="TruthNode Logo"
                    width={205}
                    height={250}
                    className="mr-2"
                  />
                </Link>
              </div>
            </div>
            <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
              Current Staked SOL: 0 SOL
            </p>
            <Link href="https://stakewiz.com/validator/TrutHUEykD2UsmAq7W3hA4r3XiQxGLqhENAwo9522xa">
              <button className="w-full py-2 px-4 rounded-md font-medium text-white bg-zinc-400 dark:bg-zinc-600 cursor-pointer">
                Stake Now
              </button>
            </Link>
            <div className="mt-2 text-zinc-800 dark:text-zinc-300">
              Staked amounts are reviewed for rewards if applicable. Promotions
              may vary, such as credits, queries, and stake to subscribe.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
