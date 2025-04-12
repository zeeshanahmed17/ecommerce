import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingBag,
  ChartBar,
  CreditCard,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

export default function AdminSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  // Define the navigation items
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { name: "Inventory", icon: Package, path: "/admin/inventory" },
    { name: "Orders", icon: ShoppingBag, path: "/admin/orders" },
    { name: "Analytics", icon: ChartBar, path: "/admin/analytics" },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 py-4 flex-shrink-0 flex flex-col h-full">
      <div className="px-6">
        <div className="flex items-center">
          <BarChart3 className="text-primary text-2xl mr-2" />
          <span className="text-xl font-bold">Admin Panel</span>
        </div>
        <div className="mt-2 text-gray-400 text-sm">
          Welcome, Admin User
        </div>
      </div>
      <nav className="mt-8 flex-1">
        <div className="px-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                className={`w-full flex items-center justify-start py-3 px-4 rounded-lg ${
                  location === item.path
                    ? "bg-gray-700 text-gray-200"
                    : "text-gray-200 hover:bg-gray-700"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.name}</span>
              </Button>
            </Link>
          ))}
        </div>
      </nav>
      <div className="px-4 py-6">
        <Link href="/">
          <Button className="w-full flex items-center justify-start py-2 px-4 text-gray-200 hover:bg-gray-700 rounded-lg">
            <LogOut className="mr-3 h-5 w-5" />
            <span>Return to Store</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
