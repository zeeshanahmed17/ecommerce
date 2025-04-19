import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
// Import removed to avoid database dependency issues
import path from "path";
import fs from "fs";
import { EventEmitter } from "events";

// Create global event emitter for real-time updates
export const dataEvents = new EventEmitter();

// Middleware for requiring authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Middleware for requiring admin role
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Products API
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/featured", async (req, res) => {
    const featuredProducts = await storage.getFeaturedProducts();
    res.json(featuredProducts);
  });

  app.get("/api/products/category/:category", async (req, res) => {
    const { category } = req.params;
    const products = await storage.getProductsByCategoryName(category);
    res.json(products);
  });

  app.get("/api/products/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    const products = await storage.searchProducts(query);
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const product = await storage.getProductById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  });

  // Protected admin routes for product management
  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const success = await storage.deleteProduct(id);
    if (!success) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.status(204).end();
  });

  // Orders API
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      let orders;
      if (req.user?.isAdmin) {
        orders = await storage.getOrders();
      } else {
        orders = await storage.getOrdersByUserId(req.user.id);
      }
      
      // Enrich orders with product details
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const orderItems = await storage.getOrderItemsByOrderId(order.id);
          
          // Fetch product details for each order item
          const itemsWithProducts = await Promise.all(
            orderItems.map(async (item) => {
              const product = await storage.getProductById(item.productId);
              return {
                ...item,
                product: product ? {
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  sku: product.sku,
                  category: product.category
                } : null
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithProducts
          };
        })
      );
      
      res.json(enrichedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Error fetching orders" });
    }
  });

  // User Cart API
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const cartItems = await storage.getUserCart(req.user.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching user cart:", error);
      res.status(500).json({ message: "Error fetching cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const cartItems = req.body;
      if (!Array.isArray(cartItems)) {
        return res.status(400).json({ message: "Invalid cart data format" });
      }
      
      const saved = await storage.updateUserCart(req.user.id, cartItems);
      if (saved) {
        res.json({ message: "Cart updated successfully" });
      } else {
        res.status(500).json({ message: "Failed to update cart" });
      }
    } catch (error) {
      console.error("Error updating user cart:", error);
      res.status(500).json({ message: "Error updating cart" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    
    const order = await storage.getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Only admin or the order owner can view order details
    if (!req.user?.isAdmin && order.userId !== req.user?.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const orderItems = await storage.getOrderItemsByOrderId(order.id);
    
    // Fetch product details for each order item
    const enrichedOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await storage.getProductById(item.productId);
        return {
          ...item,
          product: product ? {
            id: product.id,
            name: product.name,
            imageUrl: product.imageUrl,
            sku: product.sku,
            category: product.category
          } : null
        };
      })
    );
    
    res.json({ ...order, items: enrichedOrderItems });
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { order: orderData, items } = req.body;
      
      // Make sure user ID is set to the logged-in user
      orderData.userId = req.user?.id;
      
      // Log the order details
      console.log("Creating order:", {
        userId: req.user?.id,
        total: orderData.total,
        items: items.length
      });
      
      try {
        // Create the order using the storage interface
        const newOrder = await storage.createOrder(orderData, items);
        
        // Emit event for real-time updates
        dataEvents.emit('order-created', newOrder);
        
        // Return the created order
        return res.status(201).json(newOrder);
      } catch (err: any) {
        // Check if this is an inventory validation error
        if (err.message && (
          err.message.includes('Insufficient inventory') || 
          err.message.includes('not found')
        )) {
          return res.status(400).json({ 
            message: "Inventory Error", 
            error: err.message,
            type: "INVENTORY_ERROR"
          });
        }
        
        // Re-throw other errors to be caught by the outer catch
        throw err;
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      return res.status(500).json({ 
        message: "Failed to create order", 
        error: error.message 
      });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    
    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: "Status is required" });
    }
    
    const order = await storage.updateOrderStatus(id, status);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  });

  // Analytics API (admin only)
  app.get("/api/analytics/recent-orders", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const period = (req.query.period as string) || 'monthly';
      const orders = await storage.getRecentOrders(limit, period);
      
      // Enrich orders with product details
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          const orderItems = await storage.getOrderItemsByOrderId(order.id);
          
          // Fetch product details for each order item
          const itemsWithProducts = await Promise.all(
            orderItems.map(async (item) => {
              const product = await storage.getProductById(item.productId);
              return {
                ...item,
                product: product ? {
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  sku: product.sku,
                  category: product.category
                } : null
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithProducts
          };
        })
      );
      
      res.json(enrichedOrders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Error fetching recent orders" });
    }
  });

  // Get top selling products
  app.get("/api/analytics/top-selling-products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Always use real data
      const limit = Number(req.query.limit) || 5;
      const period = (req.query.period as string) || 'monthly';
      const topProducts = await storage.getTopSellingProducts(limit, period);
      res.json(topProducts);
    } catch (error) {
      console.error("Error fetching top-selling products:", error);
      res.json([]);
    }
  });

  // Get low stock products
  app.get("/api/analytics/low-stock-products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Always use real data
      const threshold = Number(req.query.threshold) || 10;
      const lowStockProducts = await storage.getLowStockProducts(threshold);
      res.json(lowStockProducts);
    } catch (error) {
      console.error("Error fetching low-stock products:", error);
      res.json([]);
    }
  });

  // Get revenue statistics
  app.get("/api/analytics/revenue-stats", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Always use real data
      const period = (req.query.period as string) || 'monthly';
      const stats = await storage.getRevenueStats(period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching revenue stats:", error);
      res.json({
        daily: [],
        weekly: [],
        monthly: []
      });
    }
  });

  // Get category distribution
  app.get("/api/analytics/category-distribution", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Always use real data
      const period = (req.query.period as string) || 'monthly';
      const distribution = await storage.getCategoryDistribution(period);
      res.json(distribution);
    } catch (error) {
      console.error("Error fetching category distribution:", error);
      res.json([]);
    }
  });

  // Get payment method distribution
  app.get("/api/analytics/payment-method-distribution", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const period = (req.query.period as string) || 'monthly';
      const methodDistribution = await storage.getPaymentMethodDistribution(period);
      
      // Calculate totals for percentage calculations
      const totalOrders = methodDistribution.reduce((sum, item) => sum + item.count, 0);
      const totalAmount = methodDistribution.reduce((sum, item) => sum + item.amount, 0);
      
      // Add percentage data to the response
      const result = methodDistribution.map(item => ({
        method: item.method,
        count: item.count,
        amount: item.amount,
        percentage: totalOrders > 0 ? (item.count / totalOrders) * 100 : 0,
        amountPercentage: totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching payment method distribution:", error);
      res.json([]);
    }
  });

  // Dashboard summary for admin
  app.get("/api/analytics/dashboard-summary", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const period = (req.query.period as string) || 'monthly';
      
      // Always get fresh product data
      const products = await storage.getProducts();
      
      // Get low stock products
      const lowStockThreshold = 10;
      const lowStockItems = await storage.getLowStockProducts(lowStockThreshold);
      
      // Log for debugging
      console.log(`Found ${lowStockItems.length} low stock items (threshold: ${lowStockThreshold})`);
      
      // Use revenue data from getRevenueStats to ensure consistency
      const revenueStats = await storage.getRevenueStats(period);
      let totalRevenue = 0;
      
      // Sum up the revenue based on the period
      if (period === 'yearly' && revenueStats.monthly?.length) {
        totalRevenue = revenueStats.monthly.reduce((sum, item) => sum + item.revenue, 0);
      } else if (period === 'weekly' && revenueStats.weekly?.length) {
        totalRevenue = revenueStats.weekly.reduce((sum, item) => sum + item.revenue, 0);
      } else if (period === 'daily' && revenueStats.daily?.length) {
        totalRevenue = revenueStats.daily.reduce((sum, item) => sum + item.revenue, 0);
      } else {
        // Default to monthly
        totalRevenue = revenueStats.monthly.reduce((sum, item) => sum + item.revenue, 0);
      }
      
      // Get all orders for the specified period for accurate order count
      const allOrders = await storage.getOrders();
      const filteredOrders = period === 'all' 
        ? allOrders 
        : allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const now = new Date();
            let startDate;
            
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
            
            return orderDate >= startDate;
          });
      
      // Get recent orders for display in the dashboard (still limited to 10)
      const recentOrders = await storage.getRecentOrders(10, period);
      
      // Get distinct categories
      const categories = new Set();
      products.forEach(product => {
        if (product && product.category) {
          categories.add(product.category);
        }
      });
      
      const categoryDistribution = Array.from(categories).map(category => {
        const count = products.filter(p => p && p.category === category).length;
        return { category, count };
      });
      
      // Return simplified data structure
      res.json({
        totalRevenue,
        totalOrders: filteredOrders.length,
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          status: order.status || 'pending',
          total: order.total,
          createdAt: typeof order.createdAt === 'string' ? order.createdAt : new Date().toISOString()
        })),
        lowStockItems: lowStockItems.map(item => ({
          id: item.id,
          name: item.name,
          inventory: item.inventory,
          sku: item.sku,
          imageUrl: item.imageUrl,
          price: item.price
        })),
        categoryDistribution
      });
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      // Return empty data
      res.json({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        lowStockCount: 0,
        recentOrders: [],
        lowStockItems: [],
        categoryDistribution: []
      });
    }
  });

  // Setup Google authentication endpoint
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;
      
      console.log("Google auth request received:", {
        uid: uid ? "present" : "missing", 
        email: email || "missing",
        displayName: displayName || "not provided"
      });
      
      if (!uid || !email) {
        console.warn("Rejecting Google auth due to missing required fields");
        return res.status(400).json({ message: "Missing required user data" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.warn(`Invalid email format received: ${email}`);
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      console.log("Google auth request processing for:", email);
      
      // Check if user exists by email
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        try {
          // Create a new user with a username based on email
          // Generate a unique username with random suffix
          const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
          const username = baseUsername + '_' + Math.floor(Math.random() * 10000);
          const crypto = require('crypto');
          
          // Generate a secure random password since Google users won't need it
          const password = crypto.randomBytes(24).toString('hex');
          
          console.log(`Creating new user with username: ${username}`);
          
          user = await storage.createUser({
            username,
            email,
            fullName: displayName || email.split('@')[0],
            password,
            isAdmin: false
          });
          
          console.log("User created successfully:", username);
        } catch (createError) {
          console.error("Failed to create user:", createError);
          return res.status(500).json({ 
            message: "Unable to create user account",
            error: createError instanceof Error ? createError.message : "Unknown error" 
          });
        }
      } else {
        console.log("Existing user found:", user.username);
        // We'll use the existing user without modifying it
      }
      
      // Log in the user manually through Passport
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ 
            message: "Failed to login after Google auth",
            error: err instanceof Error ? err.message : "Unknown error"
          });
        }
        
        // Return user data without password
        const { password, ...userWithoutPassword } = user as any;
        console.log("Google auth successful for:", userWithoutPassword.username);
        return res.status(200).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(500).json({ 
        message: "Failed to authenticate with Google",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Admin endpoint to create users
  app.post("/api/admin/users", async (req, res) => {
    // Check if the user is authenticated and an admin
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        return res.status(400).json({ 
          message: "Username, email, and password are required" 
        });
      }
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash the password
      const { hashPassword } = require('./auth');
      const hashedPassword = await hashPassword(userData.password);
      
      // Create the user
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json({
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Password change endpoint
  app.post("/api/user/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords don't match" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    
    try {
      // Get the user from storage
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const { comparePasswords } = require('./auth');
      const passwordMatch = await comparePasswords(currentPassword, user.password);
      
      if (!passwordMatch) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash the new password
      const { hashPassword } = require('./auth');
      const hashedPassword = await hashPassword(newPassword);
      
      // Update the password
      const updatedUser = await storage.updateUserPassword(user.id, hashedPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      // Return success
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Data export routes have been removed to avoid database dependency issues

  // Add server-sent events endpoint for real-time updates
  app.get("/api/events", (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial connection established message
    res.write('data: {"type":"connected"}\n\n');
    
    // Define event handlers
    const orderCreatedHandler = (order: any) => {
      console.log('SSE: Notifying clients about new order:', order.id);
      res.write(`data: ${JSON.stringify({type: 'order-created', order})}\n\n`);
    };
    
    // Register event handlers
    dataEvents.on('order-created', orderCreatedHandler);
    
    // Clean up event handlers when client disconnects
    req.on('close', () => {
      dataEvents.off('order-created', orderCreatedHandler);
      console.log('SSE: Client disconnected');
    });
  });

  // Admin routes - restricted to admin users
  app.get('/api/admin/check', (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({ isAdmin: true });
  });

  // Add a new route to get all users data for admin
  app.get('/api/admin/users', (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Get all users from storage and convert from Map entries to array of users
      const users = storage.getUsersData().map(([id, user]) => {
        // Remove password for security
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      // Check if CSV format is requested
      const format = req.query.format;
      if (format === 'csv') {
        // Convert to CSV
        const fields = ['id', 'username', 'email', 'fullName', 'createdAt', 'isAdmin'];
        let csv = fields.join(',') + '\n';
        
        users.forEach(user => {
          const row = fields.map(field => {
            // Safely access properties with type checking
            if (field === 'id') return String(user.id || '');
            if (field === 'username') return `"${user.username}"`;
            if (field === 'email') return `"${user.email}"`;
            if (field === 'fullName') return `"${user.fullName || ''}"`;
            if (field === 'isAdmin') return String(user.isAdmin || false);
            if (field === 'createdAt' && user.createdAt) {
              return `"${new Date(user.createdAt).toISOString()}"`;
            }
            return '';
          });
          csv += row.join(',') + '\n';
        });
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        return res.send(csv);
      }
      
      // Default: return JSON
      res.json(users);
    } catch (error) {
      console.error('Error fetching users data:', error);
      res.status(500).json({ message: 'Error fetching users data' });
    }
  });

  // Add a new route to clear all mock data
  app.post('/api/admin/clear-data', async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      // Use the clearAllData method that preserves user data
      const success = await storage.clearAllData();
      
      if (success) {
        console.log('All mock data cleared by admin (user data preserved)');
        res.json({ 
          success: true, 
          message: 'All mock data has been cleared while preserving user accounts.' 
        });
      } else {
        throw new Error("Failed to clear data");
      }
    } catch (error) {
      console.error('Error clearing mock data:', error);
      res.status(500).json({ success: false, message: 'Error clearing mock data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
