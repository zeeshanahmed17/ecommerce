import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { enableRealTimeUpdates, disableRealTimeUpdates } from "@/lib/queryClient";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Eye, 
  Loader2, 
  Calendar,
  Package,
  Box,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";

// Define order details type
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

interface Order {
  id: number;
  userId: number;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  createdAt: Date | string;
  items?: OrderItem[];
}

interface OrderDetails extends Order {
  items: OrderItem[];
}

export default function MyOrders() {
  const { user, isLoading: authLoading } = useAuth();
  
  // UI state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch orders
  const { 
    data: orders, 
    isLoading: isOrdersLoading,
    isError,
    refetch
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Enable real-time updates when the component mounts
  useEffect(() => {
    enableRealTimeUpdates();
    
    // Listen for updates to orders
    const handleOrderUpdate = (event: Event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order-created' || data.type === 'order-updated') {
            // Refresh orders
            refetch();
          }
        } catch (e) {
          console.error("Error processing SSE event", e);
        }
      }
    };

    // Setup event listener
    const eventSource = new EventSource('/api/events');
    eventSource.addEventListener('message', handleOrderUpdate);
    
    return () => {
      eventSource.removeEventListener('message', handleOrderUpdate);
      eventSource.close();
      disableRealTimeUpdates();
    };
  }, [refetch]);

  // Fetch order details with items
  const { 
    data: orderDetails, 
    isLoading: isOrderDetailsLoading 
  } = useQuery<OrderDetails>({
    queryKey: [`/api/orders/${currentOrderId}`],
    enabled: !!currentOrderId && isViewDialogOpen,
  });

  // Filter orders by status
  const filteredOrders = orders?.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return ['pending', 'processing', 'shipped'].includes(order.status);
    if (activeTab === 'completed') return order.status === 'delivered';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  const handleViewOrder = (orderId: number) => {
    setCurrentOrderId(orderId);
    setIsViewDialogOpen(true);
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800 flex items-center">
          <Package className="mr-1 h-3 w-3" />
          Delivered
        </Badge>;
      case 'shipped':
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
          <Box className="mr-1 h-3 w-3" />
          In Transit
        </Badge>;
      case 'processing':
        return <Badge className="bg-purple-100 text-purple-800 flex items-center">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Processing
        </Badge>;
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center">
          <Calendar className="mr-1 h-3 w-3" />
          Pending
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 flex items-center">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 flex items-center">
          {status}
        </Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={`${statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'} border-none`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().then(() => {
      setTimeout(() => setRefreshing(false), 500);
    });
  };

  // If not logged in, redirect to auth page
  if (!authLoading && !user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-gray-500">View and track your orders</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing || isOrdersLoading}
          className="flex items-center"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {activeTab === 'all' && 'All your previous orders'}
            {activeTab === 'active' && 'Orders that are being processed or shipped'}
            {activeTab === 'completed' && 'Orders that have been delivered'}
            {activeTab === 'cancelled' && 'Orders that were cancelled'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isOrdersLoading ? (
            // Loading state
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            // Error state
            <div className="text-center py-10">
              <p className="text-red-500 mb-4">Failed to load your orders</p>
              <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            // Orders table
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>${order.total.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            // Empty state
            <div className="text-center py-10">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
              <p className="mt-2 text-gray-500">
                {activeTab === 'all' 
                  ? "You haven't placed any orders yet." 
                  : `You don't have any ${activeTab} orders.`}
              </p>
              {activeTab !== 'all' && (
                <Button 
                  variant="link" 
                  onClick={() => setActiveTab('all')}
                  className="mt-4"
                >
                  View all orders
                </Button>
              )}
              <div className="mt-6">
                <Button onClick={() => window.location.href = '/shop'}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {currentOrderId && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{currentOrderId}</DialogTitle>
              <DialogDescription>
                {orderDetails && formatDate(orderDetails.createdAt)}
              </DialogDescription>
            </DialogHeader>

            {isOrderDetailsLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Order Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Order Status</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(orderDetails.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last Updated: {formatDate(orderDetails.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Items</h3>
                  <div className="space-y-4">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                          {item.product?.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.product?.name || "Unknown Product"}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          {item.product && (
                            <p className="text-xs text-gray-500">
                              {item.product.category}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-2">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>${calculateTotal(orderDetails.items).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax</span>
                      <span>${(orderDetails.total - calculateTotal(orderDetails.items)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total</span>
                      <span>${orderDetails.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-2">Shipping Address</h3>
                  <p className="text-gray-600">
                    {orderDetails.shippingAddress || "No shipping address provided"}
                  </p>
                </div>

                {/* Payment Information */}
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-700 mb-2">Payment Information</h3>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Method</span>
                    <span className="capitalize">{orderDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">Payment Status</span>
                    <span>{getPaymentStatusBadge(orderDetails.paymentStatus)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Order details not found</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 