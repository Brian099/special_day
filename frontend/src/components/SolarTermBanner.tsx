import React, { useState } from 'react';
import { SolarTermInfo } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SolarTermBannerProps {
  solarTerm: SolarTermInfo | null;
}

const getSeasonEmoji = (season: string) => {
  switch (season) {
    case '春': return '🌸';
    case '夏': return '🌿';
    case '秋': return '🍂';
    case '冬': return '❄️';
    default: return '🍃';
  }
};

export const SolarTermBanner: React.FC<SolarTermBannerProps> = ({ solarTerm }) => {
  const [expanded, setExpanded] = useState(false);

  if (!solarTerm) return null;

  const emoji = getSeasonEmoji(solarTerm.season);

  return (
    <div 
      className="card-box"
      style={{
        background: 'var(--gold-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '0 32px',
        border: '1px solid rgba(201, 169, 110, 0.22)',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease'
      }}
    >
      {/* Main Bar Row (Fixed height row, no jump) */}
      <div style={{
        minHeight: '54px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '10px 0'
      }}>
        {/* Left Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '15px' }}>{emoji}</span>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 600,
            color: 'var(--primary)',
            letterSpacing: '0.5px'
          }}>
            {solarTerm.name} · {solarTerm.season}季
          </span>
          <span style={{ color: 'var(--gold)', margin: '0 4px', fontSize: '12px' }}>|</span>
          <span>中国传统色：<strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{solarTerm.traditionalColorName}</strong></span>
          <span style={{ color: 'var(--gold)', margin: '0 4px', fontSize: '12px' }}>|</span>
          <span style={{
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '13px',
            letterSpacing: '0.3px'
          }}>
            “{solarTerm.poem}”
          </span>
        </div>

        {/* Right Info & Toggle Button */}
        <button 
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--gold-deep)',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            letterSpacing: '0.3px',
            userSelect: 'none',
            outline: 'none'
          }}
          title={expanded ? '收起物候详情' : '展开物候详情'}
        >
          <span>距离{solarTerm.nextTermName}还有 {solarTerm.nextTermDays} 天</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expandable Details: Smooth Accordion Transition */}
      <div style={{
        maxHeight: expanded ? '200px' : '0px',
        opacity: expanded ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, padding 0.3s ease, margin 0.3s ease',
        borderTop: expanded ? '1px dashed rgba(201, 169, 110, 0.3)' : '1px dashed transparent',
        paddingTop: expanded ? '12px' : '0px',
        paddingBottom: expanded ? '16px' : '0px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <div>
          <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>🌿 节气物候 (三候)：</strong>
          <span style={{ marginLeft: '4px' }}>{solarTerm.phenology}</span>
        </div>
        <div>
          <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-serif)' }}>📖 节令阐微：</strong>
          <span style={{ marginLeft: '4px' }}>{solarTerm.summary}</span>
        </div>
      </div>
    </div>
  );
};


