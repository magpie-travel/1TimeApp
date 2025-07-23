#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔨 Building for Vercel deployment...');

// Step 1: Run normal build
console.log('📦 Running npm build...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Fix the vite.js file in dist to remove vite.config import
console.log('🔧 Fixing ES module imports for Vercel...');
const viteJsPath = 'dist/server/server/vite.js';

if (fs.existsSync(viteJsPath)) {
  let content = fs.readFileSync(viteJsPath, 'utf8');
  
  // Create embedded vite config
  const embeddedViteConfig = `{
  plugins: [],
  resolve: {
    alias: {
      "@": "client/src",
      "@shared": "shared",
      "@assets": "attached_assets",
    },
  },
  root: "client",
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}`;

  // Replace the import statement with embedded config
  content = content.replace(
    /import viteConfig from ["'][^"']+["'];/g,
    `// Embedded vite config to avoid import issues in Vercel\nconst viteConfig = ${embeddedViteConfig};`
  );
  
  // Also handle the case where it might be compiled differently
  content = content.replace(
    /from ["']\.\.\/vite\.config["'];/g,
    '// vite config import removed'
  );
  
  // Fix distPath resolution for Vercel serverless environment
  content = content.replace(
    /const distPath = path\.resolve\(import\.meta\.dirname, "public"\);/g,
    'const distPath = path.resolve(import.meta.dirname, "..", "..", "public");'
  );
  
  fs.writeFileSync(viteJsPath, content);
  console.log('✅ Fixed vite.js for Vercel deployment');
} else {
  console.error('❌ Could not find dist/server/server/vite.js');
}

// Step 3: Create Vercel-compatible API handler
console.log('📋 Creating Vercel API handler...');
const apiHandler = `import express from "express";
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
}`;

// Ensure api directory exists
if (!fs.existsSync('api')) {
  fs.mkdirSync('api', { recursive: true });
}

fs.writeFileSync('api/index.js', apiHandler);
console.log('✅ Created Vercel API handler');

console.log('🚀 Vercel build preparation complete!');
console.log('');
console.log('Next steps:');
console.log('1. Commit and push changes');
console.log('2. Deploy to Vercel');
console.log('3. API will work without vite.config import errors');