import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';

export const categoryController = {
  getCategories(req: Request, res: Response): void {
    const userId = req.user!.id;
    const categories = db.prepare(`
      SELECT c.*, COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.archived = 0
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.created_at ASC
    `).all(userId);

    res.json({ success: true, data: categories });
  },

  createCategory(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { name, icon = 'calendar', color = '#FF416C', sort_order = 0 } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ success: false, message: '分类名称不能为空' });
      return;
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO categories (id, user_id, name, icon, color, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, name.trim(), icon, color, sort_order);

    res.json({ success: true, message: '分类创建成功', data: { id, name, icon, color, sort_order } });
  },

  updateCategory(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name, icon, color, sort_order } = req.body;

    const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      res.status(404).json({ success: false, message: '分类不存在' });
      return;
    }

    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        sort_order = COALESCE(?, sort_order)
      WHERE id = ? AND user_id = ?
    `).run(name ? name.trim() : null, icon || null, color || null, sort_order !== undefined ? sort_order : null, id, userId);

    res.json({ success: true, message: '分类更新成功' });
  },

  deleteCategory(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { id } = req.params;

    db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ success: true, message: '分类已删除' });
  }
};
