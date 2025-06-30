import { PredictionHistory } from "@/components/predictions/prediction-history";
import { Suspense } from "react";

export default function PredictionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Prediction Tracker</h1>
          <p className="text-muted-foreground">
            Track and verify predictions made by the AI models over time.
          </p>
        </div>

        <Suspense fallback={<div>Loading predictions...</div>}>
          <PredictionHistory />
        </Suspense>
      </div>
    </div>
  );
}