import { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../db';
import { EmailService } from '../services/emailService';

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
              content: `**${title}**\n\n${content}\n\n*来自飞牛 fnOS 纪念日*`
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
          text: `### ${title}\n\n${content}\n\n> 来自飞牛 fnOS 纪念日`
        }
      };
      await axios.post(url, payload);
    } else if (type === 'wecom') {
      // 企业微信机器人
      payload = {
        msgtype: 'markdown',
        markdown: {
          content: `### ${title}\n\n${content}\n\n> 来自飞牛 fnOS 纪念日`
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
    let settings: any = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);

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
    const { 
      theme_mode, 
      default_calendar_type, 
      webhook_url, 
      webhook_type,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      smtp_from,
      smtp_secure,
      email_recipient,
      email_enabled
    } = req.body;

    const current: any = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);

    // If password is not provided or masked, keep current password
    const finalPass = (smtp_pass !== undefined && smtp_pass !== '') 
      ? smtp_pass 
      : (current?.smtp_pass || null);

    db.prepare(`
      INSERT INTO user_settings (
        user_id, theme_mode, default_calendar_type, webhook_url, webhook_type,
        smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, smtp_secure,
        email_recipient, email_enabled, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        theme_mode = COALESCE(excluded.theme_mode, theme_mode),
        default_calendar_type = COALESCE(excluded.default_calendar_type, default_calendar_type),
        webhook_url = excluded.webhook_url,
        webhook_type = COALESCE(excluded.webhook_type, webhook_type),
        smtp_host = excluded.smtp_host,
        smtp_port = excluded.smtp_port,
        smtp_user = excluded.smtp_user,
        smtp_pass = excluded.smtp_pass,
        smtp_from = excluded.smtp_from,
        smtp_secure = excluded.smtp_secure,
        email_recipient = excluded.email_recipient,
        email_enabled = excluded.email_enabled,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      userId,
      theme_mode || current?.theme_mode || 'system',
      default_calendar_type || current?.default_calendar_type || 'solar',
      webhook_url !== undefined ? webhook_url : (current?.webhook_url ?? null),
      webhook_type || current?.webhook_type || 'generic',
      smtp_host !== undefined ? smtp_host : (current?.smtp_host ?? null),
      smtp_port !== undefined ? Number(smtp_port) : (current?.smtp_port ?? 465),
      smtp_user !== undefined ? smtp_user : (current?.smtp_user ?? null),
      finalPass,
      smtp_from !== undefined ? smtp_from : (current?.smtp_from ?? null),
      smtp_secure !== undefined ? (smtp_secure ? 1 : 0) : (current?.smtp_secure ?? 1),
      email_recipient !== undefined ? email_recipient : (current?.email_recipient ?? null),
      email_enabled !== undefined ? (email_enabled ? 1 : 0) : (current?.email_enabled ?? 0)
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
  },

  async testEmail(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { 
      smtp_host, 
      smtp_port = 465, 
      smtp_user, 
      smtp_pass, 
      smtp_from, 
      smtp_secure = true,
      email_recipient 
    } = req.body;

    const current: any = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);

    const host = smtp_host || current?.smtp_host;
    const port = Number(smtp_port) || current?.smtp_port || 465;
    const user = smtp_user || current?.smtp_user;
    const pass = (smtp_pass !== undefined && smtp_pass !== '') ? smtp_pass : current?.smtp_pass;
    const from = smtp_from || current?.smtp_from;
    const secure = smtp_secure !== undefined ? Boolean(smtp_secure) : Boolean(current?.smtp_secure ?? true);
    const recipient = email_recipient || current?.email_recipient;

    if (!host || !user || !pass) {
      res.status(400).json({ success: false, message: '请完整配置 SMTP 服务器地址、发信账号及授权码' });
      return;
    }

    if (!recipient) {
      res.status(400).json({ success: false, message: '请提供测试收件邮箱地址' });
      return;
    }

    const result = await EmailService.sendTestEmail(
      {
        smtp_host: host,
        smtp_port: port,
        smtp_user: user,
        smtp_pass: pass,
        smtp_from: from,
        smtp_secure: secure
      },
      recipient
    );

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  }
};
