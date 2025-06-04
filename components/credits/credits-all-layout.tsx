"use client";

import CreditSlider from "@/components/credits/credit-slider";
import TruthSlider from "@/components/credits/truth-slider";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Landmark } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function CreditsAllLayout() {
  const { creditBalance, setCreditBalance } = useCreditBalance();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 dark:bg-zinc-950 dark:border-zinc-700">
      <h1 className="text-4xl font-bold text-center text-zinc-800 dark:text-zinc-200 mb-4">
        Get Credits
      </h1>
      <div className="flex text-xl font-semibold text-center text-zinc-700 dark:text-zinc-300 mb-8">
        <div className="flex flex-col w-full justify-center">
          <div className="flex justify-center">
            <Landmark /> <span className="ml-2">Balance: {creditBalance} Credits</span>
          </div>
          <div className="text-xs mt-1 text-zinc-300 dark:text-zinc-600">
            Paid Credits
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          {/* <h2 className="text-2xl font-semibold text-center text-zinc-900 dark:text-zinc-100 mb-4">
            Pay with $truth
          </h2> */}
          <TruthSlider creditBalance={creditBalance} setCreditBalance={setCreditBalance} />
        </div>
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          {/* <h2 className="text-2xl font-semibold text-center text-zinc-900 dark:text-zinc-100 mb-4">
            Pay with SOL
          </h2> */}
          <CreditSlider creditBalance={creditBalance} setCreditBalance={setCreditBalance} />
        </div>
        <div className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold text-center text-zinc-900 dark:text-zinc-100 mb-0">
            <div className="">Stake</div>
            <div className="">for Rewards</div>

          </h2>
          <div className="max-w-md mx-auto p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md">
            {/* <div className="flex flex-col w-full text-center justify-center items-center mx-auto">
              <div className="flex justify-center items-center mb-2">
                <Landmark size={22} />
                <h3 className="w-full text-xl font-semibold ml-2 text-zinc-900 dark:text-zinc-100">
                  Stake for Rewards
                </h3>
              </div>
            </div> */}
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
              <button
                className="w-full py-2 px-4 rounded-md font-medium text-white bg-zinc-400 dark:bg-zinc-600 cursor-pointer"
              >
                Stake Now
              </button>
            </Link>
            <div className="mt-2 text-zinc-800 dark:text-zinc-300">
              Staked amounts are reviewed for rewards if applicable. Promotions may vary, such as credits, queries, and stake to subscribe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}