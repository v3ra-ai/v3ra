import { Twitter, Share2, Share } from "lucide-react";

export function AskResultsStandardSocialIcons() {
  return (
    <div className="flex justify-end mr-2 text-sm text-zinc-500 space-x-2 border-0">
      <Twitter className="h-4 w-4" />
      <Share2 className="h-4 w-4" />
      <Share className="h-4 w-4" />
    </div>
  );
}