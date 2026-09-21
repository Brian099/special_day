import { Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { calculateEvent } from '../services/lunarService';

export const eventController = {
  // Get all events for the current user with countdown calculation
  getEvents(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { category_id, search, archived = '0', repeat_type } = req.query;

    let query = `
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params: any[] = [userId];

    if (archived !== 'all') {
      query += ` AND e.archived = ?`;
      params.push(archived === '1' ? 1 : 0);
    }

    if (category_id) {
      query += ` AND e.category_id = ?`;
      params.push(category_id);
    }

    if (repeat_type) {
      query += ` AND e.repeat_type = ?`;
      params.push(repeat_type);
    }

    if (search) {
      query += ` AND (e.title LIKE ? OR e.notes LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    const rows = db.prepare(query).all(...params) as any[];

    // Fetch reminders for each event
    const getRemindersStmt = db.prepare('SELECT * FROM reminders WHERE event_id = ?');

    const calculatedEvents = rows.map((event) => {
      const calc = calculateEvent({
        target_date: event.target_date,
        calendar_type: event.calendar_type,
        is_leap_month: event.is_leap_month,
        repeat_type: event.repeat_type,
        repeat_interval: event.repeat_interval,
        repeat_weekdays: event.repeat_weekdays,
        direction: event.direction
      });

      const reminders = getRemindersStmt.all(event.id);

      return {
        ...event,
        top_pinned: Boolean(event.top_pinned),
        archived: Boolean(event.archived),
        is_leap_month: Boolean(event.is_leap_month),
        reminders,
        calculation: calc
      };
    });

    // Sort: pinned first, then daysRemaining ascending
    calculatedEvents.sort((a, b) => {
      if (a.top_pinned !== b.top_pinned) {
        return a.top_pinned ? -1 : 1;
      }
      return a.calculation.daysRemaining - b.calculation.daysRemaining;
    });

    // Statistics
    const stats = {
      total: calculatedEvents.length,
      todayCount: calculatedEvents.filter(e => e.calculation.isToday).length,
      upcomingWeek: calculatedEvents.filter(e => e.calculation.daysRemaining > 0 && e.calculation.daysRemaining <= 7).length,
      upcomingMonth: calculatedEvents.filter(e => e.calculation.daysRemaining > 0 && e.calculation.daysRemaining <= 30).length,
      accumulateCount: calculatedEvents.filter(e => e.direction === 'accumulate' || e.direction === 'both').length
    };

    res.json({
      success: true,
      data: {
        events: calculatedEvents,
        stats
      }
    });
  },

  // Get single event
  getEventById(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = db.prepare(`
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? AND e.user_id = ?
    `).get(id, userId) as any;

    if (!event) {
      res.status(404).json({ success: false, message: '未找到该事件' });
      return;
    }

    const calc = calculateEvent({
      target_date: event.target_date,
      calendar_type: event.calendar_type,
      is_leap_month: event.is_leap_month,
      repeat_type: event.repeat_type,
      repeat_interval: event.repeat_interval,
      repeat_weekdays: event.repeat_weekdays,
      direction: event.direction
    });

    const reminders = db.prepare('SELECT * FROM reminders WHERE event_id = ?').all(event.id);

    res.json({
      success: true,
      data: {
        ...event,
        top_pinned: Boolean(event.top_pinned),
        archived: Boolean(event.archived),
        is_leap_month: Boolean(event.is_leap_month),
        reminders,
        calculation: calc
      }
    });
  },

  // Create event
  createEvent(req: Request, res: Response): void {
    const userId = req.user!.id;
    const {
      title,
      target_date,
      calendar_type = 'solar',
      is_leap_month = false,
      repeat_type = 'none',
      repeat_interval = 1,
      repeat_weekdays = null,
      direction = 'countdown',
      category_id = null,
      cover_image = null,
      top_pinned = false,
      notes = null,
      reminders = []
    } = req.body;

    if (!title || !target_date) {
      res.status(400).json({ success: false, message: '标题和目标日期不能为空' });
      return;
    }

    const eventId = crypto.randomUUID();

    const insertEvent = db.prepare(`
      INSERT INTO events (
        id, user_id, category_id, title, target_date, calendar_type,
        is_leap_month, repeat_type, repeat_interval, repeat_weekdays,
        direction, cover_image, top_pinned, archived, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    insertEvent.run(
      eventId,
      userId,
      category_id || null,
      title.trim(),
      target_date,
      calendar_type,
      is_leap_month ? 1 : 0,
      repeat_type,
      Number(repeat_interval) || 1,
      repeat_weekdays ? (typeof repeat_weekdays === 'string' ? repeat_weekdays : JSON.stringify(repeat_weekdays)) : null,
      direction,
      cover_image || null,
      top_pinned ? 1 : 0,
      notes || null
    );

    // Save reminders
    if (Array.isArray(reminders)) {
      const insertReminder = db.prepare(`
        INSERT INTO reminders (id, event_id, user_id, remind_time, advance_days, notify_channels, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const r of reminders) {
        insertReminder.run(
          crypto.randomUUID(),
          eventId,
          userId,
          r.remind_time || '09:00',
          Number(r.advance_days) || 0,
          JSON.stringify(r.notify_channels || ['web']),
          r.enabled !== false ? 1 : 0
        );
      }
    }

    res.json({
      success: true,
      message: '创建成功',
      data: { id: eventId }
    });
  },

  // Update event
  updateEvent(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { id } = req.params;
    const {
      title,
      target_date,
      calendar_type,
      is_leap_month,
      repeat_type,
      repeat_interval,
      repeat_weekdays,
      direction,
      category_id,
      cover_image,
      top_pinned,
      archived,
      notes,
      reminders
    } = req.body;

    const existing = db.prepare('SELECT id FROM events WHERE id = ? AND user_id = ?').get(id, userId);
    if (!existing) {
      res.status(404).json({ success: false, message: '事件不存在' });
      return;
    }

    db.prepare(`
      UPDATE events SET
        title = COALESCE(?, title),
        target_date = COALESCE(?, target_date),
        calendar_type = COALESCE(?, calendar_type),
        is_leap_month = COALESCE(?, is_leap_month),
        repeat_type = COALESCE(?, repeat_type),
        repeat_interval = COALESCE(?, repeat_interval),
        repeat_weekdays = COALESCE(?, repeat_weekdays),
        direction = COALESCE(?, direction),
        category_id = ?,
        cover_image = ?,
        top_pinned = COALESCE(?, top_pinned),
        archived = COALESCE(?, archived),
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : null,
      target_date || null,
      calendar_type || null,
      is_leap_month !== undefined ? (is_leap_month ? 1 : 0) : null,
      repeat_type || null,
      repeat_interval !== undefined ? Number(repeat_interval) : null,
      repeat_weekdays !== undefined ? (typeof repeat_weekdays === 'string' ? repeat_weekdays : JSON.stringify(repeat_weekdays)) : null,
      direction || null,
      category_id !== undefined ? category_id : null,
      cover_image !== undefined ? cover_image : null,
      top_pinned !== undefined ? (top_pinned ? 1 : 0) : null,
      archived !== undefined ? (archived ? 1 : 0) : null,
      notes !== undefined ? notes : null,
      id,
      userId
    );

    // Update reminders if provided
    if (Array.isArray(reminders)) {
      db.prepare('DELETE FROM reminders WHERE event_id = ? AND user_id = ?').run(id, userId);
      const insertReminder = db.prepare(`
        INSERT INTO reminders (id, event_id, user_id, remind_time, advance_days, notify_channels, enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of reminders) {
        insertReminder.run(
          crypto.randomUUID(),
          id,
          userId,
          r.remind_time || '09:00',
          Number(r.advance_days) || 0,
          JSON.stringify(r.notify_channels || ['web']),
          r.enabled !== false ? 1 : 0
        );
      }
    }

    res.json({
      success: true,
      message: '更新成功'
    });
  },

  // Delete event
  deleteEvent(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = db.prepare('DELETE FROM events WHERE id = ? AND user_id = ?').run(id, userId);
    if (result.changes === 0) {
      res.status(404).json({ success: false, message: '未找到该事件' });
      return;
    }

    res.json({ success: true, message: '删除成功' });
  },

  // Toggle pin
  togglePin(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = db.prepare('SELECT top_pinned FROM events WHERE id = ? AND user_id = ?').get(id, userId) as any;
    if (!event) {
      res.status(404).json({ success: false, message: '未找到该事件' });
      return;
    }

    const newPin = event.top_pinned ? 0 : 1;
    db.prepare('UPDATE events SET top_pinned = ? WHERE id = ?').run(newPin, id);

    res.json({ success: true, message: newPin ? '已置顶' : '已取消置顶', data: { top_pinned: Boolean(newPin) } });
  }
};
