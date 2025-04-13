import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@shared/schema";
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
  Truck
} from "lucide-react";

export default function AdminOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<"id" | "createdAt" | "total">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders
  const { 
    data: orders, 
    isLoading: isOrdersLoading,
    isError,
    refetch
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  // Fetch order details with items
  const { 
    data: orderDetails, 
    isLoading: isOrderDetailsLoading 
  } = useQuery({
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
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders, update statuses, and process payments.</p>
          </div>

          <Card className="mb-6">
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
                  <Button type="submit" variant="ghost" size="sm" className="absolute right-0 top-0 h-full">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
                
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Statuses" />
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
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id.toString().padStart(4, '0')}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                            <TableCell>Customer #{order.userId}</TableCell>
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
                            <TableHead>Product ID</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderDetails.items?.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productId}</TableCell>
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
