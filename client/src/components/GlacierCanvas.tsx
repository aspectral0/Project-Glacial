import { useRef, useEffect, useState } from 'react';
import { SimulationState } from '@/hooks/use-simulation';
import { motion } from 'framer-motion';

interface GlacierCanvasProps {
  stats: SimulationState['glacierStats'];
  environment?: SimulationState['environmentalFactors'];
  isFrozen?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  type: 'snow' | 'rain' | 'melt' | 'cloud' | 'ice';
}

interface CalvingEvent {
  x: number;
  y: number;
  size: number;
  life: number;
  angle: number;
}

export function GlacierCanvas({ stats, environment, isFrozen = false }: GlacierCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const calvingEventsRef = useRef<CalvingEvent[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const lastStabilityRef = useRef(stats.stability);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const particles = particlesRef.current;
    const calvingEvents = calvingEventsRef.current;

    // Check for calving events
    if (stats.stability < lastStabilityRef.current - 5) {
      setNotification('CALVING EVENT DETECTED');
      setTimeout(() => setNotification(null), 3000);
      
      // Create calving animation
      const glacierWidth = (stats.area / 2000) * (width * 0.85);
      const startX = (width - glacierWidth) / 2;
      calvingEvents.push({
        x: startX + Math.random() * glacierWidth,
        y: height - 100 - Math.random() * 100,
        size: 20 + Math.random() * 30,
        life: 60,
        angle: 0
      });
    }
    lastStabilityRef.current = stats.stability;

    const animate = () => {
      if (isFrozen) return;
      
      ctx.clearRect(0, 0, width, height);

      const maxThickness = 2000;
      const maxArea = 2000;
      const glacierHeight = (stats.thickness / maxThickness) * (height * 0.65);
      const glacierWidth = (stats.area / maxArea) * (width * 0.85);
      const startX = (width - glacierWidth) / 2;
      const groundLevel = height - 50;

      // Dynamic sky based on temperature
      const temp = environment?.globalTemp || 0;
      const skyColor1 = temp > 2 ? '#1e3a5f' : temp > 0 ? '#0f172a' : '#0a1628';
      const skyColor2 = temp > 2 ? '#4a1a1a' : temp > 0 ? '#1e1b4b' : '#020617';
      
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, skyColor1);
      skyGrad.addColorStop(0.6, skyColor2);
      skyGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Stars (fade with temp)
      const starOpacity = Math.max(0.1, 0.8 - temp * 0.1);
      ctx.shadowBlur = 3;
      ctx.shadowColor = 'white';
      ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;
      for (let i = 0; i < 80; i++) {
        const x = (Math.sin(i * 123.45) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 678.90) * 0.5 + 0.5) * (height * 0.5);
        const twinkle = Math.sin(Date.now() * 0.003 + i) * 0.3 + 0.7;
        ctx.globalAlpha = starOpacity * twinkle;
        ctx.beginPath();
        ctx.arc(x, y, 1 + Math.random() * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Aurora effect (cold temps only)
      if (temp < 0) {
        ctx.globalAlpha = 0.15;
        for (let i = 0; i < 3; i++) {
          const auroraGrad = ctx.createLinearGradient(0, 50 + i * 30, width, 100 + i * 30);
          auroraGrad.addColorStop(0, 'transparent');
          auroraGrad.addColorStop(0.3, '#22d3ee');
          auroraGrad.addColorStop(0.5, '#a855f7');
          auroraGrad.addColorStop(0.7, '#22d3ee');
          auroraGrad.addColorStop(1, 'transparent');
          
          ctx.beginPath();
          ctx.moveTo(0, 80 + i * 20);
          for (let x = 0; x <= width; x += 10) {
            const y = 80 + i * 20 + Math.sin(x * 0.02 + Date.now() * 0.001 + i) * 20;
            ctx.lineTo(x, y);
          }
          ctx.strokeStyle = auroraGrad;
          ctx.lineWidth = 8;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Clouds
      const cloudDensity = Math.min(1, (environment?.snowfall || 1) * 0.5);
      ctx.globalAlpha = cloudDensity * 0.4;
      for (let i = 0; i < 5; i++) {
        const cx = ((Date.now() * 0.01 + i * 200) % (width + 200)) - 100;
        const cy = 60 + i * 25;
        const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        cloudGrad.addColorStop(0, 'rgba(148, 163, 184, 0.8)');
        cloudGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, 60 + Math.sin(i) * 20, 0, Math.PI * 2);
        ctx.arc(cx + 40, cy + 10, 40, 0, Math.PI * 2);
        ctx.arc(cx - 30, cy + 5, 50, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Generate weather particles
      const snowfall = environment?.snowfall || 1;
      const isRaining = temp > 1 && snowfall > 0.5;
      const isSnowing = temp <= 1 && snowfall > 0.3;
      
      if (isSnowing && Math.random() > 0.7) {
        particles.push({
          x: Math.random() * width,
          y: -10,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 1 + Math.random() * 1.5,
          size: 2 + Math.random() * 3,
          opacity: 0.5 + Math.random() * 0.5,
          type: 'snow'
        });
      }
      
      if (isRaining && Math.random() > 0.5) {
        particles.push({
          x: Math.random() * width,
          y: -10,
          vx: 1,
          vy: 8 + Math.random() * 4,
          size: 1,
          opacity: 0.4,
          type: 'rain'
        });
      }

      // Meltwater particles
      if (temp > 0 && Math.random() > 0.8) {
        particles.push({
          x: startX + Math.random() * glacierWidth,
          y: groundLevel - glacierHeight * 0.3,
          vx: (Math.random() - 0.5) * 2,
          vy: 2 + Math.random() * 2,
          size: 2 + Math.random() * 2,
          opacity: 0.7,
          type: 'melt'
        });
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.opacity -= 0.005;
        
        if (p.y > height || p.opacity <= 0 || p.x < 0 || p.x > width) {
          particles.splice(i, 1);
          continue;
        }
        
        ctx.globalAlpha = p.opacity;
        if (p.type === 'snow') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'rain') {
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
          ctx.stroke();
        } else if (p.type === 'melt') {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Keep particles reasonable
      while (particles.length > 200) particles.shift();

      // Mountains background
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height * 0.4);
      ctx.lineTo(width * 0.15, height * 0.25);
      ctx.lineTo(width * 0.3, height * 0.45);
      ctx.lineTo(width * 0.45, height * 0.2);
      ctx.lineTo(width * 0.6, height * 0.4);
      ctx.lineTo(width * 0.75, height * 0.15);
      ctx.lineTo(width * 0.9, height * 0.35);
      ctx.lineTo(width, height * 0.25);
      ctx.lineTo(width, height);
      ctx.fill();

      // Snow caps on mountains
      ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.beginPath();
      ctx.moveTo(width * 0.15, height * 0.25);
      ctx.lineTo(width * 0.12, height * 0.32);
      ctx.lineTo(width * 0.18, height * 0.32);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(width * 0.45, height * 0.2);
      ctx.lineTo(width * 0.42, height * 0.28);
      ctx.lineTo(width * 0.48, height * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(width * 0.75, height * 0.15);
      ctx.lineTo(width * 0.71, height * 0.24);
      ctx.lineTo(width * 0.79, height * 0.24);
      ctx.closePath();
      ctx.fill();

      // Ocean/water at base
      const waterGrad = ctx.createLinearGradient(0, groundLevel, 0, height);
      waterGrad.addColorStop(0, '#0c4a6e');
      waterGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, groundLevel, width, height - groundLevel);
      
      // Water waves
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 2;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        for (let x = 0; x <= width; x += 5) {
          const y = groundLevel + 10 + w * 8 + Math.sin(x * 0.03 + Date.now() * 0.003 + w) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Glacier path generation
      const segments = 50;
      const step = glacierWidth / segments;
      const points: {x: number, y: number}[] = [];
      
      for (let i = 0; i <= segments; i++) {
        const x = startX + i * step;
        const t = i / segments;
        const baseProfile = Math.sin(t * Math.PI) * (0.85 + Math.sin(t * 12) * 0.03);
        const noise = Math.sin(i * 0.5 + stats.thickness * 0.01) * 6 + Math.cos(i * 0.3) * 4;
        const y = groundLevel - (glacierHeight * baseProfile) + noise;
        points.push({x, y});
      }

      // Back shadow layer
      ctx.beginPath();
      ctx.moveTo(startX, groundLevel);
      points.forEach(p => ctx.lineTo(p.x + 8, p.y - 8));
      ctx.lineTo(startX + glacierWidth + 8, groundLevel);
      ctx.fillStyle = '#0c4a6e';
      ctx.fill();

      // Main glacier body
      ctx.beginPath();
      ctx.moveTo(startX, groundLevel);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(startX + glacierWidth, groundLevel);
      
      const bodyGrad = ctx.createLinearGradient(0, groundLevel - glacierHeight, 0, groundLevel);
      bodyGrad.addColorStop(0, '#f8fafc');
      bodyGrad.addColorStop(0.08, '#e0f2fe');
      bodyGrad.addColorStop(0.25, '#bae6fd');
      bodyGrad.addColorStop(0.5, '#7dd3fc');
      bodyGrad.addColorStop(0.75, '#0ea5e9');
      bodyGrad.addColorStop(1, '#0369a1');
      
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Glacier texture (ice layers)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, groundLevel);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(startX + glacierWidth, groundLevel);
      ctx.clip();

      // Horizontal ice strata
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#0c4a6e';
      ctx.lineWidth = 1;
      for (let y = groundLevel - glacierHeight * 0.9; y < groundLevel; y += 15) {
        ctx.beginPath();
        for (let x = startX; x < startX + glacierWidth; x += 3) {
          const offset = Math.sin(x * 0.05 + y * 0.02) * 3;
          if (x === startX) ctx.moveTo(x, y + offset);
          else ctx.lineTo(x, y + offset);
        }
        ctx.stroke();
      }

      // Subsurface highlights
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 2;
      for (let i = 0; i < points.length - 1; i++) {
        if (i % 4 === 0) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y + 5);
          ctx.lineTo(points[i].x + 15 + Math.random() * 10, points[i].y + 35 + Math.random() * 20);
          ctx.stroke();
        }
      }

      // Crevasses based on stability
      if (stats.stability < 80) {
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#082f49';
        ctx.lineWidth = 2;
        const crackDensity = Math.floor((100 - stats.stability) / 4);
        for (let i = 0; i < crackDensity; i++) {
          const cx = startX + 20 + Math.random() * (glacierWidth - 40);
          const cy = groundLevel - 20 - Math.random() * glacierHeight * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          let currX = cx, currY = cy;
          for (let j = 0; j < 3 + Math.random() * 3; j++) {
            currX += (Math.random() - 0.5) * 15;
            currY += 15 + Math.random() * 15;
            ctx.lineTo(currX, currY);
          }
          ctx.stroke();
        }
      }

      ctx.restore();

      // Glacier edge glow
      ctx.beginPath();
      ctx.moveTo(startX, groundLevel);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Calving events animation
      for (let i = calvingEvents.length - 1; i >= 0; i--) {
        const ce = calvingEvents[i];
        ce.y += 2;
        ce.angle += 0.1;
        ce.life--;
        
        if (ce.life <= 0) {
          // Splash effect
          for (let j = 0; j < 8; j++) {
            particles.push({
              x: ce.x,
              y: groundLevel,
              vx: (Math.random() - 0.5) * 6,
              vy: -3 - Math.random() * 4,
              size: 3 + Math.random() * 3,
              opacity: 0.8,
              type: 'melt'
            });
          }
          calvingEvents.splice(i, 1);
          continue;
        }
        
        ctx.save();
        ctx.translate(ce.x, ce.y);
        ctx.rotate(ce.angle);
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        ctx.moveTo(-ce.size / 2, -ce.size / 3);
        ctx.lineTo(0, -ce.size / 2);
        ctx.lineTo(ce.size / 2, -ce.size / 4);
        ctx.lineTo(ce.size / 3, ce.size / 3);
        ctx.lineTo(-ce.size / 3, ce.size / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Water reflection of glacier
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.scale(1, -0.3);
      ctx.translate(0, -groundLevel * 3.3);
      ctx.beginPath();
      ctx.moveTo(startX, groundLevel);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(startX + glacierWidth, groundLevel);
      ctx.fillStyle = '#7dd3fc';
      ctx.fill();
      ctx.restore();

      // Temperature indicator overlay
      if (temp > 2) {
        ctx.fillStyle = `rgba(239, 68, 68, ${0.05 + Math.sin(Date.now() * 0.002) * 0.02})`;
        ctx.fillRect(0, 0, width, height);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [stats, environment, isFrozen]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-slate-900"
    >
      <canvas 
        ref={canvasRef} 
        width={900} 
        height={550} 
        className="w-full h-full object-cover"
      />
      
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/90 text-white font-mono text-sm rounded-lg shadow-lg"
        >
          {notification}
        </motion.div>
      )}
      
      {/* Overlay Stats */}
      <div className="absolute top-4 right-4 text-right space-y-2">
        <div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Thickness</div>
          <div className="text-2xl font-bold text-white font-mono">{stats.thickness.toFixed(0)}<span className="text-sm text-slate-400">m</span></div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Area</div>
          <div className="text-lg font-bold text-white font-mono">{stats.area.toFixed(0)}<span className="text-sm text-slate-400">km²</span></div>
        </div>
      </div>

      {/* Stability indicator */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${stats.stability > 70 ? 'bg-green-500' : stats.stability > 40 ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
        <span className="text-xs font-mono text-slate-400">
          STABILITY: <span className={stats.stability > 70 ? 'text-green-400' : stats.stability > 40 ? 'text-yellow-400' : 'text-red-400'}>{stats.stability.toFixed(0)}%</span>
        </span>
      </div>

      {/* Volume indicator */}
      <div className="absolute bottom-4 right-4">
        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Volume</div>
        <div className="text-lg font-bold text-cyan-400 font-mono">{(stats.volume / 1000).toFixed(1)}<span className="text-sm text-slate-500">k km³</span></div>
      </div>
    </motion.div>
  );
}
