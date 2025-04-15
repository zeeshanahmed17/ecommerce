import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/shop/product-card";
import CategoryCard from "@/components/shop/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@shared/schema";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, ChevronRight } from "lucide-react";

export default function HomePage() {
  const { data: featuredProducts, isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const categoryImages = {
    "Electronics": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "Fashion": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
    "Home & Kitchen": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
  };

  // Calculate product counts by category
  const productCounts = {
    "Electronics": 115,
    "Fashion": 243,
    "Home & Kitchen": 89
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center py-12 md:py-16">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                Discover Unique Products For Your Lifestyle
              </h1>
              <p className="mt-4 text-xl text-gray-500">
                Shop the latest trends with confidence and enjoy our premium shopping experience.
              </p>
              <div className="mt-8 flex space-x-4">
                <Link href="/shop">
                  <Button className="px-5 py-3 bg-primary hover:bg-indigo-700">
                    Shop Now
                  </Button>
                </Link>
                <Button variant="outline" className="px-5 py-3">
                  Explore Categories
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <img
                src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                alt="Premium shopping experience"
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div id="featured" className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Featured Products
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Check out our most popular items this season.
            </p>
          </div>

          <div className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {isProductsLoading ? (
              // Loading skeletons
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                    <Skeleton className="h-64 w-full mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                ))
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-4 text-center py-12">
                <p className="text-gray-500">No featured products available.</p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link href="/shop">
              <Button className="px-6 py-3">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div id="categories" className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Shop by Category
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Browse our wide selection of products by category.
            </p>
          </div>

          <div className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(categoryImages).map(([category, imageUrl]) => (
              <CategoryCard
                key={category}
                name={category}
                imageUrl={imageUrl}
                productCount={productCounts[category as keyof typeof productCounts] || 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Special Offers */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-6 -left-6">
                  <div className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full transform -rotate-12">
                    LIMITED TIME
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl leading-tight">
                  Summer Collection <br />
                  <span className="text-yellow-400">Flash Sale</span>
                </h2>
              </div>
              <p className="mt-4 text-xl text-indigo-100">
                Exclusive savings on our premium products. 
                Up to 50% off on selected items until supplies last!
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/shop?discount=true">
                  <Button variant="default" className="bg-white text-indigo-900 hover:bg-gray-100 font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Shop Now
                  </Button>
                </Link>
                <Link href="/about/sale">
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-medium">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 lg:w-1/2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-8 lg:p-10 border border-white/20 shadow-xl">
                <div className="text-center">
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-1 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black w-8 h-8 p-1">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    Exclusive Member Benefits
                  </h3>
                  <p className="mt-4 text-lg text-indigo-100">
                    Join our community for early access to sales, 
                    exclusive offers, and premium content.
                  </p>
                  <form className="mt-6">
                    <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-3">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        className="min-w-0 flex-auto appearance-none rounded-md border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-base text-white placeholder-white/60 focus:border-white focus:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                      />
                      <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                        Join Now
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Don't just take our word for it. Read reviews from our satisfied customers.
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Sarah Johnson</h3>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "I absolutely love this store! The products are high quality and the shipping was faster than expected. Customer service was also excellent when I had a question about my order."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Michael Brown</h3>
                  <div className="flex mt-1">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" strokeDasharray="10" strokeDashoffset="5" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "The premium smartwatch I purchased exceeded my expectations. The battery life is incredible and the fitness tracking features are spot on. Would definitely recommend to friends."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-10 w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Emily Chen</h3>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-gray-600">
                "The checkout process was seamless and I received my order in just 2 days. The eco-friendly packaging was a nice touch too. Will definitely be shopping here again!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
