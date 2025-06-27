import Image from "next/image";
import { VoteResult } from "@/lib/types";
import { parseRationale } from "@/lib/utils";
import { getValidatorIcon } from "@/lib/utils/icon-mapping";

interface AskResultsStandardValidatorAvatarsProps {
  sanitizedQuery: VoteResult;
}

export function AskResultsStandardValidatorAvatars({
  sanitizedQuery,
}: AskResultsStandardValidatorAvatarsProps) {

  return (
    <div className="mt-3">
      {sanitizedQuery.validatorResponses?.length ? (
        <div className="flex flex-wrap gap-4 max-w-full">
          {sanitizedQuery.validatorResponses.map((response) => {
            const avatarContent = (
              <div
                className={`flex w-[40px] h-[40px] ${
                  response.vote === "YES"
                    ? "border border-green-500"
                    : "border border-red-500"
                }`}
              >
                <Image
                  src={getValidatorIcon(response.id, {
                    modelName: response.profileName,
                    profileName: response.profileName,
                    provider: response.provider,
                    avatarUrl: null
                  })}
                  alt={response.profileName}
                  width={40}
                  height={38}
                  className="object-contain"
                />
              </div>
            );

            const tooltipContent = (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-md shadow-lg text-sm text-zinc-600 dark:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <p>
                  <span className="font-semibold">Profile: </span>
                  {response.profileName}
                </p>
                <p>
                  <span className="font-semibold">Vote: </span>
                  {response.vote}
                </p>
                <p className="text-xs">
                  <span className="font-semibold">Rationale: </span>
                  {parseRationale(response.rationale)}
                </p>
              </div>
            );


            return (
              <div
                key={response.id}
                className="flex flex-col items-center justify-center max-w-[40px] overflow-wrap-anywhere relative group"
              >
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                  {response.vote}
                </p>
                {/* Desktop and Mobile: Just show avatar without click functionality */}
                {avatarContent}
                {tooltipContent}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No validator responses available.
        </p>
      )}
    </div>
  );
}