import { AskResultsStandardSocialIcons } from "@/components/ask/ask-results-standard-social-icons";

interface AskResultsStandardHeaderProps {
  formattedDate: string;
}

export function AskResultsStandardHeader({ formattedDate }: AskResultsStandardHeaderProps) {
  return (
    <div className="flex px-2 font-light text-xs dark:text-zinc-500 text-zinc-500">
      <div className="w-1/2">{formattedDate}</div>
      <div className="w-1/2 justify-end">
        <div className="flex justify-between">
          <div className="flex justify-start mr-2 text-sm text-zinc-500 space-x-2 border-0"></div>
          <AskResultsStandardSocialIcons />
        </div>
      </div>
    </div>
  );
}