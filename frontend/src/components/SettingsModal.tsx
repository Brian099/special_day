import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  LogOut, 
  CheckCircle, 
  AlertCircle,
  Download,
  Upload,
  FileJson,
  RefreshCw,
  Mail,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { User, Category, AppThemeType, APP_THEMES } from '../types';
import { apiClient } from '../api/client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
  onRefreshEvents?: () => void;
  currentTheme?: AppThemeType | string;
  onSelectTheme?: (theme: AppThemeType) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  categories,
  onRefreshCategories,
  onRefreshEvents,
  currentTheme = 'autumn-gold',
  onSelectTheme
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'webhook' | 'email' | 'category' | 'data' | 'profile'>('theme');

  // Webhook form
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookType, setWebhookType] = useState('generic');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Email / SMTP form
  const [smtpPreset, setSmtpPreset] = useState('custom');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [emailSaveResult, setEmailSaveResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // New Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5E5E');

  // Data Import / Export state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any | null>(null);
  const [dataMessage, setDataMessage] = useState<{ success?: boolean; message?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    apiClient.getSettings().then(res => {
      setWebhookUrl(res.webhook_url || '');
      setWebhookType(res.webhook_type || 'generic');
      setSmtpHost(res.smtp_host || '');
      setSmtpPort(res.smtp_port || 465);
      setSmtpUser(res.smtp_user || '');
      setSmtpPass(res.smtp_pass || '');
      setSmtpFrom(res.smtp_from || '');
      setSmtpSecure(res.smtp_secure !== undefined ? Boolean(res.smtp_secure) : true);
      setEmailRecipient(res.email_recipient || '');
      setEmailEnabled(Boolean(res.email_enabled));

      // Infer preset if host matches
      if (res.smtp_host?.includes('qq.com')) setSmtpPreset('qq');
      else if (res.smtp_host?.includes('163.com')) setSmtpPreset('163');
      else if (res.smtp_host?.includes('126.com')) setSmtpPreset('126');
      else if (res.smtp_host?.includes('office365') || res.smtp_host?.includes('outlook')) setSmtpPreset('outlook');
      else if (res.smtp_host?.includes('gmail.com')) setSmtpPreset('gmail');
      else if (res.smtp_host?.includes('139.com')) setSmtpPreset('139');
      else setSmtpPreset('custom');
    });
    setTestResult(null);
    setEmailTestResult(null);
    setEmailSaveResult(null);
    setDataMessage(null);
    setSelectedFile(null);
    setParsedData(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.updateSettings({
        webhook_url: webhookUrl.trim(),
        webhook_type: webhookType as any
      });
      setTestResult({ success: true, message: 'Webhook 设置已成功保存！' });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || '保存失败' });
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: '请先填写 Webhook URL' });
      return;
    }
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await apiClient.testWebhook(webhookUrl.trim(), webhookType);
      setTestResult({ success: true, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.response?.data?.message || err.message || '测试失败' });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    setSmtpPreset(preset);
    if (preset === 'qq') {
      setSmtpHost('smtp.qq.com');
      setSmtpPort(465);
      setSmtpSecure(true);
    } else if (preset === '163') {
      setSmtpHost('smtp.163.com');
      setSmtpPort(465);
      setSmtpSecure(true);
    } else if (preset === '126') {
      setSmtpHost('smtp.126.com');
      setSmtpPort(465);
      setSmtpSecure(true);
    } else if (preset === 'outlook') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
      setSmtpSecure(false);
    } else if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(465);
      setSmtpSecure(true);
    } else if (preset === '139') {
      setSmtpHost('smtp.139.com');
      setSmtpPort(465);
      setSmtpSecure(true);
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.updateSettings({
        smtp_host: smtpHost.trim(),
        smtp_port: Number(smtpPort) || 465,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass,
        smtp_from: smtpFrom.trim(),
        smtp_secure: smtpSecure,
        email_recipient: emailRecipient.trim(),
        email_enabled: emailEnabled
      });
      setEmailSaveResult({ success: true, message: '邮件与发信服务设置已成功保存！' });
    } catch (err: any) {
      setEmailSaveResult({ success: false, message: err.response?.data?.message || err.message || '保存失败' });
    }
  };

  const handleTestEmail = async () => {
    if (!smtpHost || !smtpUser) {
      setEmailTestResult({ success: false, message: '请先填写 SMTP 主机与发信账号' });
      return;
    }
    if (!emailRecipient) {
      setEmailTestResult({ success: false, message: '请填写收件人邮箱地址' });
      return;
    }

    setTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await apiClient.testEmail({
        smtp_host: smtpHost.trim(),
        smtp_port: Number(smtpPort) || 465,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass,
        smtp_from: smtpFrom.trim(),
        smtp_secure: smtpSecure,
        email_recipient: emailRecipient.trim()
      });
      setEmailTestResult({ success: true, message: res.message || '测试邮件发送成功，请查收！' });
    } catch (err: any) {
      setEmailTestResult({ success: false, message: err.response?.data?.message || err.message || '发送失败，请检查 SMTP 配置' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await apiClient.createCategory({
        name: newCatName.trim(),
        color: newCatColor
      });
      setNewCatName('');
      onRefreshCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await apiClient.deleteCategory(id);
      onRefreshCategories();
    } catch (err) {
      console.error(err);
    }
  };

  // Export JSON file
  const handleExportData = async () => {
    try {
      setExporting(true);
      setDataMessage(null);
      const res = await apiClient.exportData();

      // Trigger browser file download
      const jsonStr = JSON.stringify(res, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `纪念日提醒_备份_${user?.username || 'user'}_${dateStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDataMessage({
        success: true,
        message: `导出成功！已下载文件 ${fileName}（包含 ${res.summary?.events_count ?? 0} 个纪念日、${res.summary?.categories_count ?? 0} 个分类）`
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setDataMessage({
        success: false,
        message: '数据导出失败: ' + (err.response?.data?.message || err.message || '网络错误')
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle JSON file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataMessage(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setParsedData(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Support both nested { data: { events, categories } } or flat format
        const actualData = json.data || json;
        const eventsCount = Array.isArray(actualData.events) ? actualData.events.length : 0;
        const categoriesCount = Array.isArray(actualData.categories) ? actualData.categories.length : 0;

        if (eventsCount === 0 && categoriesCount === 0) {
          setDataMessage({
            success: false,
            message: '该 JSON 文件中未检测到有效的纪念日或分类数据！'
          });
          setParsedData(null);
          return;
        }

        setParsedData({
          eventsCount,
          categoriesCount,
          raw: actualData
        });
      } catch (err) {
        setDataMessage({
          success: false,
          message: 'JSON 解析失败，请确认文件格式是否正确。'
        });
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Import
  const handleImportData = async () => {
    if (!parsedData || !parsedData.raw) {
      setDataMessage({ success: false, message: '请先选择有效的 JSON 备份文件' });
      return;
    }

    if (importMode === 'overwrite') {
      const confirmOverwrite = window.confirm(
        '⚠️ 警告：您选择了【清空覆盖导入】模式！\n\n这将会清空您当前所有的纪念日、分类及提醒数据，并完全用文件中的数据替代。确认继续吗？'
      );
      if (!confirmOverwrite) return;
    }

    try {
      setImporting(true);
      setDataMessage(null);
      const res = await apiClient.importData({
        mode: importMode,
        data: parsedData.raw
      });

      setDataMessage({
        success: true,
        message: res.message || '数据导入成功！'
      });

      // Clear input
      setSelectedFile(null);
      setParsedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh frontend data
      onRefreshCategories();
      if (onRefreshEvents) {
        onRefreshEvents();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setDataMessage({
        success: false,
        message: '导入失败: ' + (err.response?.data?.message || err.message || '未知错误')
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-container animate-slide-up"
        style={{
          maxWidth: '580px',
          width: '100%'
        }}
      >
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ⚙️ 系统设置与数据管理
          </h2>
          <button
            onClick={onClose}
            className="btn-icon-box"
            style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Settings Tabs */}
          <div className="settings-tabs-grid">
            {[
              { key: 'theme', label: '🎨 主题外观' },
              { key: 'webhook', label: '📢 消息推送' },
              { key: 'email', label: '📧 邮件提醒' },
              { key: 'category', label: '📂 分类管理' },
              { key: 'data', label: '💾 数据导入导出' },
              { key: 'profile', label: '👤 当前用户' }
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setActiveTab(t.key as any);
                  setDataMessage(null);
                  setTestResult(null);
                  setEmailTestResult(null);
                  setEmailSaveResult(null);
                }}
                className={`settings-tab-btn ${activeTab === t.key ? 'active' : ''}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab 0: Theme Appearance */}
          {activeTab === 'theme' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                选择您喜爱的传统国风与现代色系。主题配置将自动与当前登录账户云端绑定，不同账户可享有独立个性化风格。
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                marginTop: '4px'
              }}>
                {APP_THEMES.map(th => {
                  const isSelected = currentTheme === th.id || (th.id === 'autumn-gold' && currentTheme === 'light') || (th.id === 'dark-night' && currentTheme === 'dark');
                  return (
                    <div
                      key={th.id}
                      onClick={() => onSelectTheme && onSelectTheme(th.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--bg-card)' : 'var(--bg-subtle)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 16px rgba(139, 94, 94, 0.12)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>{th.icon}</span>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {th.name}
                          </span>
                        </div>
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: th.previewColor,
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }} />
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.3 }}>
                        {th.desc}
                      </p>
                      {isSelected && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '10px',
                          background: 'var(--primary)',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 600
                        }}>
                          当前生效
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 1: Webhook Push */}
          {activeTab === 'webhook' && (
            <form onSubmit={handleSaveWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                配置您的推送服务，当重要节日或纪念日到达时，后端将自动向您的客户端发送提醒通知。
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  推送服务类型
                </label>
                <select
                  value={webhookType}
                  onChange={(e) => setWebhookType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="generic">通用 HTTP POST</option>
                  <option value="serverchan">Server酱</option>
                  <option value="pushplus">PushPlus</option>
                  <option value="feishu">飞书自定义机器人</option>
                  <option value="dingtalk">钉钉自定义机器人</option>
                  <option value="wecom">企业微信群机器人</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="请输入 Webhook 接口调用地址"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {testResult && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: testResult.success ? 'var(--gold-light)' : '#FEF2F2',
                  color: testResult.success ? 'var(--gold-deep)' : '#C53030',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrl}
                  className="btn-icon-box"
                  style={{ width: 'auto', padding: '0 16px', height: '38px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 500, opacity: (!webhookUrl || testingWebhook) ? 0.6 : 1 }}
                >
                  <Send size={14} style={{ marginRight: '4px' }} />
                  {testingWebhook ? '正在测试...' : '测试发送'}
                </button>

                <button
                  type="submit"
                  className="btn-primary-solid"
                  style={{ height: '38px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                >
                  保存设置
                </button>
              </div>
            </form>
          )}

          {/* Tab 1.5: Email Notifications */}
          {activeTab === 'email' && (
            <form onSubmit={handleSaveEmailSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  配置发信 SMTP 服务与收件人，重要纪念日到达时将自动推送精美格式邮件。
                </p>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span>启用邮件提醒</span>
                </label>
              </div>

              {/* Service Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  常用邮箱服务快速配置
                </label>
                <select
                  value={smtpPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="custom">⚙️ 自定义 SMTP 服务器</option>
                  <option value="qq">🐧 QQ 邮箱 (smtp.qq.com · 端口 465 SSL)</option>
                  <option value="163">📮 163 网易邮箱 (smtp.163.com · 端口 465 SSL)</option>
                  <option value="126">📧 126 邮箱 (smtp.126.com · 端口 465 SSL)</option>
                  <option value="outlook">💼 微软 Outlook / Office 365 (587 STARTTLS)</option>
                  <option value="gmail">🌐 Google Gmail (465 SSL)</option>
                  <option value="139">📱 139 移动邮箱 (smtp.139.com · 端口 465 SSL)</option>
                </select>
              </div>

              {/* Preset Guidance Tip */}
              {(smtpPreset === 'qq' || smtpPreset === '163' || smtpPreset === '126') && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gold-light)',
                  color: 'var(--gold-deep)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  lineHeight: 1.5
                }}>
                  <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    {smtpPreset === 'qq' && (
                      <span><strong>QQ 邮箱授权指引：</strong>请登录 QQ 邮箱网页版，在「设置」-「账户」页面找到「POP3/IMAP/SMTP/Exchange 服务」，开启 SMTP 并点击生成 16 位<strong>授权码</strong>，在下方密码框填入该授权码（切勿填写 QQ 登录密码）。</span>
                    )}
                    {(smtpPreset === '163' || smtpPreset === '126') && (
                      <span><strong>网易邮箱授权指引：</strong>请登录网页版邮箱，在「设置」-「POP3/SMTP/IMAP」页面开启 SMTP 服务并新增<strong>授权密码</strong>，在下方密码框填入授权密码。</span>
                    )}
                  </div>
                </div>
              )}

              {/* Grid 1: Host & Port */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    SMTP 服务器主机
                  </label>
                  <input
                    type="text"
                    placeholder="例如 smtp.qq.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    端口
                  </label>
                  <input
                    type="number"
                    placeholder="465"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value) || 465)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Grid 2: Account & Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    发信邮箱账号
                  </label>
                  <input
                    type="text"
                    placeholder="your_email@domain.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    SMTP 授权码 / 密码
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSmtpPass ? 'text' : 'password'}
                      placeholder={smtpPass ? '••••••••' : '请输入授权码或应用密码'}
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 3: From Name & Recipient Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    发件人显示昵称 (选填)
                  </label>
                  <input
                    type="text"
                    placeholder="例如 飞牛纪念日提醒"
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                    默认接收提醒邮箱
                  </label>
                  <input
                    type="email"
                    placeholder="target_email@domain.com"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* SSL/TLS Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="smtpSecureCheckbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="smtpSecureCheckbox" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  使用 SSL/TLS 加密连接 (端口 465 通常勾选，端口 587 STARTTLS 通常不勾选)
                </label>
              </div>

              {/* Feedback messages */}
              {emailTestResult && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: emailTestResult.success ? 'var(--gold-light)' : '#FEF2F2',
                  color: emailTestResult.success ? 'var(--gold-deep)' : '#C53030',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {emailTestResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{emailTestResult.message}</span>
                </div>
              )}

              {emailSaveResult && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: emailSaveResult.success ? 'var(--gold-light)' : '#FEF2F2',
                  color: emailSaveResult.success ? 'var(--gold-deep)' : '#C53030',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {emailSaveResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{emailSaveResult.message}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !smtpHost || !smtpUser || !emailRecipient}
                  className="btn-icon-box"
                  style={{ 
                    width: 'auto', 
                    padding: '0 16px', 
                    height: '38px', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    opacity: (!smtpHost || !smtpUser || !emailRecipient || testingEmail) ? 0.6 : 1 
                  }}
                >
                  <Mail size={14} style={{ marginRight: '4px' }} />
                  {testingEmail ? '正在发送测试邮件...' : '测试邮件发送'}
                </button>

                <button
                  type="submit"
                  className="btn-primary-solid"
                  style={{ height: '38px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                >
                  保存邮件设置
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Category Management */}
          {activeTab === 'category' && (
            <div>
              <form onSubmit={handleCreateCategory} className="category-create-form">
                <input
                  type="text"
                  placeholder="新增分类名称"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="category-create-input"
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="category-create-color"
                  title="选择分类标识颜色"
                />
                <button
                  type="submit"
                  className="btn-primary-solid category-create-btn"
                >
                  <Plus size={15} />
                  添加
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cat.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="btn-icon-box"
                      style={{ width: '28px', height: '28px', border: 'none' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF2F2';
                        e.currentTarget.style.color = '#C53030';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Data Export & Import (JSON) */}
          {activeTab === 'data' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Export Card */}
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Download size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      导出数据备份 (JSON)
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      将当前账户下的全部纪念日、分类、提醒配置及偏好导出为单个 .json 备份文件。
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleExportData}
                    disabled={exporting}
                    className="btn-primary-solid"
                    style={{ height: '38px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
                  >
                    {exporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                    <span>{exporting ? '正在打包导出...' : '导出 JSON 备份文件'}</span>
                  </button>
                </div>
              </div>

              {/* Import Card */}
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--gold-light)',
                    color: 'var(--gold-deep)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      导入数据备份 (JSON)
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      选择此前导出的 JSON 备份文件，恢复或同步您的纪念日数据。
                    </p>
                  </div>
                </div>

                {/* File picker */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="backup-file-input"
                  />
                  <label
                    htmlFor="backup-file-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px dashed var(--gold)',
                      background: 'var(--bg-card)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <FileJson size={18} color="var(--primary)" />
                    <span>{selectedFile ? `已选择: ${selectedFile.name}` : '点击选择或拖入 .json 备份文件'}</span>
                  </label>
                </div>

                {/* File Summary if parsed */}
                {parsedData && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>📊 检测到内容：</span>
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {parsedData.eventsCount} 个纪念日 / {parsedData.categoriesCount} 个分类
                    </span>
                  </div>
                )}

                {/* Mode Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    导入模式
                  </label>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}>
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                      />
                      <span><strong>追加合并（推荐）</strong>：保留现有数据</span>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#C53030'
                    }}>
                      <input
                        type="radio"
                        name="importMode"
                        value="overwrite"
                        checked={importMode === 'overwrite'}
                        onChange={() => setImportMode('overwrite')}
                      />
                      <span><strong>清空覆盖</strong>：清除旧数据再恢复</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleImportData}
                    disabled={importing || !parsedData}
                    className="btn-primary-solid"
                    style={{
                      height: '38px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      opacity: (!parsedData || importing) ? 0.6 : 1
                    }}
                  >
                    {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                    <span>{importing ? '正在恢复数据...' : '确认开始导入'}</span>
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {dataMessage && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: dataMessage.success ? 'var(--gold-light)' : '#FEF2F2',
                  color: dataMessage.success ? 'var(--gold-deep)' : '#C53030',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: 1.5
                }}>
                  {dataMessage.success ? <CheckCircle size={18} style={{ flexShrink: 0 }} /> : <AlertCircle size={18} style={{ flexShrink: 0 }} />}
                  <span>{dataMessage.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: User Profile */}
          {activeTab === 'profile' && user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '18px',
                  fontWeight: 600
                }}>
                  {user.username[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {user.role === 'admin' ? '系统管理员' : '普通用户'}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                🛡️ <strong>多用户隔离保障</strong>：所有提醒事件、分类标签和 Webhook 配置均绑定在当前用户专属空间，数据完全独立私有。
              </p>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #C53030',
                  background: '#FEF2F2',
                  color: '#C53030',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                <LogOut size={16} />
                <span>退出登录 / 切换账号</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
