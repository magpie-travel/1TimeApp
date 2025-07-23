#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔨 Building production version...');

// Clean and build
console.log('📦 Building client and server...');
execSync('npm run build', { stdio: 'inherit' });

// Fix the vite.config import in the compiled server file
console.log('🔧 Fixing ES module imports...');
const viteJsPath = 'dist/server/vite.js';
if (fs.existsSync(viteJsPath)) {
  let content = fs.readFileSync(viteJsPath, 'utf8');
  content = content.replace(
    'import viteConfig from "../vite.config";',
    'import viteConfig from "../vite.config.js";'
  );
  fs.writeFileSync(viteJsPath, content);
  console.log('✅ Fixed vite.config import');
}

// Create a production startup script
console.log('📝 Creating production startup script...');
const startScript = `#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

// Start the server
import('./server/index.js');
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