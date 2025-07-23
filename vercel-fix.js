#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing Vercel deployment issues...');

// Check if we need to create a serverless function entry point
const apiDir = 'api';
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Create Vercel serverless function entry point
const serverlessHandler = `import { createServer } from '../dist/server/server/index.js';

let app;

export default async function handler(req, res) {
  if (!app) {
    app = await createServer();
  }
  return app(req, res);
}`;

fs.writeFileSync('api/index.js', serverlessHandler);
console.log('✅ Created serverless function entry point');

// Update vercel.json to use proper serverless functions
const vercelConfig = {
  "version": 2,
  "functions": {
    "api/index.js": {
      "runtime": "nodejs20.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
};

fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
console.log('✅ Updated vercel.json for serverless functions');

console.log('🚀 Vercel deployment fix complete!');