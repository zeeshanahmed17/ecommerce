import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Settings, HardDrive, Clock } from "lucide-react";

export default function DataExport() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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