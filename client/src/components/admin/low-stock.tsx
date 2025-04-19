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
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

// Product type
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number;
  sku: string;
  featured: boolean;
}

export default function LowStock() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/analytics/low-stock-products"],
    queryFn: getQueryFn(),
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-12 w-1/2" />
                <Skeleton className="h-8 w-1/6" />
                <Skeleton className="h-8 w-1/6" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Low Stock Items</CardTitle>
          <CardDescription>Products that need to be restocked</CardDescription>
        </div>
        <Link href="/admin/inventory">
          <span className="text-sm font-medium text-primary hover:text-indigo-700 cursor-pointer flex items-center">
            Manage Inventory
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </span>
        </Link>
      </CardHeader>
      <CardContent>
        {!products || products.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No low stock items found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      product.inventory <= 5 
                        ? 'text-red-600' 
                        : product.inventory <= 10 
                          ? 'text-orange-600' 
                          : 'text-yellow-600'
                    }`}>
                      {product.inventory} units
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/inventory?action=restock&id=${product.id}`}>
                      <Button variant="link" className="text-primary hover:text-indigo-700">
                        Restock
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
