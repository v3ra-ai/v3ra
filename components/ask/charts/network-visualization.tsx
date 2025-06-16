"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { validate as uuidValidate } from "uuid";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ValidatorStats = {
  validatorId: string;
  profileName: string;
  totalVotes: number;
  consensusMatchPercentage: number;
  participationRate: number;
};

const chartConfig = {
  consensusMatchPercentage: {
    label: "Consensus Match %",
    color: "#1d4ed8",
  },
  participationRate: {
    label: "Participation %",
    color: "#c026d3",
  },
} satisfies ChartConfig;

export default function NetworkVisualization() {
  const [chartData, setChartData] = useState<ValidatorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchValidatorStats = async () => {
      try {
        // Fetch all active validators
        const networkResponse = await fetch("/api/network");
        if (!networkResponse.ok) {
          const errorData = await networkResponse.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch network data: ${errorData.error || networkResponse.statusText}`
          );
        }
        const networkData = await networkResponse.json();

        if (!networkData.validators || networkData.validators.length === 0) {
          setLoading(false);
          return;
        }

        // Prepare and validate validator IDs
        const validatorIds = networkData.validators
          .filter((v: { id: string }) => v.id && uuidValidate(v.id))
          .map((v: { id: string }) => v.id)
          .join(",");

        if (!validatorIds) {
          setError("No valid validator IDs available");
          setLoading(false);
          return;
        }

        console.log("Fetching stats for validatorIds:", validatorIds);

        // Fetch stats for all validators in one call
        const statsResponse = await fetch(
          `/api/validators/vote-stats?validatorIds=${encodeURIComponent(validatorIds)}&limit=50`
        );
        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch validator stats: ${errorData.error || statsResponse.statusText}`
          );
        }
        const statsData = await statsResponse.json();

        // Map stats to ValidatorStats format
        const stats = networkData.validators.map(
          (validator: { id: string; profileName: string; modelName: string }) => {
            const validatorStats = statsData.find(
              (s: { validatorId: string }) => s.validatorId === validator.id
            ) || {
              totalVotes: 0,
              consensusMatchPercentage: 0,
            };

            return {
              validatorId: validator.id,
              profileName: validator.profileName || validator.modelName,
              totalVotes: validatorStats.totalVotes || 0,
              consensusMatchPercentage: validatorStats.consensusMatchPercentage || 0,
              participationRate:
                validatorStats.totalVotes > 0
                  ? Math.min(100, (validatorStats.totalVotes / 50) * 100)
                  : 0,
            };
          }
        );

        // Filter out validators with no data and sort by consensus match percentage
        const validStats = stats
          .filter((s: ValidatorStats) => s.totalVotes > 0)
          .sort((a: ValidatorStats, b: ValidatorStats) => b.consensusMatchPercentage - a.consensusMatchPercentage)
          .slice(0, 6); // Show top 6 validators

        setChartData(validStats);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching validator statistics:", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchValidatorStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[200px] max-h-[250px] w-full flex items-center justify-center">
        <p className="text-gray-500">Loading validator performance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] max-h-[250px] w-full flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="min-h-[200px] max-h-[250px] w-full flex items-center justify-center">
        <p className="text-gray-500">No validator data available</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] max-h-[250px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="profileName"
          tickLine={false}
          tickMargin={6}
          axisLine={false}
          tickFormatter={(value) => (value.length > 10 ? value.slice(0, 10) + "..." : value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          formatter={(value: number) => `${value}%`}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="consensusMatchPercentage"
          fill="var(--color-consensusMatchPercentage)"
          radius={4}
          animationBegin={0}
          animationDuration={500}
        />
        <Bar
          dataKey="participationRate"
          fill="var(--color-participationRate)"
          radius={4}
          animationBegin={200}
          animationDuration={500}
        />
      </BarChart>
    </ChartContainer>
  );
}