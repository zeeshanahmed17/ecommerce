import { users, products, orders, orderItems } from "@shared/schema";
import type { User, Product, Order, OrderItem, InsertUser, InsertProduct, InsertOrder, InsertOrderItem, CartItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { hashPassword } from "./auth";
import fs from 'fs';
import path from 'path';

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(userId: number, newPassword: string): Promise<User | undefined>;
  
  // Cart operations
  getUserCart(userId: number): Promise<CartItem[]>;
  updateUserCart(userId: number, cart: CartItem[]): Promise<boolean>;
  
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
  getRecentOrders(limit: number, period?: string): Promise<Order[]>;
  getLowStockProducts(threshold: number): Promise<Product[]>;
  getRevenueStats(period?: string): Promise<{daily: any[], weekly: any[], monthly: any[]}>;
  getCategoryDistribution(period?: string): Promise<{category: string, count: number}[]>;
  getTopSellingProducts(limit: number, period?: string): Promise<{product: Product, totalSold: number}[]>;
  getPaymentMethodDistribution(period?: string): Promise<{method: string, count: number, amount: number}[]>;
  
  // Data management operations
  clearAllData(): Promise<boolean>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private userCarts: Map<number, CartItem[]>;
  public sessionStore: session.Store;
  private userId: number;
  private productId: number;
  private orderId: number;
  private orderItemId: number;

  // Use absolute paths for data storage
  private dataDir: string;
  private productDataFile: string;
  private userCartFile: string;
  private orderDataFile: string;
  private userDataFile: string;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userCarts = new Map();
    this.userId = 1;
    this.productId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    
    // Create data directory if it doesn't exist
    this.dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Set up file paths
    this.productDataFile = path.join(this.dataDir, 'product-data.json');
    this.userCartFile = path.join(this.dataDir, 'user-cart-data.json');
    this.orderDataFile = path.join(this.dataDir, 'order-data.json');
    this.userDataFile = path.join(this.dataDir, 'user-data.json');
    
    // Always use in-memory session store regardless of environment
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    console.log("Using in-memory session store for development");
    
    // Initialize data asynchronously
    this.initialize();
  }

  // Initialize data asynchronously to properly handle promises
  private async initialize() {
    try {
      // Load user data first
      const usersLoaded = await this.loadUserData();
      
      // Initialize admin user only if no users were loaded
      if (!usersLoaded) {
        await this.initializeAdminUser();
      }
      
      // Initialize other data
      await this.initializeData();
      
      // Load cart data
      await this.loadCartData();
    } catch (error) {
      console.error("Error during storage initialization:", error);
    }
  }

  // Initialize data in the correct sequence
  private async initializeData() {
    // First load product data
    const productsLoaded = await this.loadProductData();
    
    // If no products were loaded, initialize default products
    if (!productsLoaded) {
      this.initializeProducts();
    }
    
    // Load order data
    const ordersLoaded = await this.loadOrderData();
    
    // After products are initialized, create sample orders if needed
    if (!ordersLoaded) {
      this.initializeOrders();
    }
  }

  // Initialize admin user with proper hashing
  private async initializeAdminUser() {
    try {
      // Check if admin user already exists
      const existingAdmin = Array.from(this.users.values()).find(user => 
        user.username === 'admin' || user.email === 'admin@shopelite.com'
      );
      
      if (existingAdmin) {
        console.log("Admin user already exists, skipping initialization");
        // Ensure admin privileges are set
        if (!existingAdmin.isAdmin) {
          existingAdmin.isAdmin = true;
          console.log("Updated existing admin user to have admin privileges");
        }
        return;
      }
      
      console.log("Creating new admin user...");
      
      // Create admin user with proper password hashing
      const adminPass = await hashPassword('admin123');
      
      const adminUser = {
        id: 1,
        username: "admin",
        password: adminPass,
        email: "admin@shopelite.com",
        fullName: "Admin User",
        isAdmin: true,
        createdAt: new Date()
      };
      
      this.users.set(this.userId++, adminUser);
      
      console.log("Admin user initialized with secure password");
      console.log("Admin credentials: username=admin, password=admin123");
    } catch (error) {
      console.error("Failed to initialize admin user:", error);
      
      // Fallback with pre-hashed password if hashing fails
      this.users.set(this.userId++, {
        id: 1,
        username: "admin",
        password: "8136c13805f16e5a1c77bca14be9cb5b6451bb38c0ea88c382dea9bf786e0b3e92940637e8f0e9b5a81f1e0b35fceb11b1d29762d0764d202b0afa93a0135fe3.c5eb04a48d323e39", // "admin123"
        email: "admin@shopelite.com",
        fullName: "Admin User",
        isAdmin: true,
        createdAt: new Date()
      });
      console.log("Admin user initialized with fallback pre-hashed password");
      console.log("Admin credentials: username=admin, password=admin123");
    }
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

  private initializeOrders() {
    // Create a few sample orders with different dates and totals for revenue charts
    const paymentMethods = ['card', 'paypal', 'upi'];
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered'];
    
    // Sample order from Jan to current month to show revenue growth
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Create orders for each month from January to current month
    for (let month = 0; month <= currentMonth; month++) {
      // Create 3-5 orders per month with increasing revenue pattern
      const ordersCount = Math.floor(Math.random() * 3) + 3; // 3-5 orders
      
      for (let i = 0; i < ordersCount; i++) {
        // Create an order for this month
        const orderDate = new Date(currentYear, month, Math.floor(Math.random() * 28) + 1);
        const userId = 1; // Admin user
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        
        // Gradually increase base revenue as months progress (150 + month * 20)
        const baseTotal = 150 + (month * 20);
        // Add some random variation
        const total = baseTotal + Math.floor(Math.random() * 100);
        
        // Create the order
        const orderId = this.orderId++;
        const order: Order = {
          id: orderId,
          userId,
          total,
          status,
          paymentMethod,
          paymentStatus: 'completed',
          shippingAddress: '123 Sample St, Anytown, ST 12345',
          createdAt: orderDate
        };
        this.orders.set(orderId, order);
        
        // Add 1-3 order items for this order
        const itemsCount = Math.floor(Math.random() * 3) + 1;
        let itemsTotal = 0;
        
        for (let j = 0; j < itemsCount; j++) {
          // Pick a random product
          const productKeys = Array.from(this.products.keys());
          const randomProductId = productKeys[Math.floor(Math.random() * productKeys.length)];
          const product = this.products.get(randomProductId)!;
          
          // Random quantity between 1 and 3
          const quantity = Math.floor(Math.random() * 3) + 1;
          const price = product.price;
          
          // Create the order item
          const orderItemId = this.orderItemId++;
          const orderItem: OrderItem = {
            id: orderItemId,
            orderId,
            productId: product.id,
            quantity,
            price
          };
          
          this.orderItems.set(orderItemId, orderItem);
          itemsTotal += price * quantity;
        }
        
        // If there's a big discrepancy between order total and items total,
        // adjust the order total to match items (with a small shipping/tax addition)
        if (Math.abs(itemsTotal - total) > 50) {
          order.total = itemsTotal + (itemsTotal * 0.1); // Add 10% for tax/shipping
          this.orders.set(orderId, order);
        }
      }
    }
    
    console.log(`Initialized ${this.orders.size} sample orders with revenue data`);
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
    
    // Check if password is already hashed
    let userPassword = insertUser.password;
    if (!userPassword.includes('.')) {
      try {
        // Hash the password if it's not already hashed
        userPassword = await hashPassword(userPassword);
      } catch (error) {
        console.error("Error hashing password:", error);
        // Continue with original password if hashing fails
      }
    }
    
    const user: User = { 
      ...insertUser, 
      password: userPassword,
      id, 
      createdAt: now,
      fullName: insertUser.fullName || null,
      isAdmin: insertUser.isAdmin || false
    };
    this.users.set(id, user);
    
    // Log user creation without exposing password
    const { password, ...userWithoutPassword } = user;
    console.log(`Created new user: ${userWithoutPassword.username}, ID: ${userWithoutPassword.id}`);
    
    // Save user data after creating a new user
    this.saveUserData();
    
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    try {
      // Since we can't find the @db module, we'll use the in-memory storage instead
      return Array.from(this.products.values());
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
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
    const product: Product = { 
      ...insertProduct, 
      id,
      createdAt: new Date(),
      inventory: insertProduct.inventory || 0,
      featured: insertProduct.featured || false
    };
    this.products.set(id, product);
    
    // Save product data after creating a new product
    this.saveProductData();
    
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    // Ensure inventory can never be negative
    if (productUpdate.inventory !== undefined && productUpdate.inventory < 0) {
      console.warn(`Attempted to set negative inventory (${productUpdate.inventory}) for product ${id}. Setting to 0 instead.`);
      productUpdate.inventory = 0;
    }
    
    const updatedProduct = { ...product, ...productUpdate };
    this.products.set(id, updatedProduct);
    
    // Save product data after updating a product
    this.saveProductData();
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const deleted = this.products.delete(id);
    
    // Save product data after deleting a product
    if (deleted) {
      this.saveProductData();
    }
    
    return deleted;
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
    // First check if all items are in stock with requested quantities
    for (const item of items) {
      const product = this.products.get(item.productId);
      
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found`);
      }
      
      if (product.inventory < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}. Available: ${product.inventory}, Requested: ${item.quantity}`);
      }
    }
    
    // If we get here, all items are available in requested quantities
    const id = this.orderId++;
    const now = new Date();
    const order: Order = { 
      ...orderData, 
      id, 
      createdAt: now,
      status: orderData.status || 'pending',
      paymentStatus: orderData.paymentStatus || 'pending'
    };
    this.orders.set(id, order);
    
    // Create order items and update inventory
    items.forEach(item => {
      const orderItemId = this.orderItemId++;
      const orderItem: OrderItem = { ...item, id: orderItemId, orderId: id };
      this.orderItems.set(orderItemId, orderItem);
      
      // Update product inventory
      const product = this.products.get(item.productId);
      if (product) {
        // Ensure inventory doesn't go below zero (should never happen due to check above)
        const newInventory = Math.max(0, product.inventory - item.quantity);
        this.updateProduct(product.id, { inventory: newInventory });
      }
    });
    
    // Save product data to persist inventory changes
    this.saveProductData();
    
    // Save order data to persist changes
    this.saveOrderData();
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, status };
    this.orders.set(id, updatedOrder);
    
    // Save order data after status update
    this.saveOrderData();
    
    return updatedOrder;
  }

  // OrderItem operations
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  // Analytics operations
  async getRecentOrders(limit: number, period: string = 'monthly'): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    
    // Filter orders based on period if specified
    const filteredOrders = this.filterOrdersByPeriod(orders, period);
    
    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return filteredOrders.slice(0, limit);
  }

  // Helper function to format date for logging
  private formatDateForLog(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  // Helper function to filter orders by period
  private filterOrdersByPeriod(orders: Order[], period: string): Order[] {
    const now = new Date(); // Always use current time
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        // Set to start of today (midnight 00:00:00)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      case 'weekly':
        // Last 7 days from now
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'yearly':
        // Start of current year
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      case 'monthly':
      default:
        // Start of current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
    }
    
    console.log(`Filtering orders from ${this.formatDateForLog(startDate)} to ${this.formatDateForLog(now)} for period: ${period}`);
    
    return orders.filter(order => {
      const orderDate = order.createdAt instanceof Date 
        ? order.createdAt 
        : new Date(order.createdAt);
      return orderDate >= startDate;
    });
  }

  async getLowStockProducts(threshold: number): Promise<Product[]> {
    // No period filtering needed for inventory status
    return Array.from(this.products.values()).filter(
      (product) => product.inventory <= threshold
    ).sort((a, b) => a.inventory - b.inventory);
  }

  // Analytics operations for SQLite
  async getRevenueStats(period: string = 'monthly'): Promise<{daily: any[], weekly: any[], monthly: any[]}> {
    // Create maps for daily, weekly, and monthly revenue
    const dailyRevenue = new Map<string, number>();
    const weeklyRevenue = new Map<string, number>();
    const monthlyRevenue = new Map<string, number>();
    
    // Get orders filtered by period
    const orders = this.filterOrdersByPeriod(
      Array.from(this.orders.values()),
      period
    );
    
    // Process each order
    for (const order of orders) {
      if (!order.createdAt) continue;
      
      const orderDate = order.createdAt instanceof Date 
        ? order.createdAt 
        : new Date(order.createdAt);
      const total = typeof order.total === 'number' ? order.total : Number(order.total) || 0;
      
      // Skip invalid dates or orders with zero total
      if (isNaN(orderDate.getTime()) || total <= 0) continue;
      
      // Format date strings
      const day = orderDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const month = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      
      // Get week number (simplified: using the day of year / 7)
      const startOfYear = new Date(orderDate.getFullYear(), 0, 0);
      const diff = orderDate.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);
      const weekNumber = Math.floor(dayOfYear / 7) + 1;
      const weekKey = `${orderDate.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
      
      // Add to daily revenue
      dailyRevenue.set(day, (dailyRevenue.get(day) || 0) + total);
      
      // Add to weekly revenue
      weeklyRevenue.set(weekKey, (weeklyRevenue.get(weekKey) || 0) + total);
      
      // Add to monthly revenue
      const monthName = orderDate.toLocaleString('en-US', { month: 'short' });
      const monthYear = `${monthName} ${orderDate.getFullYear()}`;
      monthlyRevenue.set(monthYear, (monthlyRevenue.get(monthYear) || 0) + total);
    }
    
    // Convert maps to arrays and sort by date
    const daily = Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const weekly = Array.from(weeklyRevenue.entries())
      .map(([week, revenue]) => {
        const [year, weekNum] = week.split('-W');
        return { 
          week: parseInt(weekNum), 
          year: parseInt(year), 
          revenue 
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      });
    
    const monthly = Array.from(monthlyRevenue.entries())
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => {
        // Custom sort for month-year format
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
    
    return { daily, weekly, monthly };
  }

  /**
   * Get the distribution of product categories based on orders in a specified time period
   * 
   * This method provides data for visualizing which product categories are most popular
   * in the given time period. It works by:
   * 
   * 1. Filtering orders by the specified time period (daily, weekly, monthly or yearly)
   * 2. Collecting all order items associated with those orders
   * 3. Getting the corresponding products for each order item
   * 4. Counting the occurrences of each product category
   * 5. Returning an array of category-count pairs sorted by count in descending order
   * 
   * The returned data is in the format needed for direct visualization in charts/graphs
   * on the admin dashboard.
   * 
   * @param period - The time period for filtering orders: 'daily', 'weekly', 'monthly', or 'yearly'
   * @returns Promise<Array<{category: string, count: number}>> - Category distribution data
   */
  async getCategoryDistribution(period: string = 'monthly'): Promise<{category: string, count: number}[]> {
    try {
      // Filter orders by the specified period
      const filteredOrders = this.filterOrdersByPeriod(Array.from(this.orders.values()), period);
      
      // If no orders found in the period, return empty array
      if (filteredOrders.length === 0) {
        return [];
      }
      
      // Get all order items for the filtered orders
      const orderItems: OrderItem[] = [];
      for (const order of filteredOrders) {
        const items = await this.getOrderItemsByOrderId(order.id);
        orderItems.push(...items);
      }
      
      // Count products by category
      const categoryCount: Record<string, number> = {};
      
      for (const item of orderItems) {
        const product = this.products.get(item.productId);
        if (product) {
          const category = product.category;
          categoryCount[category] = (categoryCount[category] || 0) + item.quantity;
        }
      }
      
      // Convert to array format for the frontend
      const result = Object.entries(categoryCount).map(([category, count]) => ({
        category,
        count
      }));
      
      // Sort by count in descending order
      return result.sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error(`Error getting category distribution: ${error}`);
      return [];
    }
  }

  async getTopSellingProducts(limit: number, period: string = 'monthly'): Promise<{product: Product, totalSold: number}[]> {
    // Filter orders by period
    const filteredOrders = this.filterOrdersByPeriod(
      Array.from(this.orders.values()),
      period
    );
    
    // Get order IDs for these orders
    const orderIds = new Set<number>();
    for (const order of filteredOrders) {
      orderIds.add(order.id);
    }
    
    // Group order items by product ID and calculate total quantity sold
    const productSales = new Map<number, number>();
    for (const item of this.orderItems.values()) {
      // Skip if the order is not in our filtered set
      if (!orderIds.has(item.orderId)) continue;
      
      const currentTotal = productSales.get(item.productId) || 0;
      productSales.set(item.productId, currentTotal + item.quantity);
    }
    
    // Sort by quantity sold (descending) and convert to array with product details
    const topProducts: {product: Product, totalSold: number}[] = [];
    
    for (const [productId, totalSold] of productSales.entries()) {
      const product = this.products.get(productId);
      if (product) {
        topProducts.push({ product, totalSold });
      }
    }
    
    // Sort by quantity sold in descending order
    topProducts.sort((a, b) => b.totalSold - a.totalSold);
    
    // Return only the requested number of results
    return topProducts.slice(0, limit);
  }

  async getPaymentMethodDistribution(period: string = 'monthly'): Promise<{method: string, count: number, amount: number}[]> {
    // Filter orders by period
    const filteredOrders = this.filterOrdersByPeriod(
      Array.from(this.orders.values()),
      period
    );
    
    // Group by payment method
    const methodMap = new Map<string, { count: number, amount: number }>();
    
    for (const order of filteredOrders) {
      const method = order.paymentMethod || 'unknown';
      const total = typeof order.total === 'number' ? order.total : Number(order.total) || 0;
      
      if (!methodMap.has(method)) {
        methodMap.set(method, { count: 0, amount: 0 });
      }
      
      const stats = methodMap.get(method)!;
      stats.count += 1;
      stats.amount += total;
    }
    
    return Array.from(methodMap.entries()).map(([method, stats]) => ({
      method,
      count: stats.count,
      amount: stats.amount
    }));
  }

  // Methods to expose user data for persistence
  getUsersData(): [number, User][] {
    return Array.from(this.users.entries());
  }
  
  getUsersCount(): number {
    return this.users.size;
  }
  
  getCurrentUserIdCounter(): number {
    return this.userId;
  }
  
  setUserIdCounter(id: number): void {
    this.userId = id;
  }
  
  resetUsersMap(): void {
    this.users = new Map<number, User>();
  }
  
  addUserFromData(id: number, user: User): void {
    this.users.set(id, user);
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    // Update the user's password
    const updatedUser: User = { 
      ...user, 
      password: newPassword
    };
    this.users.set(userId, updatedUser);
    
    // Save user data after updating a password
    this.saveUserData();
    
    return updatedUser;
  }

  // Methods to expose product data for persistence
  getProductsData(): [number, Product][] {
    return Array.from(this.products.entries());
  }
  
  getProductsCount(): number {
    return this.products.size;
  }
  
  getCurrentProductIdCounter(): number {
    return this.productId;
  }
  
  setProductIdCounter(id: number): void {
    this.productId = id;
  }
  
  resetProductsMap(): void {
    this.products = new Map<number, Product>();
  }
  
  addProductFromData(id: number, product: Product): void {
    this.products.set(id, product);
  }

  // Save product data to disk
  private async saveProductData(): Promise<boolean> {
    try {
      const products = this.getProductsData();
      const productData = {
        products: products.map(([id, product]) => ({
          ...product,
          // Convert Date objects to ISO strings for proper serialization
          createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt
        })),
        nextProductId: this.getCurrentProductIdCounter()
      };
      
      // Ensure the directory exists
      const dir = path.dirname(this.productDataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await fs.promises.writeFile(
        this.productDataFile,
        JSON.stringify(productData, null, 2)
      );
      console.log(`Product data saved to ${this.productDataFile}`);
      return true;
    } catch (error) {
      console.error('Failed to save product data:', error);
      return false;
    }
  }
  
  // Load product data from disk
  private async loadProductData(): Promise<boolean> {
    try {
      if (fs.existsSync(this.productDataFile)) {
        try {
          const data = await fs.promises.readFile(this.productDataFile, 'utf8');
          const productData = JSON.parse(data);
          
          // Reset product map
          this.resetProductsMap();
          
          // Restore products from file
          if (productData.products && Array.isArray(productData.products)) {
            productData.products.forEach((product: Product) => {
              // Convert ISO strings back to Date objects
              if (typeof product.createdAt === 'string') {
                product.createdAt = new Date(product.createdAt);
              }
              this.addProductFromData(product.id, product);
            });
            
            // Set the next product ID if provided
            if (productData.nextProductId) {
              this.setProductIdCounter(productData.nextProductId);
            }
            
            console.log(`Loaded ${productData.products.length} products from ${this.productDataFile}`);
            return true;
          }
        } catch (parseError: any) {
          console.error(`Error parsing product data file: ${parseError.message}`);
          console.log('Removing corrupted product data file and initializing default products');
          try {
            // Remove the corrupted file
            await fs.promises.unlink(this.productDataFile);
          } catch (unlinkError: any) {
            console.error(`Failed to remove corrupted product data file: ${unlinkError.message}`);
          }
          return false;
        }
      } else {
        console.log('No product data file found, will initialize with sample products');
        return false;
      }
    } catch (error: any) {
      console.error('Failed to load product data:', error);
      return false;
    }
    return false;
  }

  // Cart operations
  /**
   * Get a user's cart contents
   * @param userId - The ID of the user
   * @returns Promise<CartItem[]> - The user's cart items
   */
  async getUserCart(userId: number): Promise<CartItem[]> {
    // If user not found, return empty cart
    if (!this.users.has(userId)) {
      console.warn(`Attempted to access cart for non-existent user ${userId}`);
      return [];
    }
    
    return this.userCarts.get(userId) || [];
  }

  /**
   * Update a user's cart contents with synchronization protection
   * @param userId - The ID of the user
   * @param cart - The new cart contents
   * @returns Promise<boolean> - Whether the update was successful
   */
  async updateUserCart(userId: number, cart: CartItem[]): Promise<boolean> {
    try {
      // If user doesn't exist, return false
      if (!this.users.has(userId)) {
        console.warn(`Attempted to update cart for non-existent user ${userId}`);
        return false;
      }
      
      // Validate cart items
      for (const item of cart) {
        // Check if the product exists and has sufficient inventory
        const product = this.products.get(item.productId);
        if (!product) {
          console.warn(`Cart contains non-existent product ID: ${item.productId}`);
          return false;
        }
        
        if (item.quantity <= 0) {
          console.warn(`Invalid quantity for product ${product.name}: ${item.quantity}`);
          return false;
        }
        
        if (item.quantity > product.inventory) {
          console.warn(`Requested quantity exceeds inventory for ${product.name}: ${item.quantity} > ${product.inventory}`);
          // We don't return false here to allow the cart to be updated,
          // but the checkout process will handle inventory validation
        }
      }
      
      // Update the cart and save to disk
      this.userCarts.set(userId, cart);
      await this.saveCartData();
      return true;
    } catch (error) {
      console.error(`Error updating cart for user ${userId}:`, error);
      return false;
    }
  }

  // Methods to expose cart data for persistence
  getCartData(): [number, CartItem[]][] {
    return Array.from(this.userCarts.entries());
  }

  resetCartMap(): void {
    this.userCarts = new Map<number, CartItem[]>();
  }

  addCartFromData(userId: number, cart: CartItem[]): void {
    this.userCarts.set(userId, cart);
  }

  // Save cart data to disk with error handling
  private async saveCartData(): Promise<boolean> {
    try {
      const carts = this.getCartData();
      const cartData = {
        carts: carts.map(([userId, cartItems]) => ({
          userId,
          cartItems
        }))
      };
      
      // Ensure the directory exists
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      
      // Write to a temporary file first, then rename to avoid corruption
      const tempFile = `${this.userCartFile}.tmp`;
      await fs.promises.writeFile(
        tempFile,
        JSON.stringify(cartData, null, 2)
      );
      
      // Atomically replace the file (fs.rename is atomic on most systems)
      await fs.promises.rename(tempFile, this.userCartFile);
      
      console.log(`User cart data saved to ${this.userCartFile}`);
      return true;
    } catch (error) {
      console.error('Failed to save cart data:', error);
      return false;
    }
  }
  
  // Load cart data from disk
  private async loadCartData(): Promise<boolean> {
    try {
      if (fs.existsSync(this.userCartFile)) {
        try {
          const data = await fs.promises.readFile(this.userCartFile, 'utf8');
          const cartData = JSON.parse(data);
          
          // Reset cart map
          this.resetCartMap();
          
          // Restore carts from file
          if (cartData.carts && Array.isArray(cartData.carts)) {
            cartData.carts.forEach((item: {userId: number, cartItems: CartItem[]}) => {
              this.addCartFromData(item.userId, item.cartItems);
            });
            
            console.log(`Loaded ${cartData.carts.length} user carts from ${this.userCartFile}`);
            return true;
          }
        } catch (parseError: any) {
          console.error(`Error parsing user cart data file: ${parseError.message}`);
          console.log('Removing corrupted user cart data file');
          try {
            // Remove the corrupted file
            await fs.promises.unlink(this.userCartFile);
          } catch (unlinkError: any) {
            console.error(`Failed to remove corrupted user cart data file: ${unlinkError.message}`);
          }
          return false;
        }
      } else {
        console.log('No user cart data file found, starting with empty carts');
        return false;
      }
    } catch (error: any) {
      console.error('Failed to load user cart data:', error);
      return false;
    }
    return false;
  }

  // Methods to expose order data for persistence
  getOrdersData(): [number, Order][] {
    return Array.from(this.orders.entries());
  }
  
  getOrderItemsData(): [number, OrderItem][] {
    return Array.from(this.orderItems.entries());
  }
  
  getOrdersCount(): number {
    return this.orders.size;
  }
  
  getCurrentOrderIdCounter(): number {
    return this.orderId;
  }
  
  getCurrentOrderItemIdCounter(): number {
    return this.orderItemId;
  }
  
  setOrderIdCounter(id: number): void {
    this.orderId = id;
  }
  
  setOrderItemIdCounter(id: number): void {
    this.orderItemId = id;
  }
  
  resetOrdersMap(): void {
    this.orders = new Map<number, Order>();
  }
  
  resetOrderItemsMap(): void {
    this.orderItems = new Map<number, OrderItem>();
  }
  
  addOrderFromData(id: number, order: Order): void {
    this.orders.set(id, order);
  }
  
  addOrderItemFromData(id: number, orderItem: OrderItem): void {
    this.orderItems.set(id, orderItem);
  }

  // Save order data to disk
  private async saveOrderData(): Promise<boolean> {
    try {
      const orders = this.getOrdersData();
      const orderItems = this.getOrderItemsData();
      const orderData = {
        orders: orders.map(([id, order]) => ({
          ...order,
          // Convert Date objects to ISO strings for proper serialization
          createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt
        })),
        orderItems: orderItems.map(([id, item]) => ({
          ...item
        })),
        nextOrderId: this.getCurrentOrderIdCounter(),
        nextOrderItemId: this.getCurrentOrderItemIdCounter()
      };
      
      // Ensure the directory exists
      const dir = path.dirname(this.orderDataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await fs.promises.writeFile(
        this.orderDataFile,
        JSON.stringify(orderData, null, 2)
      );
      console.log(`Order data saved to ${this.orderDataFile}`);
      return true;
    } catch (error) {
      console.error('Failed to save order data:', error);
      return false;
    }
  }
  
  // Load order data from disk
  private async loadOrderData(): Promise<boolean> {
    try {
      if (fs.existsSync(this.orderDataFile)) {
        try {
          const data = await fs.promises.readFile(this.orderDataFile, 'utf8');
          const orderData = JSON.parse(data);
          
          // Reset order maps
          this.resetOrdersMap();
          this.resetOrderItemsMap();
          
          // Restore orders from file
          if (orderData.orders && Array.isArray(orderData.orders)) {
            orderData.orders.forEach((order: Order) => {
              // Convert ISO strings back to Date objects
              if (typeof order.createdAt === 'string') {
                order.createdAt = new Date(order.createdAt);
              }
              this.addOrderFromData(order.id, order);
            });
            
            // Restore order items from file
            if (orderData.orderItems && Array.isArray(orderData.orderItems)) {
              orderData.orderItems.forEach((item: OrderItem) => {
                this.addOrderItemFromData(item.id, item);
              });
            }
            
            // Set the next order IDs if provided
            if (orderData.nextOrderId) {
              this.setOrderIdCounter(orderData.nextOrderId);
            }
            
            if (orderData.nextOrderItemId) {
              this.setOrderItemIdCounter(orderData.nextOrderItemId);
            }
            
            console.log(`Loaded ${orderData.orders.length} orders and ${orderData.orderItems.length} order items from ${this.orderDataFile}`);
            return true;
          }
        } catch (parseError: any) {
          console.error(`Error parsing order data file: ${parseError.message}`);
          console.log('Removing corrupted order data file and initializing sample orders');
          try {
            // Remove the corrupted file
            await fs.promises.unlink(this.orderDataFile);
          } catch (unlinkError: any) {
            console.error(`Failed to remove corrupted order data file: ${unlinkError.message}`);
          }
          return false;
        }
      } else {
        console.log('No order data file found, will initialize with sample orders');
        return false;
      }
    } catch (error: any) {
      console.error('Failed to load order data:', error);
      return false;
    }
    return false;
  }

  // Save user data to disk
  private async saveUserData(): Promise<boolean> {
    try {
      const users = this.getUsersData();
      const userData = {
        users: users.map(([id, user]) => ({
          ...user,
          // Convert Date objects to ISO strings for proper serialization
          createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt
        })),
        nextUserId: this.getCurrentUserIdCounter()
      };
      
      // Ensure the directory exists
      const dir = path.dirname(this.userDataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await fs.promises.writeFile(
        this.userDataFile,
        JSON.stringify(userData, null, 2)
      );
      console.log(`User data saved to ${this.userDataFile}`);
      return true;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return false;
    }
  }
  
  // Load user data from disk
  private async loadUserData(): Promise<boolean> {
    try {
      if (fs.existsSync(this.userDataFile)) {
        try {
          const data = await fs.promises.readFile(this.userDataFile, 'utf8');
          const userData = JSON.parse(data);
          
          // Reset user map
          this.resetUsersMap();
          
          // Restore users from file
          if (userData.users && Array.isArray(userData.users)) {
            userData.users.forEach((user: User) => {
              // Convert ISO strings back to Date objects
              if (typeof user.createdAt === 'string') {
                user.createdAt = new Date(user.createdAt);
              }
              this.addUserFromData(user.id, user);
            });
            
            // Set the next user ID if provided
            if (userData.nextUserId) {
              this.setUserIdCounter(userData.nextUserId);
            }
            
            console.log(`Loaded ${userData.users.length} users from ${this.userDataFile}`);
            return true;
          }
        } catch (parseError: any) {
          console.error(`Error parsing user data file: ${parseError.message}`);
          console.log('Removing corrupted user data file and initializing default users');
          try {
            // Remove the corrupted file
            await fs.promises.unlink(this.userDataFile);
          } catch (unlinkError: any) {
            console.error(`Failed to remove corrupted user data file: ${unlinkError.message}`);
          }
          return false;
        }
      } else {
        console.log('No user data file found, will initialize with admin user');
        return false;
      }
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      return false;
    }
    return false;
  }

  // Clear data method for admin panel
  async clearAllData(): Promise<boolean> {
    // Don't clear users - keep login credentials persistent
    // Clear all other data
    this.resetProductsMap();
    this.resetOrdersMap();
    this.resetOrderItemsMap();
    this.resetCartMap();
    
    // Reset ID counters except userId
    this.setProductIdCounter(1);
    this.setOrderIdCounter(1);
    this.setOrderItemIdCounter(1);
    
    // Save the empty data
    await this.saveProductData();
    await this.saveOrderData();
    await this.saveCartData();
    
    return true;
  }
}

// Using MemStorage for development instead of DatabaseStorage
// This will fix the admin login issues and ensure proper functionality
// Later, for production with thousands of users, a proper database implementation should be used
export const storage = new MemStorage();

// DatabaseStorage commented out until proper database setup is available
// export const storage = new DatabaseStorage();
