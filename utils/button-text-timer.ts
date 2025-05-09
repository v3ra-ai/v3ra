import { Dispatch, SetStateAction } from "react";

interface ButtonTextTimerResult {
  startTimer: () => void;
  cancelTimer: () => void;
}

/**
 * Manages dynamic button text changes with a cancellable timer.
 * @param setButtonText - State setter for the button text.
 * @returns Functions to start and cancel the timer.
 */
export function useButtonTextTimer(
  setButtonText: Dispatch<SetStateAction<string>>
): ButtonTextTimerResult {
  let timerIds: NodeJS.Timeout[] = [];

  const startTimer = () => {
    // Clear any existing timers
    cancelTimer();

    // Define text changes with cumulative delays
    const textChanges = [
      { text: "Broadcasting...", delay: 2000 },
      { text: "Waiting...", delay: 3000 },
      { text: "Validating...", delay: 3000 },
      { text: "Merging...", delay: 1000 },
      { text: "Finalizing...", delay: 3000 },
    ];

    let cumulativeDelay = 0;
    textChanges.forEach(({ text, delay }) => {
      cumulativeDelay += delay;
      const id = setTimeout(() => {
        setButtonText(text);
        console.log(`[useButtonTextTimer] Updated button text to: ${text}`);
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