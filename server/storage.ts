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
    
    // We're skipping the password hashing here since there's no easy way to do it
    // directly in the constructor. In a real app, this should be hashed properly.
    // For development purposes, we'll use a hardcoded value - use admin/admin123
    this.users.set(this.userId++, {
      id: 1,
      username: "admin",
      password: "8136c13805f16e5a1c77bca14be9cb5b6451bb38c0ea88c382dea9bf786e0b3e92940637e8f0e9b5a81f1e0b35fceb11b1d29762d0764d202b0afa93a0135fe3.c5eb04a48d323e39", // "admin123"
      email: "admin@shopelite.com",
      fullName: "Admin User",
      isAdmin: true,
      createdAt: new Date()
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

import { db } from "./db";
import { eq, and, like, desc, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for DatabaseStorage");
    }
    
    this.sessionStore = new PostgresSessionStore({ 
      conObject: {
        connectionString: process.env.DATABASE_URL
      }, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductsByCategoryName(category: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.category, category));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.featured, true));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id));
    return result.rowCount > 0;
  }

  async searchProducts(query: string): Promise<Product[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(products)
      .where(
        sql`${products.name} ILIKE ${searchPattern} OR 
           ${products.description} ILIKE ${searchPattern} OR 
           ${products.category} ILIKE ${searchPattern}`
      );
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
  }

  async createOrder(orderData: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Use a transaction for inserting order and items
    const [order] = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values(orderData)
        .returning();
      
      // Insert order items
      for (const item of items) {
        await tx
          .insert(orderItems)
          .values({ ...item, orderId: newOrder.id });
        
        // Update product inventory
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        if (product) {
          await tx
            .update(products)
            .set({ inventory: product.inventory - item.quantity })
            .where(eq(products.id, item.productId));
        }
      }
      
      return [newOrder];
    });
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  // OrderItem operations
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  // Analytics operations
  async getRecentOrders(limit: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async getLowStockProducts(threshold: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(sql`${products.inventory} <= ${threshold}`)
      .orderBy(products.inventory);
  }

  async getRevenueStats(): Promise<{daily: any[], weekly: any[], monthly: any[]}> {
    // Daily revenue - last 30 days
    const dailyResults = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        SUM(total) as revenue
      FROM orders
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Weekly revenue - last 12 weeks
    const weeklyResults = await db.execute(sql`
      SELECT 
        EXTRACT(WEEK FROM created_at) as week,
        EXTRACT(YEAR FROM created_at) as year,
        SUM(total) as revenue
      FROM orders
      WHERE created_at > NOW() - INTERVAL '12 weeks'
      GROUP BY EXTRACT(WEEK FROM created_at), EXTRACT(YEAR FROM created_at)
      ORDER BY year DESC, week DESC
    `);

    // Monthly revenue - last 12 months
    const monthlyResults = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        EXTRACT(MONTH FROM created_at) as month_num,
        EXTRACT(YEAR FROM created_at) as year,
        SUM(total) as revenue
      FROM orders
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at)
      ORDER BY year DESC, month_num DESC
    `);

    return {
      daily: dailyResults.rows,
      weekly: weeklyResults.rows,
      monthly: monthlyResults.rows
    };
  }

  async getCategoryDistribution(): Promise<{category: string, count: number}[]> {
    const results = await db.execute(sql`
      SELECT 
        category,
        COUNT(*) as count
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);
    
    return results.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    }));
  }
}

// Using DatabaseStorage now that we have a valid DATABASE_URL
export const storage = new DatabaseStorage();
