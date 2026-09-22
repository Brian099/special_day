import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';

export const dataController = {
  // Export all user data as a structured JSON object
  exportData(req: Request, res: Response): void {
    try {
      const userId = req.user!.id;

      // 1. Fetch categories
      const categories = db.prepare(`
        SELECT id, name, icon, color, sort_order
        FROM categories
        WHERE user_id = ?
        ORDER BY sort_order ASC, created_at ASC
      `).all(userId) as any[];

      // 2. Fetch events
      const events = db.prepare(`
        SELECT e.*, c.name as category_name
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.user_id = ?
        ORDER BY e.created_at ASC
      `).all(userId) as any[];

      // 3. Fetch reminders for each event
      const getRemindersStmt = db.prepare(`
        SELECT remind_time, advance_days, notify_channels, enabled
        FROM reminders
        WHERE event_id = ?
      `);

      const exportEvents = events.map(e => {
        const reminders = getRemindersStmt.all(e.id);
        return {
          id: e.id,
          title: e.title,
          category_name: e.category_name || null,
          target_date: e.target_date,
          calendar_type: e.calendar_type || 'solar',
          is_leap_month: e.is_leap_month ? 1 : 0,
          repeat_type: e.repeat_type || 'none',
          repeat_interval: e.repeat_interval || 1,
          repeat_weekdays: e.repeat_weekdays || null,
          direction: e.direction || 'countdown',
          cover_image: e.cover_image || null,
          top_pinned: e.top_pinned ? 1 : 0,
          archived: e.archived ? 1 : 0,
          notes: e.notes || '',
          reminders: reminders || []
        };
      });

      // 4. Fetch user settings
      const settings = db.prepare(`
        SELECT theme_mode, default_calendar_type, webhook_url, webhook_type
        FROM user_settings
        WHERE user_id = ?
      `).get(userId) as any;

      const payload = {
        version: '1.0',
        app: 'anniversary-reminder',
        exported_at: new Date().toISOString(),
        user: {
          username: req.user!.username
        },
        summary: {
          categories_count: categories.length,
          events_count: exportEvents.length
        },
        data: {
          categories,
          events: exportEvents,
          settings: settings || {}
        }
      };

      res.json({ success: true, ...payload });
    } catch (err: any) {
      console.error('[DataExport] Error:', err);
      res.status(500).json({ success: false, message: '导出数据失败: ' + (err.message || '未知错误') });
    }
  },

  // Import data from JSON
  importData(req: Request, res: Response): void {
    try {
      const userId = req.user!.id;
      const { mode = 'merge', data } = req.body;

      if (!data || typeof data !== 'object') {
        res.status(400).json({ success: false, message: '无效的数据格式，请提供正确的备份 JSON 对象' });
        return;
      }

      // Extract items from data object or root
      const importCategories = Array.isArray(data.categories) ? data.categories : [];
      const importEvents = Array.isArray(data.events) ? data.events : [];
      const importSettings = data.settings && typeof data.settings === 'object' ? data.settings : null;

      if (importCategories.length === 0 && importEvents.length === 0) {
        res.status(400).json({ success: false, message: '备份文件中未找到任何纪念日或分类数据' });
        return;
      }

      // If overwrite mode, clear current user's existing records
      if (mode === 'overwrite') {
        db.prepare('DELETE FROM reminders WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM events WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
      }

      // Map category name/id to current user's category ID
      const categoryMap = new Map<string, string>(); // key: name.toLowerCase(), value: id

      // Get existing user categories
      const existingCategories = db.prepare('SELECT id, name FROM categories WHERE user_id = ?').all(userId) as any[];
      existingCategories.forEach(c => {
        categoryMap.set(c.name.toLowerCase().trim(), c.id);
      });

      let insertedCatCount = 0;
      const createCatStmt = db.prepare(`
        INSERT INTO categories (id, user_id, name, icon, color, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const cat of importCategories) {
        if (!cat.name || typeof cat.name !== 'string') continue;
        const normalizedName = cat.name.toLowerCase().trim();

        if (!categoryMap.has(normalizedName)) {
          const newCatId = crypto.randomUUID();
          createCatStmt.run(
            newCatId,
            userId,
            cat.name.trim(),
            cat.icon || 'calendar',
            cat.color || '#FF416C',
            typeof cat.sort_order === 'number' ? cat.sort_order : 0
          );
          categoryMap.set(normalizedName, newCatId);
          insertedCatCount++;
        }
      }

      // Insert events and their reminders
      let insertedEventCount = 0;
      let insertedReminderCount = 0;

      const createEventStmt = db.prepare(`
        INSERT INTO events (
          id, user_id, category_id, title, target_date, calendar_type,
          is_leap_month, repeat_type, repeat_interval, repeat_weekdays,
          direction, cover_image, top_pinned, archived, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const createReminderStmt = db.prepare(`
        INSERT INTO reminders (
          id, event_id, user_id, remind_time, advance_days, notify_channels, enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const ev of importEvents) {
        if (!ev.title || !ev.target_date) continue;

        // Resolve category ID
        let resolvedCatId: string | null = null;
        if (ev.category_name && categoryMap.has(ev.category_name.toLowerCase().trim())) {
          resolvedCatId = categoryMap.get(ev.category_name.toLowerCase().trim()) || null;
        }

        const newEventId = crypto.randomUUID();
        createEventStmt.run(
          newEventId,
          userId,
          resolvedCatId,
          String(ev.title).trim(),
          String(ev.target_date).trim(),
          ev.calendar_type === 'lunar' ? 'lunar' : 'solar',
          ev.is_leap_month ? 1 : 0,
          ev.repeat_type || 'none',
          Number(ev.repeat_interval) || 1,
          ev.repeat_weekdays ? (typeof ev.repeat_weekdays === 'string' ? ev.repeat_weekdays : JSON.stringify(ev.repeat_weekdays)) : null,
          ev.direction === 'anniversary' ? 'anniversary' : 'countdown',
          ev.cover_image || null,
          ev.top_pinned ? 1 : 0,
          ev.archived ? 1 : 0,
          ev.notes ? String(ev.notes) : ''
        );
        insertedEventCount++;

        // Import reminders if present
        if (Array.isArray(ev.reminders)) {
          for (const rem of ev.reminders) {
            const remId = crypto.randomUUID();
            createReminderStmt.run(
              remId,
              newEventId,
              userId,
              rem.remind_time || '09:00',
              Number(rem.advance_days) || 0,
              typeof rem.notify_channels === 'string' ? rem.notify_channels : JSON.stringify(rem.notify_channels || ['web']),
              rem.enabled !== undefined ? (rem.enabled ? 1 : 0) : 1
            );
            insertedReminderCount++;
          }
        }
      }

      // Optionally restore settings
      if (importSettings && mode === 'overwrite') {
        db.prepare(`
          INSERT INTO user_settings (user_id, theme_mode, default_calendar_type, webhook_url, webhook_type, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id) DO UPDATE SET
            theme_mode = COALESCE(excluded.theme_mode, user_settings.theme_mode),
            default_calendar_type = COALESCE(excluded.default_calendar_type, user_settings.default_calendar_type),
            webhook_url = COALESCE(excluded.webhook_url, user_settings.webhook_url),
            webhook_type = COALESCE(excluded.webhook_type, user_settings.webhook_type),
            updated_at = CURRENT_TIMESTAMP
        `).run(
          userId,
          importSettings.theme_mode || 'system',
          importSettings.default_calendar_type || 'solar',
          importSettings.webhook_url || null,
          importSettings.webhook_type || 'generic'
        );
      }

      res.json({
        success: true,
        message: `数据导入成功！新增 ${insertedEventCount} 个纪念日，${insertedCatCount} 个分类，${insertedReminderCount} 条提醒。`,
        data: {
          insertedEvents: insertedEventCount,
          insertedCategories: insertedCatCount,
          insertedReminders: insertedReminderCount,
          mode
        }
      });
    } catch (err: any) {
      console.error('[DataImport] Error:', err);
      res.status(500).json({ success: false, message: '导入数据失败: ' + (err.message || '未知错误') });
    }
  }
};
