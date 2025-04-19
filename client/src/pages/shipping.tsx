import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function ShippingPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-2">Shipping & Returns</h1>
      <p className="text-gray-500 text-center mb-8">
        Information about our shipping policies, delivery times, and return process.
      </p>
      
      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipping">Shipping Information</TabsTrigger>
          <TabsTrigger value="returns">Returns & Exchanges</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shipping" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>
                Learn about our shipping methods, costs, and delivery times.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-lg font-medium mb-2">Shipping Methods</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                    <div className="font-medium">Standard Shipping</div>
                    <div className="text-gray-600">5-7 business days</div>
                    <div className="text-gray-600">$4.99 (Free on orders over $50)</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                    <div className="font-medium">Express Shipping</div>
                    <div className="text-gray-600">2-3 business days</div>
                    <div className="text-gray-600">$9.99</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="font-medium">Overnight Shipping</div>
                    <div className="text-gray-600">Next business day</div>
                    <div className="text-gray-600">$19.99</div>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-2">International Shipping</h3>
                <p className="text-gray-600 mb-4">
                  We ship to most countries worldwide. International shipping costs and delivery times vary depending on the destination. 
                  You'll see the available shipping options and costs during checkout.
                </p>
                <p className="text-gray-600">
                  Please note that international orders may be subject to customs duties and taxes, which are the responsibility of the recipient.
                </p>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-2">Order Processing</h3>
                <p className="text-gray-600">
                  Orders are processed within 1-2 business days. Business days are Monday-Friday, excluding holidays.
                  Once your order ships, you'll receive a shipping confirmation email with tracking information.
                </p>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-2">Tracking Your Order</h3>
                <p className="text-gray-600 mb-4">
                  You can track your order in your account under "My Orders" once it has shipped.
                  Alternatively, use the tracking number in your shipping confirmation email to track your package on the carrier's website.
                </p>
                <Link href="/my-orders">
                  <Button variant="outline">Track Your Order</Button>
                </Link>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="returns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Returns & Exchanges</CardTitle>
              <CardDescription>
                Our hassle-free return and exchange policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h3 className="text-lg font-medium mb-2">Return Policy</h3>
                <p className="text-gray-600 mb-2">
                  We offer a 30-day return policy. If you're not completely satisfied with your purchase, you can return it within 30 days of receiving your order.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Items must be unused, unwashed, and in their original packaging with all tags attached.</li>
                  <li>Sale items can only be returned for store credit.</li>
                  <li>Customized or personalized items cannot be returned unless they are defective.</li>
                  <li>Intimate apparel, swimwear, and beauty products cannot be returned for hygiene reasons, unless they are defective.</li>
                </ul>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-2">How to Return an Item</h3>
                <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                  <li>Log in to your account and go to "My Orders".</li>
                  <li>Find the order containing the item you wish to return.</li>
                  <li>Select "Return Item" and follow the instructions.</li>
                  <li>Print the return label (free returns for orders over $50, otherwise a $6.99 return shipping fee will be deducted from your refund).</li>
                  <li>Package the item securely in its original packaging, if possible.</li>
                  <li>Attach the return label to the outside of the package and drop it off at any authorized shipping location.</li>
                </ol>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-2">Exchanges</h3>
                <p className="text-gray-600">
                  We recommend returning the unwanted item for a refund and placing a new order for the item you want instead.
                  This is often faster than processing an exchange. 
                  If you need assistance with an exchange, please contact our customer service team.
                </p>
              </section>
              
              <section>
                <h3 className="text-lg font-medium mb-2">Refund Processing</h3>
                <p className="text-gray-600">
                  Once we receive and inspect your return, we'll process your refund. Refunds are issued to the original payment method and typically take 5-7 business days to appear on your statement, depending on your financial institution.
                </p>
              </section>
              
              <section className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about returns or exchanges, our customer service team is here to help.
                </p>
                <Link href="/contact">
                  <Button>Contact Us</Button>
                </Link>
              </section>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 