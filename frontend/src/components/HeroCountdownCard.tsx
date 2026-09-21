import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Flame, 
  Calendar, 
  Pin, 
  Edit3, 
  Moon, 
  Sun, 
  Repeat, 
  Clock, 
  HeartHandshake
} from 'lucide-react';
import { EventItem } from '../types';

interface HeroCountdownCardProps {
  event: EventItem | null;
  onEdit: (event: EventItem) => void;
  onTogglePin: (event: EventItem) => void;
}

export const HeroCountdownCard: React.FC<HeroCountdownCardProps> = ({
  event,
  onEdit,
  onTogglePin
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!event) return;

    if (event.calculation.isToday) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date(`${event.calculation.nextDate}T00:00:00`);
      const diff = target.getTime() - now.getTime();

      if (diff > 0) {
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [event]);

  if (!event) {
    return (
      <div className="glass-card" style={{
        padding: '36px',
        textAlign: 'center',
        marginBottom: '28px',
        color: 'var(--text-secondary)'
      }}>
        <Sparkles size={36} style={{ color: 'var(--accent-rose)', margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
          暂无置顶或近期纪念日
        </h3>
        <p style={{ fontSize: '0.85rem' }}>
          点击右上角「新建纪念日」添加你的第一个重要节日或循环周期吧！
        </p>
      </div>
    );
  }

  const { calculation } = event;
  const isToday = calculation.isToday;

  return (
    <div 
      className="hero-card-container glass-card"
      style={{
        position: 'relative',
        padding: '32px 36px',
        marginBottom: '32px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid rgba(255, 65, 108, 0.25)',
        background: 'linear-gradient(135deg, rgba(255, 65, 108, 0.08) 0%, rgba(138, 35, 135, 0.06) 50%, rgba(99, 102, 241, 0.08) 100%), var(--bg-card)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      {/* Background Glowing Orb */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255, 65, 108, 0.25) 0%, rgba(138, 35, 135, 0) 70%)',
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Section: Event Info */}
        <div style={{ flex: '1', minWidth: '280px' }}>
          {/* Top Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--grad-hero)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(255, 65, 108, 0.3)'
            }}>
              <Flame size={14} />
              {event.top_pinned ? '重要置顶' : '最近将至'}
            </span>

            {event.category_name && (
              <span style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600
              }}>
                {event.category_name}
              </span>
            )}

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-card)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              {event.calendar_type === 'lunar' ? <Moon size={13} color="#8a2387" /> : <Sun size={13} color="#f59e0b" />}
              {event.calendar_type === 'lunar' ? '农历' : '公历'}
            </span>

            {event.repeat_type !== 'none' && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600
              }}>
                <Repeat size={13} />
                {event.repeat_type === 'year' && '按年循环'}
                {event.repeat_type === 'month' && '按月循环'}
                {event.repeat_type === 'week' && '按周循环'}
                {event.repeat_type === 'custom_days' && `每 ${event.repeat_interval} 天`}
              </span>
            )}
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '10px',
            lineHeight: 1.2
          }}>
            {event.title}
          </h2>

          {/* Details / Lunar Info */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Calendar size={15} style={{ color: 'var(--accent-rose)' }} />
              <span>下一次发生：<strong style={{ color: 'var(--text-primary)' }}>{calculation.nextDate}</strong></span>
              <span>•</span>
              <span>{calculation.lunarFormatted}</span>
              {calculation.solarTerm && (
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>• {calculation.solarTerm}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
              <span>生肖: {calculation.zodiac}</span>
              <span>•</span>
              <span>干支: {calculation.ganzhi}</span>
              <span>•</span>
              <span>星座: {calculation.constellation}</span>
            </div>

            {calculation.yearsCount > 0 && event.repeat_type === 'year' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontWeight: 700, marginTop: '4px' }}>
                <HeartHandshake size={16} />
                <span>迎来第 {calculation.yearsCount} 周年纪念</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onTogglePin(event)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-card)',
                color: event.top_pinned ? 'var(--accent-rose)' : 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Pin size={14} fill={event.top_pinned ? 'var(--accent-rose)' : 'none'} />
              {event.top_pinned ? '取消置顶' : '置顶展示'}
            </button>

            <button
              onClick={() => onEdit(event)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Edit3 size={14} />
              编辑详情
            </button>
          </div>
        </div>

        {/* Right Section: Massive Countdown Display */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-card)',
          padding: '24px 32px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-md)',
          minWidth: '220px',
          textAlign: 'center'
        }}>
          {isToday ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.8rem',
                fontWeight: 900,
                background: 'var(--grad-hero)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.1
              }}>
                🎉 今天！
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 700, marginTop: '6px' }}>
                尽情庆祝属于你的高光时刻！
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                倒计时
              </div>
              <div style={{
                fontSize: '4.2rem',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-0.04em',
                background: 'var(--grad-hero)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '4px 0'
              }}>
                {calculation.daysRemaining}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                天
              </div>

              {/* Sub Hourly Countdown */}
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px dashed var(--border-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}>
                <Clock size={13} />
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}时 {String(timeLeft.minutes).padStart(2, '0')}分 {String(timeLeft.seconds).padStart(2, '0')}秒
                </span>
              </div>
            </div>
          )}

          {/* Cumulative Counter (If configured) */}
          {(event.direction === 'accumulate' || event.direction === 'both') && (
            <div style={{
              marginTop: '14px',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              已记录 / 相伴 <strong>{calculation.daysPassed}</strong> 天
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
