import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // For development mode, allow direct comparison for admin
  if (process.env.NODE_ENV !== 'production' && supplied === stored && supplied === 'admin123') {
    console.log("Using direct password comparison for admin account only");
    return true;
  }
  
  // Handle properly hashed passwords 
  if (stored.includes('.')) {
    try {
      const [hashed, salt] = stored.split(".");
      const hashedBuf = Buffer.from(hashed, "hex");
      const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
      return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error("Error comparing passwords:", error);
      return false;
    }
  }
  
  // No fallback for plain text passwords - ensure all passwords are hashed
  console.error("Attempted to use an unhashed password");
  return false;
}

export function setupAuth(app: Express) {
  console.log("Setting up authentication");
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Create a simple in-memory store that doesn't rely on the database
  const memoryStore = new session.MemoryStore();
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "shopelite-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore, // Use the session store from storage
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax'
    }
  };

  if (process.env.NODE_ENV === "production") {
    console.log("Using production session settings");
    app.set("trust proxy", 1); // trust first proxy
  } else {
    console.log("Using development session settings");
  }
  
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for: ${username}`);
        
        // Check if login is using email or username
        let user;
        if (username.includes('@')) {
          user = await storage.getUserByEmail(username);
          console.log(`Found user by email: ${!!user}`);
        } else {
          user = await storage.getUserByUsername(username);
          console.log(`Found user by username: ${!!user}`);
        }
        
        if (!user) {
          console.log("Login failed: User not found");
          return done(null, false, { message: "Invalid username or email" });
        }
        
        // For admin user in development, provide a special case
        const isAdmin = user.isAdmin === true;
        const isAdminCredentials = (username === 'admin' || username === 'admin@shopelite.com') && password === 'admin123';
        
        if (process.env.NODE_ENV !== 'production' && isAdmin && isAdminCredentials) {
          console.log("Admin login in development mode successful");
          return done(null, user);
        }
        
        // Regular password checking for all users
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`Password match: ${passwordMatch}`);
        
        if (!passwordMatch) {
          return done(null, false, { message: "Invalid password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error("Login error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Extended validation schema
      const registerSchema = insertUserSchema.extend({
        confirmPassword: z.string()
      }).refine(data => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });
      
      const userData = registerSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password)
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: error.errors 
        });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login request received:", req.body.username);
    
    // Add more detailed logging
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info?.message || "Unknown reason");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return next(loginErr);
        }
        
        console.log(`User ${user.username} (${user.id}) logged in successfully`);
        console.log(`User is${user.isAdmin ? '' : ' not'} an admin`);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
