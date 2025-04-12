import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, Minus, Plus, ShoppingCart } from "lucide-react";

export default function CartSidebar() {
  const { 
    items, 
    isOpen, 
    closeCart, 
    removeItem, 
    updateQuantity,
    subtotal,
    totalItems
  } = useCart();
  const [, navigate] = useLocation();

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const handleContinueShopping = () => {
    closeCart();
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-lg font-medium text-gray-900">
              Your Cart ({totalItems})
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={closeCart}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Your cart is empty</h3>
              <p className="text-gray-500 mt-1">Add some products to your cart to continue shopping</p>
              <Button className="mt-6" onClick={() => {
                closeCart();
                navigate("/shop");
              }}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.productId} className="flex py-6 border-b border-gray-200">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="h-full w-full object-cover object-center" 
                    />
                  </div>
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>
                          <Link href={`/product/${item.productId}`} onClick={closeCart}>
                            <a>{item.product.name}</a>
                          </Link>
                        </h3>
                        <p className="ml-4">${(item.product.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{item.product.category}</p>
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon" 
                          className="h-8 w-8 p-0" 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-gray-500 mx-2">Qty {item.quantity}</span>
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0" 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button 
                        variant="ghost"
                        onClick={() => removeItem(item.productId)}
                        className="font-medium text-primary hover:text-indigo-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            <div className="flex justify-between text-base font-medium text-gray-900">
              <p>Subtotal</p>
              <p>${subtotal.toFixed(2)}</p>
            </div>
            <p className="text-sm text-gray-500">Shipping and taxes calculated at checkout.</p>
            <Button 
              className="w-full" 
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            <div className="flex justify-center text-sm text-gray-500">
              <Button 
                variant="link" 
                onClick={handleContinueShopping}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
