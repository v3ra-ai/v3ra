"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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

export const description = "An interactive bar chart";

export const chartData = [
  { date: "2025-04-01", desktop: 222, mobile: 150 },
  { date: "2025-04-02", desktop: 97, mobile: 180 },
  { date: "2025-04-03", desktop: 167, mobile: 120 },
  { date: "2025-04-04", desktop: 42, mobile: 260 },
  { date: "2025-04-05", desktop: 173, mobile: 190 },
  { date: "2025-04-06", desktop: 101, mobile: 140 },
  { date: "2025-04-07", desktop: 245, mobile: 180 },
  { date: "2025-04-08", desktop: 409, mobile: 320 },
  { date: "2025-04-09", desktop: 59, mobile: 110 },
  { date: "2025-04-10", desktop: 261, mobile: 190 },
  { date: "2025-04-11", desktop: 327, mobile: 150 },
  { date: "2025-04-12", desktop: 292, mobile: 210 },
  { date: "2025-04-13", desktop: 342, mobile: 380 },
  { date: "2025-04-14", desktop: 137, mobile: 220 },
  { date: "2025-04-15", desktop: 120, mobile: 170 },
  { date: "2025-04-16", desktop: 138, mobile: 190 },
  { date: "2025-04-17", desktop: 146, mobile: 160 },
  { date: "2025-04-18", desktop: 364, mobile: 410 },
  { date: "2025-04-19", desktop: 243, mobile: 180 },
  { date: "2025-04-20", desktop: 89, mobile: 150 },
  { date: "2025-04-21", desktop: 137, mobile: 200 },
  { date: "2025-04-22", desktop: 224, mobile: 170 },
  { date: "2025-04-23", desktop: 138, mobile: 230 },
  { date: "2025-04-24", desktop: 387, mobile: 290 },
  { date: "2025-04-25", desktop: 215, mobile: 250 },
  { date: "2025-04-26", desktop: 75, mobile: 130 },
  { date: "2025-04-27", desktop: 383, mobile: 420 },
  { date: "2025-04-28", desktop: 122, mobile: 180 },
  { date: "2025-04-29", desktop: 315, mobile: 240 },
  { date: "2025-04-30", desktop: 454, mobile: 380 },
  { date: "2025-05-01", desktop: 165, mobile: 220 },
  { date: "2025-05-02", desktop: 293, mobile: 310 },
  { date: "2025-05-03", desktop: 247, mobile: 190 },
  { date: "2025-05-04", desktop: 385, mobile: 420 },
  { date: "2025-05-05", desktop: 481, mobile: 390 },
  { date: "2025-05-06", desktop: 498, mobile: 520 },
  { date: "2025-05-07", desktop: 388, mobile: 300 },
  { date: "2025-05-08", desktop: 149, mobile: 210 },
  { date: "2025-05-09", desktop: 227, mobile: 180 },
  { date: "2025-05-10", desktop: 293, mobile: 330 },
  { date: "2025-05-11", desktop: 435, mobile: 470 },
  { date: "2025-05-12", desktop: 397, mobile: 440 },
  { date: "2025-05-13", desktop: 497, mobile: 560 },
  { date: "2025-05-14", desktop: 448, mobile: 590 },
  { date: "2025-05-15", desktop: 473, mobile: 380 },
  { date: "2025-05-16", desktop: 538, mobile: 400 },
  { date: "2025-05-17", desktop: 699, mobile: 420 },
  { date: "2025-05-18", desktop: 715, mobile: 550 },
  { date: "2025-05-19", desktop: 735, mobile: 180 },
  { date: "2025-05-20", desktop: 777, mobile: 230 },
  { date: "2025-05-21", desktop: 882, mobile: 140 },
  { date: "2025-05-22", desktop: 81, mobile: 120 },
  { date: "2025-05-23", desktop: 252, mobile: 290 },
  { date: "2025-05-24", desktop: 294, mobile: 220 },
  { date: "2025-05-25", desktop: 201, mobile: 250 },
  { date: "2025-05-26", desktop: 213, mobile: 170 },
  { date: "2025-05-27", desktop: 420, mobile: 460 },
  { date: "2025-05-28", desktop: 233, mobile: 190 },
  { date: "2025-05-29", desktop: 78, mobile: 130 },
  { date: "2025-05-30", desktop: 340, mobile: 280 },
  { date: "2025-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 775, mobile: 520 },
  { date: "2024-06-18", desktop: 707, mobile: 170 },
  { date: "2024-06-19", desktop: 741, mobile: 290 },
  { date: "2024-06-20", desktop: 708, mobile: 450 },
  { date: "2024-06-21", desktop: 569, mobile: 210 },
  { date: "2024-06-22", desktop: 517, mobile: 270 },
  { date: "2024-06-23", desktop: 680, mobile: 530 },
  { date: "2024-06-24", desktop: 832, mobile: 180 },
  { date: "2024-06-25", desktop: 841, mobile: 190 },
  { date: "2024-06-26", desktop: 834, mobile: 380 },
  { date: "2024-06-27", desktop: 848, mobile: 490 },
  { date: "2024-06-28", desktop: 1249, mobile: 200 },
  { date: "2024-06-29", desktop: 803, mobile: 160 },
  { date: "2024-06-30", desktop: 846, mobile: 400 },
];

export default function QueriesChart() {


  const chartConfig = {
    views: {
      label: "Total Queries",
    },
    desktop: {
      label: "Desktop Queries",
      color: "#7dd3fc"
    },
    mobile: {
      label: "Mobile Queries",
      color: "#0ea5e9"
    },
  } satisfies ChartConfig;

  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("desktop");

  const total = React.useMemo(
    () => ({
      desktop: chartData.reduce((acc, curr) => acc + curr.desktop, 0),
      mobile: chartData.reduce((acc, curr) => acc + curr.mobile, 0),
    }),
    []
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-6 w-full">
      <h3 className="text-md font-medium text-gray-800 dark:text-zinc-200 mb-4">
        Staking
      </h3>
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Testnet Queries - Interactive</CardTitle>
            <CardDescription>
              Showing recent queries on Testnet
            </CardDescription>
          </div>
          <div className="flex">
            {["desktop", "mobile"].map((key) => {
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
                    {total[key as keyof typeof total].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
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
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
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
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
