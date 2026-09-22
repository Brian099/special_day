import React from 'react';
import { 
  Plus, 
  Sun, 
  Moon, 
  Settings, 
  Search, 
  User as UserIcon
} from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  onToggleTheme,
  onOpenAddModal,
  onOpenSettings,
  onOpenAuth,
  searchQuery,
  onSearchChange
}) => {
  return (
    <header className="card-box" style={{
      padding: '24px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '20px'
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold-light)',
          fontFamily: 'var(--font-serif)',
          fontSize: '20px',
          fontWeight: 600,
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(139, 94, 94, 0.2)'
        }}>
          纪
        </div>
        <div>
          <h1 style={{ 
            fontFamily: 'var(--font-serif)',
            fontSize: '24px', 
            fontWeight: 600, 
            letterSpacing: '0.5px',
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            纪念日
          </h1>
          <p style={{ 
            fontSize: '13px', 
            color: 'var(--text-tertiary)',
            marginTop: '3px',
            letterSpacing: '0.3px'
          }}>
            珍惜每一个值得铭记的日子
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0 16px',
          height: '42px',
          width: '240px',
          border: '1px solid transparent',
          transition: 'all 0.25s ease'
        }}>
          <Search size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="搜索节日、生日、纪念日…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%'
              }}
              title="清空搜索"
            >
              <span style={{ fontSize: '14px', lineHeight: 1, fontWeight: 'bold' }}>×</span>
            </button>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={onOpenAddModal}
          className="btn-primary-solid"
          style={{ height: '42px', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>新建纪念日</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="btn-icon-box"
          title={theme === 'dark' ? '切换为浅色模式' : '切换为深色模式'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings / User Action */}
        {user ? (
          <div 
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              background: 'var(--bg-subtle)',
              padding: '4px 12px 4px 6px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-light)',
              transition: 'all 0.2s ease'
            }}
            title="点击打开设置与多用户管理"
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: 'var(--font-serif)',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
            }}>
              {user.username[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.username}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                {user.role === 'admin' ? '管理员' : '普通用户'}
              </span>
            </div>
            <Settings size={15} style={{ color: 'var(--text-tertiary)', marginLeft: '4px' }} />
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-icon-box"
            style={{ width: 'auto', padding: '0 16px', gap: '6px', fontSize: '13px', fontWeight: 500 }}
          >
            <UserIcon size={16} />
            <span>登录 / 注册</span>
          </button>
        )}

      </div>
    </header>

  );
};

