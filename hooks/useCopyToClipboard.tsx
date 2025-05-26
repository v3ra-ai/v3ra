import { toast } from 'sonner';

interface CopyToClipboardOptions {
  textToCopy: string;
  successMessage?: string;
  successDescription?: string;
  errorMessage?: string;
  errorDescription?: string;
}

export function useCopyToClipboard() {
  const copyToClipboard = async ({
    textToCopy,
    successMessage = "Copied!",
    successDescription = `The text "${textToCopy}" was copied to your clipboard.`,
    errorMessage = "Error",
    errorDescription = "Failed to copy. Try again.",
  }: CopyToClipboardOptions) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(successMessage, {
        description: successDescription,
        duration: 2000,
      });
    } catch {
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 2000,
      });
    }
  };

  return { copyToClipboard };
}