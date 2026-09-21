import { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../db';

export async function sendWebhookNotification(
  url: string,
  type: string,
  title: string,
  content: string
): Promise<{ success: boolean; message: string }> {
  try {
    let payload: any = {};

    if (type === 'serverchan') {
      // Server酱 API
      payload = { title, desp: content };
      await axios.post(url, payload);
    } else if (type === 'pushplus') {
      // PushPlus
      payload = { title, content, template: 'markdown' };
      await axios.post(url, payload);
    } else if (type === 'feishu') {
      // 飞书机器人 Webhook
      payload = {
        msg_type: 'interactive',
        card: {
          header: {
            title: { tag: 'plain_text', content: `🎉 ${title}` },
            template: 'red'
          },
          elements: [
            {
              tag: 'markdown',
              content: `**${title}**\n\n${content}\n\n*来自飞牛 fnOS 纪念日与节日提醒*`
            }
          ]
        }
      };
      await axios.post(url, payload);
    } else if (type === 'dingtalk') {
      // 钉钉机器人
      payload = {
        msgtype: 'markdown',
        markdown: {
          title,
          text: `### ${title}\n\n${content}\n\n> 来自飞牛 fnOS 纪念日与节日提醒`
        }
      };
      await axios.post(url, payload);
    } else if (type === 'wecom') {
      // 企业微信机器人
      payload = {
        msgtype: 'markdown',
        markdown: {
          content: `### ${title}\n\n${content}\n\n> 来自飞牛 fnOS 纪念日与节日提醒`
        }
      };
      await axios.post(url, payload);
    } else {
      // Generic Webhook POST
      payload = {
        title,
        content,
        timestamp: new Date().toISOString()
      };
      await axios.post(url, payload);
    }

    return { success: true, message: '通知发送成功' };
  } catch (error: any) {
    return { success: false, message: error.message || 'Webhook 发送失败' };
  }
}

export const settingController = {
  getSettings(req: Request, res: Response): void {
    const userId = req.user!.id;
    let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);

    if (!settings) {
      db.prepare(`
        INSERT INTO user_settings (user_id, theme_mode, default_calendar_type)
        VALUES (?, 'system', 'solar')
      `).run(userId);
      settings = { user_id: userId, theme_mode: 'system', default_calendar_type: 'solar' };
    }

    res.json({ success: true, data: settings });
  },

  updateSettings(req: Request, res: Response): void {
    const userId = req.user!.id;
    const { theme_mode, default_calendar_type, webhook_url, webhook_type } = req.body;

    db.prepare(`
      INSERT INTO user_settings (user_id, theme_mode, default_calendar_type, webhook_url, webhook_type, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        theme_mode = COALESCE(excluded.theme_mode, theme_mode),
        default_calendar_type = COALESCE(excluded.default_calendar_type, default_calendar_type),
        webhook_url = excluded.webhook_url,
        webhook_type = COALESCE(excluded.webhook_type, webhook_type),
        updated_at = CURRENT_TIMESTAMP
    `).run(
      userId,
      theme_mode || 'system',
      default_calendar_type || 'solar',
      webhook_url !== undefined ? webhook_url : null,
      webhook_type || 'generic'
    );

    res.json({ success: true, message: '设置保存成功' });
  },

  async testWebhook(req: Request, res: Response): Promise<void> {
    const { webhook_url, webhook_type = 'generic' } = req.body;

    if (!webhook_url) {
      res.status(400).json({ success: false, message: '请提供 Webhook URL' });
      return;
    }

    const result = await sendWebhookNotification(
      webhook_url,
      webhook_type,
      '测试提醒：结婚 5 周年纪念日',
      '今天是你们在一起的特别日子！祝你们恩爱甜蜜，生活美满！\n\n- 目标日期: 2026-09-21\n- 农历: 八月十一\n- 剩余天数: 0 天 (今天)'
    );

    if (result.success) {
      res.json({ success: true, message: 'Webhook 测试推送已成功发送！' });
    } else {
      res.status(500).json({ success: false, message: `推送失败: ${result.message}` });
    }
  }
};
