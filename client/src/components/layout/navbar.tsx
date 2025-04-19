import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, User, ShoppingCart, Menu, Settings, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary">ShopElite</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`${location === '/' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              <Link 
                href="/shop"
                className={`${location === '/shop' ? 'border-primary text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Shop
              </Link>
              <div className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    Categories
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onSelect={() => navigate("/shop?category=Electronics")}>
                      Electronics
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/shop?category=Fashion")}>
                      Fashion
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate("/shop?category=Home & Kitchen")}>
                      Home & Kitchen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Input 
                  type="text" 
                  placeholder="Search products..." 
                  className="py-2 pl-10 pr-4 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </form>
            </div>
            <div className="hidden md:ml-4 md:flex md:items-center md:space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <span className="font-medium">
                        {user.fullName || user.username}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate("/my-orders")}>
                      My Orders
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <>
                        <DropdownMenuItem onSelect={() => navigate("/admin")}>
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onSelect={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleCart}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
              {user?.isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="ml-4 md:hidden flex items-center">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="space-y-4 py-4">
                    <div className="px-4">
                      <form onSubmit={handleSearch} className="relative">
                        <Input 
                          type="text" 
                          placeholder="Search products..." 
                          className="py-2 pl-10 pr-4 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                      </form>
                    </div>
                    <div className="px-4 space-y-1">
                      <Link 
                        href="/"
                        className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                      >
                        Home
                      </Link>
                      <Link 
                        href="/shop"
                        className="block py-2 text-base font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-900 rounded-md"
                      >
                        Shop
                      </Link>
                      <div className="py-2">
                        <p className="text-base font-medium text-gray-900">Categories</p>
                        <div className="mt-2 pl-4 space-y-1">
                          <Link 
                            href="/shop?category=Electronics"
                            className="block py-1 text-sm text-gray-600 hover:text-gray-900"
                          >
                            Electronics
                          </Link>
                          <Link 
                            href="/shop?category=Fashion"
                            className="block py-1 text-sm text-gray-600 hover:text-gray-900"
                          >
                            Fashion
                          </Link>
                          <Link 
                            href="/shop?category=Home & Kitchen"
                            className="block py-1 text-sm text-gray-600 hover:text-gray-900"
                          >
                            Home & Kitchen
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      {user ? (
                        <div className="px-4 space-y-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-3">
                              <div className="text-base font-medium text-gray-800">{user.fullName || user.username}</div>
                              <div className="text-sm font-medium text-gray-500">{user.email}</div>
                            </div>
                          </div>
                          {user.isAdmin && (
                            <Link href="/admin">
                              <Button variant="outline" className="w-full">
                                Admin Dashboard
                              </Button>
                            </Link>
                          )}
                          <Link href="/my-orders">
                            <Button variant="outline" className="w-full">
                              My Orders
                            </Button>
                          </Link>
                          <Button variant="default" className="w-full" onClick={handleLogout}>
                            Logout
                          </Button>
                        </div>
                      ) : (
                        <div className="px-4 space-y-2">
                          <Link href="/auth">
                            <Button className="w-full" variant="default">
                              Sign in
                            </Button>
                          </Link>
                          <Link href="/auth">
                            <Button className="w-full" variant="outline">
                              Create account
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCart}
                className="relative ml-2"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
