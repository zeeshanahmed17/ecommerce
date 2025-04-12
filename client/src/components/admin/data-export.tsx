import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Sample data structure for development and testing
// In production, this would be replaced with actual data from database
const mockExportData = {
  users: [
    { id: 1, username: "admin", email: "admin@example.com", fullName: "Admin User", isAdmin: true, createdAt: "2025-03-15T10:00:00.000Z" },
    { id: 2, username: "customer1", email: "customer1@example.com", fullName: "John Smith", isAdmin: false, createdAt: "2025-03-20T14:30:00.000Z" },
    { id: 3, username: "customer2", email: "customer2@example.com", fullName: "Jane Doe", isAdmin: false, createdAt: "2025-03-25T09:15:00.000Z" },
    { id: 4, username: "manager", email: "manager@example.com", fullName: "Alex Johnson", isAdmin: true, createdAt: "2025-03-28T11:45:00.000Z" },
  ],
  products: [
    { id: 1, name: "Premium T-Shirt", price: 29.99, category: "Clothing", inventory: 100, sku: "TS-001", imageUrl: "/images/tshirt.jpg", description: "High-quality cotton t-shirt", featured: true, createdAt: "2025-03-10T08:00:00.000Z" },
    { id: 2, name: "Wireless Headphones", price: 89.99, category: "Electronics", inventory: 50, sku: "EL-001", imageUrl: "/images/headphones.jpg", description: "Noise-cancelling wireless headphones", featured: true, createdAt: "2025-03-11T09:30:00.000Z" },
    { id: 3, name: "Coffee Mug", price: 12.99, category: "Kitchenware", inventory: 200, sku: "KW-001", imageUrl: "/images/mug.jpg", description: "Ceramic coffee mug", featured: false, createdAt: "2025-03-12T10:15:00.000Z" },
    { id: 4, name: "Leather Wallet", price: 49.99, category: "Accessories", inventory: 75, sku: "AC-001", imageUrl: "/images/wallet.jpg", description: "Genuine leather wallet", featured: false, createdAt: "2025-03-13T11:45:00.000Z" },
    { id: 5, name: "Smart Watch", price: 199.99, category: "Electronics", inventory: 30, sku: "EL-002", imageUrl: "/images/smartwatch.jpg", description: "Fitness tracking smartwatch", featured: true, createdAt: "2025-03-14T13:00:00.000Z" },
  ],
  orders: [
    { id: 1, userId: 2, total: 42.98, status: "Delivered", paymentStatus: "Paid", paymentMethod: "Credit Card", shippingAddress: "123 Main St, Anytown, USA", createdAt: "2025-04-01T15:30:00.000Z" },
    { id: 2, userId: 3, total: 89.99, status: "Processing", paymentStatus: "Paid", paymentMethod: "PayPal", shippingAddress: "456 Oak Ave, Somecity, USA", createdAt: "2025-04-02T10:15:00.000Z" },
    { id: 3, userId: 2, total: 199.99, status: "Shipped", paymentStatus: "Paid", paymentMethod: "Credit Card", shippingAddress: "123 Main St, Anytown, USA", createdAt: "2025-04-03T14:45:00.000Z" },
    { id: 4, userId: 3, total: 62.98, status: "Processing", paymentStatus: "Paid", paymentMethod: "Credit Card", shippingAddress: "456 Oak Ave, Somecity, USA", createdAt: "2025-04-04T09:30:00.000Z" },
  ],
  order_items: [
    { id: 1, orderId: 1, productId: 1, quantity: 1, price: 29.99 },
    { id: 2, orderId: 1, productId: 3, quantity: 1, price: 12.99 },
    { id: 3, orderId: 2, productId: 2, quantity: 1, price: 89.99 },
    { id: 4, orderId: 3, productId: 5, quantity: 1, price: 199.99 },
    { id: 5, orderId: 4, productId: 1, quantity: 1, price: 29.99 },
    { id: 6, orderId: 4, productId: 3, quantity: 1, price: 12.99 },
    { id: 7, orderId: 4, productId: 4, quantity: 1, price: 49.99 },
  ]
};

