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
    <div className="solar-banner-card card-box">
      {/* Main Bar: PC端单行优雅排版，手机端规整分行 */}
      <div className="solar-banner-main">
        {/* 顶部/主要部分：标题与倒计时展开按钮 */}
        <div className="solar-banner-header-row">
          <div className="solar-term-title">
            <span className="solar-emoji">{emoji}</span>
            <span className="solar-name">
              {solarTerm.name} · {solarTerm.season}季
            </span>
          </div>

          {/* 倒计时与展开按钮（移动端在第一行右侧，PC端在最右侧） */}
          <button 
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="solar-toggle-btn"
            title={expanded ? '收起物候详情' : '展开物候详情'}
          >
            <span>距离{solarTerm.nextTermName}还有 {solarTerm.nextTermDays} 天</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* 传统色与诗词：PC端水平排列，移动端分行展示 */}
        <div className="solar-banner-sub-info">
          <div className="solar-color-item">
            <span className="solar-item-label">中国传统色：</span>
            <strong className="solar-color-val">{solarTerm.traditionalColorName}</strong>
          </div>
          <div className="solar-poem-item">
            “{solarTerm.poem}”
          </div>
        </div>
      </div>

      {/* 展开的物候详情 */}
      <div className={`solar-expandable-box ${expanded ? 'expanded' : ''}`}>
        <div className="solar-expand-item">
          <strong className="solar-expand-label">🌿 节气物候 (三候)：</strong>
          <span>{solarTerm.phenology}</span>
        </div>
        <div className="solar-expand-item">
          <strong className="solar-expand-label">📖 节令阐微：</strong>
          <span>{solarTerm.summary}</span>
        </div>
      </div>
    </div>
  );
};

export default SolarTermBanner;



