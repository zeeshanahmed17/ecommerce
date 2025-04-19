import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  CreditCard, 
  Smartphone, 
  Wallet,
  AlertTriangle
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

// Define interfaces for payment method data
interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
  amountPercentage: number;
}

interface PaymentMethodsProps {
  period?: string;
}

export default function PaymentMethods({ period = "monthly" }: PaymentMethodsProps) {
  // Fetch payment method data from API
  const { 
    data: paymentData, 
    isLoading, 
    isError 
  } = useQuery<PaymentMethodData[]>({
    queryKey: ["/api/analytics/payment-method-distribution", { period }],
    queryFn: async ({ queryKey }) => {
      // Extract period from query key
      const [endpoint, params] = queryKey as [string, { period?: string }];
      const periodValue = params?.period || "monthly";
      
      // Fetch data with period parameter
      const response = await fetch(`${endpoint}?period=${periodValue}`);
      if (!response.ok) {
        throw new Error("Failed to fetch payment method data");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get icon based on payment method
  const getIconForMethod = (method: string) => {
    const methodLower = method.toLowerCase();
    if (methodLower.includes('card')) {
      return { icon: CreditCard, bgColor: "bg-primary", description: "Visa, Mastercard, Amex" };
    } else if (methodLower.includes('upi')) {
      return { icon: Smartphone, bgColor: "bg-secondary", description: "Google Pay, PhonePe, Paytm" };
    } else if (methodLower.includes('wallet') || methodLower.includes('paypal') || methodLower.includes('apple')) {
      return { icon: Wallet, bgColor: "bg-accent", description: "PayPal, Apple Pay, etc." };
    } else {
      return { icon: Wallet, bgColor: "bg-gray-500", description: "Other payment methods" };
    }
  };

  // Format payment method display name
  const formatMethodName = (method: string) => {
    // Convert snake_case or camelCase to Title Case
    return method
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Convert camelCase to spaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get time period label
  const getPeriodLabel = () => {
    switch(period) {
      case 'daily': return 'Today';
      case 'yearly': return 'This Year';
      case 'monthly':
      default: return 'This Month';
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Overview</CardTitle>
          <CardDescription>Summary of payment methods used by customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[150px] w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (isError || !paymentData || paymentData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Overview</CardTitle>
          <CardDescription>Summary of payment methods used by customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mb-4" />
            <p className="text-gray-500 mb-2">No payment data available</p>
            <p className="text-sm text-gray-400">Complete some orders to see payment statistics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Methods Overview</CardTitle>
          <CardDescription>
            Summary of payment methods used ({getPeriodLabel()})
          </CardDescription>
        </div>
        <Link href="/admin/payments">
          <span className="text-sm font-medium text-primary hover:text-indigo-700 cursor-pointer">
            Configure Payments
          </span>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentData.map((item, index) => {
            const { icon: Icon, bgColor, description } = getIconForMethod(item.method);
            
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 mr-3 ${bgColor} bg-opacity-10 p-2 rounded-full`}>
                    <Icon className={`h-5 w-5 ${bgColor} bg-opacity-100`} />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-gray-900">{formatMethodName(item.method)}</h4>
                    <p className="text-sm text-gray-500">{description}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Revenue</span>
                  <span className="font-medium">{formatCurrency(item.amount)}</span>
                </div>
                <div className="mt-1">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${bgColor} rounded-full h-2`} 
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 flex justify-between">
                    <span>{item.percentage.toFixed(1)}% of orders</span>
                    <span>{item.count} orders</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