// Convert JSON data to CSV format
function convertToCSV(objArray: any[]): string {
  if (objArray.length === 0) return 'No data available';
  
  const header = Object.keys(objArray[0]).join(',');
  const rows = objArray.map(obj => 
    Object.values(obj).map(val => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
}

// Download CSV data
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

type ExportResponse = {
  success: boolean;
  message: string;
  links?: { name: string; url: string }[];
  error?: string;
};

export default function DataExport() {
  const { toast } = useToast();
  const [exportLinks, setExportLinks] = useState<{ name: string; url: string }[]>([]);
  const [backendUnavailable, setBackendUnavailable] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/export/excel");
        return res.json() as Promise<ExportResponse>;
      } catch (error) {
        // If the server request fails, we'll use fallback mode
        console.error("Server request failed, using fallback mode:", error);
        setBackendUnavailable(true);
        
        // Create pseudo-links for fallback mode
        return {
          success: true,
          message: "Export prepared in fallback mode. Click on the links to download sample data.",
          links: [
            { name: 'Users', url: '#users' },
            { name: 'Products', url: '#products' },
            { name: 'Orders', url: '#orders' },
            { name: 'Order Items', url: '#order_items' }
          ]
        } as ExportResponse;
      }
    },
    onSuccess: (data) => {
      if (data.success && data.links) {
        setExportLinks(data.links);
        toast({
          title: "Export Prepared",
          description: backendUnavailable 
            ? "Export data prepared in fallback mode." 
            : "Your data has been exported. You can now download each table individually.",
        });
      } else {
        toast({
          title: "Export Issue",
          description: data.message || "There was a problem preparing your data export.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Export failed:", error);
      setBackendUnavailable(true);
      toast({
        title: "Export Failed",
        description: "There was a problem connecting to the server. Using fallback mode.",
        variant: "destructive",
      });
    },
  });

  const handleExportToExcel = async () => {
    exportMutation.mutate();
  };

  const handleDownloadTable = (table: string) => {
    try {
      if (backendUnavailable) {
        // In fallback mode, use the mock data
        const mockData = mockExportData[table as keyof typeof mockExportData] || [];
        const csvContent = convertToCSV(mockData);
        downloadCSV(csvContent, `${table}.csv`);
        
        toast({
          title: "Download Complete",
          description: `Sample ${table} data has been downloaded (fallback mode).`,
        });
      } else {
        // Normal mode - try to get data from the server
        window.open(`/api/export/${table}`, "_blank");
        toast({
          title: "Download Started",
          description: `The ${table} data will download automatically.`,
        });
      }
    } catch (error) {
      console.error(`Download of ${table} failed:`, error);
      toast({
        title: "Download Failed",
        description: `There was a problem downloading the ${table} data. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Data Export
        </CardTitle>
        <CardDescription>
          Export your shop data to Excel compatible format for analysis and backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {backendUnavailable && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Backend Connection Issue</AlertTitle>
            <AlertDescription>
              Currently operating in fallback mode. CSV exports will contain sample data only. 
              Please contact system administrator to resolve database connection issues.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-primary/10 p-4 rounded-lg">
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel Export
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {backendUnavailable 
              ? "Download sample shop data as individual CSV files, ready for Excel import."
              : "Download all your shop data as CSV files packaged in a ZIP archive, ready for Excel import."}
          </p>
          <Button 
            onClick={handleExportToExcel} 
            disabled={exportMutation.isPending}
            className="w-full"
          >
            {exportMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {backendUnavailable ? "Prepare Sample Data" : "Prepare Data Export"}
              </>
            )}
          </Button>
        </div>

        <div>
          <h3 className="text-sm font-medium mb-3">Download Individual Tables</h3>
          
          {exportLinks.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 mb-3">
                Your data is ready! Click on each table to download:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {exportLinks.map((link) => (
                  <Button 
                    key={link.name}
                    variant="outline" 
                    className="justify-start" 
                    onClick={() => {
                      if (backendUnavailable && link.url.startsWith('#')) {
                        // In fallback mode, extract table name from URL fragment
                        const tableName = link.url.replace('#', '');
                        handleDownloadTable(tableName);
                      } else {
                        // Normal mode
                        window.open(link.url, "_blank");
                      }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {link.name}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="justify-start" 
                onClick={() => handleDownloadTable("users")}
              >
                <Download className="mr-2 h-4 w-4" />
                Users
              </Button>
              <Button 
                variant="outline" 
                className="justify-start" 
                onClick={() => handleDownloadTable("products")}
              >
                <Download className="mr-2 h-4 w-4" />
                Products
              </Button>
              <Button 
                variant="outline" 
                className="justify-start" 
                onClick={() => handleDownloadTable("orders")}
              >
                <Download className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Button 
                variant="outline" 
                className="justify-start" 
                onClick={() => handleDownloadTable("order_items")}
              >
                <Download className="mr-2 h-4 w-4" />
                Order Items
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t px-6 py-3">
        <p className="text-xs text-gray-500">
          Data is exported in CSV format which can be opened directly in Excel, Google Sheets, or any spreadsheet application.
        </p>
      </CardFooter>
    </Card>
  );
}