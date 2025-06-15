"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
  consensusMatch: {
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

  useEffect(() => {
    const fetchValidatorStats = async () => {
      try {
        // First get all active validators
        const networkResponse = await fetch('/api/network');
        const networkData = await networkResponse.json();
        
        if (!networkData.validators || networkData.validators.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch stats for each validator
        const validatorStatsPromises = networkData.validators.map(async (validator: { id: string; profileName: string; modelName: string }) => {
          try {
            const statsResponse = await fetch(`/api/validators/vote-stats?validatorId=${validator.id}&limit=50`);
            const stats = await statsResponse.json();
            
            return {
              validatorId: validator.id,
              profileName: validator.profileName || validator.modelName,
              totalVotes: stats.totalVotes || 0,
              consensusMatch: stats.consensusMatchPercentage || 0,
              participationRate: stats.totalVotes > 0 ? Math.min(100, (stats.totalVotes / 50) * 100) : 0,
            };
          } catch (error) {
            console.error(`Error fetching stats for validator ${validator.id}:`, error);
            return {
              validatorId: validator.id,
              profileName: validator.profileName || validator.modelName,
              totalVotes: 0,
              consensusMatch: 0,
              participationRate: 0,
            };
          }
        });

        const stats = await Promise.all(validatorStatsPromises);
        
        // Filter out validators with no data and sort by consensus match
        const validStats = stats
          .filter(s => s.totalVotes > 0)
          .sort((a, b) => b.consensusMatch - a.consensusMatch)
          .slice(0, 6); // Show top 6 validators

        setChartData(validStats);
      } catch (error) {
        console.error('Error fetching validator statistics:', error);
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
          tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
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
          dataKey="consensusMatch" 
          fill="var(--color-consensusMatch)" 
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
