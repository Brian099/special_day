const fs = require('fs');
const path = require('path');

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
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        // If file is locked, ignore or warn
      }
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
const frontendDist = path.join(rootDir, 'frontend/dist');
const backendDist = path.join(rootDir, 'backend/dist');
const targetUi = path.join(rootDir, 'app/ui');
const targetBackend = path.join(rootDir, 'app/backend');

console.log('Syncing fonts...');
const rootFonts = path.join(rootDir, 'fonts');
const publicFonts = path.join(rootDir, 'frontend/public/fonts');
const uiFonts = path.join(targetUi, 'fonts');

if (fs.existsSync(rootFonts)) {
  copyDirRecursive(rootFonts, publicFonts);
  copyDirRecursive(rootFonts, uiFonts);
}

console.log('Syncing frontend build to app/ui...');
if (fs.existsSync(frontendDist)) {
  const assetsDir = path.join(targetUi, 'assets');
  if (fs.existsSync(assetsDir)) {
    fs.rmSync(assetsDir, { recursive: true, force: true });
  }
  copyDirRecursive(frontendDist, targetUi);
}

console.log('Syncing backend build to app/backend...');
if (fs.existsSync(backendDist)) {
  copyDirRecursive(backendDist, targetBackend);
}

// Copy backend package.json to app/backend/package.json
const backendPkg = path.join(rootDir, 'backend/package.json');
if (fs.existsSync(backendPkg)) {
  try {
    fs.copyFileSync(backendPkg, path.join(targetBackend, 'package.json'));
  } catch {}
}

// Copy backend node_modules to app/backend/node_modules if not exists or update non-locked
const backendModules = path.join(rootDir, 'backend/node_modules');
const targetModules = path.join(targetBackend, 'node_modules');

console.log('Syncing backend node_modules to app/backend/node_modules...');
if (fs.existsSync(backendModules)) {
  if (fs.existsSync(targetModules)) {
    try {
      fs.rmSync(targetModules, { recursive: true, force: true });
    } catch {}
  }
  copyDirRecursive(backendModules, targetModules);
}

console.log('✨ Build synchronized successfully to app/ structure ready for fnpack packaging!');
