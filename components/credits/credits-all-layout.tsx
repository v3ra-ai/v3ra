"use client";

import { useEffect, useCallback, useState, useMemo, Dispatch, SetStateAction } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Coins, Gift } from "lucide-react";
import { useCreditsStore } from "@/store/credit-store";
import CreditSlider from "@/components/credits/credit-slider";
import { supabase } from "@/lib/supabase-client";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import CreditFAQ from "./credit-faq";

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

  // Compute total credits with useMemo to prevent unnecessary recalculations
  const totalCredits = useMemo(
    () => userFreeCredits + userPaidCredits,
    [userFreeCredits, userPaidCredits]
  );

  // Define setCreditBalance to update store with correct type
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
      <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
            Daily Free Credits
          </h2>
        </div>
        <p className="text-center text-emerald-700 dark:text-emerald-300 text-sm">
          You automatically receive <strong>10 free credits</strong> every day! Simply log in to reset your daily allowance.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 justify-center text-xl font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-8">
        <div className="flex flex-col items-center w-full sm:w-auto p-2 border-2 border-transparent">
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
        <div className="flex flex-col items-center w-full sm:w-auto p-2 border-2 border-transparent">
          <div className="flex items-center">
            <Coins className="mr-1" strokeWidth={1} size={20} />
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
      <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <CreditSlider
            creditBalance={totalCredits}
            setCreditBalance={setCreditBalance}
          />
        </div>
      </div>
      <div className="mt-8">
        <CreditFAQ />
      </div>
    </motion.div>
  );
}

export default CreditsAllLayout;