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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;
    const particles = particlesRef.current;
    const powerUps = powerUpsRef.current;
    const keys = keysRef.current;
    const mouse = mouseRef.current;

    // Decrease weapon timer
    if (player.weaponTimer > 0) {
      player.weaponTimer--;
      if (player.weaponTimer === 0) {
        player.weaponType = 'normal';
        setCurrentWeapon('PLASMA');
      }
    }

    // Screen shake
    let shakeX = 0, shakeY = 0;
    if (screenShakeRef.current > 0) {
      shakeX = (Math.random() - 0.5) * screenShakeRef.current;
      shakeY = (Math.random() - 0.5) * screenShakeRef.current;
      screenShakeRef.current *= 0.9;
      if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // Background with gradient
    const bgGrad = ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Animated grid
    const time = Date.now() * 0.001;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      const offset = Math.sin(time + i * 0.02) * 2;
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + offset, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Floating ice particles in background
    ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
    for (let i = 0; i < 20; i++) {
      const px = (Math.sin(time * 0.5 + i * 50) * 0.5 + 0.5) * CANVAS_WIDTH;
      const py = ((time * 10 + i * 30) % CANVAS_HEIGHT);
      ctx.beginPath();
      ctx.arc(px, py, 1 + Math.sin(i) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Calculate angle to mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Player movement with smoothing
    const moveSpeed = player.speed;
    if (keys['w'] || keys['arrowup']) player.y = Math.max(30, player.y - moveSpeed);
    if (keys['s'] || keys['arrowdown']) player.y = Math.min(CANVAS_HEIGHT - 30, player.y + moveSpeed);
    if (keys['a'] || keys['arrowleft']) player.x = Math.max(30, player.x - moveSpeed);
    if (keys['d'] || keys['arrowright']) player.x = Math.min(CANVAS_WIDTH - 30, player.x + moveSpeed);

    // Shooting
    if (mouse.shooting || keys[' ']) {
      shootBullet();
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life--;
      p.dy += 0.05; // Gravity
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pu = powerUps[i];
      pu.y += 0.5;
      pu.life--;
      
      // Check collision with player
      const dx = pu.x - player.x;
      const dy = pu.y - player.y;
      if (dx * dx + dy * dy < 900) {
        switch (pu.type) {
          case 'health':
            player.health = Math.min(player.maxHealth, player.health + 30);
            setDisplayHealth(player.health);
            break;
          case 'shield':
            player.shield = Math.min(100, player.shield + 30);
            setDisplayShield(player.shield);
            break;
          case 'spread':
            player.weaponType = 'spread';
            player.weaponTimer = 600;
            setCurrentWeapon('SPREAD');
            break;
          case 'laser':
            player.weaponType = 'laser';
            player.weaponTimer = 500;
            setCurrentWeapon('LASER');
            break;
          case 'explosive':
            player.weaponType = 'explosive';
            player.weaponTimer = 400;
            setCurrentWeapon('EXPLOSIVE');
            break;
          case 'speed':
            player.speed += 1;
            setTimeout(() => { player.speed -= 1; }, 10000);
            break;
        }
        createIceShards(pu.x, pu.y);
        powerUps.splice(i, 1);
        continue;
      }
      
      if (pu.life <= 0 || pu.y > CANVAS_HEIGHT) powerUps.splice(i, 1);
    }

    // Update bullets
    const now = Date.now();
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      
      // Trail particles for special bullets
      if (b.type === 'laser' && Math.random() > 0.5) {
        particles.push({
          x: b.x, y: b.y,
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
          life: 15,
          maxLife: 15,
          color: '#a855f7',
          size: 2,
          type: 'trail'
        });
      }
      
      if (b.y < -10 || b.y > CANVAS_HEIGHT + 10 || b.x < -10 || b.x > CANVAS_WIDTH + 10) {
        bullets.splice(i, 1);
      }
    }

    // Update enemies
    for (const enemy of enemies) {
      if (enemy.type === 'boss') {
        enemy.angle = (enemy.angle || 0) + 0.02;
        enemy.x = CANVAS_WIDTH / 2 + Math.sin(enemy.angle) * 150;
        enemy.y = 80 + Math.sin(enemy.angle * 2) * 20;
        
        if (now - (enemy.lastShot || 0) > 600) {
          const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          for (let i = -2; i <= 2; i++) {
            bullets.push({
              x: enemy.x,
              y: enemy.y + 40,
              dx: Math.cos(angleToPlayer + i * 0.2) * 5,
              dy: Math.sin(angleToPlayer + i * 0.2) * 5,
              isEnemy: true,
              size: 5
            });
          }
          enemy.lastShot = now;
        }
      } else if (enemy.type === 'sniper') {
        if (now - (enemy.lastShot || 0) > 2000) {
          const angleToPlayer = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          bullets.push({
            x: enemy.x,
            y: enemy.y,
            dx: Math.cos(angleToPlayer) * 10,
            dy: Math.sin(angleToPlayer) * 10,
            isEnemy: true,
            size: 4
          });
          enemy.lastShot = now;
        }
      } else {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          enemy.x += (dx / dist) * enemy.speed * (enemy.type === 'swarm' ? 0.8 : 0.4);
          enemy.y += (dy / dist) * enemy.speed * (enemy.type === 'swarm' ? 0.6 : 0.25);
        }
      }
    }

    // Collision: player bullets vs enemies
    let killThisFrame = false;
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (b.isEnemy) continue;
      
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const hitRadius = e.type === 'boss' ? 45 : e.type === 'tank' ? 22 : 16;
        
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          let damage = player.damage;
          if (b.type === 'laser') damage *= 1.5;
          if (b.type === 'explosive') {
            damage *= 0.8;
            createExplosion(b.x, b.y, '#f97316', 20);
            screenShakeRef.current = 8;
            // Splash damage
            for (const other of enemies) {
              if (other === e) continue;
              const odx = b.x - other.x;
              const ody = b.y - other.y;
              if (odx * odx + ody * ody < 4000) {
                other.health -= damage * 0.5;
              }
            }
          }
          
          e.health -= damage;
          createExplosion(b.x, b.y, e.type === 'boss' ? '#dc2626' : '#f59e0b', 8);
          bullets.splice(bi, 1);
          
          if (e.health <= 0) {
            killThisFrame = true;
            const points = e.type === 'boss' ? 150 : e.type === 'tank' ? 25 : e.type === 'sniper' ? 30 : 12;
            const comboBonus = Math.floor(combo * 0.5);
            setScore(s => s + points + comboBonus);
            setCredits(c => c + points);
            setCombo(c => c + 1);
            setShowCombo(true);
            setTimeout(() => setShowCombo(false), 500);
            
            createExplosion(e.x, e.y, e.type === 'boss' ? '#dc2626' : '#a855f7', 20);
            createIceShards(e.x, e.y);
            screenShakeRef.current = e.type === 'boss' ? 15 : 5;
            spawnPowerUp(e.x, e.y);
            
            enemies.splice(ei, 1);
            setEnemyCount(enemies.length);
          }
          break;
        }
      }
    }

    // Reset combo if no kills this frame (with decay)
    if (!killThisFrame && combo > 0) {
      // Decay combo slowly
    }

    // Collision: enemy bullets vs player
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (!b.isEnemy) continue;
      
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      if (dx * dx + dy * dy < 500) {
        let dmg = 12;
        if (player.shield > 0) {
          const absorbed = Math.min(player.shield, dmg);
          player.shield -= absorbed;
          dmg -= absorbed;
          setDisplayShield(player.shield);
        }
        player.health -= dmg;
        setDisplayHealth(Math.max(0, player.health));
        screenShakeRef.current = 6;
        createExplosion(b.x, b.y, '#ef4444', 6);
        bullets.splice(bi, 1);
        setCombo(0);
      }
    }

    // Collision: enemies vs player
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const hitDist = e.type === 'boss' ? 55 : 35;
      if (dx * dx + dy * dy < hitDist * hitDist) {
        let dmg = 0.3;
        if (player.shield > 0) {
          const absorbed = Math.min(player.shield, dmg);
          player.shield -= absorbed;
          dmg -= absorbed;
          setDisplayShield(Math.max(0, player.shield));
        }
        player.health -= dmg;
        setDisplayHealth(Math.max(0, Math.floor(player.health)));
      }
    }

    // Draw aiming line
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
      player.x + Math.cos(player.angle) * 120,
      player.y + Math.sin(player.angle) * 120
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw particles
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw power-ups
    for (const pu of powerUps) {
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      ctx.save();
      ctx.translate(pu.x, pu.y);
      ctx.scale(pulse, pulse);
      
      const colors: { [key: string]: string } = {
        health: '#22c55e',
        shield: '#3b82f6',
        spread: '#f59e0b',
        laser: '#a855f7',
        explosive: '#ef4444',
        speed: '#06b6d4'
      };
      
      ctx.fillStyle = colors[pu.type] || '#fff';
      ctx.shadowColor = colors[pu.type] || '#fff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pu.type[0].toUpperCase(), 0, 0);
      ctx.restore();
    }

    // Draw player with glow
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle + Math.PI / 2);
    
    // Shield effect
    if (player.shield > 0) {
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Ship glow
    ctx.shadowColor = player.weaponType === 'laser' ? '#a855f7' : player.weaponType === 'spread' ? '#f59e0b' : '#3b82f6';
    ctx.shadowBlur = 20;
    
    // Ship body
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(-14, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(14, 14);
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.lineTo(0, 18 + Math.sin(Date.now() * 0.02) * 4);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();

    // Draw crosshair
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouse.x - 18, mouse.y);
    ctx.lineTo(mouse.x - 6, mouse.y);
    ctx.moveTo(mouse.x + 6, mouse.y);
    ctx.lineTo(mouse.x + 18, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 18);
    ctx.lineTo(mouse.x, mouse.y - 6);
    ctx.moveTo(mouse.x, mouse.y + 6);
    ctx.lineTo(mouse.x, mouse.y + 18);
    ctx.stroke();
    
    // Center dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw bullets
    for (const b of bullets) {
      if (b.type === 'laser') {
        ctx.fillStyle = '#a855f7';
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;
      } else if (b.type === 'explosive') {
        ctx.fillStyle = '#f97316';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = b.isEnemy ? '#ef4444' : '#22d3ee';
        ctx.shadowColor = b.isEnemy ? '#ef4444' : '#22d3ee';
        ctx.shadowBlur = 6;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size || 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw enemies
    for (const e of enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);
      
      if (e.type === 'boss') {
        // Boss with rotating core
        ctx.rotate(Date.now() * 0.002);
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#dc2626';
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.rotate(i * Math.PI / 3);
          ctx.beginPath();
          ctx.arc(25, 0, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.rotate(-Date.now() * 0.002);
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(-45, -55, 90, 10);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-45, -55, 90 * (e.health / e.maxHealth), 10);
        ctx.strokeStyle = '#374151';
        ctx.strokeRect(-45, -55, 90, 10);
      } else if (e.type === 'tank') {
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'sniper') {
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(-12, 12);
        ctx.lineTo(12, 12);
        ctx.closePath();
        ctx.fill();
        // Targeting laser
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(player.x - e.x, player.y - e.y);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (e.type === 'swarm') {
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.005;
          const r = 10;
          if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }

    ctx.restore(); // End screen shake

    // Check win/lose
    if (player.health <= 0) {
      setGameState('gameover');
      return;
    }

    if (enemies.length === 0) {
      const currentLevel = level;
      const isBossLevel = currentLevel % 3 === 0;
      if (isBossLevel && currentLevel >= 9) {
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
          className={`w-full border-blue-500/30 hover:bg-blue-500/10 ${unlockedData.full ? 'border-green-500/50 bg-green-500/5' : ''}`}
          data-testid="button-start-drill-game"
        >
          <Crosshair className="w-4 h-4 mr-2" />
          {unlockedData.full ? 'GLACIER UNLOCKED' : 'Launch Ice Drill Mission'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] bg-slate-950 border-blue-500/20 text-white p-0 overflow-hidden">
        <DialogDescription className="sr-only">Ice Core Extraction shooter game</DialogDescription>
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-mono tracking-tight uppercase text-blue-400 flex items-center gap-2">
              <Crosshair className="w-5 h-5" />
              Ice Core Extraction // {glacier.name}
            </DialogTitle>
          </DialogHeader>

          {gameState === 'menu' && (
            <div className="text-center space-y-6 py-8">
              <div className="relative inline-block">
                <Crosshair className="w-20 h-20 text-blue-400 animate-pulse" />
                <Sparkles className="w-6 h-6 text-cyan-400 absolute -top-2 -right-2 animate-bounce" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ICE DRILL SHOOTER
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Fight through enemy drones to extract glacier data. Collect power-ups, defeat bosses, and unlock critical research data.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 max-w-xs mx-auto">
                <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                  <div className="font-bold text-blue-400 mb-1">MOVE</div>
                  <div>WASD / Arrows</div>
                </div>
                <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                  <div className="font-bold text-blue-400 mb-1">SHOOT</div>
                  <div>Mouse Click</div>
                </div>
              </div>
              <Button onClick={() => startLevel(1)} className="bg-blue-600 hover:bg-blue-500 px-10 py-6 text-lg font-bold">
                START MISSION
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex gap-4 items-center">
                  <span className="text-blue-400 font-bold">LEVEL {level}</span>
                  <span className="text-slate-400">ENEMIES: {enemyCount}</span>
                  <span className="px-2 py-0.5 bg-slate-800 rounded text-cyan-400">{currentWeapon}</span>
                </div>
                <div className="flex gap-4 items-center">
                  {showCombo && combo > 1 && (
                    <span className="text-yellow-400 animate-pulse font-bold">x{combo} COMBO!</span>
                  )}
                  <span className="text-green-400">SCORE: {score}</span>
                  <span className="text-yellow-400">CREDITS: {credits}</span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                      style={{ width: `${(displayHealth / playerRef.current.maxHealth) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-red-400 w-16 text-right">{displayHealth}/{playerRef.current.maxHealth}</span>
                </div>
                {displayShield > 0 && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <div className="w-20 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                        style={{ width: `${displayShield}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="border border-blue-500/20 rounded-lg bg-slate-950 mx-auto block cursor-none w-full"
                style={{ imageRendering: 'pixelated' }}
              />
              
              <div className="flex justify-center gap-2">
                {unlockedData.temp && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded font-mono">THERMAL</span>}
                {unlockedData.co2 && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] rounded font-mono">CO2</span>}
                {unlockedData.strength && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] rounded font-mono">DENSITY</span>}
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
