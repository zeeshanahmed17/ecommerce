import { useLocation } from "wouter";
import { XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancel() {
  const [, setLocation] = useLocation();

  return (
    <div className="max-w-md mx-auto my-16 p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <XCircleIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="text-gray-600 mt-2">
          Your payment process was cancelled. No charges were made to your account.
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Your items are still in your cart. You can try again or continue shopping.
        </p>

        <div className="pt-4 border-t border-gray-200">
          <Button 
            className="w-full" 
            onClick={() => setLocation("/checkout")}
          >
            Return to Checkout
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