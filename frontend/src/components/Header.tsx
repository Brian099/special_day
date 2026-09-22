import React from 'react';
import { 
  Plus, 
  Settings, 
  Search, 
  User as UserIcon
} from 'lucide-react';
import { User, AppThemeType, APP_THEMES } from '../types';

interface HeaderProps {
  user: User | null;
  theme: AppThemeType | string;
  onCycleTheme: () => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  onCycleTheme,
  onOpenAddModal,
  onOpenSettings,
  onOpenAuth,
  searchQuery,
  onSearchChange
}) => {
  const currentThemeObj = APP_THEMES.find(t => t.id === theme) || APP_THEMES[0];

  return (
    <header className="header-card card-box">
      {/* 第一行：品牌/Logo + 用户状态/设置 */}
      <div className="header-top-row">
        {/* 左侧 Brand & Logo */}
        <div className="header-brand">
          <div className="header-logo">
            纪
          </div>
          <div className="header-title-wrap">
            <h1 className="header-title">
              纪念日
            </h1>
            <p className="header-subtitle">
              珍惜每一个值得铭记的日子
            </p>
          </div>
        </div>

        {/* 右侧 User Profile / Settings */}
        <div className="header-user-wrap">
          {user ? (
            <div 
              onClick={onOpenSettings}
              className="header-user-badge"
              title="点击打开设置与多用户管理"
            >
              <div className="header-user-info">
                <span className="header-username">
                  {user.username}
                </span>
                <span className="header-user-role">
                  {user.role === 'admin' ? '管理员' : '普通用户'}
                </span>
              </div>
              <Settings size={15} className="header-user-icon" />
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="header-auth-btn"
            >
              <UserIcon size={15} />
              <span>登录 / 注册</span>
            </button>
          )}
        </div>
      </div>

      {/* 第二行：全宽搜索栏 + 新建按钮 + 循环切换主题 */}
      <div className="header-bottom-row">
        {/* Search Input */}
        <div className="header-search-bar">
          <Search size={16} className="header-search-icon" />
          <input
            type="text"
            placeholder="搜索节日、生日、纪念日…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="header-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="header-search-clear"
              title="清空搜索"
            >
              ×
            </button>
          )}
        </div>

        {/* Create Button: 移动端为带 '+' 图标的紧凑按钮，PC端显示完整文案 */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="header-btn-create btn-primary-solid"
          title="新建纪念日"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="header-btn-text">新建纪念日</span>
        </button>

        {/* Multi-Theme Cycle Button */}
        <button
          type="button"
          onClick={onCycleTheme}
          className="header-btn-theme btn-icon-box"
          title={`当前主题：${currentThemeObj.name}（点击切换主题）`}
          style={{ position: 'relative' }}
        >
          <span style={{ fontSize: '16px', lineHeight: 1 }}>{currentThemeObj.icon}</span>
        </button>
      </div>
    </header>
  );
};

export default Header;


