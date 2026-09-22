"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultCategories = createDefaultCategories;
exports.authMiddleware = authMiddleware;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || 'fnos-anniversary-secret-key-2026';
function createDefaultCategories(userId) {
    const insertCat = db_1.db.prepare(`
    INSERT OR IGNORE INTO categories (id, user_id, name, icon, color, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    const defaults = [
        { id: `${userId}-cat-birthday`, name: '生日祝福', icon: 'cake', color: '#FF416C', sort_order: 1 },
        { id: `${userId}-cat-anniversary`, name: '恋爱纪念', icon: 'heart', color: '#FF4B2B', sort_order: 2 },
        { id: `${userId}-cat-cycle`, name: '周期关怀', icon: 'flower2', color: '#8A2387', sort_order: 3 },
        { id: `${userId}-cat-routine`, name: '日常周期', icon: 'flag', color: '#4A00E0', sort_order: 4 },
        { id: `${userId}-cat-festival`, name: '传统节日', icon: 'sparkles', color: '#F37335', sort_order: 5 }
    ];
    for (const cat of defaults) {
        insertCat.run(cat.id, userId, cat.name, cat.icon, cat.color, cat.sort_order);
    }
    // Create default settings
    db_1.db.prepare(`
    INSERT OR IGNORE INTO user_settings (user_id, theme_mode, default_calendar_type)
    VALUES (?, 'system', 'solar')
  `).run(userId);
}
function authMiddleware(req, res, next) {
    // Check Bearer Token (Independent user authentication)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            const user = db_1.db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(decoded.id);
            if (user) {
                req.user = user;
                return next();
            }
        }
        catch {
            res.status(401).json({ success: false, message: '无效或已过期的登录令牌' });
            return;
        }
    }
    res.status(401).json({ success: false, message: '请先登录' });
}
function generateToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
}
