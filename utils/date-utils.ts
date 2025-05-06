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

// Format timestamp to include date and time (e.g., "2025-05-03 14:30")
export const formatDateTimeCards = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
