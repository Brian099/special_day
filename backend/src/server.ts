import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import { authMiddleware } from './middlewares/auth';
import { authController } from './controllers/authController';
import { eventController } from './controllers/eventController';
import { categoryController } from './controllers/categoryController';
import { settingController } from './controllers/settingController';
import { calculateEvent, getCurrentSolarTermInfo } from './services/lunarService';
import { initCronJobs } from './services/cronService';

dotenv.config();

// 1. Initialize App
const app = express();
app.use(cors());
app.use(express.json());

// 3. API Routes

// Public Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Current Solar Term & Traditional Color Theme API
app.get('/api/solar-terms/current', (req, res) => {
  try {
    const termInfo = getCurrentSolarTermInfo();
    res.json({ success: true, data: termInfo });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || '获取节气信息失败' });
  }
});

// Helper to detect any custom font placed in fonts directories
function findCustomFontFile(): { filePath: string; fileName: string; format: string; mimeType: string; mtime: number } | null {
  const possibleDirs = [
    path.join(__dirname, '../../frontend/public/fonts'),
    path.join(__dirname, '../../app/ui/fonts'),
    path.join(__dirname, '../ui/fonts'),
    path.join(__dirname, '../../frontend/dist/fonts'),
    path.join(__dirname, '../../fonts'),
    path.join(process.cwd(), 'fonts'),
    path.join(process.cwd(), 'frontend/public/fonts'),
    path.join(process.cwd(), 'app/ui/fonts')
  ];

  const validExts: Record<string, { format: string; mimeType: string }> = {
    '.woff2': { format: 'woff2', mimeType: 'font/woff2' },
    '.woff': { format: 'woff', mimeType: 'font/woff' },
    '.ttf': { format: 'truetype', mimeType: 'font/ttf' },
    '.otf': { format: 'opentype', mimeType: 'font/otf' }
  };

  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (validExts[ext]) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            return {
              filePath,
              fileName: file,
              format: validExts[ext].format,
              mimeType: validExts[ext].mimeType,
              mtime: stat.mtimeMs
            };
          }
        }
      } catch {}
    }
  }
  return null;
}

// Public Dynamic Font Routes (supports any font placed in fonts folder)
app.get('/api/custom-font/file', (req, res) => {
  const font = findCustomFontFile();
  if (!font) {
    return res.status(404).send('No custom font found');
  }
  res.setHeader('Content-Type', font.mimeType);
  res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  res.setHeader('ETag', `"${font.mtime}"`);
  res.sendFile(font.filePath);
});

app.get('/api/custom-font', (req, res) => {
  const font = findCustomFontFile();
  if (!font) {
    return res.json({ success: true, fontExists: false });
  }
  res.json({
    success: true,
    fontExists: true,
    fileName: font.fileName,
    format: font.format,
    url: '/api/custom-font/file'
  });
});

// Calculation preview route (no auth strictly required, helps realtime form editing)
app.post('/api/preview/calculate', (req, res) => {
  try {
    const calc = calculateEvent(req.body);
    res.json({ success: true, data: calc });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || '计算失败' });
  }
});

// Protected routes
app.use('/api', authMiddleware);

// User & Auth
app.get('/api/auth/me', authController.getCurrentUser);

// Events
app.get('/api/events', eventController.getEvents);
app.get('/api/events/:id', eventController.getEventById);
app.post('/api/events', eventController.createEvent);
app.put('/api/events/:id', eventController.updateEvent);
app.delete('/api/events/:id', eventController.deleteEvent);
app.post('/api/events/:id/pin', eventController.togglePin);

// Categories
app.get('/api/categories', categoryController.getCategories);
app.post('/api/categories', categoryController.createCategory);
app.put('/api/categories/:id', categoryController.updateCategory);
app.delete('/api/categories/:id', categoryController.deleteCategory);

// Settings
app.get('/api/settings', settingController.getSettings);
app.put('/api/settings', settingController.updateSettings);
app.post('/api/settings/test-webhook', settingController.testWebhook);

// 4. Static Frontend Assets Serving
const frontendDistPaths = [
  path.join(__dirname, '../ui'),
  path.join(__dirname, '../../app/ui'),
  path.join(__dirname, '../../frontend/dist')
];

let staticDir = '';
for (const p of frontendDistPaths) {
  if (fs.existsSync(path.join(p, 'index.html'))) {
    staticDir = p;
    break;
  }
}

if (staticDir) {
  console.log(`[Static] Serving UI from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

async function startServer() {
  // 1. Initialize SQLite Database (WASM)
  await initDatabase();

  // 2. Start Cron Jobs
  initCronJobs();

  // 3. Start Server (TCP Port and optional Unix Socket for fnOS Gateway)
  let socketPath = process.env.UNIX_SOCKET;
  const socketArgIndex = process.argv.indexOf('--socket');
  if (socketArgIndex !== -1 && process.argv[socketArgIndex + 1]) {
    socketPath = process.argv[socketArgIndex + 1];
  }

  const PORT = Number(process.env.PORT) || 6921;

  // Always listen on TCP port for direct browser access
  const tcpServer = http.createServer(app);
  tcpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [TCP Server] Listening on http://0.0.0.0:${PORT}`);
  });

  // Also listen on Unix Domain Socket if provided
  if (socketPath) {
    if (fs.existsSync(socketPath)) {
      try {
        fs.unlinkSync(socketPath);
      } catch {}
    }

    const socketServer = http.createServer(app);
    socketServer.listen(socketPath, () => {
      try {
        fs.chmodSync(socketPath, '0777');
      } catch {}
      console.log(`🚀 [fnOS Gateway] Server listening on Unix Socket: ${socketPath}`);
    });
  }
}

startServer().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
