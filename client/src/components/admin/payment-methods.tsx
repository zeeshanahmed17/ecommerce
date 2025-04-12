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
  Wallet 
} from "lucide-react";
import { Link } from "wouter";

export default function PaymentMethods() {
  // This would typically come from backend data
  // For demo purposes, we'll use static data
  const paymentStats = [
    {
      method: "Credit/Debit Cards",
      description: "Visa, Mastercard, Amex",
      icon: CreditCard,
      iconBgColor: "bg-primary",
      amount: "$14,285.65",
      percentage: 65,
      growth: "+12.3%",
    },
    {
      method: "UPI Payments",
      description: "Google Pay, PhonePe, Paytm",
      icon: Smartphone,
      iconBgColor: "bg-secondary",
      amount: "$7,865.20",
      percentage: 28,
      growth: "+23.7%",
    },
    {
      method: "Digital Wallets",
      description: "PayPal, Apple Pay, etc.",
      icon: Wallet,
      iconBgColor: "bg-accent",
      amount: "$2,416.95",
      percentage: 7,
      growth: "+5.2%",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment Methods Overview</CardTitle>
          <CardDescription>
            Summary of payment methods used by customers
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
          {paymentStats.map((stat, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className={`flex-shrink-0 mr-3 ${stat.iconBgColor} bg-opacity-10 p-2 rounded-full`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconBgColor} bg-opacity-100`} />
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900">{stat.method}</h4>
                  <p className="text-sm text-gray-500">{stat.description}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">This Month</span>
                <span className="font-medium">{stat.amount}</span>
              </div>
              <div className="mt-1">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${stat.iconBgColor} rounded-full h-2`} 
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500 flex justify-between">
                  <span>{stat.percentage}% of orders</span>
                  <span>{stat.growth} from last month</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
