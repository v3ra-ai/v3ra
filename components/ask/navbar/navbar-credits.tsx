"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/loading-spinner-new";
import { Coins } from "lucide-react";
import { useCreditsStore } from "@/store/credit-store";

export default function NavbarCredits() {
  const { publicKey } = useWallet();
  const { userPaidCredits, creditsLoading, fetchAllCredits } =
    useCreditsStore();

  useEffect(() => {
    if (publicKey) {
      fetchAllCredits(publicKey);
    }
  }, [publicKey, fetchAllCredits]);

  if (!publicKey) {
    return null;
  }

  return (
    <div className="flex items-center text-md text-zinc-600 dark:text-zinc-300">
      <Link href="/credits-all/">
        <div className="flex items-center">
          <Coins size={16} /> <span className="mx-2">Paid Credits:</span>
          <span className="text-sky-700 dark:text-sky-300 bg-zinc-200 dark:bg-zinc-700 ml-1 px-2 py-1 rounded-md">
            {creditsLoading ? (
              <>
                {console.log(
                  "[NavbarCredits] Rendering LoadingSpinner for credits fetch"
                )}
                <LoadingSpinner
                  noWrapper
                  type="pulse"
                  color="#d946ef"
                  size={5}
                  message=""
                />
              </>
            ) : (
              userPaidCredits
            )}
          </span>
        </div>
      </Link>
    </div>
  );
}
