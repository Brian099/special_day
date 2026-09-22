"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
const auth_1 = require("../middlewares/auth");
exports.authController = {
    // Get current user info
    getCurrentUser(req, res) {
        const user = req.user;
        const settings = db_1.db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id) || {};
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                settings
            }
        });
    },
    // Register independent user
    register(req, res) {
        const { username, password } = req.body;
        if (!username || !password || username.trim().length < 2 || password.length < 4) {
            res.status(400).json({ success: false, message: '用户名至少2位，密码至少4位' });
            return;
        }
        const existing = db_1.db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
        if (existing) {
            res.status(400).json({ success: false, message: '该用户名已被占用' });
            return;
        }
        const userId = crypto_1.default.randomUUID();
        const passwordHash = bcryptjs_1.default.hashSync(password, 10);
        db_1.db.prepare(`
      INSERT INTO users (id, username, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `).run(userId, username.trim(), passwordHash);
        (0, auth_1.createDefaultCategories)(userId);
        const newUser = { id: userId, username: username.trim(), role: 'user' };
        const token = (0, auth_1.generateToken)(newUser);
        res.json({
            success: true,
            message: '注册成功',
            data: {
                token,
                user: newUser
            }
        });
    },
    // Login independent user
    login(req, res) {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(400).json({ success: false, message: '请输入用户名和密码' });
            return;
        }
        const user = db_1.db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
        if (!user || !user.password_hash) {
            res.status(400).json({ success: false, message: '用户名或密码错误' });
            return;
        }
        const valid = bcryptjs_1.default.compareSync(password, user.password_hash);
        if (!valid) {
            res.status(400).json({ success: false, message: '用户名或密码错误' });
            return;
        }
        const authUser = {
            id: user.id,
            username: user.username,
            role: user.role
        };
        const token = (0, auth_1.generateToken)(authUser);
        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: authUser
            }
        });
    }
};
