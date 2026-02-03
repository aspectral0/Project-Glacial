import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Glacier } from "@shared/schema";
import { Crosshair, Zap, Heart, Target, Trophy, ArrowUp, Shield, Sparkles } from "lucide-react";

interface IceDrillShooterProps {
  glacier: Glacier;
  onComplete?: () => void;
}

interface Player {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  fireRate: number;
  angle: number;
  shield: number;
  weaponType: 'normal' | 'spread' | 'laser' | 'explosive';
  weaponTimer: number;
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isEnemy?: boolean;
  type?: 'normal' | 'laser' | 'explosive';
  size?: number;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'drone' | 'tank' | 'boss' | 'sniper' | 'swarm';
  lastShot?: number;
  angle?: number;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'explosion' | 'ice' | 'spark' | 'trail';
}

interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'shield' | 'spread' | 'laser' | 'explosive' | 'speed';
  life: number;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  cost: number;
  apply: (player: Player) => Player;
}

const CANVAS_WIDTH = 650;
const CANVAS_HEIGHT = 420;
const BULLET_SPEED = 14;

export function IceDrillShooter({ glacier, onComplete }: IceDrillShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'shop' | 'victory' | 'gameover'>('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [credits, setCredits] = useState(0);
  const [unlockedData, setUnlockedData] = useState({ temp: false, co2: false, strength: false, full: false });
  const [isOpen, setIsOpen] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    health: 100,
    maxHealth: 100,
    speed: 5,
    damage: 25,
    fireRate: 180,
    angle: -Math.PI / 2,
    shield: 0,
    weaponType: 'normal',
    weaponTimer: 0
  });
  
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const mouseRef = useRef({ x: CANVAS_WIDTH / 2, y: 0, shooting: false });
  const lastShotRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const gameStateRef = useRef(gameState);
  const screenShakeRef = useRef(0);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayHealth, setDisplayHealth] = useState(100);
  const [displayShield, setDisplayShield] = useState(0);
  const [enemyCount, setEnemyCount] = useState(0);
  const [currentWeapon, setCurrentWeapon] = useState<string>('PLASMA');

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const upgrades: Upgrade[] = [
    {
      id: 'health',
      name: 'Nano Repair',
      description: '+30 Max Health & Full Heal',
      icon: <Heart className="w-4 h-4" />,
      cost: 60,
      apply: (p) => ({ ...p, maxHealth: p.maxHealth + 30, health: p.maxHealth + 30 })
    },
    {
      id: 'damage',
      name: 'Plasma Core',
      description: '+15 Damage',
      icon: <Zap className="w-4 h-4" />,
      cost: 80,
      apply: (p) => ({ ...p, damage: p.damage + 15 })
    },
    {
      id: 'speed',
      name: 'Ion Thrusters',
      description: '+2.5 Speed',
      icon: <ArrowUp className="w-4 h-4" />,
      cost: 50,
      apply: (p) => ({ ...p, speed: p.speed + 2.5 })
    },
    {
      id: 'firerate',
      name: 'Rapid Cycling',
      description: 'Faster fire rate',
      icon: <Target className="w-4 h-4" />,
      cost: 100,
      apply: (p) => ({ ...p, fireRate: Math.max(60, p.fireRate - 25) })
    },
    {
      id: 'shield',
      name: 'Energy Shield',
      description: '+50 Shield Points',
      icon: <Shield className="w-4 h-4" />,
      cost: 70,
      apply: (p) => ({ ...p, shield: Math.min(100, p.shield + 50) })
    }
  ];

  const createExplosion = (x: number, y: number, color: string, count: number = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x, y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 3 + Math.random() * 4,
        type: 'explosion'
      });
    }
  };

  const createIceShards = (x: number, y: number) => {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      particlesRef.current.push({
        x, y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 40,
        maxLife: 40,
        color: '#67e8f9',
        size: 2 + Math.random() * 3,
        type: 'ice'
      });
    }
  };

  const spawnPowerUp = (x: number, y: number) => {
    if (Math.random() > 0.7) {
      const types: PowerUp['type'][] = ['health', 'shield', 'spread', 'laser', 'explosive', 'speed'];
      const weights = [0.25, 0.2, 0.15, 0.15, 0.15, 0.1];
      let rand = Math.random();
      let type: PowerUp['type'] = 'health';
      for (let i = 0; i < types.length; i++) {
        rand -= weights[i];
        if (rand <= 0) { type = types[i]; break; }
      }
      powerUpsRef.current.push({ x, y, type, life: 300 });
    }
  };

  const spawnEnemies = useCallback((lvl: number) => {
    const enemies: Enemy[] = [];
    const isBossLevel = lvl % 3 === 0;
    
    if (isBossLevel) {
      enemies.push({
        x: CANVAS_WIDTH / 2,
        y: 70,
        health: 300 + lvl * 80,
        maxHealth: 300 + lvl * 80,
        speed: 1.5,
        type: 'boss',
        lastShot: 0,
        angle: 0
      });
      for (let i = 0; i < 2; i++) {
        enemies.push({
          x: 100 + i * 450,
          y: 50,
          health: 40,
          maxHealth: 40,
          speed: 2,
          type: 'drone'
        });
      }
    } else {
      const count = 4 + Math.floor(lvl * 0.8);
      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let type: Enemy['type'] = 'drone';
        if (rand > 0.85 && lvl > 3) type = 'sniper';
        else if (rand > 0.7) type = 'tank';
        else if (rand > 0.5 && lvl > 2) type = 'swarm';
        
        const health = type === 'tank' ? 80 : type === 'sniper' ? 50 : type === 'swarm' ? 20 : 35;
        const speed = type === 'tank' ? 0.8 : type === 'swarm' ? 3 : type === 'sniper' ? 0.5 : 1.5;
        
        enemies.push({
          x: 40 + Math.random() * (CANVAS_WIDTH - 80),
          y: 30 + Math.random() * 120,
          health,
          maxHealth: health,
          speed,
          type,
          lastShot: 0
        });
      }
    }
    enemiesRef.current = enemies;
    setEnemyCount(enemies.length);
  }, []);

  const startLevel = useCallback((lvl: number) => {
    setLevel(lvl);
    setGameState('playing');
    spawnEnemies(lvl);
    bulletsRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    keysRef.current = {};
    setCombo(0);
    
    if (lvl === 2) setUnlockedData(d => ({ ...d, temp: true }));
    if (lvl === 4) setUnlockedData(d => ({ ...d, co2: true }));
    if (lvl === 6) setUnlockedData(d => ({ ...d, strength: true }));
  }, [spawnEnemies]);

  const buyUpgrade = (upgrade: Upgrade) => {
    if (credits >= upgrade.cost) {
      setCredits(c => c - upgrade.cost);
      playerRef.current = upgrade.apply(playerRef.current);
      setDisplayHealth(playerRef.current.health);
      setDisplayShield(playerRef.current.shield);
    }
  };

  const shootBullet = useCallback(() => {
    const player = playerRef.current;
    const now = Date.now();
    if (now - lastShotRef.current > player.fireRate) {
      const cos = Math.cos(player.angle);
      const sin = Math.sin(player.angle);
      
      if (player.weaponType === 'spread') {
        for (let i = -2; i <= 2; i++) {
          const spreadAngle = player.angle + i * 0.15;
          bulletsRef.current.push({
            x: player.x + cos * 20,
            y: player.y + sin * 20,
            dx: Math.cos(spreadAngle) * BULLET_SPEED,
            dy: Math.sin(spreadAngle) * BULLET_SPEED,
            type: 'normal',
            size: 3
          });
        }
      } else if (player.weaponType === 'laser') {
        bulletsRef.current.push({
          x: player.x + cos * 20,
          y: player.y + sin * 20,
          dx: cos * BULLET_SPEED * 1.5,
          dy: sin * BULLET_SPEED * 1.5,
          type: 'laser',
          size: 6
        });
      } else if (player.weaponType === 'explosive') {
        bulletsRef.current.push({
          x: player.x + cos * 20,
          y: player.y + sin * 20,
          dx: cos * BULLET_SPEED * 0.8,
          dy: sin * BULLET_SPEED * 0.8,
          type: 'explosive',
          size: 5
        });
      } else {
        bulletsRef.current.push({
          x: player.x + cos * 20,
          y: player.y + sin * 20,
          dx: cos * BULLET_SPEED,
          dy: sin * BULLET_SPEED,
          type: 'normal',
          size: 4
        });
      }
      
      particlesRef.current.push({
        x: player.x + cos * 25,
        y: player.y + sin * 25,
        dx: cos * 2,
        dy: sin * 2,
        life: 10,
        maxLife: 10,
        color: '#22d3ee',
        size: 8,
        type: 'spark'
      });
      
      lastShotRef.current = now;
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const player = playerRef.current;
    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;
    const particles = particlesRef.current;
    const powerUps = powerUpsRef.current;
    const keys = keysRef.current;
    const mouse = mouseRef.current;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = CANVAS_WIDTH;
      offscreenCanvasRef.current.height = CANVAS_HEIGHT;
    }
    const offCtx = offscreenCanvasRef.current.getContext('2d', { alpha: false });
    if (!offCtx) return;

    if (player.weaponTimer > 0) {
      player.weaponTimer--;
      if (player.weaponTimer === 0) {
        player.weaponType = 'normal';
        setCurrentWeapon('PLASMA');
      }
    }

    let shakeX = 0, shakeY = 0;
    if (screenShakeRef.current > 0) {
      shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      screenShakeRef.current *= 0.85;
      if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
    }

    offCtx.save();
    offCtx.translate(shakeX, shakeY);
    offCtx.fillStyle = '#020617';
    offCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const time = Date.now() * 0.001;
    offCtx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
    offCtx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
      offCtx.beginPath(); offCtx.moveTo(i, 0); offCtx.lineTo(i, CANVAS_HEIGHT); offCtx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
      offCtx.beginPath(); offCtx.moveTo(0, i); offCtx.lineTo(CANVAS_WIDTH, i); offCtx.stroke();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx; p.y += p.dy; p.life--; p.dy += 0.04;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = p.life / p.maxLife;
      offCtx.globalAlpha = alpha;
      offCtx.fillStyle = p.color;
      offCtx.beginPath(); offCtx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); offCtx.fill();
    }
    offCtx.globalAlpha = 1;

    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const moveSpeed = player.speed;
    if (keys['w'] || keys['arrowup']) player.y = Math.max(30, player.y - moveSpeed);
    if (keys['s'] || keys['arrowdown']) player.y = Math.min(CANVAS_HEIGHT - 30, player.y + moveSpeed);
    if (keys['a'] || keys['arrowleft']) player.x = Math.max(30, player.x - moveSpeed);
    if (keys['d'] || keys['arrowright']) player.x = Math.min(CANVAS_WIDTH - 30, player.x + moveSpeed);

    if (mouse.shooting || keys[' ']) shootBullet();

    const now = Date.now();
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pu = powerUps[i];
      pu.y += 0.5; pu.life--;
      if (Math.hypot(pu.x - player.x, pu.y - player.y) < 30) {
        if (pu.type === 'health') { player.health = Math.min(player.maxHealth, player.health + 30); setDisplayHealth(player.health); }
        else if (pu.type === 'shield') { player.shield = Math.min(100, player.shield + 30); setDisplayShield(player.shield); }
        else { player.weaponType = pu.type as any; player.weaponTimer = 500; setCurrentWeapon(pu.type.toUpperCase()); }
        createIceShards(pu.x, pu.y);
        powerUps.splice(i, 1); continue;
      }
      if (pu.life <= 0 || pu.y > CANVAS_HEIGHT) powerUps.splice(i, 1);
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx; b.y += b.dy;
      if (b.y < -10 || b.y > CANVAS_HEIGHT + 10 || b.x < -10 || b.x > CANVAS_WIDTH + 10) bullets.splice(i, 1);
    }

    for (const e of enemies) {
      if (e.type === 'boss') {
        e.angle = (e.angle || 0) + 0.02;
        e.x = CANVAS_WIDTH / 2 + Math.sin(e.angle) * 150;
        if (now - (e.lastShot || 0) > 600) {
          const a = Math.atan2(player.y - e.y, player.x - e.x);
          for (let j = -1; j <= 1; j++) bullets.push({ x: e.x, y: e.y + 40, dx: Math.cos(a + j * 0.2) * 5, dy: Math.sin(a + j * 0.2) * 5, isEnemy: true, size: 5 });
          e.lastShot = now;
        }
      } else {
        const d = Math.hypot(player.x - e.x, player.y - e.y);
        if (d > 0) { e.x += (player.x - e.x) / d * e.speed * 0.4; e.y += (player.y - e.y) / d * e.speed * 0.4; }
      }
    }

    for (const pu of powerUps) {
      offCtx.fillStyle = pu.type === 'health' ? '#22c55e' : '#3b82f6';
      offCtx.beginPath(); offCtx.arc(pu.x, pu.y, 10, 0, Math.PI * 2); offCtx.fill();
    }

    for (const b of bullets) {
      offCtx.fillStyle = b.isEnemy ? '#ef4444' : '#22d3ee';
      offCtx.beginPath(); offCtx.arc(b.x, b.y, b.size || 4, 0, Math.PI * 2); offCtx.fill();
    }

    offCtx.save(); offCtx.translate(player.x, player.y); offCtx.rotate(player.angle);
    offCtx.fillStyle = '#06b6d4';
    offCtx.beginPath(); offCtx.moveTo(15, 0); offCtx.lineTo(-10, 10); offCtx.lineTo(-10, -10); offCtx.closePath(); offCtx.fill();
    if (player.shield > 0) { offCtx.strokeStyle = '#3b82f6'; offCtx.lineWidth = 2; offCtx.beginPath(); offCtx.arc(0, 0, 20, 0, Math.PI * 2); offCtx.stroke(); }
    offCtx.restore();

    for (const e of enemies) {
      offCtx.fillStyle = e.type === 'boss' ? '#dc2626' : '#3b82f6';
      offCtx.beginPath(); offCtx.arc(e.x, e.y, e.type === 'boss' ? 35 : 15, 0, Math.PI * 2); offCtx.fill();
    }

    offCtx.restore();
    ctx.drawImage(offscreenCanvasRef.current, 0, 0);

    let killThisFrame = false;
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (!b.isEnemy) {
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
          const e = enemies[ei];
          if (Math.hypot(b.x - e.x, b.y - e.y) < (e.type === 'boss' ? 40 : 20)) {
            e.health -= player.damage;
            bullets.splice(bi, 1);
            if (e.health <= 0) {
              killThisFrame = true;
              setScore(s => s + 50); setCredits(c => c + 20);
              createExplosion(e.x, e.y, '#ef4444');
              enemies.splice(ei, 1);
              setEnemyCount(enemies.length);
            }
            break;
          }
        }
      } else {
        if (Math.hypot(b.x - player.x, b.y - player.y) < 20) {
          player.health -= 10; setDisplayHealth(player.health);
          screenShakeRef.current = 5;
          bullets.splice(bi, 1);
        }
      }
    }

    if (player.health <= 0) { setGameState('gameover'); return; }
    if (enemies.length === 0) {
      const isBossLevel = level % 3 === 0;
      if (isBossLevel && level >= 9) {
        setUnlockedData({ temp: true, co2: true, strength: true, full: true });
        setGameState('victory');
        onComplete?.();
      } else {
        setGameState('shop');
      }
      return;
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [level, onComplete, shootBullet, combo]);

  useEffect(() => {
    if (gameState !== 'playing') {
      keysRef.current = {};
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
      mouseRef.current.y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.shooting = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) mouseRef.current.shooting = false;
    };

    const handleBlur = () => {
      keysRef.current = {};
      mouseRef.current.shooting = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('blur', handleBlur);
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('blur', handleBlur);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, gameLoop]);

  const resetGame = () => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      health: 100,
      maxHealth: 100,
      speed: 5,
      damage: 25,
      fireRate: 180,
      angle: -Math.PI / 2,
      shield: 0,
      weaponType: 'normal',
      weaponTimer: 0
    };
    keysRef.current = {};
    particlesRef.current = [];
    powerUpsRef.current = [];
    setDisplayHealth(100);
    setDisplayShield(0);
    setLevel(1);
    setScore(0);
    setCredits(0);
    setCombo(0);
    setCurrentWeapon('PLASMA');
    setUnlockedData({ temp: false, co2: false, strength: false, full: false });
    setGameState('menu');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        keysRef.current = {};
        mouseRef.current.shooting = false;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full h-11 font-mono text-xs tracking-wider uppercase transition-all duration-300 ${
            unlockedData.full 
              ? 'border-green-500/50 bg-green-500/10 text-green-400 hover:bg-green-500/20' 
              : 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-400/50'
          }`}
          data-testid="button-start-drill-game"
        >
          <Crosshair className="w-4 h-4 mr-2" />
          {unlockedData.full ? 'DATA EXTRACTED' : 'Ice Drill Mission'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[780px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-cyan-500/20 text-white p-0 overflow-hidden shadow-2xl shadow-cyan-500/10">
        <DialogDescription className="sr-only">Ice Core Extraction shooter game</DialogDescription>
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
        
        <div className="relative p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-mono tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Crosshair className="w-5 h-5 text-cyan-400" />
                </div>
                Ice Core Extraction
              </DialogTitle>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                {glacier.name}
              </div>
            </div>
          </DialogHeader>

          {gameState === 'menu' && (
            <div className="text-center space-y-8 py-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
                <div className="relative p-6 rounded-full bg-gradient-to-b from-cyan-500/20 to-transparent border border-cyan-500/30">
                  <Crosshair className="w-16 h-16 text-cyan-400" />
                </div>
                <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                    ICE DRILL SHOOTER
                  </span>
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Fight through enemy drones to extract glacier data. Collect power-ups, defeat bosses, and unlock critical research data.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">Move</div>
                  <div className="text-sm text-white font-medium">WASD / Arrows</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                  <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1">Shoot</div>
                  <div className="text-sm text-white font-medium">Mouse Click</div>
                </div>
              </div>
              
              <Button 
                onClick={() => startLevel(1)} 
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-12 py-6 text-lg font-bold uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all duration-300"
                data-testid="button-start-mission"
              >
                <Target className="w-5 h-5 mr-2" />
                Start Mission
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">Level {level}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    <span className="text-slate-400">{enemyCount}</span> Hostiles
                  </div>
                  <div className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/50">
                    <span className="text-[10px] font-mono text-cyan-300">{currentWeapon}</span>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  {showCombo && combo > 1 && (
                    <span className="text-yellow-400 animate-pulse font-bold text-sm">x{combo} COMBO</span>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    <Target className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-mono text-green-400">{score}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs font-mono text-yellow-400">{credits}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 p-3 rounded-lg bg-slate-900/50 border border-slate-800/50">
                <div className="flex-1 flex items-center gap-3">
                  <div className="p-1.5 rounded bg-red-500/10 border border-red-500/20">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 rounded-full"
                        style={{ width: `${(displayHealth / playerRef.current.maxHealth) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-red-400 w-14 text-right">{displayHealth}/{playerRef.current.maxHealth}</span>
                </div>
                {displayShield > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/20">
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 rounded-full"
                        style={{ width: `${displayShield}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative rounded-xl overflow-hidden border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
                <canvas 
                  ref={canvasRef} 
                  width={CANVAS_WIDTH} 
                  height={CANVAS_HEIGHT}
                  className="bg-slate-950 mx-auto block cursor-none w-full"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-xl" />
              </div>
              
              <div className="flex justify-center gap-2">
                {unlockedData.temp && (
                  <span className="px-3 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[9px] rounded-full font-mono uppercase tracking-wider">Thermal</span>
                )}
                {unlockedData.co2 && (
                  <span className="px-3 py-1 bg-green-500/15 border border-green-500/30 text-green-400 text-[9px] rounded-full font-mono uppercase tracking-wider">CO2</span>
                )}
                {unlockedData.strength && (
                  <span className="px-3 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[9px] rounded-full font-mono uppercase tracking-wider">Density</span>
                )}
              </div>
            </div>
          )}

          {gameState === 'shop' && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-green-400 mb-2">LEVEL {level} COMPLETE!</h2>
                <p className="text-yellow-400 font-mono text-lg">CREDITS: {credits}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {upgrades.map(upgrade => (
                  <button
                    key={upgrade.id}
                    onClick={() => buyUpgrade(upgrade)}
                    disabled={credits < upgrade.cost}
                    data-testid={`button-upgrade-${upgrade.id}`}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      credits >= upgrade.cost 
                        ? 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60' 
                        : 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-400">{upgrade.icon}</span>
                      <span className="font-bold text-sm">{upgrade.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{upgrade.description}</p>
                    <p className="text-xs text-yellow-400 mt-2 font-mono">{upgrade.cost} credits</p>
                  </button>
                ))}
              </div>
              
              <Button 
                onClick={() => startLevel(level + 1)} 
                className="w-full bg-blue-600 hover:bg-blue-500 py-6 text-lg font-bold"
                data-testid="button-next-level"
              >
                NEXT LEVEL
              </Button>
            </div>
          )}

          {gameState === 'victory' && (
            <div className="text-center space-y-6 py-8">
              <Trophy className="w-20 h-20 text-yellow-400 mx-auto animate-bounce" />
              <h2 className="text-3xl font-bold text-green-400">MISSION COMPLETE!</h2>
              <p className="text-slate-400">All glacier data has been successfully extracted.</p>
              <div className="text-2xl font-mono text-blue-400">FINAL SCORE: {score}</div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-4 py-2 bg-blue-500/20 text-blue-400 text-sm rounded-lg font-mono">THERMAL DATA</span>
                <span className="px-4 py-2 bg-green-500/20 text-green-400 text-sm rounded-lg font-mono">CO2 DATA</span>
                <span className="px-4 py-2 bg-purple-500/20 text-purple-400 text-sm rounded-lg font-mono">DENSITY DATA</span>
                <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm rounded-lg font-mono">FULL UNLOCK</span>
              </div>
              <Button onClick={() => setIsOpen(false)} className="bg-green-600 hover:bg-green-500 px-8 py-4" data-testid="button-close-victory">
                CLOSE
              </Button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="text-center space-y-6 py-8">
              <div className="text-7xl">💥</div>
              <h2 className="text-3xl font-bold text-red-400">MISSION FAILED</h2>
              <p className="text-slate-400">Your drill was destroyed before extracting all data.</p>
              <div className="text-xl font-mono">SCORE: {score}</div>
              <div className="flex gap-4 justify-center">
                <Button onClick={resetGame} variant="outline" className="border-slate-600 px-6" data-testid="button-retry">
                  TRY AGAIN
                </Button>
                <Button onClick={() => setIsOpen(false)} className="bg-slate-700 px-6" data-testid="button-close-gameover">
                  CLOSE
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
