import React, { useState } from 'react';
import { X, Lock, User as UserIcon } from 'lucide-react';
import { apiClient } from '../api/client';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await apiClient.register(username.trim(), password);
        onSuccess(res.user);
      } else {
        const res = await apiClient.login(username.trim(), password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div 
        className="modal-container animate-slide-up"
        style={{
          maxWidth: '420px',
          width: '100%'
        }}
      >
        <div className="modal-header">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isRegister ? '注册独立账户' : '登录独立账户'}
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
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: '#FEF2F2',
              color: '#C53030',
              fontSize: '13px',
              marginBottom: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                用户名
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  required
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
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

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="password"
                  required
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-solid"
              style={{
                marginTop: '8px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '处理中...' : isRegister ? '立即注册' : '登录'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {isRegister ? '已有账户？返回登录' : '没有账户？创建新独立账户'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

