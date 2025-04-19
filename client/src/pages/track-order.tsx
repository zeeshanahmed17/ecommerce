import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, PackageOpen, AlertTriangle, Check } from "lucide-react";
import { Link } from "wouter";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<null | {
    status: "success" | "error";
    message: string;
    orderDetails?: {
      id: number;
      status: string;
      createdAt: string;
      updatedAt: string;
      shippingInfo: {
        carrier: string;
        trackingNumber: string;
        estimatedDelivery: string;
      };
      statusHistory: {
        status: string;
        date: string;
        location?: string;
      }[];
    }
  }>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call with mock data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (orderNumber === "12345" && email.toLowerCase() === "test@example.com") {
      setTrackingResult({
        status: "success",
        message: "Order found",
        orderDetails: {
          id: 12345,
          status: "shipped",
          createdAt: "2023-06-15T10:30:00Z",
          updatedAt: "2023-06-16T14:45:00Z",
          shippingInfo: {
            carrier: "FedEx",
            trackingNumber: "FEDEX12345678901",
            estimatedDelivery: "2023-06-20"
          },
          statusHistory: [
            {
              status: "ordered",
              date: "2023-06-15T10:30:00Z"
            },
            {
              status: "processing",
              date: "2023-06-15T14:20:00Z"
            },
            {
              status: "shipped",
              date: "2023-06-16T14:45:00Z",
              location: "Distribution Center"
            },
            {
              status: "in transit",
              date: "2023-06-17T08:30:00Z",
              location: "Regional Sorting Facility"
            }
          ]
        }
      });
    } else {
      setTrackingResult({
        status: "error",
        message: "We couldn't find an order matching the information provided. Please check your order number and email address."
      });
    }
    
    setIsLoading(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status icon based on status
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'shipped':
      case 'in transit':
        return <PackageOpen className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold text-center mb-2">Track Your Order</h1>
      <p className="text-gray-500 text-center mb-8">
        Enter your order number and email to check the status of your order.
      </p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
          <CardDescription>
            Please provide your order number and the email address used for the order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g., 12345"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Tracking...
                </>
              ) : "Track Order"}
            </Button>
            
            <p className="text-sm text-gray-500 text-center">
              For demo purposes, try order #12345 with email test@example.com
            </p>
          </form>
        </CardContent>
      </Card>
      
      {trackingResult && (
        <div className="space-y-6">
          {trackingResult.status === "error" ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Order Not Found</AlertTitle>
              <AlertDescription>
                {trackingResult.message}
              </AlertDescription>
            </Alert>
          ) : trackingResult.orderDetails ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order #{trackingResult.orderDetails.id}</CardTitle>
                  <CardDescription>
                    Ordered on {formatDate(trackingResult.orderDetails.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Current Status</h3>
                      <p className="text-lg font-semibold capitalize">{trackingResult.orderDetails.status}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Estimated Delivery</h3>
                      <p className="text-lg font-semibold">{new Date(trackingResult.orderDetails.shippingInfo.estimatedDelivery).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p><span className="font-medium">Carrier:</span> {trackingResult.orderDetails.shippingInfo.carrier}</p>
                      <p className="mt-1">
                        <span className="font-medium">Tracking Number:</span>{" "}
                        <a 
                          href={`https://www.google.com/search?q=${trackingResult.orderDetails.shippingInfo.carrier}+${trackingResult.orderDetails.shippingInfo.trackingNumber}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {trackingResult.orderDetails.shippingInfo.trackingNumber}
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Tracking History</h3>
                    <div className="border rounded-md">
                      <ul className="divide-y">
                        {trackingResult.orderDetails.statusHistory.map((event, i) => (
                          <li key={i} className="p-4 flex items-start">
                            <div className="mr-3 pt-1">
                              {getStatusIcon(event.status)}
                            </div>
                            <div>
                              <p className="font-medium capitalize">{event.status}</p>
                              <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                              {event.location && (
                                <p className="text-sm text-gray-500">{event.location}</p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-center">
                <Link href="/my-orders">
                  <Button variant="outline">View All Orders</Button>
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 