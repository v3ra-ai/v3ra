"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { Layers, Square } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { QUERY_COST } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";

export default function StakeSlider() {
  // const [stakeAmount, setStakeAmount] = useState(0);
  // const { connected: isWalletConnected } = useWallet();

  // const stakeSol = stakeAmount * QUERY_COST;

  // const onChangeWallet = () => {
  //   // Implement wallet change logic here
  //   console.log("Changing wallet");
  // };

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg shadow-md">
      <div className="flex flex-col w-full text-center justify-center items-center mx-auto">
        <div className="flex justify-center items-center mb-2">
          {" "}
          <Layers size={22} />
          <h2 className="w-full text-2xl font-semibold ml-2 text-zinc-900 dark:text-zinc-100">
            Stake for Rewards
          </h2>
        </div>
        {/* <div className="flex text-center mb-6">
            <span className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
              {stakeAmount}
            </span>
          </div> */}
      </div>
      <div className="flex w-full justify-center items-centermb-2">
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

        {/* <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Select Stake Amount
        </label> */}
        {/* <div className="relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[stakeAmount]}
            onValueChange={(value) => setStakeAmount(value[0])}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-zinc-300 dark:bg-zinc-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Stake Amount"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            <span>Min. (0)</span>
            <span>Max. (100)</span>
          </div>
        </div> */}
      </div>
      {/* <div className="mb-6">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Stake: {stakeSol.toFixed(3)} SOL
        </p>
      </div> */}
      <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
        Current Staked SOL: 0 SOL
      </p>
      <Link href="https://stakewiz.com/validator/TrutHUEykD2UsmAq7W3hA4r3XiQxGLqhENAwo9522xa">
        <button
          disabled={false}
          className="w-full py-2 px-4 rounded-md font-medium text-white
          bg-zinc-400 dark:bg-zinc-600 cursor-pointer"
        >
          Stake Now
        </button>
      </Link>
      <div className="mt-2 text-zinc-800 dark:text-zinc-300">
        Staked amounts are reviewed for rewards if applicable. Promotions may vary, such as credits, queries and stake to subscribe.
      </div>
      {/* {isWalletConnected && (
        <div className="text-center mt-2 flex items-center justify-center gap-2">
          <Square
            className="h-4 w-4"
            fill={isWalletConnected ? "#22c55e" : "#ef4444"}
          />
          <button
            onClick={onChangeWallet}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            Change Wallet
          </button>
        </div>
      )} */}
    </div>
  );
}
