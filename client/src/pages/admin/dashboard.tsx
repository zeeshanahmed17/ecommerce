import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import AdminSidebar from "@/components/admin/sidebar";
import DashboardStats from "@/components/admin/dashboard-stats";
import SalesChart from "@/components/admin/sales-chart";
import RecentOrders from "@/components/admin/recent-orders";
import LowStock from "@/components/admin/low-stock";
import PaymentMethods from "@/components/admin/payment-methods";
import DataExport from "@/components/admin/data-export";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();

  // If not admin, redirect to home
  if (!isLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome to your store management dashboard. Here's a summary of your business performance.</p>
          </div>

          {/* Stats Cards */}
          <DashboardStats />

          {/* Sales Chart */}
          <SalesChart />

          {/* Recent Orders and Inventory Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <RecentOrders />
            <LowStock />
          </div>

          {/* Payment Methods Section */}
          <PaymentMethods />
          
          {/* Data Export Section */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
            <DataExport />
          </div>
        </div>
      </div>
    </div>
  );
}
