#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔧 Fixing Vercel path resolution issues...');

// Run normal build first
execSync('npm run build', { stdio: 'inherit' });

// Fix path resolution in compiled vite.js for Vercel serverless compatibility
const viteJsPath = 'dist/server/server/vite.js';
if (fs.existsSync(viteJsPath)) {
  let content = fs.readFileSync(viteJsPath, 'utf8');
  
  // Replace import.meta.dirname with process.cwd() for serverless compatibility
  content = content.replace(
    /const distPath = path\.resolve\(import\.meta\.dirname, "public"\);/g,
    'const distPath = path.resolve(process.cwd(), "dist/public");'
  );
  
  // Also fix any other import.meta.dirname references for static files
  content = content.replace(
    /path\.resolve\(import\.meta\.dirname, "public"\)/g,
    'path.resolve(process.cwd(), "dist/public")'
  );
  
  fs.writeFileSync(viteJsPath, content);
  console.log('✅ Fixed path resolution for Vercel serverless environment');
} else {
  console.error('❌ Could not find dist/server/server/vite.js');
}

console.log('🚀 Vercel path fix complete!');