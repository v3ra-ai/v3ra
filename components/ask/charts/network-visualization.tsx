"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartData = [
  { validator: "GEMINI", reliability: 90, speed: 80 },
  { validator: "GROK-1", reliability: 82, speed: 81 },
  { validator: "GPT-4O", reliability: 89, speed: 95 },
  { validator: "SONNET-20240229", reliability: 94, speed: 87 },
  { validator: "OpenAI", reliability: 91, speed: 94 },
  { validator: "Grok-2", reliability: 92, speed: 93 },
];

const chartConfig = {
  reliability: {
    label: "Reliability",
    color: "#334155",
  },
  speed: {
    label: "Speed",
    color: "#64748b",
  },
} satisfies ChartConfig;

export default function NetworkVisualization() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] max-h-[250px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="validator"
          tickLine={false}
          tickMargin={6}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 7)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="reliability" fill="var(--color-reliability)" radius={4}
                animationBegin={0}
                animationDuration={20}
                // animationEasing={3}
                />
        <Bar dataKey="speed" fill="var(--color-speed)" radius={4}
                   animationBegin={2}
                   animationDuration={10}
          />
      </BarChart>
    </ChartContainer>
  );
}
