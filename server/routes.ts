import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { initializeDb, exportTableToCSV } from "./direct-db";
import { exportDataToCSV } from "./export";
import path from "path";
import fs from "fs";

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
  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
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

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
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
    
    let orders;
    if (req.user?.isAdmin) {
      orders = await storage.getOrders();
    } else {
      orders = await storage.getOrdersByUserId(req.user.id);
    }
    
    res.json(orders);
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
    
    res.json({ ...order, items: orderItems });
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const orderSchema = insertOrderSchema.omit({ userId: true });
      const orderItemsSchema = z.array(insertOrderItemSchema.omit({ id: true, orderId: true }));
      
      const { order: orderData, items } = z.object({
        order: orderSchema,
        items: orderItemsSchema
      }).parse(req.body);
      
      // Add user ID from authenticated user
      const orderWithUserId = { ...orderData, userId: req.user?.id };
      
      const order = await storage.createOrder(orderWithUserId, items);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid order data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create order" });
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
    
    const limit = parseInt(req.query.limit as string) || 10;
    const orders = await storage.getRecentOrders(limit);
    res.json(orders);
  });

  app.get("/api/analytics/low-stock", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const threshold = parseInt(req.query.threshold as string) || 10;
    const products = await storage.getLowStockProducts(threshold);
    res.json(products);
  });

  app.get("/api/analytics/revenue", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const stats = await storage.getRevenueStats();
    res.json(stats);
  });

  app.get("/api/analytics/categories", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const distribution = await storage.getCategoryDistribution();
    res.json(distribution);
  });

  // Data Export API for Excel
  app.get("/api/export/excel", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Initialize the database connection if not already done
      initializeDb();
      
      // Return links to each available table
      const exportLinks = [
        { name: 'Users', url: '/api/export/users' },
        { name: 'Products', url: '/api/export/products' },
        { name: 'Orders', url: '/api/export/orders' },
        { name: 'Order Items', url: '/api/export/order_items' }
      ];
      
      res.json({ 
        success: true, 
        message: "Data export ready. Click on the links below to download each table.", 
        links: exportLinks 
      });
    } catch (error) {
      console.error('Error in export route:', error);
      res.status(500).json({ 
        success: false,
        message: "An error occurred during data export preparation", 
        error: String(error)
      });
    }
  });

  // Download individual CSV files directly from database
  app.get("/api/export/:table", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { table } = req.params;
    
    // Check for valid table names to prevent injection
    const validTables = ['users', 'products', 'orders', 'order_items'];
    if (!validTables.includes(table)) {
      return res.status(400).json({ message: "Invalid table name" });
    }
    
    try {
      // Get the CSV data directly from the database
      const csvData = await exportTableToCSV(table);
      
      // Set the appropriate headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${table}.csv`);
      
      // Send the CSV data
      res.send(csvData);
    } catch (error) {
      console.error(`Error exporting ${table}:`, error);
      res.status(500).json({ 
        message: `Failed to export ${table}`, 
        error: String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
