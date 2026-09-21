import React, { useState } from 'react';
import { EventItem, Category } from '../types';
import { 
  Calendar as CalendarIcon, 
  Pin, 
  Edit3, 
  Trash2, 
  Inbox
} from 'lucide-react';

interface TimelineViewProps {
  events: EventItem[];
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  selectedRepeatType: string;
  onSelectRepeatType: (type: string) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (event: EventItem) => void;
  onOpenAddModal: () => void;
}

const formatEventDateText = (event: EventItem) => {
  const dateStr = event.calculation?.nextDate || event.target_date;
  const parts = dateStr.split('-');
  const year = parts[0];
  const month = parts[1] ? parseInt(parts[1], 10) : '';
  const day = parts[2] ? parseInt(parts[2], 10) : '';

  const curYear = new Date().getFullYear();
  const showYear = year && parseInt(year, 10) !== curYear ? ` (${year})` : '';

  let baseDate = `${month}月${day}日${showYear}`;
  if (event.repeat_type === 'month') {
    baseDate = `每月 ${day} 日`;
  } else if (event.repeat_type === 'week') {
    baseDate = `每周固定`;
  }

  return baseDate;
};

const getRepeatTypeText = (repeatType: string) => {
  switch (repeatType) {
    case 'year': return '每年';
    case 'month': return '每月';
    case 'week': return '每周';
    case 'custom_days': return '周期';
    case 'none': return '单次';
    default: return '';
  }
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  categories,
  selectedCategory,
  onSelectCategory,
  selectedRepeatType,
  onSelectRepeatType,
  onEdit,
  onDelete,
  onTogglePin,
  onOpenAddModal
}) => {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  // Sort events chronologically by upcoming days
  const sortedEvents = [...events].sort((a, b) => {
    const dA = a.calculation?.daysRemaining ?? 999;
    const dB = b.calculation?.daysRemaining ?? 999;
    return dA - dB;
  });

  return (
    <div className="card-box" style={{
      padding: 'var(--padding-card)',
      marginBottom: '40px'
    }}>
      {/* Top Header & Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-serif)',
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          color: 'var(--text-primary)'
        }}>
          <CalendarIcon size={20} style={{ color: 'var(--gold-deep)', flexShrink: 0 }} />
          <span>所有纪念日 · 时间轴</span>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--text-tertiary)',
            marginLeft: '6px'
          }}>
            共 {events.length} 个记录
          </span>
        </div>

        {/* Category Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => onSelectCategory('')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: selectedCategory === '' ? 'var(--primary)' : 'var(--bg-subtle)',
              color: selectedCategory === '' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              letterSpacing: '0.3px',
              boxShadow: selectedCategory === '' ? '0 3px 10px rgba(139, 94, 94, 0.2)' : 'none'
            }}
          >
            全部分类
          </button>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? '' : cat.id)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: 'none',
                  background: isSelected ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px',
                  boxShadow: isSelected ? '0 3px 10px rgba(139, 94, 94, 0.2)' : 'none'
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Repeat Selector & Year Selector */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            className="sort-select"
            value={selectedRepeatType}
            onChange={(e) => onSelectRepeatType(e.target.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-card)',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          >
            <option value="">全部循环</option>
            <option value="year">按年</option>
            <option value="month">按月</option>
            <option value="week">按周</option>
          </select>

          <div style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            background: 'var(--bg-subtle)'
          }}>
            {currentYear}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        background: 'var(--border-light)',
        marginBottom: '16px'
      }} />

      {/* Timeline List */}
      {sortedEvents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-tertiary)'
        }}>
          <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            没有匹配的纪念日记录
          </div>
          <div style={{ fontSize: '13px', marginBottom: '18px' }}>
            您可以调整筛选条件，或点击下方按钮添加新纪念日。
          </div>
          <button
            onClick={onOpenAddModal}
            className="btn-primary-solid"
          >
            新建纪念日
          </button>
        </div>
      ) : (
        <div style={{
          position: 'relative',
          paddingLeft: '32px'
        }}>
          {/* Timeline Dashed Line */}
          <div style={{
            position: 'absolute',
            left: '8px',
            top: '20px',
            bottom: '20px',
            width: '1px',
            borderLeft: '1px dashed var(--gold)',
            opacity: 0.6
          }} />

          {sortedEvents.map((event, idx) => {
            const calc = event.calculation || {};
            const days = calc.isToday ? 0 : calc.daysRemaining ?? 0;
            const dateText = formatEventDateText(event);
            const repeatText = getRepeatTypeText(event.repeat_type);
            const isHovered = hoveredEventId === event.id;

            return (
              <div
                key={event.id}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 0',
                  borderBottom: idx < sortedEvents.length - 1 ? '1px dashed var(--border-light)' : 'none',
                  gap: '16px'
                }}
              >
                {/* Timeline Diamond Dot */}
                <div style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '50%',
                  transform: 'translate(-50%, -50%) rotate(45deg)',
                  width: '8px',
                  height: '8px',
                  background: isHovered ? 'var(--primary)' : 'var(--bg-card)',
                  border: `1.5px solid ${isHovered ? 'var(--primary)' : 'var(--gold)'}`,
                  zIndex: 1,
                  transition: 'all 0.2s ease'
                }} />

                {/* Left Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <span 
                      onClick={() => onEdit(event)}
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '17px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        letterSpacing: '0.5px',
                        cursor: 'pointer'
                      }}
                    >
                      {event.title}
                    </span>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {event.category_name && (
                        <span className="tag-chip tag-primary">
                          {event.category_name}
                        </span>
                      )}

                      {event.calendar_type === 'lunar' && (
                        <span className="tag-chip">
                          农历
                        </span>
                      )}

                      {repeatText && (
                        <span className="tag-chip">
                          {repeatText}
                        </span>
                      )}

                      {event.top_pinned && (
                        <span className="tag-chip tag-primary" style={{ padding: '3px 8px' }} title="已置顶">
                          <Pin size={11} style={{ transform: 'rotate(45deg)' }} />
                          置顶
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta Subtext */}
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-tertiary)',
                    marginTop: '6px',
                    letterSpacing: '0.3px',
                    fontFamily: 'var(--font-serif)'
                  }}>
                    <span>{dateText}</span>
                    {event.calendar_type === 'lunar' && calc.lunarFormatted && (
                      <span style={{ marginLeft: '6px' }}>· {calc.lunarFormatted}</span>
                    )}
                    {event.notes && (
                      <span style={{
                        marginLeft: '8px',
                        maxWidth: '280px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                        verticalAlign: 'bottom'
                      }}>
                        · {event.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Content: Days badge & Hover Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flexShrink: 0
                }}>
                  {/* Days Badge */}
                  <div style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: calc.isToday ? '#fff' : 'var(--primary)',
                    background: calc.isToday ? 'var(--primary)' : 'var(--primary-light)',
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.5px'
                  }}>
                    {calc.isToday ? (
                      '今天 🎉'
                    ) : event.direction === 'accumulate' ? (
                      `已过 ${calc.daysPassed ?? 0} 天`
                    ) : (
                      `${days}天后`
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    opacity: isHovered ? 1 : 0.25,
                    transition: 'opacity 0.2s ease'
                  }}>
                    <button
                      type="button"
                      onClick={() => onTogglePin(event)}
                      title={event.top_pinned ? '取消置顶' : '置顶'}
                      className="btn-icon-box"
                      style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', border: 'none' }}
                    >
                      <Pin size={15} style={{ color: event.top_pinned ? 'var(--primary)' : 'inherit' }} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(event)}
                      title="编辑"
                      className="btn-icon-box"
                      style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', border: 'none' }}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(event.id)}
                      title="删除"
                      className="btn-icon-box"
                      style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', border: 'none' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF2F2';
                        e.currentTarget.style.color = '#C53030';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-card)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

