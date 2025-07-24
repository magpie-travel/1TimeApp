import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";
import http from "http";

if (process.cwd().endsWith("server")) {
  process.chdir(path.resolve(process.cwd(), ".."));
}

async function createApp() {
  const app = express();

  // Body parsing
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: false, limit: "50mb" }));

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJson: unknown;

    const origJson = res.json;
    res.json = function (body, ...args) {
      capturedJson = body;
      return origJson.apply(this, [body, ...args]);
    };

    res.on("finish", () => {
      if (reqPath.startsWith("/api")) {
        const duration = Date.now() - start;
        let line = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
        if (capturedJson !== undefined) {
          const json = JSON.stringify(capturedJson);
          line += ` :: ${json.length > 200 ? json.slice(0, 200) + "…" : json}`;
        }
        log(line);
      }
    });

    next();
  });

  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (process.env.NODE_ENV === "development") {
    const server = http.createServer(app);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  return app;
}

// For development - start server
if (process.env.NODE_ENV === "development") {
  createApp().then(app => {
    const server = http.createServer(app);
    const PORT = Number(process.env.PORT) || 5000;
    
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on http://0.0.0.0:${PORT}`);
    });
  });
}

// For Vercel - export handler
const appPromise = createApp();

export default async function handler(
  req: Parameters<http.RequestListener>[0],
  res: Parameters<http.RequestListener>[1],
) {
  const app = await appPromise;
  return app(req, res);
}
