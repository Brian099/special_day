import React from 'react';
import { 
  Pin, 
  Edit3, 
  Trash2, 
  Repeat, 
  Moon, 
  Sun, 
  Calendar, 
  Sparkles
} from 'lucide-react';
import { EventItem } from '../types';

interface EventCardProps {
  event: EventItem;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onTogglePin
}) => {
  const { calculation } = event;
  const isToday = calculation.isToday;
  const isUrgent = calculation.daysRemaining > 0 && calculation.daysRemaining <= 7;

  return (
    <div 
      className="event-card glass-card"
      style={{
        padding: '20px 22px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 'var(--radius-md)',
        border: isToday 
          ? '1.5px solid var(--accent-rose)' 
          : event.top_pinned 
            ? '1.5px solid rgba(255, 65, 108, 0.4)' 
            : '1px solid var(--border-card)',
        background: isToday 
          ? 'linear-gradient(135deg, rgba(255, 65, 108, 0.07) 0%, rgba(255, 255, 255, 0.9) 100%), var(--bg-card)' 
          : 'var(--bg-card)',
        boxShadow: isToday ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isToday ? 'var(--shadow-glow)' : 'var(--shadow-sm)';
      }}
    >
      {/* Pinned Marker */}
      {event.top_pinned && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          color: 'var(--accent-rose)'
        }} title="已置顶">
          <Pin size={15} fill="var(--accent-rose)" />
        </div>
      )}

      {/* Card Header: Category & Cycle Tags */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {event.category_name && (
            <span style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-input)',
              color: event.category_color || 'var(--text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {event.category_name}
            </span>
          )}

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-input)',
            color: 'var(--text-secondary)',
            fontSize: '0.72rem',
            fontWeight: 600
          }}>
            {event.calendar_type === 'lunar' ? <Moon size={11} color="#8a2387" /> : <Sun size={11} color="#f59e0b" />}
            {event.calendar_type === 'lunar' ? '农历' : '公历'}
          </span>

          {event.repeat_type !== 'none' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 600
            }}>
              <Repeat size={11} />
              {event.repeat_type === 'year' && '年循环'}
              {event.repeat_type === 'month' && '月循环'}
              {event.repeat_type === 'week' && '周循环'}
              {event.repeat_type === 'custom_days' && `每${event.repeat_interval}天`}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.12rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          wordBreak: 'break-word',
          lineHeight: 1.3
        }}>
          {event.title}
        </h3>

        {/* Date Details */}
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} style={{ color: 'var(--accent-rose)' }} />
            <span>下个日期: <strong style={{ color: 'var(--text-primary)' }}>{calculation.nextDate}</strong></span>
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {calculation.lunarFormatted} {calculation.solarTerm && `(${calculation.solarTerm})`}
          </div>

          {calculation.yearsCount > 0 && event.repeat_type === 'year' && (
            <div style={{ fontSize: '0.76rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
              第 {calculation.yearsCount} 周年
            </div>
          )}
        </div>
      </div>

      {/* Countdown Display Area */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 'var(--radius-sm)',
          background: isToday ? 'rgba(255, 65, 108, 0.12)' : 'var(--bg-input)',
          marginBottom: '14px'
        }}>
          {isToday ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontWeight: 800, fontSize: '1.15rem' }}>
              <Sparkles size={18} />
              <span>就是今天！🎉</span>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '0.78rem', color: isUrgent ? 'var(--accent-rose)' : 'var(--text-secondary)', fontWeight: 600 }}>
                {isUrgent ? '🔥 即将到来' : '还有'}
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: isUrgent ? 'var(--accent-rose)' : 'var(--text-primary)',
                  lineHeight: 1
                }}>
                  {calculation.daysRemaining}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  天
                </span>
              </div>
            </>
          )}
        </div>

        {/* Accumulated Days (if requested) */}
        {(event.direction === 'accumulate' || event.direction === 'both') && (
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '12px',
            textAlign: 'right'
          }}>
            已过 {calculation.daysPassed} 天
          </div>
        )}

        {/* Action Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-card)'
        }}>
          <button
            onClick={() => onTogglePin(event)}
            title={event.top_pinned ? '取消置顶' : '置顶'}
            style={{
              background: 'none',
              border: 'none',
              color: event.top_pinned ? 'var(--accent-rose)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <Pin size={15} fill={event.top_pinned ? 'var(--accent-rose)' : 'none'} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onEdit(event)}
              title="编辑"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.75rem'
              }}
            >
              <Edit3 size={14} />
              编辑
            </button>

            <button
              onClick={() => onDelete(event.id)}
              title="删除"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
