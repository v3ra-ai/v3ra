"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { month: "January", staked: 9186, rewards: 8380 },
  { month: "February", staked: 11305, rewards: 9300 },
  { month: "March", staked: 12237, rewards: 9120 },
  { month: "April", staked: 14173, rewards: 10190 },
  { month: "May", staked: 21209, rewards: 11130 },
  { month: "June", staked: 31214, rewards:15140 },
]

const chartConfig = {
  staked: {
    label: "staked",
    color: "#1d4ed8",
  },
  rewards: {
    label: "rewards",
    color: "#c026d3",
  },
} satisfies ChartConfig

export default function StakingAreaStacked() {
  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="text-xl">Truth Staking Projections</CardTitle>
        <CardDescription>
          Showing staking rewards projected (experimental data only)
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        <ChartContainer className="w-full h-[300px]" config={chartConfig}>
          <AreaChart
          width={600}
          height={200}
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="rewards"
              type="natural"
              fill="var(--color-rewards)"
              fillOpacity={0.4}
              stroke="var(--color-rewards)"
              stackId="a"
            />
            <Area
              dataKey="staked"
              type="natural"
              fill="var(--color-staked)"
              fillOpacity={0.4}
              stroke="var(--color-staked)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 8.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              January - June 2025 (projected, experimental data only, not confirmed)
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
