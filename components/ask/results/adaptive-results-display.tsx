"use client";

import { QueryCategory } from "@/lib/types/query-classifier";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Brain,
  Globe,
  Scale
} from "lucide-react";

interface AdaptiveResponse {
  id: string;
  query: string;
  classification: any;
  consensus: any;
  validatorResponses: any[];
  metadata: any;
}

const CATEGORY_CONFIG = {
  [QueryCategory.FACT_CHECK]: {
    label: "Fact Check",
    icon: CheckCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
  },
  [QueryCategory.QUESTION_ANSWER]: {
    label: "Question & Answer",
    icon: HelpCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  [QueryCategory.IDENTITY_PHILOSOPHY]: {
    label: "Philosophical Inquiry",
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  [QueryCategory.CURRENT_EVENTS]: {
    label: "Current Events",
    icon: Globe,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  [QueryCategory.OPINION_DEBATE]: {
    label: "Opinion & Debate",
    icon: Scale,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
};

interface AdaptiveResultsDisplayProps {
  response: AdaptiveResponse;
}

export function AdaptiveResultsDisplay({ response }: AdaptiveResultsDisplayProps) {
  const categoryConfig = CATEGORY_CONFIG[response.classification.category];
  const Icon = categoryConfig.icon;
  
  // Simple responsive width based on content
  const cardClassName = "w-full sm:w-[90%] lg:w-4xl max-w-4xl mx-auto";

  const renderConsensusContent = () => {
    const { consensus } = response;

    switch (response.classification.category) {
      case QueryCategory.FACT_CHECK:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Verdict:</span>
              <div className="flex items-center gap-2">
                {consensus.value === true && (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <span className="text-2xl font-bold text-green-500">TRUE</span>
                  </>
                )}
                {consensus.value === false && (
                  <>
                    <XCircle className="w-6 h-6 text-red-500" />
                    <span className="text-2xl font-bold text-red-500">FALSE</span>
                  </>
                )}
                {consensus.value === null && (
                  <>
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                    <span className="text-2xl font-bold text-amber-500">UNCERTAIN</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{consensus.summary}</div>
          </div>
        );

      case QueryCategory.QUESTION_ANSWER:
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
              <h4 className="font-semibold mb-2">Answer:</h4>
              <p className="text-sm">{consensus.answer}</p>
            </div>
            {consensus.keyPoints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Points:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {consensus.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case QueryCategory.IDENTITY_PHILOSOPHY:
      case QueryCategory.OPINION_DEBATE:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{consensus.summary}</p>
            {consensus.perspectives && consensus.perspectives.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Different Perspectives:</h4>
                <div className="space-y-3">
                  {consensus.perspectives.map((perspective, idx) => (
                    <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                      <h5 className="font-medium mb-1">{perspective.viewpoint}</h5>
                      <p className="text-sm text-muted-foreground">{perspective.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case QueryCategory.CURRENT_EVENTS:
        return (
          <div className="space-y-4">
            {consensus.answer && (
              <div className="p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                <p className="text-sm">{consensus.answer}</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{consensus.summary}</p>
            {consensus.keyPoints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Facts:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {consensus.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-sm text-muted-foreground">{consensus.summary}</p>;
    }
  };

  return (
    <Card className={`${cardClassName} bg-gradient-to-br from-zinc-900/90 via-zinc-900/95 to-black/90 backdrop-blur-2xl border border-zinc-700/50 hover:border-cyan-400/40 transition-all duration-300 hover:shadow-2xl`}>
      <CardHeader>
        <div className="space-y-4">
          {/* Category Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`${categoryConfig.bgColor} ${categoryConfig.borderColor} ${categoryConfig.color}`}
            >
              <Icon className="w-4 h-4 mr-1" />
              {categoryConfig.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {response.metadata.modelsQueried} models queried
            </span>
          </div>

          {/* Query Display */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Query:</h3>
            <p className="text-muted-foreground">{response.query}</p>
          </div>

          {/* Classification Confidence */}
          {response.classification.confidence < 0.8 && (
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">Low Classification Confidence</span>
              </div>
              {response.classification.suggestedRephrasing && (
                <p className="text-xs text-muted-foreground">
                  Suggestion: {response.classification.suggestedRephrasing}
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Consensus Display */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">AI Consensus</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-muted-foreground">Confidence: </span>
                <span className="font-medium">{Math.round(response.consensus.confidence * 100)}%</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Agreement: </span>
                <span className="font-medium">{Math.round(response.consensus.modelAgreement * 100)}%</span>
              </div>
            </div>
          </div>
          
          <Progress 
            value={response.consensus.confidence * 100} 
            className="h-2 mb-4"
          />

          {renderConsensusContent()}
        </div>

        {/* Processing Metadata */}
        <div className="pt-4 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Processing time: {response.metadata.processingTime}ms</span>
            <span>Timestamp: {new Date(response.metadata.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}