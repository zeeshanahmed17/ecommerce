import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CartItem as BaseCartItem, Product } from "@shared/schema";
import { useAuth } from "./use-auth";

// Extended CartItem type that includes inventory in the product
interface CartItem extends Omit<BaseCartItem, 'product'> {
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    category: string;
    sku: string;
    inventory: number;
  };
}

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isProductInCart: (productId: number) => boolean;
};

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from local storage on initial render if not logged in
  // or from server if logged in
  useEffect(() => {
    const loadCart = async () => {
      // If user is logged in, fetch cart from server
      if (user && user.id) {
        try {
          const response = await fetch('/api/cart');
          if (response.ok) {
            const cartData = await response.json();
            setItems(cartData);
            return;
          }
        } catch (error) {
          console.error('Failed to fetch cart from server:', error);
          toast({
            title: "Error",
            description: "Failed to load your cart. Please try again.",
            variant: "destructive"
          });
        }
      }

      // Fall back to local storage if not logged in or server fetch fails
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Failed to parse cart from local storage:', error);
        }
      }
    };

    // Only load cart when auth state is determined
    if (!isLoading) {
      loadCart();
    }
  }, [user, isLoading, toast]);

  // Save cart to local storage and server when it changes
  useEffect(() => {
    // Always save to local storage as backup
    localStorage.setItem('cart', JSON.stringify(items));
    
    // If logged in, sync with server
    if (user && user.id && items) {
      const syncCartWithServer = async () => {
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(items),
          });
          
          if (!response.ok) {
            console.error('Failed to sync cart with server:', await response.text());
          }
        } catch (error) {
          console.error('Error syncing cart with server:', error);
        }
      };
      
      syncCartWithServer();
    }
  }, [items, user]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen(!isOpen);

  const addItem = (product: Product, quantity = 1) => {
    // Check if there's enough inventory
    if (product.inventory < quantity) {
      toast({
        title: "Not enough in stock",
        description: `Sorry, only ${product.inventory} item(s) available.`,
        variant: "destructive"
      });
      return;
    }
    
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Calculate new quantity and check against inventory
        const currentQuantity = prevItems[existingItemIndex].quantity;
        const newQuantity = currentQuantity + quantity;
        
        // Check if new quantity exceeds available inventory
        if (newQuantity > product.inventory) {
          toast({
            title: "Not enough in stock",
            description: `You already have ${currentQuantity} in your cart. Only ${product.inventory} available in total.`,
            variant: "destructive"
          });
          return prevItems;
        }
        
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          productId: product.id,
          quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            category: product.category,
            sku: product.sku,
            inventory: product.inventory
          }
        }];
      }
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const removeItem = (productId: number) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    
    // Find the item and its current product inventory
    const item = items.find(item => item.productId === productId);
    if (!item) return;
    
    // Check if requested quantity exceeds inventory
    if (quantity > item.product.inventory) {
      toast({
        title: "Not enough in stock",
        description: `Sorry, only ${item.product.inventory} item(s) available.`,
        variant: "destructive"
      });
      
      // Set to maximum available instead
      setItems(prevItems => 
        prevItems.map(item => 
          item.productId === productId ? { ...item, quantity: item.product.inventory } : item
        )
      );
      return;
    }
    
    // Update to requested quantity if it's valid
    setItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = items.reduce(
    (total, item) => total + (item.product.price * item.quantity), 
    0
  );

  const isProductInCart = (productId: number) => {
    return items.some(item => item.productId === productId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isProductInCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
