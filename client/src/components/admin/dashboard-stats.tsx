import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  UserPlus, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardStats() {
  const { data: recentOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/analytics/recent-orders"],
  });

  if (isOrdersLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-10 w-1/3 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // These values would typically come from real data analysis
  // In a real app, we would have API endpoints for these metrics
  const statsData = [
    {
      title: "Total Revenue",
      value: "$24,567.80",
      change: 7.2,
      icon: DollarSign,
      iconBgColor: "bg-primary",
    },
    {
      title: "Total Orders",
      value: "378",
      change: 4.3,
      icon: ShoppingBag,
      iconBgColor: "bg-secondary",
    },
    {
      title: "New Customers",
      value: "156",
      change: 12.7,
      icon: UserPlus,
      iconBgColor: "bg-accent",
    },
    {
      title: "Conversion Rate",
      value: "3.6%",
      change: -0.5,
      icon: TrendingUp,
      iconBgColor: "bg-success",
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-5">
            <div className="flex justify-between">
              <div>
                <h3 className="text-base font-normal text-gray-500">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-full ${stat.iconBgColor} bg-opacity-10 flex items-center justify-center`}>
                <stat.icon className={`${stat.iconBgColor} text-xl`} />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              {stat.change > 0 ? (
                <span className="text-green-600 font-medium flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" /> {stat.change}%
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center">
                  <ArrowDown className="h-4 w-4 mr-1" /> {Math.abs(stat.change)}%
                </span>
              )}
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
