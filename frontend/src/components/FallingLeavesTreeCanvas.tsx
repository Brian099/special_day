import React, { useEffect, useRef } from 'react';
import { AppThemeType } from '../types';

interface FallingLeavesTreeCanvasProps {
  theme?: AppThemeType | 'light' | 'dark' | string;
}

interface TreeBranch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
}

interface CrownLeaf {
  x: number;
  y: number;
  size: number;
  angle: number;
  swayAmp: number;
  swayPhase: number;
  swaySpeed: number;
  color: string;
  alpha: number;
}

interface FallingLeaf {
  x: number;
  y: number;
  size: number;
  fall: number;
  slip: number;
  spin: number;
  spinSpeed: number;
  roll: number;
  rollSpeed: number;
  drift: number;
  alpha: number;
  color: string;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
}

interface TreeData {
  branches: TreeBranch[];
  crownLeaves: CrownLeaf[];
  crown: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export const FallingLeavesTreeCanvas: React.FC<FallingLeavesTreeCanvasProps> = ({ theme = 'autumn-gold' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let W = 0;
    let H = 0;
    let tree: TreeData | null = null;
    let leaves: FallingLeaf[] = [];
    let root = { x: 0, y: 0 };
    let dpr = 1;

    // 离屏树木画布：将复杂的递归树和所有树叶一次性预渲染在离屏 Canvas 上
    let offscreenTreeCanvas: HTMLCanvasElement | null = null;

    let isPageVisible = !document.hidden;

    const isDark = theme === 'dark' || theme === 'dark-night';

    // 5 套主题对应的自然树叶色盘
    let LEAF_COLORS: string[] = [];
    let BRANCH_COLOR_BASE = { r: 72, g: 48, b: 34 };

    if (theme === 'spring-sakura') {
      // 春日绯樱色系
      LEAF_COLORS = [
        '#e8849b', '#f29fb2', '#f7b5c4',
        '#d4607c', '#c74d6c', '#fedfe5',
        '#ea91a7', '#f4a8b9'
      ];
      BRANCH_COLOR_BASE = { r: 88, g: 50, b: 58 };
    } else if (theme === 'cute-pink') {
      // 可爱粉色系（软萌蜜桃樱粉、草莓糖果色）
      LEAF_COLORS = [
        '#ff7597', '#ff8fad', '#ffa8be',
        '#ff537b', '#e83e68', '#ffd4e2',
        '#ff99b4', '#ff6b8b'
      ];
      BRANCH_COLOR_BASE = { r: 92, g: 48, b: 60 };
    } else if (theme === 'summer-forest') {
      // 松柏竹青色系
      LEAF_COLORS = [
        '#4f8c6f', '#62a884', '#79bf9c',
        '#386b52', '#2f5a44', '#a8d8be',
        '#579778', '#6eb38f'
      ];
      BRANCH_COLOR_BASE = { r: 42, g: 62, b: 50 };
    } else if (theme === 'royal-blue') {
      // 霁蓝天青色系
      LEAF_COLORS = [
        '#4b7e9f', '#5e94b8', '#73a9cc',
        '#366582', '#2c536d', '#a4cde5',
        '#548ab0', '#6aa0c4'
      ];
      BRANCH_COLOR_BASE = { r: 44, g: 58, b: 72 };
    } else if (isDark) {
      // 暗夜流金色系
      LEAF_COLORS = [
        '#d48855', '#e09855', '#eac058',
        '#c4653f', '#b85434', '#f0ca6a',
        '#b0783a', '#e0a050'
      ];
      BRANCH_COLOR_BASE = { r: 160, g: 120, b: 90 };
    } else {
      // 经典秋叶金（默认）
      LEAF_COLORS = [
        '#c9622a', '#d97b2b', '#e0a02e',
        '#b64a1f', '#a83c1c', '#e6b84a',
        '#8f5a1e', '#cf8a2c'
      ];
      BRANCH_COLOR_BASE = { r: 72, g: 48, b: 34 };
    }

    /* ---------------- 叶形路径 ---------------- */
    function leafPath(c: CanvasRenderingContext2D, s: number) {
      c.beginPath();
      c.moveTo(0, -s * 0.5);
      c.quadraticCurveTo(s * 0.55, 0, 0, s * 0.5);
      c.quadraticCurveTo(-s * 0.55, 0, 0, -s * 0.5);
      c.closePath();
    }

    function drawLeafShape(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      angle: number,
      color: string,
      alpha: number
    ) {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      leafPath(c, size);
      c.fill();

      c.globalAlpha = alpha * 0.45;
      c.strokeStyle = isDark ? 'rgba(255, 230, 200, 0.6)' : 'rgba(90, 50, 20, 0.9)';
      c.lineWidth = Math.max(0.6, size * 0.06);
      c.beginPath();
      c.moveTo(0, -size * 0.42);
      c.lineTo(0, size * 0.42);
      c.stroke();
      c.restore();
    }

    /* ---------------- 生成自然递归树并离屏预渲染 ---------------- */
    function buildTree() {
      const isMobile = W <= 768;
      const baseX = W * (isMobile ? 0.95 : 0.93);
      const baseY = H * 1.02;
      root = { x: baseX, y: baseY };

      const trunkLen = H * (isMobile ? 0.28 : 0.30);
      const trunkW = Math.max(W * (isMobile ? 0.02 : 0.018), 9);

      const branches: TreeBranch[] = [];
      const crownLeaves: CrownLeaf[] = [];

      function grow(x: number, y: number, angle: number, len: number, width: number, depth: number) {
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;

        branches.push({ x1: x, y1: y, x2, y2, w: width });

        if (depth <= 3 && len > 4) {
          const leafCount = depth <= 1 ? (isMobile ? 3 : 4) : 2;
          for (let i = 0; i < leafCount; i++) {
            const t = 0.35 + Math.random() * 0.65;
            const lx = x + (x2 - x) * t + (Math.random() - 0.5) * len * 0.7;
            const ly = y + (y2 - y) * t + (Math.random() - 0.5) * len * 0.7;

            crownLeaves.push({
              x: lx,
              y: ly,
              size: 5 + Math.random() * 6,
              angle: Math.random() * Math.PI * 2,
              swayAmp: 0.10 + Math.random() * 0.15,
              swayPhase: Math.random() * Math.PI * 2,
              swaySpeed: 0.6 + Math.random() * 0.9,
              color: LEAF_COLORS[(Math.random() * LEAF_COLORS.length) | 0],
              alpha: isDark ? 0.65 + Math.random() * 0.25 : 0.75 + Math.random() * 0.25
            });
          }
        }

        if (depth <= 0 || len < 6) return;

        const spread = 0.42 + Math.random() * 0.22;
        const shrink = 0.7 + Math.random() * 0.1;

        grow(x2, y2, angle - spread, len * shrink, width * 0.68, depth - 1);
        grow(x2, y2, angle + spread * 0.85, len * shrink * 0.95, width * 0.68, depth - 1);

        if (depth > 2 && Math.random() < 0.32) {
          grow(x2, y2, angle + (Math.random() - 0.5) * 0.5, len * 0.6, width * 0.5, depth - 2);
        }
      }

      grow(baseX, baseY, -Math.PI / 2 - 0.12, trunkLen, trunkW, 8);

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      crownLeaves.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });

      tree = {
        branches,
        crownLeaves,
        crown: { minX, maxX, minY, maxY }
      };

      // 预渲染离屏树木（增加 160px 四周超量边距 PAD，彻底杜绝大树左右晃动时边缘留白或切边）
      const PAD = 160;
      offscreenTreeCanvas = document.createElement('canvas');
      offscreenTreeCanvas.width = Math.floor((W + PAD * 2) * dpr);
      offscreenTreeCanvas.height = Math.floor((H + PAD * 2) * dpr);
      const offCtx = offscreenTreeCanvas.getContext('2d', { alpha: true });
      if (offCtx) {
        // 将原点平移 PAD 逻辑像素
        offCtx.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);

        // 1. 绘制所有树枝
        branches.forEach(b => {
          const t = Math.min(b.w / 14, 1);
          const r = Math.round(BRANCH_COLOR_BASE.r + (1 - t) * 30);
          const g = Math.round(BRANCH_COLOR_BASE.g + (1 - t) * 25);
          const bVal = Math.round(BRANCH_COLOR_BASE.b + (1 - t) * 20);
          offCtx.strokeStyle = `rgba(${r}, ${g}, ${bVal}, ${isDark ? 0.85 : 0.92})`;
          offCtx.lineWidth = b.w;
          offCtx.lineCap = 'round';
          offCtx.beginPath();
          offCtx.moveTo(b.x1, b.y1);
          offCtx.lineTo(b.x2, b.y2);
          offCtx.stroke();
        });

        // 2. 绘制所有树叶
        crownLeaves.forEach(l => {
          drawLeafShape(offCtx, l.x, l.y, l.size, l.angle, l.color, l.alpha);
        });
      }
    }

    /* ---------------- 尺寸自适应（全高清 Retian 支持） ---------------- */
    function resize() {
      if (!canvas || !ctx) return;
      // 保持全高清 DPR（最大支持 2.0），移动端和桌面端都清晰细腻
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildTree();
      leaves = [];
    }

    /* ---------------- 整棵树的摆动 ---------------- */
    function treeSway(time: number) {
      return (
        Math.sin(time * 0.55) * 0.018 +
        Math.sin(time * 1.37 + 1.1) * 0.007
      );
    }

    function swayPoint(x: number, y: number, angle: number) {
      const dx = x - root.x;
      const dy = y - root.y;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: root.x + dx * cos - dy * sin,
        y: root.y + dx * sin + dy * cos
      };
    }

    /* ---------------- 极速绘制树（GPU 贴图，带安全边距防止留白） ---------------- */
    function drawTree(time: number) {
      if (!offscreenTreeCanvas || !ctx) return;

      const sway = treeSway(time);
      const PAD = 160;

      ctx.save();
      ctx.translate(root.x, root.y);
      ctx.rotate(sway);
      // 绘制带 Overscan 的离屏画布，将边缘拉出视口外，完全消除旋转留白
      ctx.drawImage(
        offscreenTreeCanvas,
        -root.x - PAD,
        -root.y - PAD,
        W + PAD * 2,
        H + PAD * 2
      );
      ctx.restore();
    }

    /* ---------------- 落叶粒子 ---------------- */
    function createLeaf(sway: number): FallingLeaf {
      const c = tree?.crown || { minX: W * 0.7, maxX: W * 0.98, minY: H * 0.1, maxY: H * 0.5 };
      const lx = c.minX + Math.random() * (c.maxX - c.minX);
      const ly = c.minY + Math.random() * (c.maxY - c.minY);

      const p = swayPoint(lx, ly, sway);

      return {
        x: p.x,
        y: p.y,
        size: 5 + Math.random() * 6,
        fall: 22 + Math.random() * 35,
        slip: 18 + Math.random() * 30,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (0.6 + Math.random() * 1.5) * (Math.random() < 0.5 ? -1 : 1),
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 1.2,
        // 横向漂移：向左移动，飘向左下角
        drift: -35 - Math.random() * 40,
        alpha: isDark ? 0.55 + Math.random() * 0.35 : 0.65 + Math.random() * 0.35,
        color: LEAF_COLORS[(Math.random() * LEAF_COLORS.length) | 0],
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1 + Math.random() * 1.5,
        swayAmp: 6 + Math.random() * 12
      };
    }

    function drawFallingLeaf(l: FallingLeaf) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.roll);
      ctx.scale(Math.cos(l.spin), 1);
      ctx.globalAlpha = l.alpha;
      ctx.fillStyle = l.color;

      leafPath(ctx, l.size);
      ctx.fill();

      ctx.globalAlpha = l.alpha * 0.45;
      ctx.strokeStyle = isDark ? 'rgba(255, 230, 200, 0.6)' : 'rgba(90, 50, 20, 0.8)';
      ctx.lineWidth = Math.max(0.6, l.size * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, -l.size * 0.42);
      ctx.lineTo(0, l.size * 0.42);
      ctx.stroke();
      ctx.restore();
    }

    function updateLeaves(dt: number, sway: number) {
      const isMobile = W <= 768;
      // 移动端保持 18 片适量自然落叶，桌面端 36 片
      const maxCount = isMobile ? 18 : 36;
      const target = Math.min(Math.round((W * H) / 36000), maxCount);

      if (leaves.length < target) {
        for (let i = 0; i < 1 && leaves.length < target; i++) {
          leaves.push(createLeaf(sway));
        }
      }

      for (let i = leaves.length - 1; i >= 0; i--) {
        const l = leaves[i];

        l.spin += l.spinSpeed * dt;
        l.roll += l.rollSpeed * dt;
        l.swayPhase += l.swaySpeed * dt;

        const s = Math.sin(l.swayPhase) * l.swayAmp;

        l.x += (Math.sin(l.spin) * l.slip + l.drift + s) * dt;
        l.y += l.fall * dt;

        if (l.y > H * 0.92) l.alpha -= dt * 0.7;

        if (l.y > H + 40 || l.x < -60 || l.alpha <= 0) {
          leaves.splice(i, 1);
        }
      }
    }

    /* ---------------- 主循环：连续平滑无缝渲染 ---------------- */
    let last = performance.now();
    let simTime = 0;

    function frame(now: number) {
      const rawDt = (now - last) / 1000;
      last = now;

      // 页面可见时平滑更新，dt 限制在 0.05s 防止切后台恢复跳帧
      if (isPageVisible && ctx) {
        const dt = Math.min(rawDt, 0.05);
        simTime += dt;

        ctx.clearRect(0, 0, W, H);

        const sway = treeSway(simTime);

        drawTree(simTime);
        updateLeaves(dt, sway);

        leaves.sort((a, b) => a.size - b.size);
        leaves.forEach(drawFallingLeaf);
      }

      animationFrameId = requestAnimationFrame(frame);
    }

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) {
        last = performance.now();
      }
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resize();
    animationFrameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      offscreenTreeCanvas = null;
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        contain: 'strict',
      }}
    />
  );
};
