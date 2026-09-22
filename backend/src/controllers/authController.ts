import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db';
import { generateToken, createDefaultCategories } from '../middlewares/auth';

export const authController = {
  // Get current user info
  getCurrentUser(req: Request, res: Response): void {
    const user = req.user!;
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id) || {};
    
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
  register(req: Request, res: Response): void {
    const { username, password } = req.body;

    if (!username || !password || username.trim().length < 2 || password.length < 4) {
      res.status(400).json({ success: false, message: '用户名至少2位，密码至少4位' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
    if (existing) {
      res.status(400).json({ success: false, message: '该用户名已被占用' });
      return;
    }

    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, username, password_hash, role)
      VALUES (?, ?, ?, 'user')
    `).run(userId, username.trim(), passwordHash);

    createDefaultCategories(userId);

    const newUser = { id: userId, username: username.trim(), role: 'user' };
    const token = generateToken(newUser);

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
  login(req: Request, res: Response): void {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: '请输入用户名和密码' });
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim()) as any;
    if (!user || !user.password_hash) {
      res.status(400).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      res.status(400).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    const authUser = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const token = generateToken(authUser);

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


