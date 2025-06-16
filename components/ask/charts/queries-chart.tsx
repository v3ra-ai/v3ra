"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "Query volume over time";

type QueryData = {
  date: string;
  totalQueries: number;
  consensusReached: number;
  consensusFailed: number;
};

// Helper function to group queries by date
const groupQueriesByDate = (
  queries: Array<{ timestamp: string; isConsensusReached: boolean }>
): QueryData[] => {
  const dateMap = new Map<
    string,
    { total: number; consensusReached: number; consensusFailed: number }
  >();

  queries.forEach((query) => {
    const date = new Date(query.timestamp).toISOString().split("T")[0];
    const current =
      dateMap.get(date) || { total: 0, consensusReached: 0, consensusFailed: 0 };

    current.total++;
    if (query.isConsensusReached) {
      current.consensusReached++;
    } else {
      current.consensusFailed++;
    }

    dateMap.set(date, current);
  });

  // Convert to array and sort by date
  const result = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      totalQueries: data.total,
      consensusReached: data.consensusReached,
      consensusFailed: data.consensusFailed,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Return last 30 days of data
  return result.slice(-30);
};

export default function QueriesChart() {
  const [chartData, setChartData] = React.useState<QueryData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [totalCount, setTotalCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchQueryData = async () => {
      try {
        // Calculate date for last 30 days
        const since = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();

        // Get total count
        const countResponse = await fetch("/api/vote-history?countOnly=true");
        if (!countResponse.ok) {
          throw new Error(
            `Failed to fetch total count: ${countResponse.statusText}`
          );
        }
        const countData = await countResponse.json();
        setTotalCount(countData.count || 0);

        // Get recent queries with pagination (limit=30, last 30 days)
        const response = await fetch(
          `/api/vote-history?limit=30&offset=0&since=${encodeURIComponent(since)}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch vote history: ${
              errorData.message || errorData.error || response.statusText
            }`
          );
        }
        const queries = await response.json();

        if (Array.isArray(queries)) {
          const groupedData = groupQueriesByDate(queries);
          setChartData(groupedData);
        } else {
          throw new Error("Invalid response format from vote-history API");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error fetching query data:", errorMessage);
        setError(errorMessage);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQueryData();
  }, []);

  const chartConfig = {
    totalQueries: {
      label: "Total Queries",
      color: "#7dd3fc",
    },
    consensusReached: {
      label: "Consensus Reached",
      color: "#0ea5e9",
    },
    consensusFailed: {
      label: "No Consensus",
      color: "#e11d48",
    },
  } satisfies ChartConfig;

  const [activeChart, setActiveChart] = React.useState<
    keyof typeof chartConfig
  >("totalQueries");

  const total = React.useMemo(
    () => ({
      totalQueries: chartData.reduce((acc, curr) => acc + curr.totalQueries, 0),
      consensusReached: chartData.reduce(
        (acc, curr) => acc + curr.consensusReached,
        0
      ),
      consensusFailed: chartData.reduce(
        (acc, curr) => acc + curr.consensusFailed,
        0
      ),
    }),
    [chartData]
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 w-full">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Query Volume
        </h3>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500">Loading query data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 w-full">
        <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
          Query Volume
        </h3>
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 w-full">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Query Volume
      </h3>
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Testnet Query Activity</CardTitle>
            <CardDescription>
              Showing recent queries on Testnet Total queries processed:{" "}
              {totalCount.toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex">
            {Object.keys(chartConfig).map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-xs text-muted-foreground">
                    {chartConfig[chart].label}
                  </span>
                  <span className="text-lg font-bold leading-none sm:text-3xl">
                    {total[chart].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          {chartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-gray-500">No query data available</p>
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[200px]"
                      nameKey="queries"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      }}
                    />
                  }
                />
                <Bar
                  dataKey={activeChart}
                  fill={`var(--color-${activeChart})`}
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}