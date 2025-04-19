import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// User model
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Product model
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  inventory: integer("inventory").notNull().default(0),
  sku: text("sku").notNull().unique(),
  featured: integer("featured", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Order model
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Order item model
export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users, {
  isAdmin: z.boolean().default(false),
}).omit({ id: true, createdAt: true });

export const insertProductSchema = createInsertSchema(products, {
  featured: z.boolean().default(false),
}).omit({ id: true, createdAt: true });

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// Cart item schema (not stored in database - only in session)
export const cartItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1),
  product: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    imageUrl: z.string(),
    category: z.string(),
    sku: z.string()
  })
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type CartItem = z.infer<typeof cartItemSchema>; 