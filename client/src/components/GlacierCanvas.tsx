import { useRef, useEffect } from 'react';
import { SimulationState } from '@/hooks/use-simulation';
import { motion } from 'framer-motion';

interface GlacierCanvasProps {
  stats: SimulationState['glacierStats'];
  isFrozen?: boolean; // For static preview
}

export function GlacierCanvas({ stats, isFrozen = false }: GlacierCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);

    // Dynamic Scale
    const maxThickness = 2000; 
    const maxArea = 2000;
    const glacierHeight = (stats.thickness / maxThickness) * (height * 0.7);
    const glacierWidth = (stats.area / maxArea) * (width * 0.85);
    const startX = (width - glacierWidth) / 2;
    const groundLevel = height - 40;

    // Atmospheric Background
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars with Bloom
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'white';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 60; i++) {
      const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * (height * 0.7);
      const size = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Glacier Path Generation
    const segments = 40;
    const step = glacierWidth / segments;
    const points: {x: number, y: number}[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const x = startX + i * step;
      const t = i / segments;
      const baseProfile = Math.sin(t * Math.PI) * (0.8 + Math.sin(t * 10) * 0.05);
      const noise = Math.sin(i * 0.5 + stats.thickness * 0.01) * 8 + Math.cos(i * 0.2) * 5;
      const y = groundLevel - (glacierHeight * baseProfile) + noise;
      points.push({x, y});
    }

    // 1. Back Layer (Darker Depth)
    ctx.beginPath();
    ctx.moveTo(startX, groundLevel);
    points.forEach(p => ctx.lineTo(p.x + 10, p.y - 10));
    ctx.lineTo(startX + glacierWidth + 10, groundLevel);
    ctx.fillStyle = '#0c4a6e';
    ctx.fill();

    // 2. Main Body Layer
    ctx.beginPath();
    ctx.moveTo(startX, groundLevel);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(startX + glacierWidth, groundLevel);
    
    const bodyGrad = ctx.createLinearGradient(0, groundLevel - glacierHeight, 0, groundLevel);
    bodyGrad.addColorStop(0, '#f8fafc'); // Fresh snow
    bodyGrad.addColorStop(0.1, '#e0f2fe'); // Light ice
    bodyGrad.addColorStop(0.4, '#7dd3fc'); // Compressed ice
    bodyGrad.addColorStop(0.8, '#0369a1'); // Deep glacial blue
    bodyGrad.addColorStop(1, '#0c4a6e'); // Base
    
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 3. Texture & Highlights
    ctx.save();
    ctx.clip(); // Only draw inside the glacier
    
    // Subsurface scattering highlights
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 2;
    for (let i = 0; i < points.length - 1; i++) {
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i].x + 20, points[i].y + 40);
        ctx.stroke();
      }
    }

    // Crevasses/Cracks
    if (stats.stability < 70) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#082f49';
      ctx.lineWidth = 1;
      const crackDensity = Math.floor((100 - stats.stability) / 5);
      for (let i = 0; i < crackDensity; i++) {
        const cx = startX + Math.random() * glacierWidth;
        const cy = groundLevel - Math.random() * glacierHeight * 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (Math.random()-0.5)*15, cy + 30 + Math.random()*20);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 4. Edge Definition
    ctx.beginPath();
    ctx.moveTo(startX, groundLevel);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(startX + glacierWidth, groundLevel);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Reflection
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.scale(1, -0.4);
    ctx.translate(0, -groundLevel * 2.5);
    ctx.beginPath();
    ctx.moveTo(startX, groundLevel);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(startX + glacierWidth, groundLevel);
    ctx.fillStyle = '#7dd3fc';
    ctx.fill();
    ctx.restore();

  }, [stats]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900"
    >
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={500} 
        className="w-full h-full object-cover"
      />
      
      {/* Overlay Stats for quick view */}
      <div className="absolute top-4 right-4 text-right space-y-1">
        <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Thickness</div>
        <div className="text-2xl font-bold text-white font-mono">{stats.thickness.toFixed(0)}m</div>
      </div>
    </motion.div>
  );
}
