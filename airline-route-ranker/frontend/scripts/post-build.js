// Copy index.html to 200.html for SPA routing on Render
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get build directory from environment or use default
const buildDir = path.resolve(__dirname, '../build');

// Check if build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('Build directory does not exist:', buildDir);
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(buildDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('index.html does not exist:', indexPath);
  process.exit(1);
}

// Copy index.html to 200.html
const html200Path = path.join(buildDir, '200.html');
fs.copyFileSync(indexPath, html200Path);
console.log('✅ Created 200.html for SPA routing on Render');

// Copy index.html to 404.html as well for safety
const html404Path = path.join(buildDir, '404.html');
fs.copyFileSync(indexPath, html404Path);
console.log('✅ Created 404.html for SPA routing on Render');

// Create _redirects file (crucial for Render static sites)
const redirectsPath = path.join(buildDir, '_redirects');
fs.writeFileSync(redirectsPath, '/* /index.html 200');
console.log('✅ Created _redirects file for SPA routing on Render'); 