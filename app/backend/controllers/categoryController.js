"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../db");
exports.categoryController = {
    getCategories(req, res) {
        const userId = req.user.id;
        const categories = db_1.db.prepare(`
      SELECT c.*, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.archived = 0
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at ASC
    `).all(userId);
        res.json({ success: true, data: categories });
    },
    createCategory(req, res) {
        const userId = req.user.id;
        const { name, icon = 'calendar', color = '#FF416C', sort_order = 0 } = req.body;
        if (!name || name.trim().length === 0) {
            res.status(400).json({ success: false, message: '分类名称不能为空' });
            return;
        }
        const id = crypto_1.default.randomUUID();
        db_1.db.prepare(`
      INSERT INTO categories (id, user_id, name, icon, color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, name.trim(), icon, color, sort_order);
        res.json({ success: true, message: '分类创建成功', data: { id, name, icon, color, sort_order } });
    },
    updateCategory(req, res) {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, icon, color, sort_order } = req.body;
        const existing = db_1.db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(id, userId);
        if (!existing) {
            res.status(404).json({ success: false, message: '分类不存在' });
            return;
        }
        db_1.db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ? AND user_id = ?
    `).run(name ? name.trim() : null, icon || null, color || null, sort_order !== undefined ? sort_order : null, id, userId);
        res.json({ success: true, message: '分类更新成功' });
    },
    deleteCategory(req, res) {
        const userId = req.user.id;
        const { id } = req.params;
        db_1.db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true, message: '分类已删除' });
    }
};
