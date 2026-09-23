"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    /**
     * Create nodemailer transporter from SMTP configuration
     */
    static createTransporter(config) {
        const isSecure = config.smtp_secure !== undefined
            ? Boolean(config.smtp_secure)
            : (config.smtp_port === 465);
        return nodemailer_1.default.createTransport({
            host: config.smtp_host,
            port: Number(config.smtp_port) || 465,
            secure: isSecure, // true for 465, false for other ports (e.g. 587 with STARTTLS)
            auth: {
                user: config.smtp_user,
                pass: config.smtp_pass
            },
            tls: {
                // Do not fail on invalid certificates if local mail server
                rejectUnauthorized: false
            }
        });
    }
    /**
     * Verify SMTP credentials connection
     */
    static async verifyConnection(config) {
        if (!config.smtp_host || !config.smtp_user || !config.smtp_pass) {
            return { success: false, message: '请完整填写 SMTP 主机、账号与授权码/密码' };
        }
        try {
            const transporter = this.createTransporter(config);
            await transporter.verify();
            return { success: true, message: 'SMTP 服务器连接与身份验证成功！' };
        }
        catch (err) {
            console.error('[EmailService] SMTP verification failed:', err);
            let msg = err.message || 'SMTP 连接失败';
            if (msg.includes('Invalid login') || msg.includes('authentication failed') || msg.includes('535')) {
                msg = '登录认证失败：请检查 SMTP 用户名与授权码是否正确（QQ/163 邮箱需使用专属 SMTP 授权码而非普通密码）';
            }
            else if (msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
                msg = `无法连接至 SMTP 服务器 ${config.smtp_host}:${config.smtp_port}，请检查主机地址与端口设置`;
            }
            return { success: false, message: msg };
        }
    }
    /**
     * Send Test Email
     */
    static async sendTestEmail(config, toEmail) {
        if (!toEmail) {
            return { success: false, message: '请提供测试收件邮箱地址' };
        }
        const testEvent = {
            title: '结婚 5 周年纪念日（测试）',
            target_date: new Date().toISOString().slice(0, 10),
            calendar_type: 'solar',
            repeat_type: 'year',
            notes: '这是一封由飞牛 fnOS 纪念日提醒系统发送的测试邮件，确认您的 SMTP 发信服务配置正常。'
        };
        const testCalculation = {
            nextDate: new Date().toISOString().slice(0, 10),
            daysRemaining: 0,
            isToday: true,
            daysPassed: 1826,
            yearsCount: 5,
            targetDateFormatted: new Date().toISOString().slice(0, 10),
            lunarFormatted: '农历八月十一',
            zodiac: '马',
            ganzhi: '丙午年 丁酉月 庚子日',
            constellation: '天秤座',
            solarTerm: '秋分'
        };
        return this.sendAnniversaryEmail({
            smtpConfig: config,
            to: toEmail,
            event: testEvent,
            calculation: testCalculation
        });
    }
    /**
     * Send an Anniversary Reminder Email
     */
    static async sendAnniversaryEmail(options) {
        const { smtpConfig, to, event, calculation } = options;
        if (!to) {
            return { success: false, message: '未指定收件人邮箱' };
        }
        try {
            const transporter = this.createTransporter(smtpConfig);
            let subjectPrefix = '';
            if (calculation.daysRemaining === 0) {
                subjectPrefix = '🎉【就在今天】';
            }
            else if (calculation.daysRemaining === 1) {
                subjectPrefix = '⏰【明天即到】';
            }
            else {
                subjectPrefix = `⏰【还有 ${calculation.daysRemaining} 天】`;
            }
            const subject = `${subjectPrefix} ${event.title} - 飞牛纪念日提醒`;
            const fromAddress = smtpConfig.smtp_from?.trim()
                ? smtpConfig.smtp_from.includes('<')
                    ? smtpConfig.smtp_from
                    : `"${smtpConfig.smtp_from}" <${smtpConfig.smtp_user}>`
                : `"纪念日提醒" <${smtpConfig.smtp_user}>`;
            const htmlContent = this.generateHtmlTemplate(event, calculation);
            const plainContent = this.generatePlainText(event, calculation);
            const info = await transporter.sendMail({
                from: fromAddress,
                to: to.trim(),
                subject: subject,
                text: plainContent,
                html: htmlContent
            });
            console.log(`[EmailService] Email sent successfully to ${to}, MessageID: ${info.messageId}`);
            return { success: true, message: `邮件已成功发送至 ${to}` };
        }
        catch (err) {
            console.error(`[EmailService] Failed to send email to ${to}:`, err);
            let errMsg = err.message || '邮件发送失败';
            if (errMsg.includes('535') || errMsg.includes('Invalid login')) {
                errMsg = '发件失败：SMTP 认证未通过，请检查发件人授权码是否有效';
            }
            return { success: false, message: errMsg };
        }
    }
    /**
     * Build Responsive HTML Email Template
     */
    static generateHtmlTemplate(event, calc) {
        const isToday = calc.daysRemaining === 0;
        const badgeText = isToday ? '就在今天 · 节日快乐' : `距离到达仅剩 ${calc.daysRemaining} 天`;
        const badgeBg = isToday ? '#E64C6E' : '#8B5E5E';
        return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${event.title}</title>
</head>
<body style="margin: 0; padding: 30px 15px; background-color: #FDF8F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #2D2424; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(139, 94, 94, 0.08); border: 1px solid #EDE5E0;">
    
    <!-- Header Banner -->
    <tr>
      <td style="padding: 36px 32px 24px; background: linear-gradient(135deg, #8B5E5E 0%, #6E4646 100%); color: #FFFFFF; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">🏮</div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1px; color: #FFFFFF;">
          ${event.title}
        </h1>
        <p style="margin: 10px 0 0; font-size: 13px; color: #F7EDE8; opacity: 0.9;">
          珍惜每一个值得铭记的日子 · 飞牛纪念日周期提醒
        </p>
      </td>
    </tr>

    <!-- Main Card Body -->
    <tr>
      <td style="padding: 32px 28px;">
        
        <!-- Big Highlight Badge -->
        <div style="text-align: center; margin-bottom: 28px;">
          <span style="display: inline-block; padding: 8px 24px; border-radius: 9999px; background-color: ${badgeBg}; color: #FFFFFF; font-size: 15px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(139, 94, 94, 0.2);">
            ${badgeText}
          </span>
        </div>

        <!-- Info Grid -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FDF9F5; border-radius: 14px; padding: 18px 20px; border: 1px solid #F3ECE6;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #7F6D6D; width: 110px;">🗓️ 下次日期：</td>
            <td style="padding: 8px 0; font-size: 15px; font-weight: 600; color: #2D2424;">
              ${calc.nextDate || event.target_date}
            </td>
          </tr>
          ${calc.lunarFormatted ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #7F6D6D;">🌙 传统农历：</td>
            <td style="padding: 8px 0; font-size: 14px; color: #4A3A3A;">
              ${calc.lunarFormatted} ${calc.ganzhi ? `(${calc.ganzhi})` : ''}
            </td>
          </tr>
          ` : ''}
          ${calc.solarTerm || calc.constellation ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #7F6D6D;">🌿 节气星座：</td>
            <td style="padding: 8px 0; font-size: 14px; color: #4A3A3A;">
              ${[calc.solarTerm, calc.constellation].filter(Boolean).join(' · ')}
            </td>
          </tr>
          ` : ''}
          ${calc.yearsCount > 0 ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #7F6D6D;">🎂 累计年数：</td>
            <td style="padding: 8px 0; font-size: 15px; font-weight: 600; color: #E64C6E;">
              第 ${calc.yearsCount} 周年
            </td>
          </tr>
          ` : ''}
          ${calc.daysPassed > 0 ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #7F6D6D;">⏳ 已经相伴：</td>
            <td style="padding: 8px 0; font-size: 14px; color: #4A3A3A;">
              ${calc.daysPassed} 天
            </td>
          </tr>
          ` : ''}
        </table>

        <!-- Event Notes -->
        ${event.notes ? `
        <div style="margin-top: 20px; padding: 16px 18px; border-radius: 12px; background-color: #FFF9F9; border-left: 4px solid #8B5E5E;">
          <div style="font-size: 12px; font-weight: 600; color: #8B5E5E; margin-bottom: 4px;">📝 备忘记录</div>
          <div style="font-size: 13px; color: #4A3A3A; line-height: 1.6; white-space: pre-wrap;">${event.notes}</div>
        </div>
        ` : ''}

        <!-- Warm Wish -->
        <div style="margin-top: 28px; text-align: center; color: #8C7B7B; font-size: 13px; line-height: 1.6;">
          愿生活常伴温暖，岁月皆有回响。<br>
          让每一个特别的瞬间，都满载美好与喜悦。
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 24px; background-color: #F8F3EF; text-align: center; border-top: 1px solid #EDE5E0;">
        <p style="margin: 0; font-size: 12px; color: #A89898;">
          此邮件由 <strong>飞牛 fnOS 纪念日周期提醒服务</strong> 自动推送<br>
          如需修改提醒频次或发信设置，请登录管理控制台进行调整。
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
    `;
    }
    /**
     * Plain text fallback
     */
    static generatePlainText(event, calc) {
        const isToday = calc.daysRemaining === 0;
        const badgeText = isToday ? '就在今天！' : `还有 ${calc.daysRemaining} 天`;
        return `
【飞牛纪念日提醒】${event.title}

- 状态：${badgeText}
- 下次日期：${calc.nextDate || event.target_date}
- 传统农历：${calc.lunarFormatted || '-'}
- 节气星座：${[calc.solarTerm, calc.constellation].filter(Boolean).join(' · ')}
${calc.yearsCount > 0 ? `- 累计年数：第 ${calc.yearsCount} 周年\n` : ''}${calc.daysPassed > 0 ? `- 已经相伴：${calc.daysPassed} 天\n` : ''}${event.notes ? `- 备忘内容：${event.notes}\n` : ''}
---
飞牛 fnOS 纪念日周期提醒
    `.trim();
    }
}
exports.EmailService = EmailService;
