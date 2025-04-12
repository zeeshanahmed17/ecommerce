import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  ChevronRight, 
  Plus, 
  Minus, 
  Check 
} from "lucide-react";

export default function ProductPage() {
  const [match, params] = useRoute<{ id: string }>("/product/:id");
  const productId = parseInt(params?.id || "0");
  const [quantity, setQuantity] = useState(1);
  const { addItem, isProductInCart } = useCart();
  const productInCart = isProductInCart(productId);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId && productId > 0,
  });

  // Handle quantity changes
  const increaseQuantity = () => setQuantity(prev => prev + 1);
  const decreaseQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  // Add to cart with selected quantity
  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
          <div className="md:w-1/2">
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/4 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-8" />
            <div className="flex space-x-4 mb-8">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Product Not Found
            </h2>
            <p className="text-gray-500 mb-6">
              Sorry, we couldn't find the product you're looking for.
            </p>
            <Link href="/shop">
              <Button>
                Continue Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="mb-8">
        <ol className="flex items-center text-sm">
          <li>
            <Link href="/">
              <a className="text-gray-500 hover:text-gray-700">Home</a>
            </Link>
          </li>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <li>
            <Link href="/shop">
              <a className="text-gray-500 hover:text-gray-700">Shop</a>
            </Link>
          </li>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <li>
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`}>
              <a className="text-gray-500 hover:text-gray-700">{product.category}</a>
            </Link>
          </li>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <li className="text-gray-900 font-medium truncate max-w-xs">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Image */}
        <div className="md:w-1/2">
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto object-contain aspect-square"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">42 reviews</span>
            <span className="text-sm text-gray-500">SKU: {product.sku}</span>
          </div>
          
          <div className="text-2xl font-bold text-gray-900 mb-6">
            ${product.price.toFixed(2)}
          </div>
          
          <div className="mb-8">
            <p className="text-gray-700">{product.description}</p>
          </div>
          
          {/* Quantity Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
                className="h-10 w-10 rounded-none"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={increaseQuantity}
                className="h-10 w-10 rounded-none"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center mb-6">
            {product.inventory > 0 ? (
              <>
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-500">
                  In Stock ({product.inventory} available)
                </span>
              </>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 mb-8">
            <Button
              variant={productInCart ? "secondary" : "default"}
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.inventory === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {productInCart ? "Added to Cart" : "Add to Cart"}
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Product Information Tabs */}
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Product Highlights:</h4>
                  <ul className="list-disc pl-5 text-gray-700 mt-2 space-y-1">
                    <li>Premium quality materials</li>
                    <li>Ergonomic design for comfort</li>
                    <li>Long-lasting durability</li>
                    <li>1-year manufacturer warranty</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Technical Specifications:</h4>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <span className="text-gray-500">Brand:</span>
                    <span>ShopElite Premium</span>
                    <span className="text-gray-500">Model:</span>
                    <span>{product.sku}</span>
                    <span className="text-gray-500">Category:</span>
                    <span>{product.category}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="p-4">
              <div className="space-y-4">
                <p className="text-gray-700">
                  Free standard shipping on all orders over $50. Delivery typically takes 3-5 business days.
                </p>
                <div>
                  <h4 className="font-medium">Shipping Options:</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="flex justify-between">
                      <span>Standard Shipping (3-5 days)</span>
                      <span>$4.99</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Express Shipping (1-2 days)</span>
                      <span>$12.99</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Same Day Delivery (select areas)</span>
                      <span>$19.99</span>
                    </li>
                  </ul>
                </div>
                <p className="text-gray-700">
                  All items can be returned within 30 days of delivery if unused and in original packaging.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="p-4">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Customer Reviews (42)</h4>
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 ml-2">4.2 out of 5</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Write a Review</Button>
                </div>
                
                <div className="space-y-4">
                  {/* Sample Reviews */}
                  <div className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 5 ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">Great product!</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      This exceeded my expectations. The quality is amazing and it works perfectly for my needs.
                    </p>
                    <div className="text-xs text-gray-500">
                      <span>Sarah J.</span> • <span>2 weeks ago</span>
                    </div>
                  </div>
                  
                  <div className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < 4 ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="font-medium">Very satisfied</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Good value for money and fast shipping. Would buy again.
                    </p>
                    <div className="text-xs text-gray-500">
                      <span>Michael B.</span> • <span>1 month ago</span>
                    </div>
                  </div>
                  
                  <Button variant="link" className="text-primary mx-auto block">
                    Load More Reviews
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* This would typically be populated with related products by category */}
          {/* For now, we'll show a placeholder message */}
          <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Loading related products...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
