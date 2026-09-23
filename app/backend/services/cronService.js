"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = initCronJobs;
exports.checkAndDispatchReminders = checkAndDispatchReminders;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../db");
const lunarService_1 = require("./lunarService");
const settingController_1 = require("../controllers/settingController");
const emailService_1 = require("./emailService");
function initCronJobs() {
    // Run every hour at minute 0 (e.g. 09:00, 10:00...)
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('[Cron] Checking upcoming reminders...');
        try {
            await checkAndDispatchReminders();
        }
        catch (err) {
            console.error('[Cron] Error running reminder job:', err);
        }
    });
    // Also run once when server starts
    setTimeout(() => {
        checkAndDispatchReminders().catch(console.error);
    }, 5000);
}
async function checkAndDispatchReminders() {
    // Query all active events and user notification settings
    const events = db_1.db.prepare(`
    SELECT 
      e.*, 
      u.username, 
      s.webhook_url, 
      s.webhook_type,
      s.smtp_host,
      s.smtp_port,
      s.smtp_user,
      s.smtp_pass,
      s.smtp_from,
      s.smtp_secure,
      s.email_recipient,
      s.email_enabled
    FROM events e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN user_settings s ON e.user_id = s.user_id
    WHERE e.archived = 0
  `).all();
    for (const event of events) {
        const calc = (0, lunarService_1.calculateEvent)({
            target_date: event.target_date,
            calendar_type: event.calendar_type,
            is_leap_month: event.is_leap_month,
            repeat_type: event.repeat_type,
            repeat_interval: event.repeat_interval,
            repeat_weekdays: event.repeat_weekdays,
            direction: event.direction
        });
        // Check reminders for this event
        const reminders = db_1.db.prepare(`
      SELECT * FROM reminders 
      WHERE event_id = ? AND enabled = 1
    `).all(event.id);
        for (const r of reminders) {
            // Check advance_days condition
            if (calc.daysRemaining === r.advance_days) {
                let channels = ['web', 'webhook', 'email'];
                try {
                    if (r.notify_channels) {
                        channels = typeof r.notify_channels === 'string' ? JSON.parse(r.notify_channels) : r.notify_channels;
                    }
                }
                catch { }
                // 1. Webhook Notification
                if (event.webhook_url && (channels.includes('webhook') || channels.includes('web'))) {
                    let title = '';
                    if (calc.daysRemaining === 0) {
                        title = `🎉【今天】${event.title}`;
                    }
                    else {
                        title = `⏰【还有 ${calc.daysRemaining} 天】${event.title}`;
                    }
                    let content = `**事件名称**: ${event.title}\n` +
                        `**下个发生日**: ${calc.nextDate} (${calc.lunarFormatted})\n` +
                        `**剩余天数**: ${calc.daysRemaining === 0 ? '就在今天！' : `${calc.daysRemaining} 天`}\n`;
                    if (calc.yearsCount > 0 && event.repeat_type === 'year') {
                        content += `**累计年数**: 第 ${calc.yearsCount} 周年\n`;
                    }
                    if (event.notes) {
                        content += `**备注文档**: ${event.notes}\n`;
                    }
                    console.log(`[Cron] Dispatching webhook to ${event.username} for event: ${event.title}`);
                    await (0, settingController_1.sendWebhookNotification)(event.webhook_url, event.webhook_type || 'generic', title, content);
                }
                // 2. Email Notification
                const isEmailChannel = channels.includes('email') || Boolean(event.email_enabled);
                if (isEmailChannel && event.email_recipient && event.smtp_host && event.smtp_user && event.smtp_pass) {
                    console.log(`[Cron] Dispatching email to ${event.email_recipient} for event: ${event.title}`);
                    await emailService_1.EmailService.sendAnniversaryEmail({
                        smtpConfig: {
                            smtp_host: event.smtp_host,
                            smtp_port: Number(event.smtp_port) || 465,
                            smtp_user: event.smtp_user,
                            smtp_pass: event.smtp_pass,
                            smtp_from: event.smtp_from,
                            smtp_secure: Boolean(event.smtp_secure ?? true)
                        },
                        to: event.email_recipient,
                        event: {
                            title: event.title,
                            target_date: event.target_date,
                            calendar_type: event.calendar_type,
                            repeat_type: event.repeat_type,
                            repeat_interval: event.repeat_interval,
                            notes: event.notes
                        },
                        calculation: calc
                    });
                }
            }
        }
    }
}
