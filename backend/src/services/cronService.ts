import cron from 'node-cron';
import { db } from '../db';
import { calculateEvent } from './lunarService';
import { sendWebhookNotification } from '../controllers/settingController';

export function initCronJobs() {
  // Run every hour at minute 0 (e.g. 09:00, 10:00...)
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking upcoming reminders...');
    try {
      await checkAndDispatchReminders();
    } catch (err) {
      console.error('[Cron] Error running reminder job:', err);
    }
  });

  // Also run once when server starts
  setTimeout(() => {
    checkAndDispatchReminders().catch(console.error);
  }, 5000);
}

export async function checkAndDispatchReminders() {
  const now = new Date();
  const currentHour = `${now.getHours().toString().padStart(2, '0')}:00`;

  // Query all active events
  const events = db.prepare(`
    SELECT e.*, u.username, s.webhook_url, s.webhook_type
    FROM events e
    JOIN users u ON e.user_id = u.id
    LEFT JOIN user_settings s ON e.user_id = s.user_id
    WHERE e.archived = 0
  `).all() as any[];

  for (const event of events) {
    const calc = calculateEvent({
      target_date: event.target_date,
      calendar_type: event.calendar_type,
      is_leap_month: event.is_leap_month,
      repeat_type: event.repeat_type,
      repeat_interval: event.repeat_interval,
      repeat_weekdays: event.repeat_weekdays,
      direction: event.direction
    });

    // Check reminders for this event
    const reminders = db.prepare(`
      SELECT * FROM reminders 
      WHERE event_id = ? AND enabled = 1
    `).all(event.id) as any[];

    for (const r of reminders) {
      // Check advance_days condition
      if (calc.daysRemaining === r.advance_days) {
        // If user has configured a webhook
        if (event.webhook_url) {
          let title = '';
          if (calc.daysRemaining === 0) {
            title = `🎉【今天】${event.title}`;
          } else {
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
          await sendWebhookNotification(event.webhook_url, event.webhook_type || 'generic', title, content);
        }
      }
    }
  }
}
