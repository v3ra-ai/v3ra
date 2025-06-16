"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type ConsensusData = {
  month: string;
  consensusRate: number;
  participationRate: number;
};

const chartConfig = {
  consensusRate: {
    label: "Consensus Rate",
    color: "#1d4ed8",
  },
  participationRate: {
    label: "Participation Rate",
    color: "#c026d3",
  },
} satisfies ChartConfig;

export default function StakingAreaStacked() {
  const [chartData, setChartData] = useState<ConsensusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trend, setTrend] = useState({ value: 0, isUp: true });

  useEffect(() => {
    const fetchConsensusData = async () => {
      try {
        // Calculate date for last 6 months
        const since = new Date(
          Date.now() - 6 * 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        // Fetch vote history with pagination (limit=100, last 6 months, grouped by month)
        const response = await fetch(
          `/api/vote-history?limit=100&offset=0&since=${encodeURIComponent(
            since
          )}&groupBy=month`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch vote history: ${
              errorData.message || errorData.error || response.statusText
            }`
          );
        }
        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid response format from vote-history API");
        }

        // Process monthly data
        const processedData: ConsensusData[] = data
          .map(
            (item: {
              month: string;
              total: number;
              consensusReached: number;
              participationRate: number;
            }) => ({
              month: item.month.split(" ")[0], // Just the month name
              consensusRate:
                item.total > 0
                  ? Math.round((item.consensusReached / item.total) * 100)
                  : 0,
              participationRate: Math.round(item.participationRate * 100),
            })
          )
          .slice(-6); // Ensure last 6 months

        setChartData(processedData);

        // Calculate trend
        if (processedData.length >= 2) {
          const lastMonth = processedData[processedData.length - 1];
          const previousMonth = processedData[processedData.length - 2];
          const diff = lastMonth.consensusRate - previousMonth.consensusRate;
          setTrend({ value: Math.abs(diff), isUp: diff > 0 });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching consensus data:", errorMessage);
        setError(errorMessage);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConsensusData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Network Consensus Trends</CardTitle>
          <CardDescription>Loading consensus data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Network Consensus Trends</CardTitle>
          <CardDescription>Error loading consensus data</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Network Consensus Trends</CardTitle>
          <CardDescription>No consensus data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Network Consensus Trends</CardTitle>
        <CardDescription>
          Monthly consensus achievement and validator participation rates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="w-full h-[300px]" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="participationRate"
              type="natural"
              fill="var(--color-participationRate)"
              fillOpacity={0.4}
              stroke="var(--color-participationRate)"
              stackId="a"
            />
            <Area
              dataKey="consensusRate"
              type="natural"
              fill="var(--color-consensusRate)"
              fillOpacity={0.4}
              stroke="var(--color-consensusRate)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {trend.isUp ? "Trending up" : "Trending down"} by {trend.value}% this
              month
              <TrendingUp
                className={`h-4 w-4 ${!trend.isUp ? "rotate-180" : ""}`}
              />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Based on actual network consensus data
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}