#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Building production version...');

// Clean and build
console.log('📦 Building client and server...');
execSync('npm run build', { stdio: 'inherit' });

// Copy vite.config.ts to dist as vite.config.js for production
console.log('📋 Copying vite config...');
fs.copyFileSync('vite.config.ts', 'dist/vite.config.js');

// Fix the vite.config import in the compiled server file - ACTUAL STRUCTURE
console.log('🔧 Fixing ES module imports...');
const viteJsPath = 'dist/server/server/vite.js';  // Actual path where files are compiled
if (fs.existsSync(viteJsPath)) {
  let content = fs.readFileSync(viteJsPath, 'utf8');
  // Fix the import path - from dist/server/server/ it should go up two levels to reach vite.config.js
  content = content.replace(
    /import viteConfig from ["']\.\.\/vite\.config["'];/g,
    'import viteConfig from "../../vite.config.js";'
  );
  fs.writeFileSync(viteJsPath, content);
  console.log('✅ Fixed vite.config import path in dist/server/server/vite.js');
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