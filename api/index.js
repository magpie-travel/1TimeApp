import express from "express";
import { registerRoutes } from "../dist/server/server/routes.js";
import { serveStatic, log } from "../dist/server/server/vite.js";
import path from "path";

let app;

export default async function handler(req, res) {
  if (!app) {
    app = express();
    
    // Increase payload limits for image/video uploads
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false, limit: '50mb' }));

    // Request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      const path = req.path;
      let capturedJsonResponse;

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

    // Register API routes
    await registerRoutes(app);

    // Error handling middleware
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Serve static files in production
    serveStatic(app);
  }

  return app(req, res);
}