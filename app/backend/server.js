"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const auth_1 = require("./middlewares/auth");
const authController_1 = require("./controllers/authController");
const eventController_1 = require("./controllers/eventController");
const categoryController_1 = require("./controllers/categoryController");
const settingController_1 = require("./controllers/settingController");
const dataController_1 = require("./controllers/dataController");
const lunarService_1 = require("./services/lunarService");
const cronService_1 = require("./services/cronService");
dotenv_1.default.config();
// 1. Initialize App
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// 3. API Routes
// Public Auth routes
app.post('/api/auth/register', authController_1.authController.register);
app.post('/api/auth/login', authController_1.authController.login);
// Current Solar Term & Traditional Color Theme API
app.get('/api/solar-terms/current', (req, res) => {
    try {
        const termInfo = (0, lunarService_1.getCurrentSolarTermInfo)();
        res.json({ success: true, data: termInfo });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message || '获取节气信息失败' });
    }
});
// Helper to detect any custom font placed in fonts directories
function findCustomFontFile() {
    const possibleDirs = [
        path_1.default.join(__dirname, '../../frontend/public/fonts'),
        path_1.default.join(__dirname, '../../app/ui/fonts'),
        path_1.default.join(__dirname, '../ui/fonts'),
        path_1.default.join(__dirname, '../../frontend/dist/fonts'),
        path_1.default.join(__dirname, '../../fonts'),
        path_1.default.join(process.cwd(), 'fonts'),
        path_1.default.join(process.cwd(), 'frontend/public/fonts'),
        path_1.default.join(process.cwd(), 'app/ui/fonts')
    ];
    const validExts = {
        '.woff2': { format: 'woff2', mimeType: 'font/woff2' },
        '.woff': { format: 'woff', mimeType: 'font/woff' },
        '.ttf': { format: 'truetype', mimeType: 'font/ttf' },
        '.otf': { format: 'opentype', mimeType: 'font/otf' }
    };
    for (const dir of possibleDirs) {
        if (fs_1.default.existsSync(dir)) {
            try {
                const files = fs_1.default.readdirSync(dir);
                for (const file of files) {
                    const ext = path_1.default.extname(file).toLowerCase();
                    if (validExts[ext]) {
                        const filePath = path_1.default.join(dir, file);
                        const stat = fs_1.default.statSync(filePath);
                        return {
                            filePath,
                            fileName: file,
                            format: validExts[ext].format,
                            mimeType: validExts[ext].mimeType,
                            mtime: stat.mtimeMs
                        };
                    }
                }
            }
            catch { }
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
        const calc = (0, lunarService_1.calculateEvent)(req.body);
        res.json({ success: true, data: calc });
    }
    catch (err) {
        res.status(400).json({ success: false, message: err.message || '计算失败' });
    }
});
// Protected routes
app.use('/api', auth_1.authMiddleware);
// User & Auth
app.get('/api/auth/me', authController_1.authController.getCurrentUser);
// Events
app.get('/api/events', eventController_1.eventController.getEvents);
app.get('/api/events/:id', eventController_1.eventController.getEventById);
app.post('/api/events', eventController_1.eventController.createEvent);
app.put('/api/events/:id', eventController_1.eventController.updateEvent);
app.delete('/api/events/:id', eventController_1.eventController.deleteEvent);
app.post('/api/events/:id/pin', eventController_1.eventController.togglePin);
// Categories
app.get('/api/categories', categoryController_1.categoryController.getCategories);
app.post('/api/categories', categoryController_1.categoryController.createCategory);
app.put('/api/categories/:id', categoryController_1.categoryController.updateCategory);
app.delete('/api/categories/:id', categoryController_1.categoryController.deleteCategory);
// Settings
app.get('/api/settings', settingController_1.settingController.getSettings);
app.put('/api/settings', settingController_1.settingController.updateSettings);
app.post('/api/settings/test-webhook', settingController_1.settingController.testWebhook);
// Data Export & Import (JSON)
app.get('/api/data/export', dataController_1.dataController.exportData);
app.post('/api/data/import', dataController_1.dataController.importData);
// 4. Static Frontend Assets Serving
const frontendDistPaths = [
    path_1.default.join(__dirname, '../ui'),
    path_1.default.join(__dirname, '../../app/ui'),
    path_1.default.join(__dirname, '../../frontend/dist')
];
let staticDir = '';
for (const p of frontendDistPaths) {
    if (fs_1.default.existsSync(path_1.default.join(p, 'index.html'))) {
        staticDir = p;
        break;
    }
}
if (staticDir) {
    console.log(`[Static] Serving UI from: ${staticDir}`);
    app.use(express_1.default.static(staticDir));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(path_1.default.join(staticDir, 'index.html'));
    });
}
async function startServer() {
    // 1. Initialize SQLite Database (WASM)
    await (0, db_1.initDatabase)();
    // 2. Start Cron Jobs
    (0, cronService_1.initCronJobs)();
    // 3. Start Server (TCP Port and optional Unix Socket for fnOS Gateway)
    let socketPath = process.env.UNIX_SOCKET;
    const socketArgIndex = process.argv.indexOf('--socket');
    if (socketArgIndex !== -1 && process.argv[socketArgIndex + 1]) {
        socketPath = process.argv[socketArgIndex + 1];
    }
    const PORT = Number(process.env.PORT) || 6921;
    // Always listen on TCP port for direct browser access
    const tcpServer = http_1.default.createServer(app);
    tcpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 [TCP Server] Listening on http://0.0.0.0:${PORT}`);
    });
    // Also listen on Unix Domain Socket if provided
    if (socketPath) {
        if (fs_1.default.existsSync(socketPath)) {
            try {
                fs_1.default.unlinkSync(socketPath);
            }
            catch { }
        }
        const socketServer = http_1.default.createServer(app);
        socketServer.listen(socketPath, () => {
            try {
                fs_1.default.chmodSync(socketPath, '0777');
            }
            catch { }
            console.log(`🚀 [fnOS Gateway] Server listening on Unix Socket: ${socketPath}`);
        });
    }
}
startServer().catch(err => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
