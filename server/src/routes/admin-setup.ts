import express from 'express';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { storage } from '../../storage';

const router = express.Router();
const scryptAsync = promisify(scrypt);

// Hash password for admin creation
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Route to create or verify admin account
router.get('/setup-admin', async (req, res) => {
  try {
    // Check if admin user already exists
    const admin = await storage.getUserByUsername('admin');
    
    if (admin) {
      return res.json({ 
        success: true, 
        message: 'Admin user already exists', 
        username: admin.username,
        email: admin.email
      });
    }
    
    // Admin doesn't exist, create one
    const hashedPassword = await hashPassword('admin123');
    
    const newAdmin = await storage.createUser({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@shopelite.com',
      fullName: 'Admin User',
      isAdmin: true
    });
    
    return res.json({ 
      success: true, 
      message: 'Admin user created successfully',
      username: newAdmin.username,
      email: newAdmin.email
    });
  } catch (error) {
    console.error('Error in admin setup:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to set up admin user',
      error: String(error)
    });
  }
});

// Create an alternative admin user with a different username
router.get('/create-alt-admin', async (req, res) => {
  try {
    // Create a new admin user with different username
    const username = 'admin2';
    const email = 'admin2@shopelite.com';
    
    // Check if this admin already exists
    const existingAdmin = await storage.getUserByUsername(username);
    if (existingAdmin) {
      return res.json({
        success: true,
        message: 'Alternative admin already exists',
        username: existingAdmin.username,
        email: existingAdmin.email,
        note: 'Use password: admin123'
      });
    }
    
    // Create fresh password hash
    const hashedPassword = await hashPassword('admin123');
    
    // Create new admin
    const newAdmin = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      fullName: 'Admin User 2',
      isAdmin: true
    });
    
    return res.json({ 
      success: true, 
      message: 'Alternative admin created successfully',
      username: newAdmin.username,
      email: newAdmin.email,
      note: 'Use password: admin123'
    });
  } catch (error) {
    console.error('Error creating alt admin:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create alternative admin',
      error: String(error)
    });
  }
});

// Create an endpoint to check admin status of the current user
router.get('/check-admin', async (req, res) => {
  try {
    // Check if the user is authenticated and is an admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated',
        isLoggedIn: false,
        isAdmin: false
      });
    }
    
    return res.json({
      success: true,
      isLoggedIn: true,
      isAdmin: req.user?.isAdmin || false,
      user: {
        id: req.user?.id,
        username: req.user?.username,
        email: req.user?.email,
        isAdmin: req.user?.isAdmin || false
      }
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error checking admin status',
      error: String(error)
    });
  }
});

export default router; 