#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🚀 Building for Railway...');

try {
  // Create dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }
  if (!existsSync('dist/public')) {
    mkdirSync('dist/public', { recursive: true });
  }
  
  console.log('📦 Installing dependencies...');
  execSync('npm install --no-optional --no-fund --no-audit', { stdio: 'inherit' });
  
  console.log('🔧 Building frontend...');
  // Build frontend with production config
  execSync('npx vite build --config vite.config.prod.ts', { stdio: 'inherit' });
  
  console.log('🔧 Building backend...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --target=node18', { 
    stdio: 'inherit' 
  });
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}