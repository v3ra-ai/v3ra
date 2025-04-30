/**
 * Logs debug messages with a custom prefix in development mode.
 * @param prefix - The prefix to include in the log (e.g., "VoteHistory").
 * @param message - The main log message.
 * @param args - Additional arguments to log.
 */
export function debugLog(
  prefix: string,
  message: string,
  ...args: unknown[]
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${prefix}] ${message}`, ...args);
  }
}
