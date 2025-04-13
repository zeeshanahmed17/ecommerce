import crypto from 'crypto';
import pg from 'pg';
const { Pool } = pg;

async function generateHashedPassword(password) {
  // Use the same algorithm as in auth.ts
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

async function createAdminUser() {
  // Create hashed password
  const password = 'admin123';
  const hashedPassword = await generateHashedPassword(password);
  console.log('Generated hashed password:', hashedPassword);
  
  // Insert into database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    const result = await pool.query(
      `INSERT INTO users (username, password, email, full_name, is_admin, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      ['admin', hashedPassword, 'admin@example.com', 'Admin User', true]
    );
    
    console.log('Admin user created with ID:', result.rows[0].id);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();