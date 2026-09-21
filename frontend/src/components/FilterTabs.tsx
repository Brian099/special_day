import React from 'react';
import { Category, Stats } from '../types';

interface FilterTabsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  selectedRepeatType: string;
  onSelectRepeatType: (type: string) => void;
  stats: Stats;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  selectedRepeatType,
  onSelectRepeatType,
  stats
}) => {
  return (
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Category Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        <button
          onClick={() => onSelectCategory('')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-full)',
            border: selectedCategory === '' ? 'none' : '1px solid var(--border-card)',
            background: selectedCategory === '' ? 'var(--grad-hero)' : 'var(--bg-card)',
            color: selectedCategory === '' ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: selectedCategory === '' ? '0 2px 10px rgba(255, 65, 108, 0.25)' : 'none'
          }}
        >
          全部 {stats.total}
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-full)',
              border: selectedCategory === cat.id ? `1.5px solid ${cat.color || 'var(--accent-rose)'}` : '1px solid var(--border-card)',
              background: selectedCategory === cat.id ? 'var(--bg-input)' : 'var(--bg-card)',
              color: selectedCategory === cat.id ? (cat.color || 'var(--accent-rose)') : 'var(--text-secondary)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{cat.name}</span>
            {cat.event_count !== undefined && (
              <span style={{
                fontSize: '0.72rem',
                opacity: 0.75,
                background: 'rgba(0,0,0,0.06)',
                padding: '1px 5px',
                borderRadius: '8px'
              }}>
                {cat.event_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Secondary Quick Filters: Cycle Types */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        fontSize: '0.78rem'
      }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>快速筛选：</span>

        {[
          { key: '', label: '所有周期' },
          { key: 'year', label: '按年循环' },
          { key: 'month', label: '按月循环' },
          { key: 'week', label: '按周循环' },
          { key: 'custom_days', label: '自定义天数' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => onSelectRepeatType(item.key)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: selectedRepeatType === item.key ? '1px solid var(--accent-indigo)' : '1px solid transparent',
              background: selectedRepeatType === item.key ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: selectedRepeatType === item.key ? 'var(--accent-indigo)' : 'var(--text-secondary)',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
