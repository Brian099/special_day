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

export interface UserSettings {
  user_id: string;
  theme_mode: 'system' | 'light' | 'dark';
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
