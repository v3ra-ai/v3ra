import Image from "next/image";
import Link from "next/link";
import { VoteResult } from "@/lib/types";
import validatorImageMapping from "@/utils/validatorImageMapping.json";

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
            const mapping = validatorImageMapping.find(
              (m) => m.id === response.id
            ) as { id: string; profile: string; avatarUrl: string | null } | undefined;
            // Enhanced debugging for validator data
            if (process.env.NODE_ENV === "development") {
              // console.log(`Validator ID: ${response.id}`);
              // console.log(`Mapping found: ${!!mapping}`);
              if (mapping) {
                // console.log(`Mapping data:`, mapping);
              } else {
                // console.log(`No mapping for ID ${response.id} in validatorImageMapping`);
              }
            }
            return (
              <div
                key={response.id}
                className={`flex flex-col items-center justify-center max-w-[40px] overflow-wrap-anywhere relative group`}
              >
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mb-1">
                  {response.vote}
                </p>
                <Link href={`/validators/${response.id}/profile`}>
                  <div
                    className={`flex w-[40px] h-[40px] ${
                      response.vote === "YES"
                        ? "border border-green-500"
                        : "border border-red-500"
                    } cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    <Image
                      src={
                        mapping?.avatarUrl
                          ? `/icons/${mapping.avatarUrl}`
                          : "/icons/placeholder.png"
                      }
                      alt={response.profileName}
                      width={40}
                      height={38}
                      className="grayscale object-contain"
                    />
                  </div>
                </Link>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-md shadow-lg text-sm text-zinc-600 dark:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <p>
                    <span className="font-semibold">Provider: </span>
                    {response.provider}
                  </p>
                  <p>
                    <span className="font-semibold">Profile: </span>
                    {response.profileName}
                  </p>
                  <p>
                    <span className="font-semibold">Vote: </span>
                    {response.vote}
                  </p>
                  <p>
                    <span className="font-semibold">Rationale: </span>
                    {response.rationale}
                  </p>
                </div>
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