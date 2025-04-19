import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesChartProps {
  defaultPeriod?: string;
}

export default function SalesChart({ defaultPeriod = "monthly" }: SalesChartProps) {
  const [period, setPeriod] = useState(defaultPeriod);
  
  // Update period when defaultPeriod changes
  useEffect(() => {
    setPeriod(defaultPeriod);
  }, [defaultPeriod]);
  
  const { data: revenueData, isLoading } = useQuery<{
    daily: { date: string; revenue: number }[];
    weekly: { week: number; year: number; revenue: number }[];
    monthly: { month: string; revenue: number }[];
  }>({
    queryKey: ["/api/analytics/revenue-stats", { period }],
    queryFn: async ({ queryKey }) => {
      const [endpoint, params] = queryKey as [string, { period?: string }];
      const periodValue = params?.period || "monthly";
      
      // Fetch with period parameter
      const response = await fetch(`${endpoint}?period=${periodValue}`);
      if (!response.ok) {
        throw new Error("Failed to fetch revenue data");
      }
      return response.json();
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // If no data is available, show an error state
  if (!revenueData || (!revenueData.daily?.length && !revenueData.weekly?.length && !revenueData.monthly?.length)) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-gray-500">Revenue data could not be loaded</p>
        </CardContent>
      </Card>
    );
  }

  let chartData: any[] = revenueData.monthly || [];
  if (period === "weekly") chartData = revenueData.weekly || [];
  if (period === "daily") chartData = revenueData.daily || [];
  // For yearly view, aggregate monthly data
  if (period === "yearly" && revenueData.monthly?.length) {
    const yearlyData: Record<string, number> = {};
    
    revenueData.monthly.forEach(item => {
      if (item.month) {
        const year = item.month.split(' ')[1]; // Extract year from "Jan 2023" format
        if (!yearlyData[year]) {
          yearlyData[year] = 0;
        }
        yearlyData[year] += item.revenue;
      }
    });
    
    chartData = Object.entries(yearlyData).map(([year, revenue]) => ({
      year,
      revenue
    })).sort((a, b) => Number(a.year) - Number(b.year));
  }

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Sales Analytics</CardTitle>
          <CardDescription>
            View your sales performance over time
          </CardDescription>
        </div>
        <Tabs 
          defaultValue={defaultPeriod}
          value={period} 
          onValueChange={setPeriod}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {period === "monthly" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `$${value.toLocaleString()}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} 
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : period === "weekly" ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="week" 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `$${value.toLocaleString()}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} 
                  labelFormatter={(label) => `Week ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            ) : period === "yearly" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `$${value.toLocaleString()}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} 
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `$${value.toLocaleString()}`} 
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} 
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--chart-3))" 
                  fill="hsl(var(--chart-3))" 
                  fillOpacity={0.2} 
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
