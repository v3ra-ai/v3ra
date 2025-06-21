import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidators } from "@/lib/db/validators";
import ValidatorsClient from "@/app/validators/validators-client";

export default async function AIHubPage() {
  const validators = await getValidators();

  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            A.I. Hub
          </CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Explore detailed profiles and performance metrics of all AI validators in the network
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <ValidatorsClient validators={validators} />
        </CardContent>
      </Card>
    </div>
  );
}