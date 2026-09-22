export interface CalculationResult {
  nextDate: string;
  daysRemaining: number;
  isToday: boolean;
  daysPassed: number;
  yearsCount: number;
  targetDateFormatted: string;
  lunarFormatted: string;
  zodiac?: string;
  ganzhi: string;
  constellation?: string;
  solarTerm?: string;
  targetLunarString?: string;
}

export interface Reminder {
  id?: string;
  remind_time: string;
  advance_days: number;
  notify_channels: string[];
  enabled: boolean;
}

export interface EventItem {
  id: string;
  user_id: string;
  category_id?: string | null;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  title: string;
  target_date: string;
  calendar_type: 'solar' | 'lunar';
  is_leap_month: boolean;
  repeat_type: 'none' | 'year' | 'month' | 'week' | 'custom_days';
  repeat_interval: number;
  repeat_weekdays?: string | null;
  direction: 'countdown' | 'accumulate' | 'both';
  cover_image?: string | null;
  top_pinned: boolean;
  archived: boolean;
  notes?: string | null;
  created_at?: string;
  reminders: Reminder[];
  calculation: CalculationResult;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  event_count?: number;
}

export const APP_THEMES = [
  { id: 'autumn-gold', name: '秋叶金', icon: '🍂', desc: '经典秋意 · 暖酒红金', previewColor: '#8B5E5E' },
  { id: 'dark-night', name: '暮夜凝月', icon: '🌙', desc: '曜石暗夜 · 沉木金晖', previewColor: '#D4B783' },
  { id: 'spring-sakura', name: '落樱绯雪', icon: '🌸', desc: '春日绯樱 · 柔美雅致', previewColor: '#A85D6F' },
  { id: 'summer-forest', name: '竹影青翠', icon: '🍃', desc: '松柏青竹 · 清雅幽静', previewColor: '#3D6B58' },
  { id: 'royal-blue', name: '霁蓝月白', icon: '🌊', desc: '天青霁蓝 · 沉静如水', previewColor: '#3B5E78' },
] as const;

export type AppThemeType = typeof APP_THEMES[number]['id'];

export interface UserSettings {
  user_id: string;
  theme_mode: AppThemeType | 'system' | 'light' | 'dark' | string;
  default_calendar_type: 'solar' | 'lunar';
  webhook_url?: string;
  webhook_type?: string;
  notify_web: boolean;
  notify_email: boolean;
  notify_webhook: boolean;
}

export interface SolarTermInfo {
  name: string;
  season: '春' | '夏' | '秋' | '冬';
  summary: string;
  poem: string;
  author: string;
  phenology: string;
  traditionalColorName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  currentDate: string;
  termStartDate: string;
  nextTermName: string;
  nextTermDate: string;
  nextTermDays: number;
  wuHou: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
  isFnOSUser: boolean;
  fnUid?: string;
}

export interface Stats {
  total: number;
  todayCount: number;
  upcomingWeek: number;
  upcomingMonth: number;
  accumulateCount: number;
}
