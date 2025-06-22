"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { LLM } from "@/store/llm-store";
import { ArrowLeft, Activity, TrendingUp, Brain, Shield, Zap, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getModelIconPath } from "@/lib/utils/icon-mapping";
import { getModelSpecialization, VoteHistory, VoteStatistics } from "@/types/ai-models";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { parseRationale } from "@/lib/utils";

interface ModelProfileClientProps {
  initialModel?: LLM;
  modelId?: string;
}

export default function ModelProfileClient({ initialModel, modelId: propModelId }: ModelProfileClientProps) {
  const params = useParams();
  const modelId = propModelId || (params.modelId as string);
  
  const [model, setModel] = useState<LLM | null>(initialModel || null);
  const [activeTab, setActiveTab] = useState("overview");
  const [voteStats, setVoteStats] = useState<VoteStatistics | null>(null);
  const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModel = useCallback(async () => {
    try {
      const response = await fetch(`/api/validators/${modelId}`);
      if (!response.ok) throw new Error('Failed to fetch model');
      const data = await response.json();
      setModel({
        id: data.id,
        name: data.profileName || data.name,
        provider: data.provider,
        enabled: data.active || false,
        pinned: false,
        avatar: data.avatarUrl,
      } as LLM);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model');
    }
  }, [modelId]);

  const fetchVoteData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch vote statistics
      const statsResponse = await fetch(`/api/validators/${modelId}/vote-stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setVoteStats({
          totalVotes: statsData.totalVotes || 0,
          yesVotes: statsData.yesVotes || 0,
          noVotes: statsData.noVotes || 0,
          reliability: statsData.consensusMatchPercentage || 0,
          consensus: statsData.consensusRate || 75,
          nonConsensus: statsData.nonConsensusRate || 25,
        });
      }

      // Fetch vote history
      const historyResponse = await fetch(`/api/validators/${modelId}/votes?limit=20`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        const formattedHistory: VoteHistory[] = historyData.votes?.map((vote: { queryText?: string; query?: string; vote: string | boolean; rationale?: string; timestamp?: string; createdAt?: string }) => ({
          queryText: vote.queryText || vote.query || '',
          vote: vote.vote === 'YES' || vote.vote === true ? 'YES' : 'NO',
          rationale: vote.rationale || '',
          timestamp: vote.timestamp || vote.createdAt || new Date().toISOString(),
        })) || [];
        setVoteHistory(formattedHistory);
      }
    } catch (err) {
      console.error('Error fetching vote data:', err);
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  useEffect(() => {
    if (!initialModel) {
      fetchModel();
    }
    fetchVoteData();
  }, [modelId, initialModel, fetchModel, fetchVoteData]);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 p-6 max-w-md">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
          <Link href="/ai-hub" className="mt-4 inline-block text-zinc-400 hover:text-zinc-100">
            ← Back to AI Hub
          </Link>
        </Card>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading model data...</div>
      </div>
    );
  }

  const specialization = getModelSpecialization(model.name);
  const reliabilityColor = (voteStats?.reliability || 0) >= 90 ? "text-emerald-400" : 
                          (voteStats?.reliability || 0) >= 75 ? "text-blue-400" : "text-amber-400";

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
                {loading ? (
                  <Skeleton className="h-10 w-20 bg-zinc-800" />
                ) : (
                  <>
                    <p className={clsx("text-3xl font-bold", reliabilityColor)}>
                      {Math.round(voteStats?.reliability || 0)}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Based on consensus matching</p>
                  </>
                )}
              </div>

              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-medium text-zinc-400">Consensus Rate</h3>
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-20 bg-zinc-800" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-blue-400">
                      {Math.round(voteStats?.consensus || 75)}%
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Agreement with majority</p>
                  </>
                )}
              </div>

              <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-medium text-zinc-400">Total Votes</h3>
                </div>
                {loading ? (
                  <Skeleton className="h-10 w-20 bg-zinc-800" />
                ) : (
                  <>
                    <p className="text-3xl font-bold text-amber-400">
                      {voteStats?.totalVotes || 0}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">Lifetime participation</p>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6">
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-zinc-100 mb-6">Vote Statistics</h2>
              
              <div className="space-y-6">
                {/* Vote Distribution */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Vote Distribution</span>
                    <span className="text-zinc-500">{voteStats?.totalVotes || 0} total votes</span>
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-full bg-zinc-800" />
                  ) : (
                    <div className="flex h-8 rounded-lg overflow-hidden bg-zinc-800">
                      {voteStats && voteStats.totalVotes > 0 && (
                        <>
                          <div 
                            className="bg-emerald-500 transition-all"
                            style={{ width: `${(voteStats.yesVotes / voteStats.totalVotes) * 100}%` }}
                          />
                          <div 
                            className="bg-red-500 transition-all"
                            style={{ width: `${(voteStats.noVotes / voteStats.totalVotes) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-emerald-400">YES: {voteStats?.yesVotes || 0}</span>
                    <span className="text-red-400">NO: {voteStats?.noVotes || 0}</span>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-1">Average Response Time</p>
                    <p className="text-xl font-semibold text-zinc-100">1.2s</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-1">Uptime</p>
                    <p className="text-xl font-semibold text-zinc-100">99.9%</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-zinc-100 mb-6">Recent Vote History</h2>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full bg-zinc-800" />
                  ))}
                </div>
              ) : voteHistory.length > 0 ? (
                <div className="space-y-4">
                  {voteHistory.map((vote, idx) => (
                    <div key={idx} className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-zinc-300 flex-1 mr-4">{vote.queryText}</p>
                        <Badge 
                          variant={vote.vote === 'YES' ? 'default' : 'destructive'}
                          className={vote.vote === 'YES' ? 'bg-emerald-600' : 'bg-red-600'}
                        >
                          {vote.vote}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500">{parseRationale(vote.rationale)}</p>
                      <p className="text-xs text-zinc-600">
                        {new Date(vote.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8">No vote history available</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}