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
    <div className="timeline-card card-box">
      {/* Top Header & Filters */}
      <div className="timeline-header-wrap">
        {/* Title */}
        <div className="timeline-title-box">
          <CalendarIcon size={19} className="timeline-title-icon" />
          <span className="timeline-title-text">所有纪念日 · 时间轴</span>
          <span className="timeline-count-badge">
            共 {events.length} 个记录
          </span>
        </div>

        {/* Category Filters (移动端支持平滑横向滚动) */}
        <div className="timeline-filters-scroll">
          <button
            type="button"
            onClick={() => onSelectCategory('')}
            className={`timeline-filter-btn ${selectedCategory === '' ? 'active' : ''}`}
          >
            全部分类
          </button>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => onSelectCategory(isSelected ? '' : cat.id)}
                className={`timeline-filter-btn ${isSelected ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Repeat Selector & Year Selector */}
        <div className="timeline-selectors-box">
          <select 
            className="timeline-repeat-select"
            value={selectedRepeatType}
            onChange={(e) => onSelectRepeatType(e.target.value)}
          >
            <option value="">全部循环</option>
            <option value="year">按年</option>
            <option value="month">按月</option>
            <option value="week">按周</option>
          </select>

          <div className="timeline-year-tag">
            {currentYear}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="timeline-divider-line" />

      {/* Timeline List */}
      {sortedEvents.length === 0 ? (
        <div className="timeline-empty-box">
          <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            没有匹配的纪念日记录
          </div>
          <div style={{ fontSize: '13px', marginBottom: '18px' }}>
            您可以调整筛选条件，或点击下方按钮添加新纪念日。
          </div>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="btn-primary-solid"
          >
            新建纪念日
          </button>
        </div>
      ) : (
        <div className="timeline-list-container">
          {/* Timeline Dashed Line */}
          <div className="timeline-vertical-line" />

          {sortedEvents.map((event) => {
            const calc = event.calculation || {};
            const days = calc.isToday ? 0 : calc.daysRemaining ?? 0;
            const dateText = formatEventDateText(event);
            const repeatText = getRepeatTypeText(event.repeat_type);
            const isHovered = hoveredEventId === event.id;
            const isPinned = Boolean(event.top_pinned);

            return (
              <div
                key={event.id}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
                className="timeline-item"
              >
                {/* Timeline Diamond Dot: 置顶为实心菱形，普通为空心菱形 */}
                <div 
                  className={`timeline-diamond-dot ${isPinned ? 'pinned' : ''} ${isHovered ? 'hovered' : ''}`}
                />

                {/* Left Main Content */}
                <div className="timeline-item-main">
                  {/* Title & Tags Row */}
                  <div className="timeline-item-title-row">
                    <span 
                      onClick={() => onEdit(event)}
                      className="timeline-item-title"
                    >
                      {event.title}
                    </span>

                    {/* Tags */}
                    <div className="timeline-item-tags">
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

                      {isPinned && (
                        <span className="tag-chip tag-primary" style={{ padding: '2px 7px' }} title="已置顶">
                          <Pin size={10} style={{ transform: 'rotate(45deg)' }} />
                          置顶
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Meta Subtext */}
                  <div className="timeline-item-meta">
                    <span>{dateText}</span>
                    {event.calendar_type === 'lunar' && calc.lunarFormatted && (
                      <span className="timeline-meta-lunar">· {calc.lunarFormatted}</span>
                    )}
                    {event.notes && (
                      <span className="timeline-meta-notes">
                        · {event.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Content: Days badge & Action Buttons */}
                <div className="timeline-item-right">
                  {/* Days Badge */}
                  <div className={`timeline-days-badge ${calc.isToday ? 'today' : ''}`}>
                    {calc.isToday ? (
                      '今天 🎉'
                    ) : event.direction === 'accumulate' ? (
                      `已过 ${calc.daysPassed ?? 0} 天`
                    ) : (
                      `${days}天后`
                    )}
                  </div>

                  {/* Action Buttons: 手机端常显，轻巧易点 */}
                  <div className="timeline-actions">
                    <button
                      type="button"
                      onClick={() => onTogglePin(event)}
                      title={isPinned ? '取消置顶' : '置顶'}
                      className={`timeline-action-btn ${isPinned ? 'active' : ''}`}
                    >
                      <Pin size={14} style={{ color: isPinned ? 'var(--primary)' : 'inherit' }} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(event)}
                      title="编辑"
                      className="timeline-action-btn"
                    >
                      <Edit3 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(event.id)}
                      title="删除"
                      className="timeline-action-btn delete"
                    >
                      <Trash2 size={14} />
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

