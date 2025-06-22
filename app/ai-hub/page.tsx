import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AIModelsCompact from "@/components/ai-hub/ai-models-compact";

export default function AIHubPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            A.I. Hub
          </CardTitle>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Explore AI model specializations and performance metrics. Click any model to view its detailed profile and voting history.
          </p>
        </CardHeader>
        <CardContent>
          <AIModelsCompact />
        </CardContent>
      </Card>
    </div>
  );
}