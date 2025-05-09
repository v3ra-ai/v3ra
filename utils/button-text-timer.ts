import { Dispatch, SetStateAction } from "react";
import { ReactNode } from "react";

interface ButtonTextTimerResult {
  startTimer: () => void;
  cancelTimer: () => void;
}

/**
 * Manages dynamic button content changes with a cancellable timer.
 * Each delay is varied by ±30% randomly.
 * @param setButtonContent - State setter for the button content (string or JSX).
 * @returns Functions to start and cancel the timer.
 */
export function useButtonTextTimer(
  setButtonContent: Dispatch<SetStateAction<ReactNode>>
): ButtonTextTimerResult {
  let timerIds: NodeJS.Timeout[] = [];

  const startTimer = () => {
    // Clear any existing timers
    cancelTimer();

    // Define variation percentage (±30%)
    const VARIATION_PERCENTAGE = 0.3;

    // Define content changes with base delays
    const contentChanges = [
      { content: "Broadcasting...", delay: 2000 },
      { content: "Waiting...", delay: 3000 },
      { content: "Validating...", delay: 3000 },
      { content: "Merging...", delay: 1000 },
      { content: "Finalizing...", delay: 3000 },
    ];

    let cumulativeDelay = 0;
    contentChanges.forEach(({ content, delay }) => {
      // Calculate random variation between 0.7 and 1.3
      const variation = 1 + (Math.random() * 2 - 1) * VARIATION_PERCENTAGE;
      const variedDelay = Math.round(delay * variation);
      cumulativeDelay += variedDelay;

      console.log(
        `[useButtonTextTimer] Scheduling content: ${content} at ${cumulativeDelay}ms (varied from ${delay}ms by ${Math.round((variation - 1) * 100)}%)`
      );

      const id = setTimeout(() => {
        setButtonContent(content);
        console.log(`[useButtonTextTimer] Updated button content to: ${content}`);
      }, cumulativeDelay);
      timerIds.push(id);
    });
  };

  const cancelTimer = () => {
    timerIds.forEach((id) => clearTimeout(id));
    timerIds = [];
    console.log("[useButtonTextTimer] Canceled all timers");
  };

  return { startTimer, cancelTimer };
}