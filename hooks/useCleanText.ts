export function useCleanText() {
  const cleanText = (text: string): string => {
    // Remove HTML tags and extra whitespace
    return text
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  };

  return { cleanText };
}