import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, enableRealTimeUpdates, disableRealTimeUpdates } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminSidebar from "@/components/admin/sidebar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  AlertTriangle, 
  Eye, 
  ArrowUpDown, 
  Loader2, 
  Calendar,
  DollarSign,
  CreditCard,
  Truck,
  RefreshCcw,
  Check,
  Bell
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

export default function AdminOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"id" | "createdAt" | "total">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [newOrderIds, setNewOrderIds] = useState<number[]>([]);
  const itemsPerPage = 10;

  // Fetch orders
  const { 
    data: orders, 
    isLoading: isOrdersLoading,
    isError,
    refetch,
    dataUpdatedAt
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Enable real-time updates when the component mounts
  useEffect(() => {
    enableRealTimeUpdates();
    
    // Listen for new order events
    const handleNewOrder = (event: Event) => {
      if (event instanceof MessageEvent) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order-created') {
            // Show notification
            toast({
              title: "New Order Received!",
              description: `Order #${data.order.id} for $${data.order.total.toFixed(2)}`,
            });
            
            // Add to new order IDs list
            setNewOrderIds(prev => [data.order.id, ...prev]);
            
            // Set refreshing state
            setRefreshing(true);
            
            // Fetch latest orders
            refetch();
            
            // Clear refreshing state and new order IDs after 10 seconds
            setTimeout(() => {
              setRefreshing(false);
              setNewOrderIds([]);
            }, 10000);
          }
        } catch (e) {
          console.error("Error processing SSE event", e);
        }
      }
    };

    // Setup event listener
    const eventSource = new EventSource('/api/events');
    eventSource.addEventListener('message', handleNewOrder);
    
    return () => {
      eventSource.removeEventListener('message', handleNewOrder);
      eventSource.close();
      disableRealTimeUpdates();
    };
  }, [toast, refetch]);

  // Display refresh animation when orders update
  useEffect(() => {
    if (orders && orders.length !== prevOrderCount && prevOrderCount !== 0) {
      setRefreshing(true);
      const timer = setTimeout(() => {
        setRefreshing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    
    if (orders) {
      setPrevOrderCount(orders.length);
    }
  }, [orders, dataUpdatedAt, prevOrderCount]);

  // Fetch order details with items
  const { 
    data: orderDetails, 
    isLoading: isOrderDetailsLoading 
  } = useQuery<OrderDetails>({
    queryKey: [`/api/orders/${currentOrderId}`],
    enabled: !!currentOrderId && isViewDialogOpen,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order updated",
        description: "The order status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/orders/${currentOrderId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search by order ID or customer
  };

  // Filter and sort orders
  const filteredOrders = orders?.filter(order => {
    // Apply search filter (by order ID or customer)
    const matchesSearch = !searchQuery || 
      order.id.toString().includes(searchQuery) ||
      order.userId.toString().includes(searchQuery);
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const factor = sortOrder === "asc" ? 1 : -1;
    
    switch (sortField) {
      case "id":
        return (a.id - b.id) * factor;
      case "total":
        return (a.total - b.total) * factor;
      case "createdAt":
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * factor;
      default:
        return 0;
    }
  });

  // Paginate orders
  const pageCount = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sort order
  const toggleSort = (field: "id" | "createdAt" | "total") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  // Handle view order
  const handleViewOrder = (orderId: number) => {
    setCurrentOrderId(orderId);
    setIsViewDialogOpen(true);
  };

  // Handle status update
  const handleUpdateStatus = (status: string) => {
    if (currentOrderId) {
      updateOrderStatusMutation.mutate({ id: currentOrderId, status });
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string, text: string }> = {
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'processing': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'shipped': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800' }
    };

    const { bg, text } = statusColors[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <Badge variant="outline" className={`${bg} ${text} border-none`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusColors: Record<string, { bg: string, text: string }> = {
      'pending': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'paid': { bg: 'bg-green-100', text: 'text-green-800' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800' },
      'refunded': { bg: 'bg-yellow-100', text: 'text-yellow-800' }
    };

    const { bg, text } = statusColors[status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <Badge variant="outline" className={`${bg} ${text} border-none`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                Order Management
                {refreshing && (
                  <RefreshCcw className="ml-2 h-5 w-5 animate-spin text-blue-500" />
                )}
                {newOrderIds.length > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse flex items-center">
                    <Bell className="h-3 w-3 mr-1" />
                    {newOrderIds.length} new
                  </Badge>
                )}
              </h1>
              <p className="text-gray-600">View and manage customer orders</p>
            </div>
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

          <Card className={`mb-6 ${refreshing ? "border-green-300 shadow-green-100 transition-all duration-300" : ""}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <form onSubmit={handleSearch} className="relative flex w-full md:w-1/3">
                  <Input
                    type="text"
                    placeholder="Search by order ID or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                  <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>

                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => refetch()}
                    className={refreshing ? "text-green-500" : ""}
                  >
                    <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardContent className="p-0">
              {isOrdersLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : isError ? (
                <div className="p-6 text-center">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Failed to load orders</h3>
                  <p className="text-gray-500 mb-4">There was an error loading the orders.</p>
                  <Button onClick={() => refetch()}>Try Again</Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[90px]">
                          <div className="flex items-center cursor-pointer" onClick={() => toggleSort("id")}>
                            Order ID
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead className="w-[180px]">
                          <div className="flex items-center cursor-pointer" onClick={() => toggleSort("createdAt")}>
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>
                          <div className="flex items-center cursor-pointer" onClick={() => toggleSort("total")}>
                            Total
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </div>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6">
                            <p className="text-gray-500">No orders found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            className={newOrderIds.includes(order.id) ? "bg-blue-50 animate-pulse" : ""}
                          >
                            <TableCell className="font-medium">
                              #{order.id.toString().padStart(4, '0')}
                              {newOrderIds.includes(order.id) && (
                                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-none">New</Badge>
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                            <TableCell>
                              {order.items && order.items.length > 0 ? (
                                <div className="flex items-center">
                                  {order.items[0].product ? (
                                    <>
                                      <span className="truncate max-w-[150px]">{order.items[0].product.name}</span>
                                      {order.items.length > 1 && (
                                        <Badge variant="outline" className="ml-2 text-xs">+{order.items.length - 1} more</Badge>
                                      )}
                                    </>
                                  ) : (
                                    `Product #${order.items[0].productId}`
                                  )}
                                </div>
                              ) : (
                                "Customer #" + order.userId
                              )}
                            </TableCell>
                            <TableCell>${order.total.toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell className="capitalize">{order.paymentMethod}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrder(order.id)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {/* Pagination */}
            {pageCount > 1 && (
              <div className="p-4 flex items-center justify-between border-t">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, sortedOrders.length)} of{" "}
                  {sortedOrders.length} orders
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pageCount))}
                    disabled={currentPage === pageCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Order Details Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Order Details #{currentOrderId?.toString().padStart(4, '0')}
                </DialogTitle>
                <DialogDescription>
                  View order information and update status.
                </DialogDescription>
              </DialogHeader>
              
              {isOrderDetailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : !orderDetails ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Order not found</h3>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Order Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Order Date:</span>
                          <span className="font-medium">{formatDate(orderDetails.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customer ID:</span>
                          <span className="font-medium">#{orderDetails.userId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Method:</span>
                          <span className="font-medium capitalize">{orderDetails.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shipping Address:</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-gray-700 text-xs whitespace-pre-line">
                          {orderDetails.shippingAddress}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Status Management</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Order Status:</span>
                            {getStatusBadge(orderDetails.status)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Payment Status:</span>
                            {getPaymentStatusBadge(orderDetails.paymentStatus)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Update Order Status:</label>
                          <Select
                            defaultValue={orderDetails.status}
                            onValueChange={handleUpdateStatus}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {updateOrderStatusMutation.isPending && (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Updating status...</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Order Items */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderDetails.items?.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  {item.product ? (
                                    <>
                                      <div className="h-8 w-8 mr-2 rounded overflow-hidden">
                                        <img 
                                          src={item.product.imageUrl} 
                                          alt={item.product.name}
                                          className="h-full w-full object-cover"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                                          }}
                                        />
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="font-medium text-sm">{item.product.name}</span>
                                        <span className="text-xs text-gray-500">SKU: {item.product.sku}</span>
                                      </div>
                                    </>
                                  ) : (
                                    <span>Product #{item.productId}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>${item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Order Summary */}
                      <div className="mt-4 space-y-2 border-t pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal:</span>
                          <span>${orderDetails.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Shipping:</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Tax:</span>
                          <span>Included</span>
                        </div>
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span>Total:</span>
                          <span>${orderDetails.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Order Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex">
                          <div className="mr-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary bg-opacity-10">
                              <Calendar className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Order Placed</p>
                            <p className="text-sm text-gray-500">{formatDate(orderDetails.createdAt)}</p>
                          </div>
                        </div>

                        <div className="flex">
                          <div className="mr-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                              <DollarSign className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium">Payment {orderDetails.paymentStatus === 'paid' ? 'Completed' : 'Pending'}</p>
                            <p className="text-sm text-gray-500">via {orderDetails.paymentMethod}</p>
                          </div>
                        </div>

                        {orderDetails.status !== 'pending' && orderDetails.status !== 'cancelled' && (
                          <div className="flex">
                            <div className="mr-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                                <CreditCard className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">Order Processing</p>
                              <p className="text-sm text-gray-500">Items are being prepared</p>
                            </div>
                          </div>
                        )}

                        {(orderDetails.status === 'shipped' || orderDetails.status === 'delivered') && (
                          <div className="flex">
                            <div className="mr-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                                <Truck className="h-5 w-5 text-yellow-600" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">Order Shipped</p>
                              <p className="text-sm text-gray-500">On its way to customer</p>
                            </div>
                          </div>
                        )}

                        {orderDetails.status === 'delivered' && (
                          <div className="flex">
                            <div className="mr-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                <Check className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                            <div>
                              <p className="font-medium">Order Delivered</p>
                              <p className="text-sm text-gray-500">Successfully delivered to customer</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
