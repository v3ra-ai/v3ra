import { Card, CardContent } from "@/components/ui/card";
import validatorImageMapping from "@/utils/validatorImageMapping.json";
import { getValidatorById, getValidatorVoteStats } from "@/lib/db/validators";
import Image from "next/image";
import { notFound } from "next/navigation";
import VoteHistoryTable from "@/components/validators/vote-history-table";

// Type for validatorImageMapping.json entries
interface ValidatorImageMapping {
  id: string;
  profile: string;
  avatarUrl: string;
}

// Fetch imageName from validatorImageMapping.json
function getValidatorImageName(id: string): string | null {
  const mappings = validatorImageMapping as ValidatorImageMapping[];
  const mapping = mappings.find((m) => m.id === id);
  if (!mapping && process.env.NODE_ENV === "development") {
    console.log(`No image mapping found for validator ID: ${id}`);
  }
  return mapping?.avatarUrl || null;
}

export default async function ValidatorProfilePage({
  params,
}: {
  params: Promise<{ validator: string }>;
}) {
  const { validator: validatorId } = await params; // Await params to resolve validator
  const validator = await getValidatorById(validatorId);
  const stats = await getValidatorVoteStats(validatorId);
  const imageName = getValidatorImageName(validatorId);

  if (!validator) {
    notFound();
  }

  return (
    <>
      <div className="container mx-auto py-8">
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="flex w-full">
                <div className="flex w-1/2 items-center">
                  <div className="w-[80px]">
                    <Image
                      src={
                        imageName
                          ? `/icons/${imageName}`
                          : "/icons/placeholder.png"
                      }
                      alt={validator.profileName}
                      width={80}
                      height={76}
                      className="grayscale"
                    />
                  </div>
                  <div className="pl-4">
                    <h2 className="text-xl font-medium text-zinc-800 dark:text-zinc-200">
                      {validator.profileName}
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Provider: {validator.provider}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Model: {validator.modelName}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      ID: {validator.id}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end w-1/2">
                  <div>
                    <div className="text-3xl">94%</div>
                    <div className="w-24 mt-1 text-xs mr-2 text-zinc-700 dark:text-zinc-300">
                      Speed
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl">
                      {stats && stats.consensusMatchPercentage !== undefined ? (
                        <span className={``}>
                          {Math.round(stats.consensusMatchPercentage)}%
                        </span>
                      ) : (
                        <span className={`text-zinc-400 dark:text-zinc-500`}>
                          ---
                        </span>
                      )}
                    </div>
                    <div className="w-24 mt-1 text-xs mr-2 text-zinc-700 dark:text-zinc-300">
                      Reliability
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">ID: </span>
                {validator.id}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">Description: </span>
                {validator.description || "N/A"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">Is Leader: </span>
                {validator.isLeader ? "Yes" : "No"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">Active: </span>
                {validator.active ? "Yes" : "No"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">Validator Type: </span>
                {validator.validatorType || "N/A"}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">Created At: </span>
                {validator.createdAt.toLocaleString()}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                <span className="font-semibold">Updated At: </span>
                {validator.updatedAt.toLocaleString()}
              </p>
            </div>

            <VoteHistoryTable validatorId={validatorId} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
