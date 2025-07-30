// Load environment variables first
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeTables } from "./db";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize database tables
initializeTables()
  .then(() => {
    startServer();
  })
  .catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

async function startServer() {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Get port from environment variable with fallback
    const port = process.env.PORT || 5000;
    
    // Start the server with error handling for port conflicts
    server.listen(port, () => {
      log(`Server started successfully on port ${port}`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please use a different port.`);
        
        // Try an alternative port
        const altPort = Number(port) + 1;
        console.log(`Attempting to use alternative port: ${altPort}`);
        
        server.listen(altPort, () => {
          log(`Server started successfully on alternative port ${altPort}`);
        }).on('error', (altError: any) => {
          console.error(`Failed to start on alternative port: ${altError.message}`);
          process.exit(1);
        });
      } else {
        console.error(`Failed to start server: ${error.message}`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
}
