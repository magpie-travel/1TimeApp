#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Building production version...');

// Clean and build
console.log('📦 Building client and server...');
execSync('npm run build', { stdio: 'inherit' });

// Create a production-safe vite.config.js without top-level await
console.log('📋 Creating production-safe vite config...');
const productionViteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
  ];

  // Only add cartographer plugin in development with Replit
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      plugins.push(cartographer());
    } catch (e) {
      // Cartographer plugin not available, continue without it
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
`;

fs.writeFileSync('dist/vite.config.js', productionViteConfig);

// Fix the vite.config import by embedding config directly - BULLETPROOF SOLUTION
console.log('🔧 Fixing ES module imports with embedded vite config...');
const viteJsPath = 'dist/server/server/vite.js';  // Actual path where files are compiled
if (fs.existsSync(viteJsPath)) {
  let content = fs.readFileSync(viteJsPath, 'utf8');
  
  // Create embedded vite config that doesn't need external import
  const embeddedViteConfig = `{
  plugins: [],
  resolve: {
    alias: {
      "@": "/client/src",
      "@shared": "/shared",
      "@assets": "/attached_assets",
    },
  },
  root: "/client",
  build: {
    outDir: "/dist/public",
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}`;

  // Replace the import statement and viteConfig usage
  content = content.replace(
    /import viteConfig from ["'][^"']+["'];/g,
    `// Embedded vite config to avoid import issues\nconst viteConfig = ${embeddedViteConfig};`
  );
  
  fs.writeFileSync(viteJsPath, content);
  console.log('✅ Embedded vite config directly in dist/server/server/vite.js');
}

// Also check for any other missing .js extensions in server files
const serverDir = 'dist/server/server';  // Actual server directory where files are compiled
if (fs.existsSync(serverDir)) {
  const serverFiles = fs.readdirSync(serverDir).filter(f => f.endsWith('.js'));
  for (const file of serverFiles) {
    const filePath = path.join(serverDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix relative imports missing .js extensions
    content = content.replace(
      /from ['"](\.\/.+?)['"](?<!\.js['"])/g,
      'from "$1.js"'
    );
    
    fs.writeFileSync(filePath, content);
  }
  console.log('✅ Fixed all ES module imports in server files');
}

// Create a production startup script
console.log('📝 Creating production startup script...');
const startScript = `#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

// Start the server - ACTUAL PATH
import('./server/server/index.js');
`;

fs.writeFileSync('dist/start.js', startScript);
fs.chmodSync('dist/start.js', '755');

console.log('🚀 Production build complete!');
console.log('');
console.log('To run in production:');
console.log('  cd dist && NODE_ENV=production node start.js');
console.log('');
console.log('For deployment platforms, use:');
console.log('  NODE_ENV=production node dist/start.js');