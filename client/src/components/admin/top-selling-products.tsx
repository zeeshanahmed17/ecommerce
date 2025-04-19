import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

// Define types
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number;
  sku: string;
}

interface TopSellingProduct {
  product: Product;
  totalSold: number;
}

export default function TopSellingProducts() {
  const { 
    data: topProducts, 
    isLoading, 
    isError
  } = useQuery<TopSellingProduct[]>({
    queryKey: ["/api/analytics/top-selling-products"],
    queryFn: getQueryFn(),
    retry: 1
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Your best performing products by sales volume</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Your best performing products by sales volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
            <p className="text-gray-500">Failed to load top selling products</p>
            <p className="text-xs text-gray-400 mt-2">Try adding some orders first</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <CardDescription>Your best performing products by sales volume</CardDescription>
      </CardHeader>
      <CardContent>
        {!topProducts || topProducts.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] flex-col">
            <p className="text-gray-500">No sales data available</p>
            <p className="text-xs text-gray-400 mt-2">Create some orders to see your top products</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Units Sold</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((item: TopSellingProduct) => (
                <TableRow key={item.product.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md overflow-hidden mr-3">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>{item.product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.product.category}</TableCell>
                  <TableCell>{formatCurrency(item.product.price)}</TableCell>
                  <TableCell className="text-right">{item.totalSold}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.product.price * item.totalSold)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 