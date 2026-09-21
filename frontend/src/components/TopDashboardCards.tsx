import React from 'react';
import { EventItem } from '../types';
import { Clock, Bell, Calendar, Sparkles } from 'lucide-react';

interface TopDashboardCardsProps {
  events: EventItem[];
  onEdit: (event: EventItem) => void;
  onTogglePin: (event: EventItem) => void;
  onOpenAddModal: () => void;
}

const getCategoryEmoji = (categoryName?: string) => {
  if (!categoryName) return '🌟';
  if (categoryName.includes('家庭') || categoryName.includes('家')) return '🏠';
  if (categoryName.includes('生日') || categoryName.includes('生')) return '🎂';
  if (categoryName.includes('结婚') || categoryName.includes('恋爱') || categoryName.includes('情侣') || categoryName.includes('爱') || categoryName.includes('相识')) return '❤️';
  if (categoryName.includes('入职') || categoryName.includes('工作') || categoryName.includes('事业') || categoryName.includes('公司')) return '💼';
  if (categoryName.includes('健康') || categoryName.includes('经期') || categoryName.includes('大姨妈')) return '🌸';
  if (categoryName.includes('升旗') || categoryName.includes('仪式') || categoryName.includes('会议')) return '🚩';
  return '🗓️';
};

const formatShortDate = (dateStr?: string, lunarFormatted?: string, calendarType?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const solarStr = `${month}月${day}日`;
    if (calendarType === 'lunar' && lunarFormatted) {
      return `${solarStr}`;
    }
    return solarStr;
  }
  return dateStr;
};

export const TopDashboardCards: React.FC<TopDashboardCardsProps> = ({
  events,
  onEdit,
  onOpenAddModal
}) => {
  // Sort events by daysRemaining ascending for upcoming
  const upcomingEvents = [...events].sort((a, b) => {
    const dA = a.calculation?.daysRemaining ?? 999;
    const dB = b.calculation?.daysRemaining ?? 999;
    return dA - dB;
  });

  // Top next event: check for top_pinned first, or next upcoming
  const heroEvent = events.find(e => e.top_pinned) || upcomingEvents[0] || null;

  // Important reminders: pinned events or upcoming ones (take up to 4)
  const pinnedEvents = events.filter(e => e.top_pinned);
  const importantList = pinnedEvents.length > 0 
    ? [...pinnedEvents, ...upcomingEvents.filter(e => !e.top_pinned)].slice(0, 4)
    : upcomingEvents.slice(0, 4);

  // Recent / Upcoming list (take up to 5)
  const recentList = upcomingEvents.slice(0, 5);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 'var(--gap)'
    }}>
      {/* CARD 1: 倒计时 */}
      <div 
        className="card-box" 
        style={{
          padding: 'var(--padding-card)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '320px',
          cursor: heroEvent ? 'pointer' : 'default'
        }}
        onClick={() => heroEvent && onEdit(heroEvent)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-serif)',
          fontSize: '17px',
          fontWeight: 600,
          marginBottom: '20px',
          color: 'var(--text-primary)',
          letterSpacing: '0.5px'
        }}>
          <Clock size={19} style={{ color: 'var(--gold-deep)', flexShrink: 0 }} />
          <span>倒计时</span>
        </div>

        {heroEvent ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '8px 0'
          }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              下一个纪念日
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--primary)'
            }}>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '72px',
                fontWeight: 500,
                lineHeight: 1,
                letterSpacing: '-2px'
              }}>
                {heroEvent.calculation?.isToday ? 0 : heroEvent.calculation?.daysRemaining ?? 0}
              </span>
              <span style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '20px',
                fontWeight: 500
              }}>
                {heroEvent.calculation?.isToday ? '今天 🎉' : '天'}
              </span>
            </div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '18px',
              fontWeight: 600,
              marginTop: '16px',
              color: 'var(--text-primary)',
              letterSpacing: '0.5px'
            }}>
              {heroEvent.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-tertiary)',
              marginTop: '6px',
              letterSpacing: '0.3px'
            }}>
              {formatShortDate(heroEvent.calculation?.nextDate || heroEvent.target_date, heroEvent.calculation?.lunarFormatted, heroEvent.calendar_type)}
              {heroEvent.category_name ? ` · ${heroEvent.category_name}` : ''}
              {heroEvent.calendar_type === 'lunar' ? ` · 农历` : ''}
            </div>
          </div>
        ) : (
          <div 
            onClick={onOpenAddModal}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-tertiary)'
            }}
          >
            <Sparkles size={28} style={{ color: 'var(--gold)', marginBottom: '8px' }} />
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--text-primary)' }}>暂无纪念日</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>点击新建开启第一个纪念日</div>
          </div>
        )}

        <div style={{
          fontSize: '12px',
          color: 'var(--text-tertiary)',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px dashed var(--border-light)',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }}>
          {heroEvent ? '距离下一个纪念日' : '记录生命中重要的日子'}
        </div>
      </div>

      {/* CARD 2: 重要提醒 */}
      <div 
        className="card-box" 
        style={{
          padding: 'var(--padding-card)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '320px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-serif)',
          fontSize: '17px',
          fontWeight: 600,
          marginBottom: '16px',
          color: 'var(--text-primary)',
          letterSpacing: '0.5px'
        }}>
          <Bell size={19} style={{ color: 'var(--gold-deep)', flexShrink: 0 }} />
          <span>重要提醒</span>
        </div>

        {importantList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}>
            {importantList.map((item, idx) => {
              const days = item.calculation?.isToday ? 0 : item.calculation?.daysRemaining ?? 0;
              const dateStr = formatShortDate(item.calculation?.nextDate || item.target_date, item.calculation?.lunarFormatted, item.calendar_type);
              return (
                <div 
                  key={item.id}
                  onClick={() => onEdit(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '13px 0',
                    borderBottom: idx < importantList.length - 1 ? '1px dashed var(--border-light)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '0.3px'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', letterSpacing: '0.3px' }}>
                        {dateStr}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginLeft: '12px',
                    letterSpacing: '0.3px'
                  }}>
                    {item.calculation?.isToday ? '今天' : `${days}天后`}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            暂无重要提醒
          </div>
        )}
      </div>

      {/* CARD 3: 最近提醒 */}
      <div 
        className="card-box" 
        style={{
          padding: 'var(--padding-card)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '320px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'var(--font-serif)',
          fontSize: '17px',
          fontWeight: 600,
          marginBottom: '16px',
          color: 'var(--text-primary)',
          letterSpacing: '0.5px'
        }}>
          <Calendar size={19} style={{ color: 'var(--gold-deep)', flexShrink: 0 }} />
          <span>最近提醒</span>
        </div>

        {recentList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}>
            {recentList.map((item, idx) => {
              const days = item.calculation?.isToday ? 0 : item.calculation?.daysRemaining ?? 0;
              const dateStr = formatShortDate(item.calculation?.nextDate || item.target_date, item.calculation?.lunarFormatted, item.calendar_type);
              const emoji = getCategoryEmoji(item.category_name);

              return (
                <div 
                  key={item.id}
                  onClick={() => onEdit(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: idx < recentList.length - 1 ? '1px dashed var(--border-light)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'var(--gold-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '15px'
                    }}>
                      {emoji}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        letterSpacing: '0.3px'
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', letterSpacing: '0.3px' }}>
                        还有 {days} 天 · {dateStr}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
            暂无最近日程
          </div>
        )}
      </div>
    </div>
  );
};

