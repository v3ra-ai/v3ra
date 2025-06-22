/**
 * Truncates a string to a specified length, appending "..." if needed.
 * @param text - The text to truncate (string or undefined).
 * @param maxLength - Maximum length before truncation (default: 45).
 * @returns The truncated string, or empty string if input is undefined.
 */
export function truncateText(text: string | undefined, maxLength: number = 45): string {
  if (!text) return "";
  if (maxLength < 0) maxLength = 45;
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatQueryMode(mode: string): string {
  switch (mode) {
    case "fact-check":
      return "Ask";
    case "predict":
      return "Predict";
    case "create":
      return "Create";
    case "shop":
      return "Shop";
    default:
      return capitalizeWords(mode);
  }
}