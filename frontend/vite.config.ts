import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function dynamicFontPlugin(): Plugin {
  return {
    name: 'dynamic-font-plugin',
    configureServer(server) {
      server.middlewares.use('/api/custom-font/file', (req, res, next) => {
        const fontsDir = path.resolve(__dirname, 'public/fonts');
        if (fs.existsSync(fontsDir)) {
          const files = fs.readdirSync(fontsDir);
          const fontFile = files.find(f => /\.(ttf|otf|woff2|woff)$/i.test(f));
          if (fontFile) {
            const ext = path.extname(fontFile).toLowerCase();
            const mime = ext === '.otf' ? 'font/otf' : ext === '.woff2' ? 'font/woff2' : ext === '.woff' ? 'font/woff' : 'font/ttf';
            res.setHeader('Content-Type', mime);
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
            return fs.createReadStream(path.join(fontsDir, fontFile)).pipe(res);
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), dynamicFontPlugin()],
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:6921',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});

