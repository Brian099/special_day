import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'fnos-anniversary-secret-key-2026';

export interface AuthUser {
  id: string;
  fn_uid?: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      isFnOSGateway?: boolean;
    }
  }
}

export function createDefaultCategories(userId: string) {
  const insertCat = db.prepare(`
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
  db.prepare(`
    INSERT OR IGNORE INTO user_settings (user_id, theme_mode, default_calendar_type)
    VALUES (?, 'system', 'solar')
  `).run(userId);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Check fnOS Unified Gateway headers
  const fnUid = req.headers['x-trim-user-id'] as string;
  const fnUsername = (req.headers['x-trim-username'] as string) || 'fnos_user';
  const fnIsAdmin = req.headers['x-trim-is-admin'] === 'true';

  if (fnUid) {
    req.isFnOSGateway = true;
    let user = db.prepare('SELECT * FROM users WHERE fn_uid = ?').get(fnUid) as any;

    if (!user) {
      // Auto-create user linked with fnOS account
      const userId = `fn_${fnUid}`;
      const role = fnIsAdmin ? 'admin' : 'user';
      db.prepare(`
        INSERT INTO users (id, fn_uid, username, role)
        VALUES (?, ?, ?, ?)
      `).run(userId, fnUid, fnUsername, role);

      createDefaultCategories(userId);
      user = { id: userId, fn_uid: fnUid, username: fnUsername, role };
    }

    req.user = {
      id: user.id,
      fn_uid: user.fn_uid,
      username: user.username,
      role: user.role
    };
    return next();
  }

  // 2. Check Bearer Token (Independent login mode)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = db.prepare('SELECT id, fn_uid, username, role FROM users WHERE id = ?').get(decoded.id) as any;

      if (user) {
        req.user = user;
        return next();
      }
    } catch {
      res.status(401).json({ success: false, message: '无效或已过期的登录令牌' });
      return;
    }
  }

  // 3. Fallback for standalone dev / test default user when enabled
  if (process.env.NODE_ENV !== 'production' && !authHeader) {
    const devUserId = 'dev_user_default';
    let user = db.prepare('SELECT id, fn_uid, username, role FROM users WHERE id = ?').get(devUserId) as any;
    if (!user) {
      db.prepare(`
        INSERT OR IGNORE INTO users (id, username, role)
        VALUES (?, '开发者测试用户', 'admin')
      `).run(devUserId);
      createDefaultCategories(devUserId);
      user = { id: devUserId, username: '开发者测试用户', role: 'admin' };
    }
    req.user = user;
    return next();
  }

  res.status(401).json({ success: false, message: '请先登录' });
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
