/**
 * Formats a timestamp into a localized time string, returning "N/A" for invalid inputs.
 * @param timestamp - The timestamp to format (string, number, or undefined).
 * @returns A localized time string (e.g., "1:30:45 PM") or "N/A" if invalid.
 */
export function formatTime(timestamp: string | number | undefined): string {
  if (!timestamp) return "N/A";
  const date =
    typeof timestamp === "string"
      ? new Date(timestamp)
      : new Date(timestamp * 1000);
  return date.toLocaleTimeString();
}
