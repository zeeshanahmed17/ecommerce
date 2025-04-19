import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./lib/protected-route";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import CartSidebar from "@/components/shop/cart-sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster as SonnerToaster } from "sonner";

// Eagerly load critical components
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";

// Loading component for code splitting
import { Loader2 } from "lucide-react";
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Lazily load non-critical components
const ShopPage = lazy(() => import("@/pages/shop-page"));
const ProductPage = lazy(() => import("@/pages/product-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-page"));
const MyOrders = lazy(() => import("@/pages/my-orders"));
const ContactPage = lazy(() => import("@/pages/contact"));
const FaqPage = lazy(() => import("@/pages/faq"));
const ShippingPage = lazy(() => import("@/pages/shipping"));
const TrackOrderPage = lazy(() => import("@/pages/track-order"));
const HelpCenterPage = lazy(() => import("@/pages/help-center"));
const SizeGuidePage = lazy(() => import("@/pages/size-guide"));
const WarrantyPage = lazy(() => import("@/pages/warranty"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminInventory = lazy(() => import("@/pages/admin/inventory"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminAnalytics = lazy(() => import("@/pages/admin/analytics"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Wrap lazy-loaded routes in Suspense with fallback */}
      <Route path="/shop">
        <Suspense fallback={<Loading />}>
          <ShopPage />
        </Suspense>
      </Route>
      
      <Route path="/product/:id">
        {(params) => (
          <Suspense fallback={<Loading />}>
            <ProductPage params={params} />
          </Suspense>
        )}
      </Route>
      
      <Route path="/contact">
        <Suspense fallback={<Loading />}><ContactPage /></Suspense>
      </Route>
      
      <Route path="/faq">
        <Suspense fallback={<Loading />}><FaqPage /></Suspense>
      </Route>
      
      <Route path="/shipping">
        <Suspense fallback={<Loading />}><ShippingPage /></Suspense>
      </Route>
      
      <Route path="/track-order">
        <Suspense fallback={<Loading />}><TrackOrderPage /></Suspense>
      </Route>
      
      <Route path="/help-center">
        <Suspense fallback={<Loading />}><HelpCenterPage /></Suspense>
      </Route>
      
      <Route path="/size-guide">
        <Suspense fallback={<Loading />}><SizeGuidePage /></Suspense>
      </Route>
      
      <Route path="/warranty">
        <Suspense fallback={<Loading />}><WarrantyPage /></Suspense>
      </Route>
      
      <ProtectedRoute path="/checkout">
        <Suspense fallback={<Loading />}><CheckoutPage /></Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/my-orders">
        <Suspense fallback={<Loading />}><MyOrders /></Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/admin" adminOnly={true}>
        <Suspense fallback={<Loading />}><AdminDashboard /></Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/admin/inventory" adminOnly={true}>
        <Suspense fallback={<Loading />}><AdminInventory /></Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/admin/orders" adminOnly={true}>
        <Suspense fallback={<Loading />}><AdminOrders /></Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/admin/analytics" adminOnly={true}>
        <Suspense fallback={<Loading />}><AdminAnalytics /></Suspense>
      </ProtectedRoute>
      
      <ProtectedRoute path="/admin/users" adminOnly={true}>
        <Suspense fallback={<Loading />}><AdminUsers /></Suspense>
      </ProtectedRoute>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            <CartSidebar />
            <Toaster />
          </div>
          <SonnerToaster position="top-right" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </>
  );
}

export default App;
