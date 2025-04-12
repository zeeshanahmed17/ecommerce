import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import ProductCard from "@/components/shop/product-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X } from "lucide-react";

export default function ShopPage() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "featured";
  const featuredParam = searchParams.get("featured") === "true";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState(sortParam);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(featuredParam);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Fetch all products
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams();
  };

  // Update URL with filters
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (sortBy !== "featured") params.set("sort", sortBy);
    if (showFeaturedOnly) params.set("featured", "true");
    
    setLocation(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Apply filters to products
  const filteredProducts = products?.filter(product => {
    // Apply search filter
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply category filter
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    // Apply featured filter
    const matchesFeatured = !showFeaturedOnly || product.featured;
    
    // Apply price filter
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesFeatured && matchesPrice;
  }) || [];

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low-high":
        return a.price - b.price;
      case "price-high-low":
        return b.price - a.price;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return b.featured ? 1 : -1; // Featured items first
    }
  });

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSortBy("featured");
    setShowFeaturedOnly(false);
    setPriceRange([0, 1000]);
    setLocation("/shop");
  };

  // Handle filter changes
  useEffect(() => {
    // Sync URL parameters with state
    const categoryFromUrl = searchParams.get("category") || "";
    const searchFromUrl = searchParams.get("q") || "";
    const sortFromUrl = searchParams.get("sort") || "featured";
    const featuredFromUrl = searchParams.get("featured") === "true";
    
    if (categoryFromUrl !== selectedCategory) setSelectedCategory(categoryFromUrl);
    if (searchFromUrl !== searchQuery) setSearchQuery(searchFromUrl);
    if (sortFromUrl !== sortBy) setSortBy(sortFromUrl);
    if (featuredFromUrl !== showFeaturedOnly) setShowFeaturedOnly(featuredFromUrl);
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedCategory ? selectedCategory : "All Products"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {sortedProducts.length} products available
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center">
          <Button 
            variant="outline"
            size="sm"
            className="md:hidden mr-2"
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <form onSubmit={handleSearch} className="relative flex items-center">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
            <Button type="submit" variant="ghost" size="sm" className="absolute right-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar (desktop) or dropdown (mobile) */}
        <Card className={`md:w-64 flex-shrink-0 ${filtersVisible ? 'block' : 'hidden md:block'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Filters</h2>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="space-y-6">
              {/* Category filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Category</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Checkbox 
                      id="category-all" 
                      checked={selectedCategory === ""}
                      onCheckedChange={() => {
                        setSelectedCategory("");
                        updateUrlParams();
                      }}
                    />
                    <label htmlFor="category-all" className="ml-2 text-sm">All Categories</label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox 
                      id="category-electronics" 
                      checked={selectedCategory === "Electronics"}
                      onCheckedChange={() => {
                        setSelectedCategory("Electronics");
                        updateUrlParams();
                      }}
                    />
                    <label htmlFor="category-electronics" className="ml-2 text-sm">Electronics</label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox 
                      id="category-fashion" 
                      checked={selectedCategory === "Fashion"}
                      onCheckedChange={() => {
                        setSelectedCategory("Fashion");
                        updateUrlParams();
                      }}
                    />
                    <label htmlFor="category-fashion" className="ml-2 text-sm">Fashion</label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox 
                      id="category-home" 
                      checked={selectedCategory === "Home & Kitchen"}
                      onCheckedChange={() => {
                        setSelectedCategory("Home & Kitchen");
                        updateUrlParams();
                      }}
                    />
                    <label htmlFor="category-home" className="ml-2 text-sm">Home & Kitchen</label>
                  </div>
                </div>
              </div>

              {/* Featured filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Product Type</h3>
                <div className="flex items-center">
                  <Checkbox 
                    id="featured-only" 
                    checked={showFeaturedOnly}
                    onCheckedChange={(checked) => {
                      setShowFeaturedOnly(checked === true);
                      updateUrlParams();
                    }}
                  />
                  <label htmlFor="featured-only" className="ml-2 text-sm">Featured Products Only</label>
                </div>
              </div>

              {/* Price Range filter */}
              <div>
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">${priceRange[0]}</span>
                    <span className="text-sm">${priceRange[1]}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      step="10"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const min = parseInt(e.target.value);
                        setPriceRange([min, Math.max(min, priceRange[1])]);
                      }}
                      onMouseUp={updateUrlParams}
                      onTouchEnd={updateUrlParams}
                    />
                    <Input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const max = parseInt(e.target.value);
                        setPriceRange([Math.min(priceRange[0], max), max]);
                      }}
                      onMouseUp={updateUrlParams}
                      onTouchEnd={updateUrlParams}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <Button 
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setFiltersVisible(!filtersVisible)}
            >
              {filtersVisible ? "Hide Filters" : "Show Filters"}
            </Button>

            <div className="flex items-center ml-auto">
              <span className="text-sm text-gray-500 mr-2">Sort by:</span>
              <Select 
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  updateUrlParams();
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low-high">Price: Low to High</SelectItem>
                  <SelectItem value="price-high-low">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-64 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error loading products. Please try again later.</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <Button onClick={resetFilters}>Clear All Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
