import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string, message?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success(message || "Copied to clipboard!");
      
      // Reset after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
      
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
      return false;
    }
  }, []);

  return { copyToClipboard, isCopied };
}