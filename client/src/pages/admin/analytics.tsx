import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertTriangle } from "lucide-react";
import TopSellingProducts from "@/components/admin/top-selling-products";
import PaymentMethods from "@/components/admin/payment-methods";
import { getQueryFn } from "@/lib/queryClient";

// Define types for the data
interface RevenueItem {
  revenue: number;
  date?: string;
  week?: number;
  year?: number;
  month?: string;
}

interface RevenueData {
  daily: RevenueItem[];
  weekly: RevenueItem[];
  monthly: RevenueItem[];
}

interface CategoryData {
  category: string;
  count: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  // Add other fields as needed
}

interface Product {
  id: number;
  name: string;
  inventory: number;
  // Add other fields as needed
}

export default function AdminAnalytics() {
  const { user, isLoading: authLoading } = useAuth();
  const [timePeriod, setTimePeriod] = useState("monthly");
  
  // Fetch revenue data
  const { 
    data: revenueData, 
    isLoading: isRevenueLoading,
    isError: isRevenueError
  } = useQuery<RevenueData>({
    queryKey: ["/api/analytics/revenue-stats"],
    queryFn: getQueryFn(),
  });

  // Fetch category distribution
  const { 
    data: categoryData, 
    isLoading: isCategoryLoading,
    isError: isCategoryError
  } = useQuery<CategoryData[]>({
    queryKey: ["/api/analytics/category-distribution"],
    queryFn: getQueryFn(),
  });

  // Fetch recent orders for dashboard metrics
  const { 
    data: recentOrders, 
    isLoading: isOrdersLoading,
    isError: isOrdersError
  } = useQuery<Order[]>({
    queryKey: ["/api/analytics/recent-orders"],
    queryFn: getQueryFn(),
  });

  // Fetch low stock products for inventory analysis
  const { 
    data: lowStockProducts, 
    isLoading: isProductsLoading,
    isError: isProductsError
  } = useQuery<Product[]>({
    queryKey: ["/api/analytics/low-stock-products"],
    queryFn: getQueryFn(),
  });

  // Get chart data based on selected time period
  const getChartData = (): RevenueItem[] => {
    if (!revenueData) return [];
    
    switch(timePeriod) {
      case "daily": return revenueData.daily || [];
      case "weekly": return revenueData.weekly || [];
      case "monthly": return revenueData.monthly || [];
      default: return revenueData.monthly || [];
    }
  };

  // Calculate total revenue
  const calculateTotalRevenue = (): number => {
    const data = getChartData();
    return data.reduce((total: number, item: RevenueItem) => total + item.revenue, 0);
  };

  // Calculate average order value
  const calculateAverageOrderValue = (): number => {
    if (!recentOrders || recentOrders.length === 0) return 0;
    
    const totalValue = recentOrders.reduce((sum: number, order: Order) => sum + order.total, 0);
    return totalValue / recentOrders.length;
  };

  // Calculate revenue growth
  const calculateRevenueGrowth = (): number => {
    const data = getChartData();
    if (data.length < 2) return 0;
    
    const currentRevenue = data[data.length - 1].revenue;
    const previousRevenue = data[data.length - 2].revenue;
    
    if (previousRevenue === 0) return 100;
    
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  };

  // PIECHAR COLORS
  const COLORS = [
    '#4F46E5', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', 
    '#3B82F6', '#EF4444', '#14B8A6', '#A855F7', '#F97316'
  ];

  // If not admin, redirect to home
  if (!authLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your store's performance with detailed analytics and insights.</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {isRevenueLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : isRevenueError ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <>
                    <div className="text-2xl font-bold">${calculateTotalRevenue().toLocaleString()}</div>
                    <p className={`text-xs flex items-center ${calculateRevenueGrowth() >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <span>{calculateRevenueGrowth() >= 0 ? '↑' : '↓'}</span>
                      <span className="ml-1">{Math.abs(calculateRevenueGrowth()).toFixed(1)}% from previous {timePeriod.slice(0, -2)}</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Orders Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : isOrdersError ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{recentOrders?.length || 0}</div>
                    <p className="text-xs text-green-500 flex items-center">
                      <span>↑</span>
                      <span className="ml-1">12.3% from last month</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Average Order Value */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                {isOrdersLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : isOrdersError ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <>
                    <div className="text-2xl font-bold">${calculateAverageOrderValue().toFixed(2)}</div>
                    <p className="text-xs text-green-500 flex items-center">
                      <span>↑</span>
                      <span className="ml-1">3.2% from last month</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Inventory Health */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                {isProductsLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : isProductsError ? (
                  <p className="text-red-500">Error loading data</p>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{lowStockProducts?.length || 0}</div>
                    <p className="text-xs text-yellow-500 flex items-center">
                      <span>⚠</span>
                      <span className="ml-1">Need attention</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                  Track your revenue performance over time
                </CardDescription>
              </div>
              <Tabs 
                defaultValue="monthly" 
                value={timePeriod} 
                onValueChange={setTimePeriod}
                className="w-[400px]"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isRevenueLoading ? (
                <div className="h-[350px] w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : isRevenueError ? (
                <div className="h-[350px] flex items-center justify-center">
                  <div className="text-center">
                    <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Failed to load revenue data</h3>
                  </div>
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {timePeriod === "monthly" ? (
                      <BarChart data={getChartData()}>
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
                    ) : timePeriod === "weekly" ? (
                      <LineChart data={getChartData()}>
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
                          labelFormatter={(label) => `${label}`}
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
                    ) : (
                      <AreaChart data={getChartData()}>
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
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Categories Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Product Categories</CardTitle>
                <CardDescription>Distribution of products by category</CardDescription>
              </CardHeader>
              <CardContent>
                {isCategoryLoading ? (
                  <div className="h-[300px]">
                    <Skeleton className="h-full w-full rounded-full" />
                  </div>
                ) : isCategoryError ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">Failed to load category data</h3>
                    </div>
                  </div>
                ) : !categoryData || categoryData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-gray-500">No category data available</p>
                  </div>
                ) : (
                  <div className="h-[300px] flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="category"
                        >
                          {categoryData.map((entry: CategoryData, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value} products`, "Count"]}
                          labelFormatter={(label) => `Category: ${label}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <TopSellingProducts />

            {/* Payment Methods Distribution */}
            <PaymentMethods />

            {/* Customer Acquisition */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>New customer registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: 'Jan', customers: 38 },
                        { month: 'Feb', customers: 52 },
                        { month: 'Mar', customers: 61 },
                        { month: 'Apr', customers: 85 },
                        { month: 'May', customers: 95 },
                        { month: 'Jun', customers: 120 },
                        { month: 'Jul', customers: 156 },
                        { month: 'Aug', customers: 175 },
                        { month: 'Sep', customers: 190 },
                        { month: 'Oct', customers: 210 },
                        { month: 'Nov', customers: 250 },
                        { month: 'Dec', customers: 270 }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="customers" 
                        stroke="hsl(var(--chart-5))" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sales by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Distribution of orders by current status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: 10 },
                          { name: 'Processing', value: 25 },
                          { name: 'Shipped', value: 15 },
                          { name: 'Delivered', value: 45 },
                          { name: 'Cancelled', value: 5 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#3B82F6" /> {/* Blue - Pending */}
                        <Cell fill="#8B5CF6" /> {/* Purple - Processing */}
                        <Cell fill="#F59E0B" /> {/* Yellow - Shipped */}
                        <Cell fill="#10B981" /> {/* Green - Delivered */}
                        <Cell fill="#EF4444" /> {/* Red - Cancelled */}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, "Percentage"]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
