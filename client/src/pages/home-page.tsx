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
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center py-6 xs:py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 relative overflow-hidden">
            {/* Background decoration - enhanced responsive */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30 rounded-lg xs:rounded-xl sm:rounded-2xl lg:rounded-3xl"></div>
            <div className="absolute top-2 right-2 xs:top-4 xs:right-4 sm:top-8 sm:right-8 lg:top-10 lg:right-10 w-12 h-12 xs:w-16 xs:h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-md xs:blur-lg lg:blur-xl"></div>
            <div className="absolute bottom-4 left-2 xs:bottom-8 xs:left-4 sm:bottom-12 sm:left-6 lg:bottom-20 lg:left-10 w-8 h-8 xs:w-12 xs:h-12 sm:w-18 sm:h-18 lg:w-24 lg:h-24 bg-gradient-to-br from-pink-200/30 to-yellow-200/30 rounded-full blur-sm xs:blur-md lg:blur-lg"></div>
            
            <div className="w-full lg:w-1/2 mb-8 xs:mb-10 sm:mb-12 lg:mb-0 lg:pr-6 xl:pr-12 relative z-10">
              <div className="inline-flex items-center px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-xs xs:text-sm font-medium mb-3 xs:mb-4 sm:mb-6 shadow-lg">
                <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-1 xs:mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden xs:inline">New Arrivals Available</span>
                <span className="xs:hidden">New Arrivals</span>
              </div>
              
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-900 tracking-tight leading-tight xs:leading-tight sm:leading-tight">
                <span className="block xs:inline">Discover</span>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Unique</span>
                <br className="hidden xs:block" />
                <span className="block xs:inline">Products For Your</span> 
                <span className="relative block xs:inline">
                  Lifestyle
                  <svg className="absolute -bottom-0.5 xs:-bottom-1 sm:-bottom-2 left-0 w-full h-1.5 xs:h-2 sm:h-3 text-yellow-300" viewBox="0 0 200 12" fill="currentColor">
                    <path d="M0,6 Q50,0 100,6 T200,6 L200,12 Q150,8 100,12 T0,12 Z" />
                  </svg>
                </span>
              </h1>
              
              <p className="mt-3 xs:mt-4 sm:mt-6 text-sm xs:text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                Shop the latest trends with confidence and enjoy our premium shopping experience.
                <span className="block xs:inline"> </span>
                <span className="font-semibold text-gray-900">Free shipping on orders over $50.</span>
              </p>
              
              <div className="mt-5 xs:mt-6 sm:mt-8 lg:mt-10 flex flex-col xs:flex-row gap-2.5 xs:gap-3 sm:gap-4">
                <Link href="/shop" className="w-full xs:w-auto">
                  <Button className="w-full xs:w-auto px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-sm xs:text-base sm:text-lg">
                    <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Shop Now
                  </Button>
                </Link>
                <Button variant="outline" className="w-full xs:w-auto px-4 xs:px-6 sm:px-8 py-2.5 xs:py-3 sm:py-4 border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold rounded-xl transition-all duration-200 text-sm xs:text-base sm:text-lg">
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 mr-1.5 xs:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="hidden xs:inline">Explore Categories</span>
                  <span className="xs:hidden">Categories</span>
                </Button>
              </div>
              
              {/* Trust indicators - enhanced responsive */}
              <div className="mt-6 xs:mt-8 sm:mt-10 lg:mt-12 flex flex-col xs:flex-row flex-wrap items-start xs:items-center gap-3 xs:gap-4 sm:gap-6 lg:gap-8 text-xs xs:text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-green-500 mr-1 xs:mr-1.5 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">Free Shipping</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-green-500 mr-1 xs:mr-1.5 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">30-Day Returns</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-green-500 mr-1 xs:mr-1.5 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-nowrap">Secure Checkout</span>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 relative z-10 mt-4 xs:mt-6 sm:mt-8 lg:mt-0">
              <div className="relative mx-auto max-w-sm xs:max-w-md sm:max-w-lg lg:max-w-none">
                {/* Background glow effect - enhanced responsive */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-lg xs:rounded-xl sm:rounded-2xl blur-lg xs:blur-xl sm:blur-2xl transform scale-105 xs:scale-110"></div>
                
                <div className="relative bg-white/80 backdrop-blur-sm rounded-lg xs:rounded-xl sm:rounded-2xl p-0.5 xs:p-1 sm:p-2 shadow-lg xs:shadow-xl sm:shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1511556820780-d912e42b4980?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                    alt="Premium shopping experience"
                    className="w-full h-auto rounded-md xs:rounded-lg sm:rounded-xl shadow-md xs:shadow-lg"
                  />
                  
                  {/* Floating badges - enhanced responsive positioning */}
                  <div className="absolute -top-2 -right-2 xs:-top-3 xs:-right-3 sm:-top-4 sm:-right-4 lg:-top-6 lg:-right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-full font-bold text-xs xs:text-sm shadow-md xs:shadow-lg transform rotate-3 xs:rotate-6 sm:rotate-12 animate-pulse">
                    <span className="hidden xs:inline">50% OFF</span>
                    <span className="xs:hidden">50%</span>
                  </div>
                  
                  <div className="absolute -bottom-1.5 -left-1.5 xs:-bottom-2 xs:-left-2 sm:-bottom-3 sm:-left-3 lg:-bottom-4 lg:-left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-1.5 py-0.5 xs:px-2 xs:py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 rounded-full font-semibold text-xs xs:text-sm shadow-md xs:shadow-lg">
                    <span className="hidden xs:inline">⭐ 4.9/5 Rating</span>
                    <span className="xs:hidden">⭐ 4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div id="featured" className="bg-gray-50 py-8 xs:py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Featured Products
            </h2>
            <p className="mt-3 xs:mt-4 max-w-2xl text-base xs:text-lg sm:text-xl text-gray-500 mx-auto leading-relaxed">
              Check out our most popular items this season.
            </p>
          </div>

          <div className="mt-8 xs:mt-10 sm:mt-12 grid gap-4 xs:gap-5 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
            {isProductsLoading ? (
              // Loading skeletons - enhanced responsive
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="bg-white rounded-lg xs:rounded-xl shadow-sm p-3 xs:p-4 sm:p-5">
                    <Skeleton className="h-48 xs:h-56 sm:h-64 w-full mb-3 xs:mb-4 rounded-md xs:rounded-lg" />
                    <Skeleton className="h-5 xs:h-6 w-3/4 mb-2" />
                    <Skeleton className="h-3 xs:h-4 w-full mb-3 xs:mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 xs:h-6 w-1/4" />
                      <Skeleton className="h-7 xs:h-8 w-7 xs:w-8 rounded-full" />
                    </div>
                  </div>
                ))
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-1 xs:col-span-2 lg:col-span-4 text-center py-8 xs:py-10 sm:py-12">
                <p className="text-gray-500 text-sm xs:text-base">No featured products available.</p>
              </div>
            )}
          </div>

          <div className="mt-8 xs:mt-10 sm:mt-12 text-center">
            <Link href="/shop">
              <Button className="px-4 xs:px-6 py-2.5 xs:py-3 text-sm xs:text-base font-semibold rounded-lg xs:rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div id="categories" className="bg-white py-8 xs:py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Shop by Category
            </h2>
            <p className="mt-3 xs:mt-4 max-w-2xl text-base xs:text-lg sm:text-xl text-gray-500 mx-auto leading-relaxed">
              Browse our wide selection of products by category.
            </p>
          </div>

          <div className="mt-8 xs:mt-10 sm:mt-12 grid gap-4 xs:gap-5 sm:gap-6 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
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
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white py-10 xs:py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 xs:gap-10 sm:gap-12">
            <div className="w-full lg:w-1/2">
              <div className="relative">
                <div className="absolute -top-3 -left-3 xs:-top-4 xs:-left-4 sm:-top-6 sm:-left-6">
                  <div className="bg-yellow-400 text-black text-xs xs:text-sm font-bold px-2 xs:px-3 py-1 rounded-full transform -rotate-6 xs:-rotate-12 shadow-lg">
                    LIMITED TIME
                  </div>
                </div>
                <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                  Summer Collection <br className="hidden xs:block" />
                  <span className="text-yellow-400">Flash Sale</span>
                </h2>
              </div>
              <p className="mt-3 xs:mt-4 text-base xs:text-lg sm:text-xl text-indigo-100 leading-relaxed">
                Exclusive savings on our premium products. 
                <span className="block xs:inline"> </span>
                Up to 50% off on selected items until supplies last!
              </p>
              <div className="mt-6 xs:mt-8 flex flex-col xs:flex-row gap-3 xs:gap-4">
                <Link href="/shop?discount=true" className="w-full xs:w-auto">
                  <Button variant="default" className="w-full xs:w-auto bg-white text-indigo-900 hover:bg-gray-100 font-bold px-4 xs:px-6 py-2.5 xs:py-3 text-sm xs:text-base rounded-lg xs:rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    Shop Now
                  </Button>
                </Link>
                <Link href="/about/sale" className="w-full xs:w-auto">
                  <Button variant="outline" className="w-full xs:w-auto border-2 border-white text-white hover:bg-white/10 font-medium px-4 xs:px-6 py-2.5 xs:py-3 text-sm xs:text-base rounded-lg xs:rounded-xl transition-all duration-200">
                    <span className="hidden xs:inline">View Details</span>
                    <span className="xs:hidden">Details</span>
                  </Button>
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 mt-6 xs:mt-8 sm:mt-10 lg:mt-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg xs:rounded-xl px-4 xs:px-6 py-6 xs:py-8 lg:p-10 border border-white/20 shadow-xl">
                <div className="text-center">
                  <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 p-0.5 xs:p-1 rounded-full mb-3 xs:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black w-6 h-6 xs:w-8 xs:h-8 p-0.5 xs:p-1">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                  </div>
                  <h3 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-white leading-tight">
                    Exclusive Member Benefits
                  </h3>
                  <p className="mt-3 xs:mt-4 text-sm xs:text-base sm:text-lg text-indigo-100 leading-relaxed">
                    Join our community for early access to sales, 
                    <span className="block xs:inline"> </span>
                    exclusive offers, and premium content.
                  </p>
                  <form className="mt-4 xs:mt-6">
                    <div className="flex flex-col gap-2.5 xs:gap-3">
                      <input
                        type="email"
                        required
                        placeholder="Enter your email"
                        className="w-full appearance-none rounded-md xs:rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base text-white placeholder-white/60 focus:border-white focus:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                      />
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-4 xs:px-6 py-2.5 xs:py-3 text-sm xs:text-base rounded-md xs:rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
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
      <div className="bg-white py-8 xs:py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              What Our Customers Say
            </h2>
            <p className="mt-3 xs:mt-4 max-w-2xl text-base xs:text-lg sm:text-xl text-gray-500 mx-auto leading-relaxed">
              Don't just take our word for it. Read reviews from our satisfied customers.
            </p>
          </div>

          <div className="mt-8 xs:mt-10 sm:mt-12 grid gap-4 xs:gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-50 rounded-lg xs:rounded-xl p-4 xs:p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-3 xs:mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 xs:h-10 xs:w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 xs:ml-3">
                  <h3 className="text-sm xs:text-base font-medium text-gray-900">Sarah Johnson</h3>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                "I absolutely love this store! The products are high quality and the shipping was faster than expected. Customer service was also excellent when I had a question about my order."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg xs:rounded-xl p-4 xs:p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-3 xs:mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 xs:h-10 xs:w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 xs:ml-3">
                  <h3 className="text-sm xs:text-base font-medium text-gray-900">Michael Brown</h3>
                  <div className="flex mt-1">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <svg className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" strokeDasharray="10" strokeDashoffset="5" />
                    </svg>
                  </div>
                </div>
              </div>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                "The premium smartwatch I purchased exceeded my expectations. The battery life is incredible and the fitness tracking features are spot on. Would definitely recommend to friends."
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg xs:rounded-xl p-4 xs:p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center mb-3 xs:mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 xs:h-10 xs:w-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 xs:ml-3">
                  <h3 className="text-sm xs:text-base font-medium text-gray-900">Emily Chen</h3>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-3 w-3 xs:h-4 xs:w-4 text-yellow-400 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs xs:text-sm sm:text-base text-gray-600 leading-relaxed">
                "The checkout process was seamless and I received my order in just 2 days. The eco-friendly packaging was a nice touch too. Will definitely be shopping here again!"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
