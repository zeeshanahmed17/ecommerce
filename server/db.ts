import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import BetterSQLite3 from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";
import * as schemaSQLite from "@shared/schema-sqlite";
import path from 'path';
import fs from 'fs';
import { scrypt, randomBytes, scryptSync } from 'crypto';
import { promisify } from 'util';
import { Database } from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import BetterSqlite3 from 'better-sqlite3';

// Hash password function (simplified version of what's in auth.ts)
async function hashPasswordForSetup(password: string): Promise<string> {
  const scryptAsync = promisify(scrypt);
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Required for Neon serverless to work with WebSockets
neonConfig.webSocketConstructor = ws;

// Set up database based on environment
const isProd = process.env.NODE_ENV === 'production';

// In development mode, we'll use SQLite by default unless a postgres DATABASE_URL is provided
// In production, DATABASE_URL must be provided
if (isProd && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set for production environment",
  );
}

let db;

// Initialize SQLite tables
function initSQLiteTables(sqlite: BetterSQLite3.Database) {
  console.log("Initializing SQLite database tables...");
  
  // Drop existing tables to ensure clean setup - in correct order to avoid FK constraints
  sqlite.exec(`DROP TABLE IF EXISTS order_items;`);
  sqlite.exec(`DROP TABLE IF EXISTS orders;`);
  sqlite.exec(`DROP TABLE IF EXISTS products;`);
  sqlite.exec(`DROP TABLE IF EXISTS users;`);
  
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create products table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      category TEXT NOT NULL,
      inventory INTEGER DEFAULT 0,
      sku TEXT NOT NULL UNIQUE,
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create orders table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      shipping_address TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create order_items table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL
    );
  `);
  
  // Add a sample admin user directly with plain password
  sqlite.exec(`
    INSERT INTO users (username, password, email, full_name, is_admin)
    VALUES ('admin', 'admin123', 'admin@shopelite.com', 'Admin User', 1)
  `);
  console.log("Added admin user with plain password (username=admin, password=admin123)");
  
  // Add sample products
  sqlite.exec(`
    INSERT INTO products (name, description, price, image_url, category, inventory, sku, featured)
    VALUES 
    ('Premium Headphones', 'Superior sound quality for music lovers.', 149.99, 'https://images.unsplash.com/photo-1560343090-f0409e92791a?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80', 'Electronics', 23, 'HP-100-BK', 1),
    ('Smartwatch Pro', 'Track fitness and stay connected.', 199.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80', 'Electronics', 15, 'SW-PRO-BK', 1),
    ('Eco-Friendly Water Bottle', 'Sustainable hydration solution.', 24.99, 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80', 'Home & Kitchen', 3, 'WB-ECO-GR', 0),
    ('Running Shoes', 'Professional athletic footwear.', 89.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&h=500&q=80', 'Fashion', 8, 'RN-SH-BL-10', 1)
  `);
  console.log("Added sample products to the database");

  // Add a sample order
  sqlite.exec(`
    INSERT INTO orders (user_id, status, total, payment_method, payment_status, shipping_address)
    VALUES (1, 'pending', 224.98, 'credit_card', 'completed', '123 Main St, Anytown, USA')
  `);
  
  // Add sample order items
  sqlite.exec(`
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES 
    (1, 1, 1, 149.99),
    (1, 3, 3, 24.99)
  `);
  console.log("Added sample order data");
  
  console.log("SQLite database initialization complete");
}

// Check if DATABASE_URL is a PostgreSQL connection string
const isPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

if (isProd || isPostgresUrl) {
  // Production or PostgreSQL connection - use PostgreSQL
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set for PostgreSQL connection");
  }
  const pool = new Pool({ connectionString });
  db = drizzle(pool, { schema });
  console.log("Using PostgreSQL database");
} else {
  // Development - use SQLite
  const dbDir = path.resolve(process.cwd(), 'data');
  
  // Ensure the data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const dbPath = path.join(dbDir, 'dev.db');
  const sqlite = new BetterSQLite3(dbPath);
  
  // Enable WAL mode for better concurrency and performance
  sqlite.pragma('journal_mode = WAL');
  
  // Force SQLite to be strict about data types
  sqlite.pragma('foreign_keys = ON');
  
  // Initialize SQLite database tables
  initSQLiteTables(sqlite);
  
  db = drizzleSQLite(sqlite, { schema: schemaSQLite });
  
  console.log(`Using SQLite database at: ${dbPath}`);
}

// Determine if we're using SQLite or PostgreSQL
const DB_URL = process.env.DATABASE_URL || '';
const isSQLite = DB_URL.startsWith('sqlite:');

// Get the SQLite file path from the connection string
const getSQLiteFilePath = (url: string) => {
  return url.replace('sqlite:', '');
};

// Initialize SQLite database
console.log('Initializing SQLite database...');
const dbFilePath = getSQLiteFilePath(DB_URL);

// Ensure the data directory exists
const dataDir = path.dirname(dbFilePath);
if (!fs.existsSync(dataDir)) {
  console.log(`Creating data directory: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

// Create the database file if it doesn't exist
if (!fs.existsSync(dbFilePath)) {
  console.log(`Creating new SQLite database file: ${dbFilePath}`);
  fs.writeFileSync(dbFilePath, '');
}

// Initialize the SQLite connection
const sqlite = new BetterSqlite3(dbFilePath);
export const dbSQLite = drizzleSQLite(sqlite, { schema: schemaSQLite });

// Log SQLite queries in development
if (process.env.NODE_ENV === 'development') {
  sqlite.exec('PRAGMA foreign_keys = ON');
  console.log('SQLite foreign keys enabled');
}

// Initialize database tables
export async function initializeTables() {
  try {
    console.log('Initializing SQLite database tables...');
    
    // Create users table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        is_admin INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create products table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price REAL NOT NULL,
        image_url TEXT NOT NULL,
        category TEXT NOT NULL,
        inventory INTEGER NOT NULL DEFAULT 0,
        sku TEXT NOT NULL UNIQUE,
        featured INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create orders table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create order_items table if it doesn't exist
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );
    `);
    
    console.log('SQLite tables initialized successfully');
  } catch (error) {
    console.error('Error initializing SQLite tables:', error);
    throw error;
  }
}

export { db };