import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  LogOut, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { User, Category } from '../types';
import { apiClient } from '../api/client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
  categories,
  onRefreshCategories
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'webhook' | 'category'>('webhook');

  // Webhook form
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookType, setWebhookType] = useState('generic');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // New Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#8B5E5E');

  useEffect(() => {
    if (!isOpen) return;
    apiClient.getSettings().then(res => {
      setWebhookUrl(res.webhook_url || '');
      setWebhookType(res.webhook_type || 'generic');
    });
    setTestResult(null);
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

  return (
    <div className="modal-overlay">
      <div 
        className="modal-container animate-slide-up"
        style={{
          maxWidth: '560px',
          width: '100%'
        }}
      >
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            ⚙️ 系统设置与多用户管理
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
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '20px' }}>
            {[
              { key: 'webhook', label: '消息推送' },
              { key: 'category', label: '分类管理' },
              { key: 'profile', label: '当前用户与隔离' }
            ].map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key as any)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === t.key ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: activeTab === t.key ? '#fff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === t.key ? '0 3px 10px rgba(139, 94, 94, 0.2)' : 'none'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

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

          {/* Tab 2: Category Management */}
          {activeTab === 'category' && (
            <div>
              <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="新增分类名称"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{
                    width: '40px',
                    height: '38px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary-solid"
                  style={{ height: '38px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
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

          {/* Tab 3: User Profile */}
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

