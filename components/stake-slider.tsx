// components/stake-slider.tsx
"use client";

import { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

export default function StakeSlider() {
  const [stakeAmount, setStakeAmount] = useState(0);
  const stakeSol = stakeAmount * 0.001;

  return (
    <div className="p-6 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Stake to Get Credits
      </h2>
      <div className="text-center mb-6">
        <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
          {stakeAmount}
        </span>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Stake Amount
        </label>
        <div className="relative">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[stakeAmount]}
            onValueChange={(value) => setStakeAmount(value[0])}
            min={0}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-gray-300 dark:bg-gray-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-blue-500 dark:bg-blue-400 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full hover:bg-blue-600 dark:hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              aria-label="Stake Amount"
            />
          </Slider.Root>
          <div className="flex justify-between mt-2 text-sm text-gray-700 dark:text-gray-300">
            <span>Min. (0)</span>
            <span>Max. (100)</span>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Stake: {stakeSol.toFixed(3)} SOL
        </p>
      </div>
      {/* <input
        type="email"
        value=""
        placeholder="Email (optional)"
        readOnly
        className="mb-6 w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
      /> */}
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
        Current Staked SOL: 0 SOL
      </p>
      <button
        disabled={true}
        className="w-full py-2 px-4 rounded-md font-medium text-white bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
      >
        Stake Now
      </button>
    </div>
  );
}