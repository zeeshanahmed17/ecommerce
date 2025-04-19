import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import AdminSidebar from "@/components/admin/sidebar";
import DashboardStats from "@/components/admin/dashboard-stats";
import SalesChart from "@/components/admin/sales-chart";
import RecentOrders from "@/components/admin/recent-orders";
import LowStock from "@/components/admin/low-stock";
import PaymentMethods from "@/components/admin/payment-methods";
import DataExport from "@/components/admin/data-export";
import { enableRealTimeUpdates, disableRealTimeUpdates } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Bell } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [updating, setUpdating] = useState(false);
  const [newOrder, setNewOrder] = useState(false);
  const queryClient = useQueryClient();

  // Listen for new order events
  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order-created') {
            // Show notification and highlight new order indicator
            toast.success("New order received!", {
              description: `Order #${data.order.id} for $${data.order.total.toFixed(2)}`,
            });
            
            // Set new order state to true to trigger animation
            setNewOrder(true);
            
            // Reset after 10 seconds
            setTimeout(() => setNewOrder(false), 10000);
            
            // Trigger a refresh
            refreshData();
          }
        } catch (e) {
          console.error("Error parsing SSE event", e);
        }
      }
    };

    // Add event listener
    const eventSource = new EventSource('/api/events');
    eventSource.addEventListener('message', handleNewOrder);

    return () => {
      eventSource.removeEventListener('message', handleNewOrder);
      eventSource.close();
    };
  }, []);

  // Function to refresh all dashboard data
  const refreshData = useCallback(() => {
    setUpdating(true);
    
    // Invalidate all queries
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/revenue-stats"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/top-selling-products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/recent-orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock-products"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/payment-method-distribution"] });
    
    // Update last refresh time
    setLastUpdate(new Date());
    
    // Reset updating state after animation
    setTimeout(() => setUpdating(false), 1000);
  }, [queryClient]);

  // Enable real-time updates when the component mounts
  useEffect(() => {
    // Enable real-time updates for admin dashboard
    enableRealTimeUpdates();
    
    // Set up refresh timer for 30 seconds
    const refreshTimer = setInterval(() => {
      refreshData();
    }, 30000);
    
    // Clean up when the component unmounts
    return () => {
      clearInterval(refreshTimer);
      disableRealTimeUpdates();
    };
  }, [refreshData]);

  // If not admin, redirect to home
  if (!isLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600">Welcome to your store management dashboard. Here's a summary of your business performance.</p>
            </div>
            <div className="flex items-center gap-4">
              <Tabs 
                defaultValue="monthly" 
                value={timePeriod} 
                onValueChange={setTimePeriod}
                className="w-[320px]"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                {newOrder && (
                  <div className="relative animate-bounce">
                    <Bell className="h-5 w-5 text-red-500" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                  </div>
                )}
                
                <button 
                  onClick={refreshData}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  title="Refresh dashboard data"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-600 ${updating ? 'animate-spin' : ''}`} />
                </button>
                
                <Badge variant="secondary" className="py-1.5">
                  <span className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Real-time updates active
                  </span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <DashboardStats period={timePeriod} />

          {/* Sales Chart */}
          <SalesChart defaultPeriod={timePeriod} />

          {/* Recent Orders and Inventory Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RecentOrders period={timePeriod} />
            <LowStock />
          </div>

          {/* Payment Methods Section */}
          <PaymentMethods period={timePeriod} />
          
          {/* Data Management Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Administration</h2>
            <DataExport />
          </div>
        </div>
      </div>
    </div>
  );
}
