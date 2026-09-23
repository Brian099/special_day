import axios from 'axios';
import { EventItem, Category, UserSettings, User, Stats, CalculationResult, SolarTermInfo } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || './api'
});

// Interceptor to inject Token if stored locally
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('anniversary_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  // Auth
  async getCurrentUser(): Promise<{ user: User; settings: UserSettings }> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.data?.token) {
      localStorage.setItem('anniversary_token', res.data.data.token);
    }
    return res.data.data;
  },

  async register(username: string, password: string): Promise<{ token: string; user: User }> {
    const res = await api.post('/auth/register', { username, password });
    if (res.data.data?.token) {
      localStorage.setItem('anniversary_token', res.data.data.token);
    }
    return res.data.data;
  },

  logout() {
    localStorage.removeItem('anniversary_token');
  },

  // Events
  async getEvents(params?: {
    category_id?: string;
    search?: string;
    archived?: string;
    repeat_type?: string;
  }): Promise<{ events: EventItem[]; stats: Stats }> {
    const res = await api.get('/events', { params });
    return res.data.data;
  },

  async getEventById(id: string): Promise<EventItem> {
    const res = await api.get(`/events/${id}`);
    return res.data.data;
  },

  async createEvent(eventData: Partial<EventItem>): Promise<{ id: string }> {
    const res = await api.post('/events', eventData);
    return res.data.data;
  },

  async updateEvent(id: string, eventData: Partial<EventItem>): Promise<void> {
    await api.put(`/events/${id}`, eventData);
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  async togglePin(id: string): Promise<{ top_pinned: boolean }> {
    const res = await api.post(`/events/${id}/pin`);
    return res.data.data;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await api.get('/categories');
    return res.data.data;
  },

  async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await api.post('/categories', data);
    return res.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },

  // Settings
  async getSettings(): Promise<UserSettings> {
    const res = await api.get('/settings');
    return res.data.data;
  },

  async updateSettings(data: Partial<UserSettings>): Promise<void> {
    await api.put('/settings', data);
  },

  async testWebhook(webhook_url: string, webhook_type: string): Promise<{ message: string }> {
    const res = await api.post('/settings/test-webhook', { webhook_url, webhook_type });
    return res.data;
  },

  async testEmail(emailConfig: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass?: string;
    smtp_from?: string;
    smtp_secure?: boolean;
    email_recipient: string;
  }): Promise<{ message: string }> {
    const res = await api.post('/settings/test-email', emailConfig);
    return res.data;
  },

  // Calculations & Solar Terms
  async previewCalculate(data: any): Promise<CalculationResult> {
    const res = await api.post('/preview/calculate', data);
    return res.data.data;
  },

  async getCurrentSolarTerm(): Promise<SolarTermInfo> {
    const res = await api.get('/solar-terms/current');
    return res.data.data;
  },

  // Data Export & Import (JSON)
  async exportData(): Promise<any> {
    const res = await api.get('/data/export');
    return res.data;
  },

  async importData(payload: { mode: 'merge' | 'overwrite'; data: any }): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await api.post('/data/import', payload);
    return res.data;
  }
};
