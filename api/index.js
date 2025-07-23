import express from "express";
import { registerRoutes } from "../dist/server/server/routes.js";
import { serveStatic, log } from "../dist/server/server/vite.js";

let app;

export default async function handler(req, res) {
  if (!app) {
    app = express();
    
    // Middleware setup
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false, limit: '50mb' }));

    // Register API routes
    await registerRoutes(app);

    // Error handling
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });

    // Serve static files
    serveStatic(app);
  }

  return app(req, res);
}