"use client"

import { useEffect, useState } from "react"
import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
} satisfies ChartConfig

export default function StakingAreaStacked() {
  const [chartData, setChartData] = useState<ConsensusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState({ value: 0, isUp: true });

  useEffect(() => {
    const fetchConsensusData = async () => {
      try {
        // Fetch vote history to calculate monthly consensus rates
        const response = await fetch('/api/vote-history?limit=500&offset=0');
        const voteHistory = await response.json();
        
        if (!Array.isArray(voteHistory)) {
          setLoading(false);
          return;
        }

        // Group by month and calculate rates
        const monthlyData = new Map<string, { total: number; consensusReached: number; totalPossibleVotes: number; actualVotes: number }>();
        
        voteHistory.forEach(session => {
          const date = new Date(session.timestamp);
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
          
          const current = monthlyData.get(monthKey) || { 
            total: 0, 
            consensusReached: 0, 
            totalPossibleVotes: 0, 
            actualVotes: 0 
          };
          
          current.total++;
          if (session.isConsensusReached) {
            current.consensusReached++;
          }
          
          // Calculate participation from voting results
          const totalValidators = session.votingResult.yes + session.votingResult.no + session.votingResult.notVoted;
          const participated = session.votingResult.yes + session.votingResult.no;
          
          current.totalPossibleVotes += totalValidators;
          current.actualVotes += participated;
          
          monthlyData.set(monthKey, current);
        });
        
        // Convert to array and calculate percentages
        const processedData: ConsensusData[] = Array.from(monthlyData.entries())
          .map(([month, data]) => ({
            month: month.split(' ')[0], // Just the month name
            consensusRate: data.total > 0 ? Math.round((data.consensusReached / data.total) * 100) : 0,
            participationRate: data.totalPossibleVotes > 0 ? Math.round((data.actualVotes / data.totalPossibleVotes) * 100) : 0,
          }))
          .slice(-6); // Last 6 months
        
        setChartData(processedData);
        
        // Calculate trend
        if (processedData.length >= 2) {
          const lastMonth = processedData[processedData.length - 1];
          const previousMonth = processedData[processedData.length - 2];
          const diff = lastMonth.consensusRate - previousMonth.consensusRate;
          setTrend({ value: Math.abs(diff), isUp: diff > 0 });
        }
      } catch (error) {
        console.error('Error fetching consensus data:', error);
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
          <CardDescription>
            Loading consensus data...
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Network Consensus Trends</CardTitle>
          <CardDescription>
            No consensus data available
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">No data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="text-xl">Network Consensus Trends</CardTitle>
        <CardDescription>
          Monthly consensus achievement and validator participation rates
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
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
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
              {trend.isUp ? 'Trending up' : 'Trending down'} by {trend.value}% this month 
              <TrendingUp className={`h-4 w-4 ${!trend.isUp ? 'rotate-180' : ''}`} />
            </div>
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              Based on actual network consensus data
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
