import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SolarTermBanner } from './components/SolarTermBanner';
import { TopDashboardCards } from './components/TopDashboardCards';
import { TimelineView } from './components/TimelineView';
import { EventFormModal } from './components/EventFormModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { FallingLeavesTreeCanvas } from './components/FallingLeavesTreeCanvas';
import { EventItem, Category, User, SolarTermInfo } from './types';
import { apiClient } from './api/client';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [solarTerm, setSolarTerm] = useState<SolarTermInfo | null>(null);

  // Filters (for Timeline only)
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRepeatType, setSelectedRepeatType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  // Theme synchronization
  useEffect(() => {
    const savedTheme = localStorage.getItem('anniversary_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('anniversary_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Load Solar Term
  const loadSolarTerm = useCallback(async () => {
    try {
      const res = await apiClient.getCurrentSolarTerm();
      setSolarTerm(res);
    } catch (err) {
      console.error('Failed to load solar term:', err);
    }
  }, []);

  // Load User Info
  const loadUser = useCallback(async () => {
    try {
      const res = await apiClient.getCurrentUser();
      setUser(res.user);
      return res.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await apiClient.getCategories();
      setCategories(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load All Events (Unfiltered, for top dashboard cards and base data)
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getEvents();
      setAllEvents(res.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered Events specifically for the Timeline View below
  const timelineEvents = React.useMemo(() => {
    return allEvents.filter(e => {
      if (selectedCategory && e.category_id !== selectedCategory) {
        return false;
      }
      if (selectedRepeatType && e.repeat_type !== selectedRepeatType) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchNotes = e.notes?.toLowerCase().includes(q);
        const matchCat = e.category_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchNotes && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [allEvents, selectedCategory, selectedRepeatType, searchQuery]);

  // Initial Load
  useEffect(() => {
    loadSolarTerm();
    loadUser().then((u) => {
      if (u) {
        loadCategories();
        loadEvents();
      } else {
        setLoading(false);
      }
    });
  }, [loadSolarTerm, loadUser, loadCategories, loadEvents]);

  // Handle Actions
  const handleEdit = (event: EventItem) => {
    setEditingEvent(event);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除这个节日/纪念日吗？')) {
      try {
        await apiClient.deleteEvent(id);
        loadEvents();
        loadCategories();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleTogglePin = async (event: EventItem) => {
    try {
      await apiClient.togglePin(event.id);
      loadEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* 极简新中式意境：右侧大树与向左下角零星飘落之落叶 */}
      <FallingLeavesTreeCanvas theme={theme} />

      <div className="app-layout">
        {/* Top Header */}
      <Header
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAddModal={() => {
          if (!user) {
            setIsAuthOpen(true);
            return;
          }
          setEditingEvent(null);
          setIsAddModalOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 24 Solar Terms Atmospheric Dynamic Banner & Traditional Color Scheme */}
      <SolarTermBanner solarTerm={solarTerm} />

      {!user && !loading ? (
        /* Unauthenticated Guest State Card */
        <div className="card-box" style={{
          padding: '48px 32px',
          textAlign: 'center',
          maxWidth: '640px',
          margin: '24px auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            fontSize: '24px'
          }}>
            🗓️
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
            欢迎使用 纪念日与节日提醒
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.6 }}>
            支持公历/农历双引擎、二十四节气物候、智能倒计时与周期提醒。请登录或注册账户开始记录每一个值得铭记的日子。
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="btn-primary-solid"
              style={{ height: '42px', padding: '0 24px', borderRadius: 'var(--radius-md)' }}
            >
              登录 / 注册新账户
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Dashboard 3-Cards Row (倒计时, 重要提醒, 最近提醒) - Hidden when searching */}
          {!searchQuery.trim() && (
            <TopDashboardCards
              events={allEvents}
              onEdit={handleEdit}
              onTogglePin={handleTogglePin}
              onOpenAddModal={() => {
                if (!user) {
                  setIsAuthOpen(true);
                  return;
                }
                setEditingEvent(null);
                setIsAddModalOpen(true);
              }}
            />
          )}

          {/* Timeline View of All Records - Based on timelineEvents (Filtered) */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              <Sparkles size={28} style={{ margin: '0 auto 12px', color: 'var(--primary)' }} />
              <p style={{ fontSize: '0.9rem', fontFamily: 'var(--font-serif)' }}>正在加载纪念日列表...</p>
            </div>
          ) : (
            <TimelineView
              events={timelineEvents}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedRepeatType={selectedRepeatType}
              onSelectRepeatType={setSelectedRepeatType}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onOpenAddModal={() => {
                if (!user) {
                  setIsAuthOpen(true);
                  return;
                }
                setEditingEvent(null);
                setIsAddModalOpen(true);
              }}
            />
          )}
        </>
      )}

      {/* Modals */}
      <EventFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadEvents();
          loadCategories();
        }}
        initialEvent={editingEvent}
        categories={categories}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onLogout={() => {
          apiClient.logout();
          setUser(null);
          loadEvents();
        }}
        categories={categories}
        onRefreshCategories={loadCategories}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          loadCategories();
          loadEvents();
        }}
      />
      </div>
    </>
  );
};

export default App;
