import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon, RefreshCcw } from "lucide-react";
import { Link } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

// Order type
interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
}

// Order item type
interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  product?: {
    id: number;
    name: string;
    imageUrl: string;
    sku: string;
    category: string;
  } | null;
}

interface RecentOrdersProps {
  period?: string;
}

export default function RecentOrders({ period = "monthly" }: RecentOrdersProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [newOrderIds, setNewOrderIds] = useState<number[]>([]);

  const { 
    data: orders, 
    isLoading, 
    refetch, 
    dataUpdatedAt 
  } = useQuery<Order[]>({
    queryKey: ["/api/analytics/recent-orders", { period }],
    queryFn: async ({ queryKey }) => {
      // Extract period from query key
      const [endpoint, params] = queryKey as [string, { period?: string }];
      const periodValue = params?.period || "monthly";
      
      // Fetch data with period parameter
      const response = await fetch(`${endpoint}?period=${periodValue}`);
      if (!response.ok) {
        throw new Error("Failed to fetch recent orders");
      }
      return response.json();
    },
  });

  // Listen for new order events via SSE
  useEffect(() => {
    const handleNewOrder = (event: Event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order-created') {
            setRefreshing(true);
            setNewOrderIds(prev => [data.order.id, ...prev]);
            
            // Ensure both queries are refreshed
            refetch();
            
            // Invalidate both queries to ensure they're fully refreshed
            queryClient.invalidateQueries({ queryKey: ["/api/analytics/recent-orders"] });
            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
            
            // Clear highlighting after 10 seconds
            setTimeout(() => {
              setRefreshing(false);
              setNewOrderIds([]);
            }, 10000);
          }
        } catch (e) {
          console.error("Error parsing SSE event", e);
        }
      }
    };

    // Setup event listener
    try {
      const eventSource = new EventSource('/api/events');
      eventSource.addEventListener('message', handleNewOrder);
      
      return () => {
        eventSource.removeEventListener('message', handleNewOrder);
        eventSource.close();
      };
    } catch (error) {
      console.error("Could not connect to event source", error);
      return () => {};
    }
  }, [refetch]);

  // Display refresh animation when new data is fetched
  useEffect(() => {
    if (orders && prevOrderCount > 0) {
      // Calculate if there are any new orders
      const currentCount = orders.length;
      if (currentCount > prevOrderCount) {
        setNewOrderCount(currentCount - prevOrderCount);
        setRefreshing(true);
        
        // Add sound notification for new orders (optional)
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
          console.log('Audio notification not supported');
        }
        
        // Clear highlighting after 5 seconds
        const timer = setTimeout(() => {
          setRefreshing(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
    
    if (orders) {
      setPrevOrderCount(orders.length);
    }
  }, [orders, dataUpdatedAt, prevOrderCount]);
  
  // Reset new order count when user manually refreshes
  const handleManualRefresh = () => {
    setNewOrderCount(0);
    refetch();
    
    // Also refetch detailed orders
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  };

  // Fetch detailed order information for each order
  const { data: detailedOrders, isLoading: isDetailedLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders", { period }],
    queryFn: async ({ queryKey }) => {
      // Extract period from query key
      const [endpoint, params] = queryKey as [string, { period?: string }];
      const periodValue = params?.period || "monthly";
      
      // Fetch data with period parameter
      const response = await fetch(`${endpoint}?period=${periodValue}`);
      if (!response.ok) {
        throw new Error("Failed to fetch detailed orders");
      }
      return response.json();
    },
    enabled: !isLoading && orders !== undefined && orders.length > 0,
  });

  // Get period-friendly label
  const getPeriodLabel = () => {
    switch(period) {
      case 'daily': return 'today';
      case 'yearly': return 'this year';
      case 'monthly':
      default: return 'this month';
    }
  };

  // Combine orders with detailed information
  const ordersWithDetails = orders?.map(order => {
    const detailedOrder = detailedOrders?.find(o => o.id === order.id);
    return {
      ...order,
      items: detailedOrder?.items || []
    };
  });

  const getProductNames = (order: Order) => {
    // For newly created orders that might not have product details yet
    if (newOrderIds.includes(order.id)) {
      return (
        <div className="flex items-center">
          <span className="text-blue-600">Order processing...</span>
          <RefreshCcw className="ml-2 h-3 w-3 animate-spin text-blue-500" />
        </div>
      );
    }
    
    if (!order.items || order.items.length === 0) return "No products";
    
    const products = order.items
      .filter(item => item.product)
      .map(item => `${item.product?.name} (${item.quantity})`);
    
    if (products.length === 0) return "Unknown products";
    
    // If there are many products, show only first with count
    if (products.length > 1) {
      return (
        <div className="flex items-center">
          <span className="truncate max-w-[180px]">{products[0]}</span>
          <Badge variant="outline" className="ml-2 text-xs">+{products.length - 1} more</Badge>
        </div>
      );
    }
    
    return products[0];
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'delivered': 'bg-green-100 text-green-800',
      'shipped': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-purple-100 text-purple-800',
      'pending': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'} border-none`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-8 w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={refreshing ? "border-green-300 shadow-green-100" : ""}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            Recent Orders {period !== "monthly" && `(${getPeriodLabel()})`}
            {refreshing && (
              <RefreshCcw className="ml-2 h-4 w-4 animate-spin text-green-500" />
            )}
            {newOrderCount > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                +{newOrderCount} new
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Latest orders from your customers</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="text-sm text-gray-500 hover:text-primary"
            onClick={handleManualRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <Link href="/admin/orders">
            <span className="text-sm font-medium text-primary hover:text-indigo-700 cursor-pointer flex items-center">
              View All
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </span>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {!ordersWithDetails || ordersWithDetails.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No orders found {period !== "monthly" && `${getPeriodLabel()}`}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersWithDetails.map((order) => (
                <TableRow 
                  key={order.id}
                  className={newOrderIds.includes(order.id) ? "bg-green-50 animate-pulse" : ""}
                >
                  <TableCell className="font-medium">
                    #{order.id.toString().padStart(4, '0')}
                    {newOrderIds.includes(order.id) && (
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-none">New</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {isDetailedLoading ? (
                      <Skeleton className="h-5 w-28" />
                    ) : (
                      getProductNames(order)
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
