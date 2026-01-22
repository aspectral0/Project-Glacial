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
    
    // Left Slope
    ctx.bezierCurveTo(
      startX + glacierWidth * 0.2, groundLevel - glacierHeight, 
      startX + glacierWidth * 0.4, groundLevel - glacierHeight * 1.1, 
      startX + glacierWidth * 0.5, groundLevel - glacierHeight * 1.05
    );
    
    // Right Slope
    ctx.bezierCurveTo(
      startX + glacierWidth * 0.6, groundLevel - glacierHeight, 
      startX + glacierWidth * 0.8, groundLevel - glacierHeight * 0.2, 
      startX + glacierWidth, groundLevel
    );
    
    ctx.closePath();

    // Ice Gradient
    const iceGradient = ctx.createLinearGradient(0, groundLevel - glacierHeight, 0, groundLevel);
    // Color shifts based on stability (more grey/cracked look if unstable)
    const stabilityRatio = stats.stability / 100;
    
    if (stabilityRatio > 0.7) {
      iceGradient.addColorStop(0, '#E0F7FA');
      iceGradient.addColorStop(1, '#0288D1');
    } else if (stabilityRatio > 0.3) {
      iceGradient.addColorStop(0, '#CFD8DC'); // Greying out
      iceGradient.addColorStop(1, '#455A64');
    } else {
      iceGradient.addColorStop(0, '#37474F'); // Dark/Dirty
      iceGradient.addColorStop(1, '#263238');
    }
    
    ctx.fillStyle = iceGradient;
    ctx.fill();

    // Cracks overlay if unstable
    if (stats.stability < 50) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX + glacierWidth * 0.4, groundLevel - glacierHeight * 0.8);
      ctx.lineTo(startX + glacierWidth * 0.45, groundLevel - glacierHeight * 0.5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(startX + glacierWidth * 0.7, groundLevel - glacierHeight * 0.6);
      ctx.lineTo(startX + glacierWidth * 0.65, groundLevel - glacierHeight * 0.3);
      ctx.stroke();
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
