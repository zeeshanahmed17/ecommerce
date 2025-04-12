import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Smartphone, Wallet, ArrowRight, CheckCircle } from "lucide-react";

// Form schema for shipping details
const shippingFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  saveAddress: z.boolean().optional(),
});

// Form schema for payment details
const paymentFormSchema = z.object({
  paymentMethod: z.enum(["card", "upi", "wallet"]),
  // Credit card fields (conditionally required based on paymentMethod)
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  // UPI fields
  upiId: z.string().optional(),
  // Wallet fields
  walletType: z.enum(["paypal", "applepay", "amazonpay"]).optional(),
});

// Combine both schemas with conditional validation
const checkoutSchema = z.object({
  shipping: shippingFormSchema,
  payment: paymentFormSchema,
}).refine(data => {
  if (data.payment.paymentMethod === 'card') {
    return !!data.payment.cardNumber && !!data.payment.cardName && !!data.payment.expiryDate && !!data.payment.cvv;
  }
  if (data.payment.paymentMethod === 'upi') {
    return !!data.payment.upiId;
  }
  if (data.payment.paymentMethod === 'wallet') {
    return !!data.payment.walletType;
  }
  return true;
}, {
  message: "Please complete all payment fields",
  path: ["payment"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState<"shipping" | "payment" | "confirmation">("shipping");
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  // Calculate totals
  const shippingCost = subtotal > 50 ? 0 : 4.99;
  const taxRate = 0.07; // 7% tax rate
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Initialize form with default values
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping: {
        fullName: user?.fullName || "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "United States",
        phone: "",
        saveAddress: false
      },
      payment: {
        paymentMethod: "card",
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
        upiId: "",
        walletType: "paypal"
      }
    },
  });

  // Submit order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormValues) => {
      // Create order items from cart
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }));
      
      // Create order data
      const orderData = {
        order: {
          total: totalAmount,
          paymentMethod: data.payment.paymentMethod,
          paymentStatus: "pending", // Initially all payments are pending
          shippingAddress: `${data.shipping.fullName}, ${data.shipping.address}, ${data.shipping.city}, ${data.shipping.state} ${data.shipping.postalCode}, ${data.shipping.country}`
        },
        items: orderItems
      };
      
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: (data) => {
      setOrderId(data.id);
      setOrderComplete(true);
      clearCart();
      
      toast({
        title: "Order placed successfully!",
        description: `Your order #${data.id} has been confirmed.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission for shipping step
  const onShippingSubmit = () => {
    setActiveStep("payment");
  };

  // Handle form submission for payment step
  const onPaymentSubmit = () => {
    const formValues = form.getValues();
    placeOrderMutation.mutate(formValues);
    setActiveStep("confirmation");
  };

  // If no items in cart, redirect to shop
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-500 mb-6">
              Add some products to your cart before proceeding to checkout.
            </p>
            <Button onClick={() => navigate("/shop")}>
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
      
      {orderComplete ? (
        // Order Confirmation
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-6 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thank You for Your Order!
            </h2>
            <p className="text-gray-600 mb-2">
              Your order #{orderId} has been placed successfully.
            </p>
            <p className="text-gray-500 mb-8">
              We've sent a confirmation email to {user?.email}. You can track your order status in your account.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => navigate("/shop")}>
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Checkout Form */}
          <div className="lg:w-2/3">
            <Tabs value={activeStep} onValueChange={(value) => setActiveStep(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="shipping" disabled={activeStep !== "shipping"}>
                  1. Shipping
                </TabsTrigger>
                <TabsTrigger value="payment" disabled={activeStep === "shipping"}>
                  2. Payment
                </TabsTrigger>
                <TabsTrigger value="confirmation" disabled={activeStep !== "confirmation"}>
                  3. Confirmation
                </TabsTrigger>
              </TabsList>
              
              {/* Shipping Information Form */}
              <TabsContent value="shipping">
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                    <CardDescription>
                      Enter your shipping details to continue with your purchase.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onShippingSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="shipping.fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipping.address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea placeholder="123 Main Street, Apt 4B" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="shipping.city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="New York" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="shipping.state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>State/Province</FormLabel>
                                <FormControl>
                                  <Input placeholder="NY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="shipping.postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="10001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="shipping.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="United States" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="shipping.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="shipping.saveAddress"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Save this address for future orders
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full">
                          Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Payment Information Form */}
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Information</CardTitle>
                    <CardDescription>
                      Choose a payment method and enter your payment details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onPaymentSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="payment.paymentMethod"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Method</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="grid grid-cols-3 gap-4"
                                >
                                  <FormItem className="flex flex-col items-center space-y-3">
                                    <FormControl>
                                      <RadioGroupItem 
                                        value="card" 
                                        id="card" 
                                        className="sr-only"
                                      />
                                    </FormControl>
                                    <label
                                      htmlFor="card"
                                      className={`flex flex-col items-center justify-center w-full p-4 border-2 rounded-lg cursor-pointer ${
                                        field.value === "card"
                                          ? "border-primary bg-primary/5"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <CreditCard className={`h-8 w-8 mb-2 ${field.value === "card" ? "text-primary" : "text-gray-400"}`} />
                                      <span className="text-sm font-medium">Credit Card</span>
                                    </label>
                                  </FormItem>
                                  <FormItem className="flex flex-col items-center space-y-3">
                                    <FormControl>
                                      <RadioGroupItem 
                                        value="upi" 
                                        id="upi" 
                                        className="sr-only"
                                      />
                                    </FormControl>
                                    <label
                                      htmlFor="upi"
                                      className={`flex flex-col items-center justify-center w-full p-4 border-2 rounded-lg cursor-pointer ${
                                        field.value === "upi"
                                          ? "border-primary bg-primary/5"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <Smartphone className={`h-8 w-8 mb-2 ${field.value === "upi" ? "text-primary" : "text-gray-400"}`} />
                                      <span className="text-sm font-medium">UPI</span>
                                    </label>
                                  </FormItem>
                                  <FormItem className="flex flex-col items-center space-y-3">
                                    <FormControl>
                                      <RadioGroupItem 
                                        value="wallet" 
                                        id="wallet" 
                                        className="sr-only"
                                      />
                                    </FormControl>
                                    <label
                                      htmlFor="wallet"
                                      className={`flex flex-col items-center justify-center w-full p-4 border-2 rounded-lg cursor-pointer ${
                                        field.value === "wallet"
                                          ? "border-primary bg-primary/5"
                                          : "border-gray-200"
                                      }`}
                                    >
                                      <Wallet className={`h-8 w-8 mb-2 ${field.value === "wallet" ? "text-primary" : "text-gray-400"}`} />
                                      <span className="text-sm font-medium">Wallet</span>
                                    </label>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Conditional form fields based on payment method */}
                        {form.watch("payment.paymentMethod") === "card" && (
                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="payment.cardNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Card Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="1234 5678 9012 3456" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="payment.cardName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Name on Card</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="payment.expiryDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Expiry Date</FormLabel>
                                    <FormControl>
                                      <Input placeholder="MM/YY" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="payment.cvv"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CVV</FormLabel>
                                    <FormControl>
                                      <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}
                        
                        {form.watch("payment.paymentMethod") === "upi" && (
                          <FormField
                            control={form.control}
                            name="payment.upiId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>UPI ID</FormLabel>
                                <FormControl>
                                  <Input placeholder="username@bankname" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {form.watch("payment.paymentMethod") === "wallet" && (
                          <FormField
                            control={form.control}
                            name="payment.walletType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Wallet</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="grid grid-cols-3 gap-4"
                                  >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="paypal" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        PayPal
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="applepay" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Apple Pay
                                      </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                      <FormControl>
                                        <RadioGroupItem value="amazonpay" />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        Amazon Pay
                                      </FormLabel>
                                    </FormItem>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <div className="flex space-x-4">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setActiveStep("shipping")}
                          >
                            Back to Shipping
                          </Button>
                          <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={placeOrderMutation.isPending}
                          >
                            {placeOrderMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Place Order"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Confirmation Tab */}
              <TabsContent value="confirmation">
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Processing Your Order
                    </h2>
                    <p className="text-gray-500">
                      Please wait while we process your payment. Do not close this page.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <Accordion type="single" collapsible defaultValue="items">
                  <AccordionItem value="items">
                    <AccordionTrigger>
                      Items ({items.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.productId} className="flex">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>
                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3 className="text-sm">{item.product.name}</h3>
                                  <p className="ml-4 text-sm">${(item.product.price * item.quantity).toFixed(2)}</p>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{item.product.category}</p>
                              </div>
                              <div className="flex flex-1 items-end justify-between text-xs">
                                <p className="text-gray-500">Qty {item.quantity}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                {/* Cost breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (7%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Shipping Method */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Shipping Method</h3>
                  <div className="flex justify-between text-sm">
                    <span>Standard Shipping</span>
                    <span>{shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {shippingCost === 0 
                      ? "Free shipping for orders over $50"
                      : "Estimated delivery: 3-5 business days"
                    }
                  </p>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 text-xs text-gray-500">
                <p>
                  By placing your order, you agree to ShopElite's terms and conditions and privacy policy.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
