import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();

  // Clear the cart on successful checkout
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="text-gray-600 mt-2">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          A confirmation email has been sent to your email address.
          You can track your order status in your account.
        </p>

        <div className="pt-4 border-t border-gray-200">
          <Button 
            className="w-full" 
            onClick={() => setLocation("/account/orders")}
          >
            View Your Orders
          </Button>
          <Button 
            className="w-full mt-3" 
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
} 