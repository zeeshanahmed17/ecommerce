import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon database connection for WebSocket support
neonConfig.webSocketConstructor = ws;

// Create a PostgreSQL connection pool
let pool: Pool | null = null;

// Initialize database connection
export function initializeDb() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL environment variable');
      return false;
    }

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('Database connection pool initialized');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Execute a SQL query directly
export async function executeQuery(query: string, params: any[] = []) {
  if (!pool) {
    const initialized = initializeDb();
    if (!initialized) {
      throw new Error('Database connection not available');
    }
  }

  try {
    const result = await pool!.query(query, params);
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Direct export function to get data in CSV format
export async function exportTableToCSV(tableName: string): Promise<string> {
  try {
    // Validate table name to prevent SQL injection
    const validTables = ['users', 'products', 'orders', 'order_items'];
    if (!validTables.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
    
    // Get data from the table
    const result = await executeQuery(`SELECT * FROM ${tableName}`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      return 'No data available';
    }
    
    // Convert to CSV
    const header = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(row => {
      return Object.values(row).map(value => {
        // Handle null values
        if (value === null) return '';
        
        // Format dates
        if (value instanceof Date) {
          return value.toISOString();
        }
        
        // Escape and quote strings with commas, quotes or newlines
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        
        return str;
      }).join(',');
    });
    
    return [header, ...csvRows].join('\n');
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
    throw error;
  }
}