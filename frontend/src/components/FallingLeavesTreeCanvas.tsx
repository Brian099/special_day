import React, { useEffect, useRef } from 'react';

interface FallingLeavesTreeCanvasProps {
  theme?: 'light' | 'dark';
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

export const FallingLeavesTreeCanvas: React.FC<FallingLeavesTreeCanvasProps> = ({ theme = 'light' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let W = 0;
    let H = 0;
    let tree: TreeData | null = null;
    let leaves: FallingLeaf[] = [];
    let root = { x: 0, y: 0 };
    let dpr = 1;

    const isDark = theme === 'dark';

    const LEAF_COLORS = isDark
      ? [
          '#d48855', '#e09855', '#eac058',
          '#c4653f', '#b85434', '#f0ca6a',
          '#b0783a', '#e0a050'
        ]
      : [
          '#c9622a', '#d97b2b', '#e0a02e',
          '#b64a1f', '#a83c1c', '#e6b84a',
          '#8f5a1e', '#cf8a2c'
        ];

    /* ---------------- 叶形 ---------------- */
    function leafPath(c: CanvasRenderingContext2D, s: number) {
      c.beginPath();
      c.moveTo(0, -s * 0.5);
      c.quadraticCurveTo(s * 0.55, 0, 0, s * 0.5);
      c.quadraticCurveTo(-s * 0.55, 0, 0, -s * 0.5);
      c.closePath();
    }

    function drawLeafShape(x: number, y: number, size: number, angle: number, color: string, alpha: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      leafPath(ctx, size);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = isDark ? 'rgba(255, 230, 200, 0.6)' : 'rgba(90, 50, 20, 0.9)';
      ctx.lineWidth = Math.max(0.6, size * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.42);
      ctx.lineTo(0, size * 0.42);
      ctx.stroke();
      ctx.restore();
    }

    /* ---------------- 生成自然递归树 ---------------- */
    function buildTree() {
      const baseX = W * 0.93;
      const baseY = H * 1.02;
      root = { x: baseX, y: baseY };

      // 树高：主干长度按画面高度算，让树冠自然舒展于页面顶部与右侧
      const trunkLen = H * 0.30;
      const trunkW = Math.max(W * 0.018, 10);

      const branches: TreeBranch[] = [];
      const crownLeaves: CrownLeaf[] = [];

      function grow(x: number, y: number, angle: number, len: number, width: number, depth: number) {
        const x2 = x + Math.cos(angle) * len;
        const y2 = y + Math.sin(angle) * len;

        branches.push({ x1: x, y1: y, x2, y2, w: width });

        if (depth <= 3 && len > 4) {
          const leafCount = depth <= 1 ? 4 : 2;
          for (let i = 0; i < leafCount; i++) {
            const t = 0.35 + Math.random() * 0.65;
            const lx = x + (x2 - x) * t + (Math.random() - 0.5) * len * 0.7;
            const ly = y + (y2 - y) * t + (Math.random() - 0.5) * len * 0.7;

            crownLeaves.push({
              x: lx,
              y: ly,
              size: 5 + Math.random() * 6,
              angle: Math.random() * Math.PI * 2,
              swayAmp: 0.12 + Math.random() * 0.18,
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

        if (depth > 2 && Math.random() < 0.35) {
          grow(x2, y2, angle + (Math.random() - 0.5) * 0.5, len * 0.6, width * 0.5, depth - 2);
        }
      }

      grow(baseX, baseY, -Math.PI / 2 - 0.12, trunkLen, trunkW, 9);

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
    }

    /* ---------------- 尺寸自适应 ---------------- */
    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildTree();
      leaves = [];
    }

    /* ---------------- 整棵树的摆动 ---------------- */
    function treeSway(time: number) {
      return (
        Math.sin(time * 0.55) * 0.022 +
        Math.sin(time * 1.37 + 1.1) * 0.009
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

    /* ---------------- 绘制树 + 树上叶子 ---------------- */
    function drawTree(time: number) {
      if (!tree || !ctx) return;

      const sway = treeSway(time);

      ctx.save();
      ctx.translate(root.x, root.y);
      ctx.rotate(sway);
      ctx.translate(-root.x, -root.y);

      // 1. 树枝
      tree.branches.forEach(b => {
        const t = Math.min(b.w / 14, 1);
        if (isDark) {
          ctx.strokeStyle = `rgba(${160 + (1 - t) * 35}, ${120 + (1 - t) * 30}, ${90 + (1 - t) * 20}, 0.85)`;
        } else {
          ctx.strokeStyle = `rgba(${72 + (1 - t) * 40}, ${48 + (1 - t) * 30}, ${34 + (1 - t) * 20}, 0.92)`;
        }
        ctx.lineWidth = b.w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
      });

      // 2. 树上叶子：自身摆动 + 随整树倾斜
      tree.crownLeaves.forEach(l => {
        const localSway = Math.sin(time * l.swaySpeed + l.swayPhase) * l.swayAmp;
        drawLeafShape(l.x, l.y, l.size, l.angle + localSway, l.color, l.alpha);
      });

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
        size: 5 + Math.random() * 7,
        fall: 22 + Math.random() * 40,
        slip: 18 + Math.random() * 35,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (0.6 + Math.random() * 1.6) * (Math.random() < 0.5 ? -1 : 1),
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 1.2,
        // 横向漂移：向左移动，飘向左下角
        drift: -35 - Math.random() * 45,
        alpha: isDark ? 0.55 + Math.random() * 0.35 : 0.65 + Math.random() * 0.35,
        color: LEAF_COLORS[(Math.random() * LEAF_COLORS.length) | 0],
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1 + Math.random() * 1.5,
        swayAmp: 6 + Math.random() * 14
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
      const target = Math.round((W * H) / 26000);
      const count = Math.min(target, 120);

      if (leaves.length < count) {
        for (let i = 0; i < 2 && leaves.length < count; i++) {
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

    /* ---------------- 主循环 ---------------- */
    let last = performance.now();

    function frame(now: number) {
      if (!ctx) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const time = now / 1000;

      ctx.clearRect(0, 0, W, H);

      const sway = treeSway(time);

      drawTree(time);
      updateLeaves(dt, sway);

      leaves.sort((a, b) => a.size - b.size);
      leaves.forEach(drawFallingLeaf);

      animationFrameId = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    animationFrameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
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
      }}
    />
  );
};
