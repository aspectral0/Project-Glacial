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
    // Base height mapping: 1000m thickness = 60% of canvas height
    // Base width mapping: 1000sqkm = 80% of canvas width
    const maxThickness = 2000; 
    const maxArea = 2000;

    const glacierHeight = (stats.thickness / maxThickness) * (height * 0.8);
    const glacierWidth = (stats.area / maxArea) * (width * 0.9);
    
    // Center it
    const startX = (width - glacierWidth) / 2;
    const groundLevel = height - 20;

    // Sky / Background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, '#0F172A'); // Dark slate
    skyGradient.addColorStop(1, '#1E293B'); // Lighter slate
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Stars (Static for now, could twinkle)
    if (!isFrozen) {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * (height * 0.6);
        const s = Math.random() * 2;
        ctx.fillRect(x, y, s, s);
      }
    }

    // Water (Rising if melted?)
    const waterHeight = 40;
    ctx.fillStyle = '#0EA5E933'; // Transparent blue
    ctx.fillRect(0, groundLevel - waterHeight, width, waterHeight + 20);

    // Glacier Drawing
    ctx.beginPath();
    ctx.moveTo(startX, groundLevel);
    
    // Detailed Top Surface with Noise/Peaks
    const segments = 20;
    const segmentWidth = glacierWidth / segments;
    
    for (let i = 0; i <= segments; i++) {
      const x = startX + i * segmentWidth;
      // Calculate a profile that is thickest in the middle
      const profile = Math.sin((i / segments) * Math.PI);
      // Add some deterministic noise based on stats for "uniqueness"
      const noise = Math.sin(i * 0.8 + stats.thickness * 0.01) * 10;
      const y = groundLevel - (glacierHeight * profile) + noise;
      
      if (i === 0) ctx.lineTo(x, groundLevel);
      else ctx.lineTo(x, y);
    }
    
    ctx.lineTo(startX + glacierWidth, groundLevel);
    ctx.closePath();

    // Ice Gradient with Subsurface Scattering look
    const iceGradient = ctx.createLinearGradient(startX, groundLevel - glacierHeight, startX + glacierWidth, groundLevel);
    const stabilityRatio = stats.stability / 100;
    
    if (stabilityRatio > 0.7) {
      iceGradient.addColorStop(0, '#f0fdff'); // Bright snow top
      iceGradient.addColorStop(0.2, '#bae6fd'); // Deep blue core
      iceGradient.addColorStop(1, '#0284c7'); // Dark base
    } else if (stabilityRatio > 0.3) {
      iceGradient.addColorStop(0, '#e2e8f0'); 
      iceGradient.addColorStop(0.5, '#94a3b8');
      iceGradient.addColorStop(1, '#475569');
    } else {
      iceGradient.addColorStop(0, '#475569'); 
      iceGradient.addColorStop(1, '#1e293b');
    }
    
    ctx.fillStyle = iceGradient;
    ctx.fill();

    // Add Highlight/Sheen
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // Cracks overlay if unstable
    if (stats.stability < 60) {
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.5;
      const crackCount = Math.floor((1 - stabilityRatio) * 15);
      for (let i = 0; i < crackCount; i++) {
        const cx = startX + (Math.random() * 0.6 + 0.2) * glacierWidth;
        const cy = groundLevel - (Math.random() * 0.5) * glacierHeight;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (Math.random() - 0.5) * 30, cy + 40);
        ctx.stroke();
      }
    }

    // Reflection in water
    ctx.save();
    ctx.scale(1, -1);
    ctx.translate(0, -groundLevel * 2);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = iceGradient;
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
