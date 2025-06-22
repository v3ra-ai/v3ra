"use client";

import { useState } from "react";
import { LLM } from "@/store/llm-store";
import { ArrowLeft, Activity, Clock, TrendingUp, Brain, Shield, Zap, Check, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getModelIconPath } from "@/lib/utils/icon-mapping";
import { getModelSpecialization, VoteHistory } from "@/types/ai-models";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIModelProfileProps {
  model: LLM;
}

// Mock data for demonstration - in production, this would come from your API
const mockVoteStats = {
  totalVotes: 324,
  yesVotes: 287,
  noVotes: 37,
  reliability: 94,
  consensus: 75,
  nonConsensus: 25,
};

const mockVoteHistory: VoteHistory[] = [
  {
    queryText: "The Declaration of Independence was adopted on July 4, 1776, marking the formal separation of the thirteen American colonies from British rule.",
    vote: "YES",
    rationale: "This statement is historically accurate. The Continental Congress did indeed adopt the Declaration of Independence on July 4, 1776.",
    timestamp: "2025-06-17T10:23:26",
  },
  {
    queryText: "George Washington had wooden teeth.",
    vote: "NO",
    rationale: "This is a common myth. George Washington's dentures were made from materials including ivory, human teeth, and metal, but not wood.",
    timestamp: "2025-06-17T10:22:56",
  },
  {
    queryText: "The Sahara Desert, covering approximately 9,200,000 square kilometers (3,552,000 sq mi), is widely recognized as the largest hot desert in the world.",
    vote: "YES",
    rationale: "The Sahara Desert is indeed the largest hot desert in the world, covering the area mentioned.",
    timestamp: "2025-06-17T09:42:16",
  },
];

export default function AIModelProfile({ model }: AIModelProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const specialization = getModelSpecialization(model.name);

  const reliabilityColor = mockVoteStats.reliability >= 90 ? "text-emerald-400" : 
                          mockVoteStats.reliability >= 75 ? "text-blue-400" : "text-amber-400";

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/ai-hub" className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to AI Hub
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative -mt-20">
            <div className="flex items-end gap-6">
              {/* Model Icon */}
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-zinc-900 border-4 border-zinc-950 shadow-xl">
                <Image
                  src={getModelIconPath(model.name, model.provider, model.avatar)}
                  alt={model.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
              
              {/* Model Info */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-zinc-100">{model.name}</h1>
                  {model.enabled && (
                    <Badge variant="default" className="bg-emerald-600">
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-zinc-400 mt-1">
                  {model.provider} • Model ID: {model.id}
                </p>
                <p className="text-zinc-300 mt-2 max-w-3xl">
                  {specialization.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-zinc-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="history">Vote History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Specialization */}
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                Specialization
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Category</h3>
                  <p className="text-zinc-100">{specialization.category}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Key Strengths</h3>
                  <div className="flex flex-wrap gap-2">
                    {specialization.strengths.map((strength, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-zinc-800">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-400 mb-2">Best Use Cases</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {specialization.useCases.map((useCase, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {useCase}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-medium text-zinc-400">Reliability</h3>
                </div>
                <p className={clsx("text-3xl font-bold", reliabilityColor)}>
                  {mockVoteStats.reliability}%
                </p>
                <p className="text-xs text-zinc-500 mt-1">Based on recent votes</p>
              </div>

              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-medium text-zinc-400">Consensus Rate</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {mockVoteStats.consensus}%
                </p>
                <p className="text-xs text-zinc-500 mt-1">Agreement with majority</p>
              </div>

              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-medium text-zinc-400">Total Votes</h3>
                </div>
                <p className="text-3xl font-bold text-amber-400">
                  {mockVoteStats.totalVotes}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Lifetime participation</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-zinc-100 mb-6">Vote Statistics (Recent)</h2>
              
              <div className="space-y-6">
                {/* Vote Distribution */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Vote Distribution</span>
                    <span className="text-zinc-300">
                      YES: {mockVoteStats.yesVotes} | NO: {mockVoteStats.noVotes}
                    </span>
                  </div>
                  <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                      style={{ width: `${(mockVoteStats.yesVotes / mockVoteStats.totalVotes) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-zinc-100">{mockVoteStats.totalVotes}</p>
                    <p className="text-xs text-zinc-400 mt-1">Total Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{mockVoteStats.yesVotes}</p>
                    <p className="text-xs text-zinc-400 mt-1">YES Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-400">{mockVoteStats.noVotes}</p>
                    <p className="text-xs text-zinc-400 mt-1">NO Votes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{mockVoteStats.reliability}%</p>
                    <p className="text-xs text-zinc-400 mt-1">Reliability</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-zinc-100">Vote History</h2>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    Yes
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    No
                  </span>
                  <Button variant="outline" size="sm" className="ml-4">
                    Recent
                  </Button>
                  <Button variant="ghost" size="sm">
                    All
                  </Button>
                </div>
              </div>

              {mockVoteHistory.map((vote, idx) => (
                <div key={idx} className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4">
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      "mt-1 w-10 h-10 rounded-lg flex items-center justify-center",
                      vote.vote === "YES" ? "bg-emerald-500/20" : "bg-red-500/20"
                    )}>
                      {vote.vote === "YES" ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={vote.vote === "YES" ? "default" : "destructive"}
                          className={clsx(
                            "text-xs",
                            vote.vote === "YES" ? "bg-emerald-600" : "bg-red-600"
                          )}
                        >
                          {vote.vote}
                        </Badge>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(vote.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 mb-2">{vote.queryText}</p>
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-400">
                          <span className="font-medium">Rationale:</span> {vote.rationale}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
