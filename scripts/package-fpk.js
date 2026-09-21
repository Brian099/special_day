const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const stagingDir = path.join(distDir, 'staging');

console.log('🚀 Starting FPK packaging process...');

// 1. Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 2. Clear staging directory
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 3. Helper to recursively copy directory
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('📦 Copying package files to staging...');

// Copy root manifest and icons
fs.copyFileSync(path.join(rootDir, 'manifest'), path.join(stagingDir, 'manifest'));
if (fs.existsSync(path.join(rootDir, 'ICON.PNG'))) {
  fs.copyFileSync(path.join(rootDir, 'ICON.PNG'), path.join(stagingDir, 'ICON.PNG'));
}
if (fs.existsSync(path.join(rootDir, 'ICON_256.PNG'))) {
  fs.copyFileSync(path.join(rootDir, 'ICON_256.PNG'), path.join(stagingDir, 'ICON_256.PNG'));
}

// Copy cmd, config, and app
copyDirRecursive(path.join(rootDir, 'cmd'), path.join(stagingDir, 'cmd'));
copyDirRecursive(path.join(rootDir, 'config'), path.join(stagingDir, 'config'));
copyDirRecursive(path.join(rootDir, 'app'), path.join(stagingDir, 'app'));

console.log('🔨 Executing fnpack build...');
const fnpackExe = path.join(rootDir, 'fnpack.exe');

try {
  const result = execSync(`"${fnpackExe}" build -d "${stagingDir}"`, {
    cwd: rootDir,
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(result);
} catch (err) {
  console.error('fnpack build failed:', err.stdout || err.message);
  process.exit(1);
}

// Check generated fpk in root or dist
const rootFiles = fs.readdirSync(rootDir);
const fpkFiles = rootFiles.filter(f => f.endsWith('.fpk'));

console.log('\n✨ FPK Package created successfully:');
for (const fpk of fpkFiles) {
  const fpkPath = path.join(rootDir, fpk);
  const stat = fs.statSync(fpkPath);
  const sizeMb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`🎉 ${fpk} (${sizeMb} MB) -> ${fpPathNormalized(fpkPath)}`);
}

// Clean up staging
try {
  fs.rmSync(stagingDir, { recursive: true, force: true });
} catch {}

function fpPathNormalized(p) {
  return p.replace(/\\/g, '/');
}
