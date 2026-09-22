import React, { useEffect, useRef } from 'react';

interface FallingLeavesTreeCanvasProps {
  theme?: 'light' | 'dark';
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  flip: number;
  flipSpeed: number;
  opacity: number;
  maxOpacity: number;
  color: string;
  veinColor: string;
  swayFreq: number;
  swayAmp: number;
  swayPhase: number;
  life: number;
  maxLife: number;
}

interface BranchPoint {
  x: number;
  y: number;
}

export const FallingLeavesTreeCanvas: React.FC<FallingLeavesTreeCanvasProps> = ({ theme = 'light' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let leaves: Leaf[] = [];
    const leafSpawnPoints: BranchPoint[] = [];

    const isDark = theme === 'dark';

    // 调色盘：极简新中式温润配色
    const leafColors = isDark
      ? [
          'rgba(212, 183, 131, 0.55)', // 香槟金
          'rgba(164, 112, 112, 0.55)', // 浅酒红
          'rgba(229, 208, 166, 0.5)',  // 浅金
          'rgba(186, 142, 142, 0.45)', // 烟粉
          'rgba(196, 154, 108, 0.5)',  // 琥珀温木
        ]
      : [
          'rgba(139, 94, 94, 0.45)',   // 经典深酒红
          'rgba(201, 169, 110, 0.55)', // 香槟金
          'rgba(178, 123, 94, 0.45)',  // 檀木暖褐
          'rgba(168, 135, 74, 0.5)',   // 熟金
          'rgba(110, 70, 70, 0.4)',    // 墨赭
        ];

    const branchStroke = isDark
      ? 'rgba(212, 183, 131, 0.18)'
      : 'rgba(110, 70, 70, 0.14)';

    const foliageColor = isDark
      ? 'rgba(212, 183, 131, 0.12)'
      : 'rgba(139, 94, 94, 0.09)';

    const foliageHighlight = isDark
      ? 'rgba(229, 208, 166, 0.18)'
      : 'rgba(201, 169, 110, 0.14)';

    // 树木关键生长节点（按比例计算，完美适配各种屏幕）
    const getTreeStructure = () => {
      const rootX = width * 1.01;
      const rootY = height * 0.98;

      return {
        trunk: {
          start: { x: rootX, y: rootY },
          cp1: { x: width * 0.92, y: height * 0.65 },
          cp2: { x: width * 0.88, y: height * 0.42 },
          end: { x: width * 0.82, y: height * 0.22 },
        },
        branches: [
          // 主下大枝（伸向左中）
          {
            start: { x: width * 0.90, y: height * 0.60 },
            cp1: { x: width * 0.82, y: height * 0.55 },
            cp2: { x: width * 0.74, y: height * 0.52 },
            end: { x: width * 0.66, y: height * 0.48 },
            thickness: 5.5,
            subBranches: [
              {
                start: { x: width * 0.76, y: height * 0.53 },
                cp: { x: width * 0.71, y: height * 0.46 },
                end: { x: width * 0.64, y: height * 0.41 },
                thickness: 2.2,
              },
              {
                start: { x: width * 0.70, y: height * 0.50 },
                cp: { x: width * 0.65, y: height * 0.56 },
                end: { x: width * 0.59, y: height * 0.58 },
                thickness: 1.8,
              },
            ],
          },
          // 主中枝（伸向左上）
          {
            start: { x: width * 0.86, y: height * 0.42 },
            cp1: { x: width * 0.79, y: height * 0.35 },
            cp2: { x: width * 0.72, y: height * 0.30 },
            end: { x: width * 0.63, y: height * 0.25 },
            thickness: 4.5,
            subBranches: [
              {
                start: { x: width * 0.75, y: height * 0.32 },
                cp: { x: width * 0.70, y: height * 0.22 },
                end: { x: width * 0.65, y: height * 0.16 },
                thickness: 2.2,
              },
              {
                start: { x: width * 0.68, y: height * 0.28 },
                cp: { x: width * 0.60, y: height * 0.32 },
                end: { x: width * 0.54, y: height * 0.35 },
                thickness: 1.6,
              },
            ],
          },
          // 树冠顶部小枝
          {
            start: { x: width * 0.82, y: height * 0.22 },
            cp1: { x: width * 0.77, y: height * 0.14 },
            cp2: { x: width * 0.72, y: height * 0.09 },
            end: { x: width * 0.68, y: height * 0.05 },
            thickness: 3.5,
            subBranches: [
              {
                start: { x: width * 0.75, y: height * 0.12 },
                cp: { x: width * 0.80, y: height * 0.06 },
                end: { x: width * 0.78, y: height * 0.02 },
                thickness: 1.6,
              },
              {
                start: { x: width * 0.71, y: height * 0.08 },
                cp: { x: width * 0.64, y: height * 0.08 },
                end: { x: width * 0.58, y: height * 0.11 },
                thickness: 1.5,
              },
            ],
          },
          // 右侧侧枝（点缀右边缘）
          {
            start: { x: width * 0.88, y: height * 0.48 },
            cp1: { x: width * 0.94, y: height * 0.38 },
            cp2: { x: width * 0.96, y: height * 0.28 },
            end: { x: width * 0.92, y: height * 0.18 },
            thickness: 3.5,
            subBranches: [
              {
                start: { x: width * 0.95, y: height * 0.32 },
                cp: { x: width * 0.98, y: height * 0.22 },
                end: { x: width * 0.96, y: height * 0.12 },
                thickness: 1.5,
              },
            ],
          },
        ],
      };
    };

    // 重新调整 Canvas 尺寸与高分屏适配
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);

      // 刷新叶子出生点
      leafSpawnPoints.length = 0;
      const tree = getTreeStructure();
      
      // 将枝丫梢头作为零星落叶的出生点
      leafSpawnPoints.push(
        tree.trunk.end,
        ...tree.branches.map(b => b.end),
        ...tree.branches.flatMap(b => b.subBranches.map(sb => sb.end)),
        ...tree.branches.map(b => ({ x: (b.start.x + b.end.x) / 2, y: (b.start.y + b.end.y) / 2 }))
      );
    };

    // 树木绘制：简洁优雅的极简东方水墨/线条意境
    const drawTree = (time: number) => {
      const tree = getTreeStructure();
      const sway = Math.sin(time * 0.0008) * 3;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. 绘制主干
      ctx.beginPath();
      ctx.moveTo(tree.trunk.start.x, tree.trunk.start.y);
      ctx.bezierCurveTo(
        tree.trunk.cp1.x + sway * 0.2,
        tree.trunk.cp1.y,
        tree.trunk.cp2.x + sway * 0.5,
        tree.trunk.cp2.y,
        tree.trunk.end.x + sway,
        tree.trunk.end.y
      );
      ctx.strokeStyle = branchStroke;
      ctx.lineWidth = Math.max(12, width * 0.012);
      ctx.stroke();

      // 2. 绘制各大分支
      tree.branches.forEach((branch, idx) => {
        const bSway = Math.sin(time * 0.001 + idx * 1.5) * 4;
        ctx.beginPath();
        ctx.moveTo(branch.start.x, branch.start.y);
        ctx.bezierCurveTo(
          branch.cp1.x + bSway * 0.4,
          branch.cp1.y,
          branch.cp2.x + bSway * 0.7,
          branch.cp2.y,
          branch.end.x + bSway,
          branch.end.y
        );
        ctx.strokeStyle = branchStroke;
        ctx.lineWidth = branch.thickness;
        ctx.stroke();

        // 绘制子分支
        branch.subBranches.forEach((sb, sidx) => {
          const sbSway = Math.sin(time * 0.0012 + idx + sidx) * 5;
          ctx.beginPath();
          ctx.moveTo(sb.start.x, sb.start.y);
          ctx.quadraticCurveTo(
            sb.cp.x + sbSway * 0.6,
            sb.cp.y,
            sb.end.x + sbSway,
            sb.end.y
          );
          ctx.lineWidth = sb.thickness;
          ctx.stroke();

          // 枝头聚簇的柔和水墨光晕叶簇（极简意境）
          ctx.beginPath();
          ctx.arc(sb.end.x + sbSway, sb.end.y, 14 + sidx * 4, 0, Math.PI * 2);
          ctx.fillStyle = sidx % 2 === 0 ? foliageColor : foliageHighlight;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(sb.end.x + sbSway - 6, sb.end.y - 4, 10, 0, Math.PI * 2);
          ctx.fillStyle = foliageHighlight;
          ctx.fill();
        });

        // 大枝梢头叶簇
        ctx.beginPath();
        ctx.arc(branch.end.x + bSway, branch.end.y, 18 + idx * 3, 0, Math.PI * 2);
        ctx.fillStyle = foliageColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(branch.end.x + bSway + 8, branch.end.y - 6, 12, 0, Math.PI * 2);
        ctx.fillStyle = foliageHighlight;
        ctx.fill();
      });

      // 树梢主体叶簇
      ctx.beginPath();
      ctx.arc(tree.trunk.end.x + sway, tree.trunk.end.y, 24, 0, Math.PI * 2);
      ctx.fillStyle = foliageColor;
      ctx.fill();

      ctx.restore();
    };

    // 单片落叶创建
    const createLeaf = (isInitial = false): Leaf => {
      // 随机从某个树梢/枝干出生点生成
      const spawnPt = leafSpawnPoints.length > 0
        ? leafSpawnPoints[Math.floor(Math.random() * leafSpawnPoints.length)]
        : { x: width * 0.8, y: height * 0.3 };

      const startX = isInitial
        ? width * 0.2 + Math.random() * (width * 0.8)
        : spawnPt.x + (Math.random() - 0.5) * 60;
      
      const startY = isInitial
        ? Math.random() * height * 0.9
        : spawnPt.y + (Math.random() - 0.5) * 40;

      const size = 7 + Math.random() * 8; // 7px ~ 15px 雅致小叶
      const maxOpacity = 0.45 + Math.random() * 0.4;
      const colorIdx = Math.floor(Math.random() * leafColors.length);

      return {
        x: startX,
        y: startY,
        size,
        // 朝左下角飘落：vx 为负（向左），vy 为正（向下）
        vx: -(0.45 + Math.random() * 0.85), // 向左漂移
        vy: 0.35 + Math.random() * 0.75,   // 向下飘落
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        flip: Math.random() * Math.PI * 2,
        flipSpeed: 0.015 + Math.random() * 0.025,
        opacity: isInitial ? maxOpacity * Math.random() : 0.05,
        maxOpacity,
        color: leafColors[colorIdx],
        veinColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(110,70,70,0.2)',
        swayFreq: 0.0015 + Math.random() * 0.002,
        swayAmp: 0.6 + Math.random() * 0.8,
        swayPhase: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: 800 + Math.random() * 600,
      };
    };

    // 初始化零星落叶（数量保持 18-28 片，清爽宁静）
    const initLeaves = () => {
      leaves = [];
      const count = width > 768 ? 22 : 12;
      for (let i = 0; i < count; i++) {
        leaves.push(createLeaf(true));
      }
    };

    // 绘制单片优雅小叶
    const drawLeaf = (leaf: Leaf) => {
      const { x, y, size, rotation, flip, opacity, color, veinColor } = leaf;
      if (opacity <= 0.01) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      // 利用 scale(flipScale, 1) 呈现落叶在空中翻转的三维轻盈感
      const flipScale = Math.sin(flip);
      ctx.scale(flipScale, 1);

      ctx.globalAlpha = opacity;

      // 叶子轮廓（圆润流线形）
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size * 0.75, -size * 0.3, size * 0.7, size * 0.65, 0, size);
      ctx.bezierCurveTo(-size * 0.7, size * 0.65, -size * 0.75, -size * 0.3, 0, -size);
      ctx.fillStyle = color;
      ctx.fill();

      // 叶脉细节
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.75);
      ctx.lineTo(0, size * 0.75);
      ctx.strokeStyle = veinColor;
      ctx.lineWidth = 0.7;
      ctx.stroke();

      ctx.restore();
    };

    // 动画主循环
    const animate = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. 绘制右侧大树
      drawTree(time);

      // 2. 更新与绘制飘落向左下角的零星落叶
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        leaf.life++;

        // 柔和淡入淡出
        if (leaf.life < 60) {
          leaf.opacity = Math.min(leaf.maxOpacity, leaf.opacity + 0.015);
        } else if (leaf.life > leaf.maxLife - 80 || leaf.x < 30 || leaf.y > height - 40) {
          leaf.opacity = Math.max(0, leaf.opacity - 0.015);
        }

        // 自然风力波动与飘移轨迹（向左下角）
        const sway = Math.sin(time * leaf.swayFreq + leaf.swayPhase) * leaf.swayAmp;
        leaf.x += leaf.vx + sway * 0.3;
        leaf.y += leaf.vy + Math.abs(sway) * 0.15;
        leaf.rotation += leaf.rotSpeed;
        leaf.flip += leaf.flipSpeed;

        drawLeaf(leaf);

        // 如果超出左侧、下边缘或生命周期结束，重新在树梢生成
        if (leaf.x < -40 || leaf.y > height + 40 || leaf.opacity <= 0 && leaf.life > 60) {
          leaves[i] = createLeaf(false);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initLeaves();
    animationFrameId = requestAnimationFrame(animate);

    window.addEventListener('resize', () => {
      resizeCanvas();
      initLeaves();
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
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
