import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown,
  Award,
  RefreshCcw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";

// Dashboard data type
interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockItems: any[];
  categoryDistribution: {category: string, count: number}[];
  recentOrders: any[];
}

// Top selling product type
interface TopSellingProduct {
  product: {
    id: number;
    name: string;
    price: number;
  };
  totalSold: number;
}

interface DashboardStatsProps {
  period?: string;
}

export default function DashboardStats({ period = "monthly" }: DashboardStatsProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [orderCountChanged, setOrderCountChanged] = useState(false);

  const { 
    data: dashboardData, 
    isLoading: isDataLoading,
    dataUpdatedAt: dashboardUpdatedAt
  } = useQuery<DashboardData>({
    queryKey: ["/api/analytics/dashboard-summary", { period }],
    queryFn: async ({ queryKey }) => {
      // Extract period from query key
      const [endpoint, params] = queryKey as [string, { period?: string }];
      const periodValue = params?.period || "monthly";
      
      // Fetch data with period parameter
      const response = await fetch(`${endpoint}?period=${periodValue}`);
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds (changed from 10 seconds)
    staleTime: 1000, // Consider data stale after 1 second
  });

  const { 
    data: topProducts, 
    isLoading: isTopProductsLoading,
    isError: isTopProductsError,
    dataUpdatedAt: topProductsUpdatedAt 
  } = useQuery<TopSellingProduct[]>({
    queryKey: ["/api/analytics/top-selling-products", { period }],
    queryFn: async ({ queryKey }) => {
      // Extract period from query key
      const [endpoint, params] = queryKey as [string, { period?: string }];
      const periodValue = params?.period || "monthly";
      
      // Fetch data with period parameter
      const response = await fetch(`${endpoint}?period=${periodValue}`);
      if (!response.ok) {
        throw new Error("Failed to fetch top selling products");
      }
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1
  });

  // Check if order count has changed
  useEffect(() => {
    if (dashboardData && prevOrderCount > 0 && dashboardData.totalOrders !== prevOrderCount) {
      setOrderCountChanged(true);
      
      // Reset the flag after 5 seconds
      const timer = setTimeout(() => {
        setOrderCountChanged(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    if (dashboardData?.totalOrders) {
      setPrevOrderCount(dashboardData.totalOrders);
    }
  }, [dashboardData?.totalOrders, prevOrderCount]);

  // Show refresh animation when data updates
  useEffect(() => {
    const latestUpdate = Math.max(dashboardUpdatedAt, topProductsUpdatedAt);
    
    if (lastUpdatedAt && latestUpdate > lastUpdatedAt) {
      setRefreshing(true);
      const timer = setTimeout(() => {
        setRefreshing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    setLastUpdatedAt(latestUpdate);
  }, [dashboardUpdatedAt, topProductsUpdatedAt, lastUpdatedAt]);

  // Calculate total units sold from top products
  const totalUnitsSold = !isTopProductsError && topProducts 
    ? topProducts.reduce((total, item) => total + item.totalSold, 0) 
    : 0;
  
  // Get top product name
  const topProductName = !isTopProductsError && topProducts && topProducts.length > 0 
    ? topProducts[0].product.name 
    : 'No sales data yet';

  // Get period-friendly label
  const getPeriodLabel = () => {
    switch(period) {
      case 'daily': return 'today';
      case 'yearly': return 'this year';
      case 'monthly':
      default: return 'this month';
    }
  };

  if (isDataLoading || isTopProductsLoading || !dashboardData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-10 w-1/3 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate stats from real data
  const statsData = [
    {
      title: `Revenue (${getPeriodLabel()})`,
      value: formatCurrency(dashboardData.totalRevenue || 0),
      change: 0, // Would need historical data for change calculation
      icon: DollarSign,
      iconBgColor: "bg-primary",
    },
    {
      title: `Orders (${getPeriodLabel()})`,
      value: dashboardData.totalOrders?.toString() || "0",
      change: 0,
      icon: ShoppingBag,
      iconBgColor: "bg-secondary",
    },
    {
      title: `Units Sold (${getPeriodLabel()})`,
      value: totalUnitsSold.toString(),
      change: 0,
      icon: Package,
      iconBgColor: "bg-accent",
    },
    {
      title: `Top Product (${getPeriodLabel()})`,
      value: topProductName,
      change: 0,
      icon: Award,
      iconBgColor: "bg-success",
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className={`
            ${refreshing ? "border-green-300 shadow-green-100 transition-colors duration-300" : ""}
            ${stat.title.includes("Orders") && orderCountChanged ? "border-indigo-400 shadow-indigo-100 animate-pulse" : ""}
          `}
        >
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <h3 className="text-base font-normal text-gray-500 flex items-center">
                  {stat.title}
                  {refreshing && (
                    <RefreshCcw className="ml-2 h-3 w-3 animate-spin text-green-500" />
                  )}
                  {stat.title.includes("Orders") && orderCountChanged && (
                    <Badge className="ml-2 bg-indigo-100 text-indigo-800 animate-pulse">New</Badge>
                  )}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-full ${stat.iconBgColor} bg-opacity-10 flex items-center justify-center`}>
                <stat.icon className={`${stat.iconBgColor} text-xl`} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              {stat.change > 0 ? (
                <span className="text-green-600 font-medium flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" /> {stat.change}%
                </span>
              ) : stat.change < 0 ? (
                <span className="text-red-600 font-medium flex items-center">
                  <ArrowDown className="h-4 w-4 mr-1" /> {Math.abs(stat.change)}%
                </span>
              ) : (
                <span className="text-gray-500">No change</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
