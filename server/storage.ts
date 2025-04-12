import { users, products, orders, orderItems } from "@shared/schema";
import type { User, Product, Order, OrderItem, InsertUser, InsertProduct, InsertOrder, InsertOrderItem, CartItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategoryName(category: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  searchProducts(query: string): Promise<Product[]>;
  
  // Order operations
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // OrderItem operations
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  
  // Analytics operations
  getRecentOrders(limit: number): Promise<Order[]>;
  getLowStockProducts(threshold: number): Promise<Product[]>;
  getRevenueStats(): Promise<{daily: any[], weekly: any[], monthly: any[]}>;
  getCategoryDistribution(): Promise<{category: string, count: number}[]>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  sessionStore: session.SessionStore;
  private userId: number;
  private productId: number;
  private orderId: number;
  private orderItemId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userId = 1;
    this.productId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Add an admin user by default
    this.createUser({
      username: "admin",
      password: "admin123", // This will be hashed in auth.ts
      email: "admin@shopelite.com",
      fullName: "Admin User",
      isAdmin: true
    });
    
    // Add some sample products
    this.initializeProducts();
  }

  private initializeProducts() {
    const sampleProducts: InsertProduct[] = [
      {
        name: "Premium Headphones",
        description: "Superior sound quality for music lovers. Features active noise cancellation and 20 hour battery life.",
        price: 149.99,
        imageUrl: "https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Electronics",
        inventory: 23,
        sku: "HP-100-BK",
        featured: true,
      },
      {
        name: "Smartwatch Pro",
        description: "Track fitness and stay connected with this premium smartwatch. Features heart rate monitoring and GPS.",
        price: 199.99,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Electronics",
        inventory: 15,
        sku: "SW-PRO-BK",
        featured: true,
      },
      {
        name: "Eco-Friendly Water Bottle",
        description: "Sustainable hydration solution that keeps your drinks cold for 24 hours or hot for 12 hours.",
        price: 24.99,
        imageUrl: "https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Home & Kitchen",
        inventory: 50,
        sku: "WB-ECO-GR",
        featured: true,
      },
      {
        name: "Running Shoes",
        description: "Professional athletic footwear with shock absorption and breathable material.",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Fashion",
        inventory: 35,
        sku: "RN-SH-BL-10",
        featured: true,
      },
      {
        name: "Wireless Phone Charger",
        description: "Fast 15W wireless charging pad compatible with all Qi-enabled devices.",
        price: 29.99,
        imageUrl: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Electronics",
        inventory: 45,
        sku: "CH-WL-10W",
        featured: false,
      },
      {
        name: "Organic Cotton T-Shirt",
        description: "Soft, sustainable cotton t-shirt with a classic fit.",
        price: 19.99,
        imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80",
        category: "Fashion",
        inventory: 100,
        sku: "TS-ORG-BL-M",
        featured: false,
      }
    ];
    
    sampleProducts.forEach(product => {
      this.createProduct(product);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategoryName(category: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.category.toLowerCase() === category.toLowerCase()
    );
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.featured
    );
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const now = new Date();
    const product: Product = { ...insertProduct, id, createdAt: now };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct: Product = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => 
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.orderId++;
    const now = new Date();
    const order: Order = { ...orderData, id, createdAt: now };
    
    this.orders.set(id, order);
    
    // Create order items
    items.forEach(item => {
      const orderItemId = this.orderItemId++;
      const orderItem: OrderItem = { ...item, id: orderItemId, orderId: id };
      this.orderItems.set(orderItemId, orderItem);
      
      // Update product inventory
      const product = this.products.get(item.productId);
      if (product) {
        this.updateProduct(product.id, { inventory: product.inventory - item.quantity });
      }
    });
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // OrderItem operations
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  // Analytics operations
  async getRecentOrders(limit: number): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return orders.slice(0, limit);
  }

  async getLowStockProducts(threshold: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.inventory <= threshold
    ).sort((a, b) => a.inventory - b.inventory);
  }

  async getRevenueStats(): Promise<{daily: any[], weekly: any[], monthly: any[]}> {
    // In a real database, we would use SQL aggregations
    // For this in-memory version, we'll create mock analytics data
    return {
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        revenue: Math.floor(Math.random() * 1000) + 500
      })),
      weekly: Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i+1}`,
        revenue: Math.floor(Math.random() * 5000) + 2000
      })),
      monthly: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2023, i, 1).toLocaleString('default', { month: 'short' }),
        revenue: Math.floor(Math.random() * 20000) + 10000
      }))
    };
  }

  async getCategoryDistribution(): Promise<{category: string, count: number}[]> {
    const categories = new Map<string, number>();
    
    for (const product of this.products.values()) {
      const currentCount = categories.get(product.category) || 0;
      categories.set(product.category, currentCount + 1);
    }
    
    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
}

export const storage = new MemStorage();
