import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Sparkles, 
  Pin,
  ArrowRightLeft,
  CalendarCheck2
} from 'lucide-react';
import { Solar, Lunar } from 'lunar-javascript';
import { EventItem, Category, CalculationResult } from '../types';
import { apiClient } from '../api/client';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialEvent?: EventItem | null;
  categories: Category[];
}

const LUNAR_MONTHS = [
  { value: 1, label: '正月' },
  { value: 2, label: '二月' },
  { value: 3, label: '三月' },
  { value: 4, label: '四月' },
  { value: 5, label: '五月' },
  { value: 6, label: '六月' },
  { value: 7, label: '七月' },
  { value: 8, label: '八月' },
  { value: 9, label: '九月' },
  { value: 10, label: '十月' },
  { value: 11, label: '冬月' },
  { value: 12, label: '腊月' }
];

const LUNAR_DAYS = [
  { value: 1, label: '初一' },
  { value: 2, label: '初二' },
  { value: 3, label: '初三' },
  { value: 4, label: '初四' },
  { value: 5, label: '初五' },
  { value: 6, label: '初六' },
  { value: 7, label: '初七' },
  { value: 8, label: '初八' },
  { value: 9, label: '初九' },
  { value: 10, label: '初十' },
  { value: 11, label: '十一' },
  { value: 12, label: '十二' },
  { value: 13, label: '十三' },
  { value: 14, label: '十四' },
  { value: 15, label: '十五' },
  { value: 16, label: '十六' },
  { value: 17, label: '十七' },
  { value: 18, label: '十八' },
  { value: 19, label: '十九' },
  { value: 20, label: '二十' },
  { value: 21, label: '廿一' },
  { value: 22, label: '廿二' },
  { value: 23, label: '廿三' },
  { value: 24, label: '廿四' },
  { value: 25, label: '廿五' },
  { value: 26, label: '廿六' },
  { value: 27, label: '廿七' },
  { value: 28, label: '廿八' },
  { value: 29, label: '廿九' },
  { value: 30, label: '三十' }
];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEvent,
  categories
}) => {
  const [title, setTitle] = useState('');

  // 1. Cycle Repeat Type First!
  const [repeatType, setRepeatType] = useState<'year' | 'month' | 'week' | 'custom_days' | 'none'>('year');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([1]); // For week cycle: 1=Mon...7=Sun

  // Monthly Cycle Day Option (1-31 for solar, 1-30 for lunar)
  const [monthlyDay, setMonthlyDay] = useState(1);

  // 2. Input & Calculation Modes
  const [inputMode, setInputMode] = useState<'solar' | 'lunar'>('solar');
  const [calcMode, setCalcMode] = useState<'solar' | 'lunar'>('solar');

  // Input states for Year/Custom/None cycles
  const [solarDateInput, setSolarDateInput] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [lunarYear, setLunarYear] = useState(new Date().getFullYear());
  const [lunarMonth, setLunarMonth] = useState(1);
  const [lunarDay, setLunarDay] = useState(1);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  // Additional form attributes
  const [direction, setDirection] = useState<'countdown' | 'accumulate' | 'both'>('countdown');
  const [categoryId, setCategoryId] = useState<string>('');
  const [topPinned, setTopPinned] = useState(false);
  const [notes, setNotes] = useState('');

  // Reminders
  const [advanceDays, setAdvanceDays] = useState<number[]>([0]);
  const [remindTime, setRemindTime] = useState('09:00');

  // Realtime Preview
  const [preview, setPreview] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate Year Options for Lunar Picker (1940 - 2050)
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = 1940; y <= 2050; y++) {
      try {
        const l = Lunar.fromYmd(y, 1, 1);
        years.push({
          year: y,
          label: `${y}年 ${l.getYearInGanZhi()}年 [${l.getYearShengXiao()}]`
        });
      } catch {
        years.push({ year: y, label: `${y}年` });
      }
    }
    return years;
  }, []);

  // Compute final effective targetDate and final effective isLeap for calculation & backend storage
  const computedTarget: { target_date: string; calendar_type: 'solar' | 'lunar'; is_leap_month: boolean; convertedInfo: string } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    // --- CASE A: Monthly Cycle ---
    if (repeatType === 'month') {
      if (inputMode === 'solar') {
        const mStr = curMonth < 10 ? `0${curMonth}` : `${curMonth}`;
        const dStr = monthlyDay < 10 ? `0${monthlyDay}` : `${monthlyDay}`;
        const curSolarStr = `${curYear}-${mStr}-${dStr}`;

        if (calcMode === 'lunar') {
          try {
            const solar = Solar.fromYmd(curYear, curMonth, Math.min(monthlyDay, 28));
            const lunar = solar.getLunar();
            const lD = lunar.getDay();
            const lDStr = lD < 10 ? `0${lD}` : `${lD}`;
            const targetLunarDate = `${curYear}-01-${lDStr}`;
            const lunarDayName = LUNAR_DAYS.find(d => d.value === lD)?.label || `${lD}日`;

            return {
              target_date: targetLunarDate,
              calendar_type: 'lunar' as const,
              is_leap_month: false,
              convertedInfo: `农历 每月${lunarDayName}`
            };
          } catch {
            return { target_date: curSolarStr, calendar_type: 'solar' as const, is_leap_month: false, convertedInfo: `公历 每月${monthlyDay}日` };
          }
        } else {
          return {
            target_date: curSolarStr,
            calendar_type: 'solar' as const,
            is_leap_month: false,
            convertedInfo: `公历 每月${monthlyDay}日`
          };
        }
      } else {
        // Monthly input as Lunar
        const dStr = monthlyDay < 10 ? `0${monthlyDay}` : `${monthlyDay}`;
        const targetLunarDate = `${curYear}-01-${dStr}`;
        const lunarDayName = LUNAR_DAYS.find(d => d.value === monthlyDay)?.label || `${monthlyDay}日`;

        if (calcMode === 'solar') {
          return {
            target_date: `${curYear}-${curMonth < 10 ? `0${curMonth}` : curMonth}-${dStr}`,
            calendar_type: 'solar' as const,
            is_leap_month: false,
            convertedInfo: `公历 每月${monthlyDay}日`
          };
        } else {
          return {
            target_date: targetLunarDate,
            calendar_type: 'lunar' as const,
            is_leap_month: false,
            convertedInfo: `农历 每月${lunarDayName}`
          };
        }
      }
    }

    // --- CASE B: Weekly Cycle ---
    if (repeatType === 'week') {
      const todayStr = now.toISOString().split('T')[0];
      return {
        target_date: todayStr,
        calendar_type: 'solar' as const,
        is_leap_month: false,
        convertedInfo: `每周循环`
      };
    }

    // --- CASE C: Annual, Custom Days, or Single Event ---
    if (inputMode === 'solar') {
      const parts = solarDateInput.split('-').map(Number);
      if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
        try {
          const solar = Solar.fromYmd(parts[0], parts[1], parts[2]);
          const lunar = solar.getLunar();
          const lY = lunar.getYear();
          const rawM = lunar.getMonth();
          const lM = Math.abs(rawM);
          const lD = lunar.getDay();
          const isLeap = rawM < 0;

          if (calcMode === 'lunar') {
            const mStr = lM < 10 ? `0${lM}` : `${lM}`;
            const dStr = lD < 10 ? `0${lD}` : `${lD}`;
            return {
              target_date: `${lY}-${mStr}-${dStr}`,
              calendar_type: 'lunar' as const,
              is_leap_month: isLeap,
              convertedInfo: `农历 ${lunar.getYearInGanZhi()}年 ${isLeap ? '闰' : ''}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
            };
          } else {
            return {
              target_date: solarDateInput,
              calendar_type: 'solar' as const,
              is_leap_month: false,
              convertedInfo: `公历 ${solarDateInput}`
            };
          }
        } catch {
          return { target_date: solarDateInput, calendar_type: calcMode, is_leap_month: false, convertedInfo: '' };
        }
      }
    } else {
      // inputMode === 'lunar'
      const mStr = lunarMonth < 10 ? `0${lunarMonth}` : `${lunarMonth}`;
      const dStr = lunarDay < 10 ? `0${lunarDay}` : `${lunarDay}`;
      const lunarDateStr = `${lunarYear}-${mStr}-${dStr}`;

      try {
        const lunar = Lunar.fromYmd(lunarYear, isLeapMonth ? -lunarMonth : lunarMonth, lunarDay);
        const solar = lunar.getSolar();
        const sM = solar.getMonth() < 10 ? `0${solar.getMonth()}` : `${solar.getMonth()}`;
        const sD = solar.getDay() < 10 ? `0${solar.getDay()}` : `${solar.getDay()}`;
        const convertedSolarStr = `${solar.getYear()}-${sM}-${sD}`;

        if (calcMode === 'solar') {
          return {
            target_date: convertedSolarStr,
            calendar_type: 'solar' as const,
            is_leap_month: false,
            convertedInfo: `公历 ${convertedSolarStr}`
          };
        } else {
          return {
            target_date: lunarDateStr,
            calendar_type: 'lunar' as const,
            is_leap_month: isLeapMonth,
            convertedInfo: `农历 ${lunar.getYearInGanZhi()}年 ${isLeapMonth ? '闰' : ''}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
          };
        }
      } catch {
        return { target_date: lunarDateStr, calendar_type: calcMode, is_leap_month: isLeapMonth, convertedInfo: '' };
      }
    }

    return { target_date: solarDateInput, calendar_type: calcMode, is_leap_month: false, convertedInfo: '' };
  }, [repeatType, monthlyDay, inputMode, calcMode, solarDateInput, lunarYear, lunarMonth, lunarDay, isLeapMonth]);

  // Sync Input mode switches
  const handleSwitchInputToLunar = () => {
    setInputMode('lunar');
    if (repeatType === 'month') {
      if (monthlyDay > 30) setMonthlyDay(30);
    } else {
      try {
        const parts = solarDateInput.split('-').map(Number);
        const solar = Solar.fromYmd(parts[0], parts[1], parts[2]);
        const lunar = solar.getLunar();
        setLunarYear(lunar.getYear());
        setLunarMonth(Math.abs(lunar.getMonth()));
        setLunarDay(lunar.getDay());
        setIsLeapMonth(lunar.getMonth() < 0);
      } catch {
        setLunarYear(new Date().getFullYear());
        setLunarMonth(1);
        setLunarDay(1);
      }
    }
  };

  const handleSwitchInputToSolar = () => {
    setInputMode('solar');
    if (repeatType !== 'month') {
      try {
        const lunar = Lunar.fromYmd(lunarYear, isLeapMonth ? -lunarMonth : lunarMonth, lunarDay);
        const solar = lunar.getSolar();
        const m = solar.getMonth() < 10 ? `0${solar.getMonth()}` : `${solar.getMonth()}`;
        const d = solar.getDay() < 10 ? `0${solar.getDay()}` : `${solar.getDay()}`;
        setSolarDateInput(`${solar.getYear()}-${m}-${d}`);
      } catch {}
    }
  };

  // Reset or fill form on open
  useEffect(() => {
    if (!isOpen) return;

    if (initialEvent) {
      setTitle(initialEvent.title);
      setRepeatType(initialEvent.repeat_type);
      setRepeatInterval(initialEvent.repeat_interval || 1);
      setCalcMode(initialEvent.calendar_type);
      setInputMode(initialEvent.calendar_type);

      try {
        setRepeatWeekdays(initialEvent.repeat_weekdays ? JSON.parse(initialEvent.repeat_weekdays) : [1]);
      } catch {
        setRepeatWeekdays([1]);
      }

      const parts = initialEvent.target_date.split('-').map(Number);
      if (initialEvent.repeat_type === 'month') {
        setMonthlyDay(parts[2] || 1);
      }

      if (initialEvent.calendar_type === 'solar') {
        setSolarDateInput(initialEvent.target_date);
        try {
          const solar = Solar.fromYmd(parts[0], parts[1], parts[2]);
          const lunar = solar.getLunar();
          setLunarYear(lunar.getYear());
          setLunarMonth(Math.abs(lunar.getMonth()));
          setLunarDay(lunar.getDay());
        } catch {}
      } else {
        setLunarYear(parts[0]);
        setLunarMonth(parts[1]);
        setLunarDay(parts[2]);
        setIsLeapMonth(Boolean(initialEvent.is_leap_month));
        try {
          const lunar = Lunar.fromYmd(parts[0], initialEvent.is_leap_month ? -parts[1] : parts[1], parts[2]);
          const solar = lunar.getSolar();
          const m = solar.getMonth() < 10 ? `0${solar.getMonth()}` : `${solar.getMonth()}`;
          const d = solar.getDay() < 10 ? `0${solar.getDay()}` : `${solar.getDay()}`;
          setSolarDateInput(`${solar.getYear()}-${m}-${d}`);
        } catch {}
      }

      setDirection(initialEvent.direction || 'countdown');
      setCategoryId(initialEvent.category_id || '');
      setTopPinned(Boolean(initialEvent.top_pinned));
      setNotes(initialEvent.notes || '');

      if (initialEvent.reminders && initialEvent.reminders.length > 0) {
        setAdvanceDays(initialEvent.reminders.map(r => r.advance_days));
        setRemindTime(initialEvent.reminders[0].remind_time || '09:00');
      }
    } else {
      setTitle('');
      setRepeatType('year');
      setRepeatInterval(1);
      setRepeatWeekdays([1]);
      setMonthlyDay(1);

      const today = new Date().toISOString().split('T')[0];
      setSolarDateInput(today);
      setInputMode('solar');
      setCalcMode('solar');
      setIsLeapMonth(false);
      setDirection('countdown');
      setCategoryId(categories[0]?.id || '');
      setTopPinned(false);
      setNotes('');
      setAdvanceDays([0]);
      setRemindTime('09:00');

      const now = new Date();
      setLunarYear(now.getFullYear());
      setLunarMonth(1);
      setLunarDay(1);
    }
    setError('');
  }, [isOpen, initialEvent, categories]);

  // Live Calculation Preview
  useEffect(() => {
    if (!computedTarget.target_date) return;

    const selectedCat = categories.find(c => c.id === categoryId);
    const payload = {
      title: title.trim(),
      category_name: selectedCat?.name || '',
      target_date: computedTarget.target_date,
      calendar_type: computedTarget.calendar_type,
      is_leap_month: computedTarget.is_leap_month,
      repeat_type: repeatType,
      repeat_interval: repeatInterval,
      repeat_weekdays: JSON.stringify(repeatWeekdays),
      direction
    };

    apiClient.previewCalculate(payload)
      .then(res => setPreview(res))
      .catch(() => setPreview(null));
  }, [computedTarget, repeatType, repeatInterval, repeatWeekdays, direction, title, categoryId, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入节日标题');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const remindersPayload = advanceDays.map(days => ({
        remind_time: remindTime,
        advance_days: days,
        notify_channels: ['web', 'webhook', 'email'],
        enabled: true
      }));

      const payload = {
        title: title.trim(),
        target_date: computedTarget.target_date,
        calendar_type: computedTarget.calendar_type,
        is_leap_month: computedTarget.is_leap_month,
        repeat_type: repeatType,
        repeat_interval: repeatInterval,
        repeat_weekdays: repeatType === 'week' ? JSON.stringify(repeatWeekdays) : null,
        direction,
        category_id: categoryId || null,
        top_pinned: topPinned,
        notes: notes.trim() || null,
        reminders: remindersPayload
      };

      if (initialEvent) {
        await apiClient.updateEvent(initialEvent.id, payload);
      } else {
        await apiClient.createEvent(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleWeekday = (day: number) => {
    if (repeatWeekdays.includes(day)) {
      if (repeatWeekdays.length > 1) {
        setRepeatWeekdays(repeatWeekdays.filter(d => d !== day));
      }
    } else {
      setRepeatWeekdays([...repeatWeekdays, day].sort());
    }
  };

  const toggleAdvanceDay = (days: number) => {
    if (advanceDays.includes(days)) {
      setAdvanceDays(advanceDays.filter(d => d !== days));
    } else {
      setAdvanceDays([...advanceDays, days]);
    }
  };

  const weekdaysMap = [
    { key: 1, label: '周一' },
    { key: 2, label: '周二' },
    { key: 3, label: '周三' },
    { key: 4, label: '周四' },
    { key: 5, label: '周五' },
    { key: 6, label: '周六' },
    { key: 7, label: '周日' }
  ];

  const lunarMonthObj = LUNAR_MONTHS.find(m => m.value === lunarMonth);
  const lunarDayObj = LUNAR_DAYS.find(d => d.value === lunarDay);

  const isCrossConversion = inputMode !== calcMode;

  return (
    <div className="modal-overlay">
      <div 
        className="modal-container animate-slide-up"
        style={{
          maxWidth: '580px',
          width: '100%'
        }}
      >
        {/* Fixed Modal Header */}
        <div className="modal-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {initialEvent ? '编辑纪念日' : '新建纪念日'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="modal-body">
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form id="event-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Step 1: Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                事件标题
              </label>
            <input
              type="text"
              required
              placeholder="例如：老婆生日、结婚纪念日、经期记录、升旗仪式..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Step 2: Choose Repeat Cycle Type FIRST */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              循环提醒方式
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px' }}>
              {[
                { type: 'year', label: '按年循环' },
                { type: 'month', label: '按月循环' },
                { type: 'week', label: '按周循环' },
                { type: 'custom_days', label: '自定义天数' },
                { type: 'none', label: '单次' }
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setRepeatType(item.type as any)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: repeatType === item.type ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                    background: repeatType === item.type ? 'var(--primary-light)' : 'var(--bg-subtle)',
                    color: repeatType === item.type ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: DYNAMIC DATE / DAY PICKER BASED ON REPEAT TYPE */}
          
          {/* TYPE 1: ANNUAL, SINGLE, OR CUSTOM INTERVAL DATES */}
          {(repeatType === 'year' || repeatType === 'none' || repeatType === 'custom_days') && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Input Mode Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  日期输入方式
                </label>

                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={handleSwitchInputToSolar}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: inputMode === 'solar' ? 'var(--primary)' : 'transparent',
                      color: inputMode === 'solar' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sun size={12} />
                    按公历输入
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchInputToLunar}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: inputMode === 'lunar' ? 'var(--primary)' : 'transparent',
                      color: inputMode === 'lunar' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Moon size={12} />
                    按农历输入
                  </button>
                </div>
              </div>

              {/* Full Calendar Input (Solar or Lunar Hanzi) */}
              {inputMode === 'solar' ? (
                <div>
                  <input
                    type="date"
                    required
                    value={solarDateInput}
                    onChange={(e) => setSolarDateInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    {/* Year */}
                    <div>
                      <select
                        value={lunarYear}
                        onChange={(e) => setLunarYear(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        {yearOptions.map(y => (
                          <option key={y.year} value={y.year}>{y.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Month */}
                    <div>
                      <select
                        value={lunarMonth}
                        onChange={(e) => setLunarMonth(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        {LUNAR_MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Day */}
                    <div>
                      <select
                        value={lunarDay}
                        onChange={(e) => setLunarDay(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.85rem'
                        }}
                      >
                        {LUNAR_DAYS.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      农历 {isLeapMonth ? '闰' : ''}{lunarMonthObj?.label}{lunarDayObj?.label}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isLeapMonth}
                        onChange={(e) => setIsLeapMonth(e.target.checked)}
                      />
                      <span>是否为闰月</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Calculation Mode Selector */}
              <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    循环计算方式
                  </label>

                  <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <button
                      type="button"
                      onClick={() => setCalcMode('solar')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: calcMode === 'solar' ? 'var(--primary)' : 'transparent',
                        color: calcMode === 'solar' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Sun size={12} />
                      按公历计算
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode('lunar')}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: calcMode === 'lunar' ? 'var(--primary)' : 'transparent',
                        color: calcMode === 'lunar' ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Moon size={12} />
                      按农历计算
                    </button>
                  </div>
                </div>

                {/* Conversion Notice */}
                <div style={{
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)'
                }}>
                  {isCrossConversion ? (
                    <ArrowRightLeft size={14} style={{ color: 'var(--gold-deep)', flexShrink: 0 }} />
                  ) : (
                    <CalendarCheck2 size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  )}
                  <span>
                    计算基准：<strong style={{ color: 'var(--primary)' }}>{computedTarget.convertedInfo}</strong>
                  </span>
                </div>
              </div>

              {/* Custom Interval input when repeat_type == 'custom_days' */}
              {repeatType === 'custom_days' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>每隔</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(Number(e.target.value))}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>天循环一次</span>
                </div>
              )}
            </div>
          )}

          {/* TYPE 2: MONTHLY CYCLE PICKER (1-31 or 初一至三十) */}
          {repeatType === 'month' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  每月固定日期
                </label>

                {/* Mode Selector */}
                <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('solar');
                      setCalcMode('solar');
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: inputMode === 'solar' ? 'var(--primary)' : 'transparent',
                      color: inputMode === 'solar' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    公历 1-31 日
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode('lunar');
                      setCalcMode('lunar');
                      if (monthlyDay > 30) setMonthlyDay(30);
                    }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: inputMode === 'lunar' ? 'var(--primary)' : 'transparent',
                      color: inputMode === 'lunar' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    农历 初一至三十
                  </button>
                </div>
              </div>

              {/* Monthly Day Selector */}
              <div>
                <select
                  value={monthlyDay}
                  onChange={(e) => setMonthlyDay(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  {inputMode === 'solar' ? (
                    Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>每月 {day} 日</option>
                    ))
                  ) : (
                    LUNAR_DAYS.map(d => (
                      <option key={d.value} value={d.value}>农历 每月{d.label}</option>
                    ))
                  )}
                </select>
              </div>
            </div>
          )}

          {/* TYPE 3: WEEKLY CYCLE PICKER (周一至周日) */}
          {repeatType === 'week' && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                选择生效的星期（可多选）
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {weekdaysMap.map(w => {
                  const active = repeatWeekdays.includes(w.key);
                  return (
                    <button
                      key={w.key}
                      type="button"
                      onClick={() => toggleWeekday(w.key)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: '6px',
                        border: active ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                        background: active ? 'var(--primary-light)' : 'var(--bg-card)',
                        color: active ? 'var(--primary)' : 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Realtime Lunar & Cycle Preview Box */}
          {preview && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gold-light)',
              border: '1px dashed rgba(201, 169, 110, 0.4)',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>
                <Sparkles size={14} />
                <span>实时智能推算结果</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--text-secondary)' }}>
                <div>下次发生日: <strong style={{ color: 'var(--text-primary)' }}>{preview.nextDate}</strong></div>
                <div>距今剩余: <strong style={{ color: 'var(--primary)' }}>{preview.daysRemaining} 天</strong></div>
                <div>{preview.lunarFormatted}</div>
                {preview.zodiac && preview.constellation ? (
                  <div>生肖: {preview.zodiac} • 星座: {preview.constellation}</div>
                ) : null}
              </div>
            </div>
          )}

          {/* Category & Display Direction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                所属分类
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                计数方向
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="countdown">仅倒计时</option>
                <option value="accumulate">仅正数日</option>
                <option value="both">全部显示</option>
              </select>
            </div>
          </div>

          {/* Advance Reminders Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              提醒策略
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { days: 0, label: '当天' },
                { days: 1, label: '提前1天' },
                { days: 3, label: '提前3天' },
                { days: 7, label: '提前1周' }
              ].map(opt => {
                const active = advanceDays.includes(opt.days);
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => toggleAdvanceDay(opt.days)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-sm)',
                      border: active ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                      background: active ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      color: active ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pin & Notes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={topPinned}
                onChange={(e) => setTopPinned(e.target.checked)}
              />
              <Pin size={14} style={{ color: 'var(--primary)' }} />
              <span>置顶到首页大卡片</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              备忘录与心动物语
            </label>
            <textarea
              rows={2}
              placeholder="例如：准备礼物、预订餐厅、准备旗帜..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          </form>
        </div>

        {/* Fixed Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-icon-box"
            style={{ width: 'auto', padding: '0 18px', height: '38px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: 500 }}
          >
            取消
          </button>
          <button
            type="submit"
            form="event-form"
            disabled={loading}
            className="btn-primary-solid"
            style={{ height: '38px', borderRadius: 'var(--radius-md)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '正在保存...' : '确认保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

