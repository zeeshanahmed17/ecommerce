import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Database, Settings, HardDrive, Clock, Trash2, AlertTriangle, Download, Users } from "lucide-react";
import { toast } from "sonner";

export default function DataExport() {
  const [isClearing, setIsClearing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const clearAllData = async () => {
    try {
      setIsClearing(true);
      const response = await fetch('/api/admin/clear-data', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success("Data cleared successfully", {
          description: "All mock data has been removed.",
        });
        // Close the dialog
        setDialogOpen(false);
        // Reload the page to reflect changes
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Failed to clear data");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear data", {
        description: "An error occurred while clearing mock data.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Data Management
        </CardTitle>
        <CardDescription>
          Manage your shop data with these tools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-4 bg-primary/10 p-2 rounded-full">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Data Configuration</h3>
                <p className="text-sm text-gray-500">Configure database settings and connections</p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-primary">
              Configure Settings
            </Button>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-4 bg-primary/10 p-2 rounded-full">
                <HardDrive className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Backup & Restore</h3>
                <p className="text-sm text-gray-500">Schedule automatic backups of your shop data</p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-primary/10 hover:bg-primary/20 text-primary">
              Manage Backups
            </Button>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-4 bg-red-100 p-2 rounded-full">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium">Clear Mock Data</h3>
                <p className="text-sm text-gray-500">Remove all sample data for testing purposes</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-4">
                  Clear All Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    Clear All Mock Data
                  </DialogTitle>
                  <DialogDescription>
                    This action will remove all products, orders, and cart data from the system.
                    User accounts will be preserved.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-sm">
                  <p className="font-medium text-yellow-800">The following data will be cleared:</p>
                  <ul className="list-disc pl-5 text-yellow-700 mt-2 space-y-1">
                    <li>All products and inventory data</li>
                    <li>All customer orders and order items</li>
                    <li>All user cart data</li>
                    <li>All analytics will be reset</li>
                  </ul>
                  <p className="mt-2 font-medium text-green-700">The following data will be preserved:</p>
                  <ul className="list-disc pl-5 text-green-700 mt-1 space-y-1">
                    <li>User accounts and credentials</li>
                    <li>Admin privileges</li>
                  </ul>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={clearAllData}
                    disabled={isClearing}
                  >
                    {isClearing ? "Clearing..." : "Yes, Clear All Data"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* User Data Export Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <div className="mr-4 bg-blue-100 p-2 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium">User Data Management</h3>
              <p className="text-sm text-gray-500">
                Export user account information for your records or analysis
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              View and export registered user data. All user data is preserved when clearing mock data.
              The export includes usernames, email addresses, registration dates, and admin status.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => window.open('/api/admin/users', '_blank')}
                variant="outline"
                className="flex items-center"
              >
                <Database className="w-4 h-4 mr-2" />
                View User Data
              </Button>
              <Button 
                onClick={() => window.open('/api/admin/users?format=csv', '_blank')}
                variant="outline"
                className="flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Scheduled Tasks</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>Daily database optimization</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>Weekly full backup</span>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>Monthly analytics report</span>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}