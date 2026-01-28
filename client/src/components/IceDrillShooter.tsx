import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Glacier } from "@shared/schema";
import { Crosshair, Shield, Zap, Heart, Target, Trophy, ArrowUp } from "lucide-react";

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
}

interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  isEnemy?: boolean;
}

interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'drone' | 'tank' | 'boss';
  lastShot?: number;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  cost: number;
  apply: (player: Player) => Player;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export function IceDrillShooter({ glacier, onComplete }: IceDrillShooterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'shop' | 'victory' | 'gameover'>('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [credits, setCredits] = useState(0);
  const [unlockedData, setUnlockedData] = useState({ temp: false, co2: false, strength: false, full: false });
  const [isOpen, setIsOpen] = useState(false);
  
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    health: 100,
    maxHealth: 100,
    speed: 5,
    damage: 25,
    fireRate: 200
  });
  
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const [displayHealth, setDisplayHealth] = useState(100);
  const [enemyCount, setEnemyCount] = useState(0);

  const upgrades: Upgrade[] = [
    {
      id: 'health',
      name: 'Reinforce Hull',
      description: '+25 Max Health',
      icon: <Heart className="w-4 h-4" />,
      cost: 50,
      apply: (p) => ({ ...p, maxHealth: p.maxHealth + 25, health: p.health + 25 })
    },
    {
      id: 'damage',
      name: 'Plasma Core',
      description: '+10 Damage',
      icon: <Zap className="w-4 h-4" />,
      cost: 75,
      apply: (p) => ({ ...p, damage: p.damage + 10 })
    },
    {
      id: 'speed',
      name: 'Thruster Boost',
      description: '+2 Speed',
      icon: <ArrowUp className="w-4 h-4" />,
      cost: 60,
      apply: (p) => ({ ...p, speed: p.speed + 2 })
    },
    {
      id: 'firerate',
      name: 'Rapid Fire',
      description: 'Faster shooting',
      icon: <Target className="w-4 h-4" />,
      cost: 100,
      apply: (p) => ({ ...p, fireRate: Math.max(50, p.fireRate - 30) })
    }
  ];

  const spawnEnemies = useCallback((lvl: number) => {
    const enemies: Enemy[] = [];
    const isBossLevel = lvl % 3 === 0;
    
    if (isBossLevel) {
      enemies.push({
        x: CANVAS_WIDTH / 2,
        y: 60,
        health: 200 + lvl * 50,
        maxHealth: 200 + lvl * 50,
        speed: 1,
        type: 'boss',
        lastShot: 0
      });
    } else {
      const count = 3 + Math.floor(lvl / 2);
      for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.7 ? 'tank' : 'drone';
        enemies.push({
          x: 50 + Math.random() * (CANVAS_WIDTH - 100),
          y: 30 + Math.random() * 100,
          health: type === 'tank' ? 60 : 30,
          maxHealth: type === 'tank' ? 60 : 30,
          speed: type === 'tank' ? 1 : 2,
          type
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
    
    if (lvl === 2) setUnlockedData(d => ({ ...d, temp: true }));
    if (lvl === 4) setUnlockedData(d => ({ ...d, co2: true }));
    if (lvl === 6) setUnlockedData(d => ({ ...d, strength: true }));
  }, [spawnEnemies]);

  const buyUpgrade = (upgrade: Upgrade) => {
    if (credits >= upgrade.cost) {
      setCredits(c => c - upgrade.cost);
      playerRef.current = upgrade.apply(playerRef.current);
      setDisplayHealth(playerRef.current.health);
    }
  };

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const player = playerRef.current;
    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;
    const keys = keysRef.current;

    // Clear
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    for (let i = 0; i < CANVAS_WIDTH; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Player movement
    if (keys.has('ArrowLeft') || keys.has('a')) player.x = Math.max(20, player.x - player.speed);
    if (keys.has('ArrowRight') || keys.has('d')) player.x = Math.min(CANVAS_WIDTH - 20, player.x + player.speed);
    if (keys.has('ArrowUp') || keys.has('w')) player.y = Math.max(20, player.y - player.speed);
    if (keys.has('ArrowDown') || keys.has('s')) player.y = Math.min(CANVAS_HEIGHT - 20, player.y + player.speed);

    // Shooting
    const now = Date.now();
    if (keys.has(' ') && now - lastShotRef.current > player.fireRate) {
      bullets.push({ x: player.x, y: player.y - 15, dx: 0, dy: -10 });
      lastShotRef.current = now;
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.dx;
      b.y += b.dy;
      if (b.y < 0 || b.y > CANVAS_HEIGHT || b.x < 0 || b.x > CANVAS_WIDTH) {
        bullets.splice(i, 1);
      }
    }

    // Update enemies
    for (const enemy of enemies) {
      if (enemy.type === 'boss') {
        enemy.x += Math.sin(now / 500) * 2;
        if (now - (enemy.lastShot || 0) > 800) {
          bullets.push({ x: enemy.x, y: enemy.y + 30, dx: 0, dy: 5, isEnemy: true });
          bullets.push({ x: enemy.x - 20, y: enemy.y + 30, dx: -1, dy: 5, isEnemy: true });
          bullets.push({ x: enemy.x + 20, y: enemy.y + 30, dx: 1, dy: 5, isEnemy: true });
          enemy.lastShot = now;
        }
      } else {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          enemy.x += (dx / dist) * enemy.speed * 0.5;
          enemy.y += (dy / dist) * enemy.speed * 0.3;
        }
      }
    }

    // Collision detection: bullets vs enemies
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (b.isEnemy) continue;
      
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const hitRadius = e.type === 'boss' ? 40 : 20;
        
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          e.health -= player.damage;
          bullets.splice(bi, 1);
          
          if (e.health <= 0) {
            const points = e.type === 'boss' ? 100 : e.type === 'tank' ? 20 : 10;
            setScore(s => s + points);
            setCredits(c => c + points);
            enemies.splice(ei, 1);
            setEnemyCount(enemies.length);
          }
          break;
        }
      }
    }

    // Collision: enemy bullets vs player
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (!b.isEnemy) continue;
      
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      if (dx * dx + dy * dy < 400) {
        player.health -= 10;
        setDisplayHealth(player.health);
        bullets.splice(bi, 1);
      }
    }

    // Collision: enemies vs player
    for (const e of enemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const hitDist = e.type === 'boss' ? 50 : 30;
      if (dx * dx + dy * dy < hitDist * hitDist) {
        player.health -= 1;
        setDisplayHealth(player.health);
      }
    }

    // Draw player
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 15);
    ctx.lineTo(player.x - 12, player.y + 10);
    ctx.lineTo(player.x + 12, player.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw bullets
    for (const b of bullets) {
      ctx.fillStyle = b.isEnemy ? '#ef4444' : '#22d3ee';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.isEnemy ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw enemies
    for (const e of enemies) {
      if (e.type === 'boss') {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7f1d1d';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Boss health bar
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(e.x - 40, e.y - 50, 80, 8);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(e.x - 40, e.y - 50, 80 * (e.health / e.maxHealth), 8);
      } else {
        ctx.fillStyle = e.type === 'tank' ? '#f59e0b' : '#a855f7';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.type === 'tank' ? 18 : 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Check win/lose
    if (player.health <= 0) {
      setGameState('gameover');
      return;
    }

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
  }, [level, onComplete]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  const resetGame = () => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 50,
      health: 100,
      maxHealth: 100,
      speed: 5,
      damage: 25,
      fireRate: 200
    };
    setDisplayHealth(100);
    setLevel(1);
    setScore(0);
    setCredits(0);
    setUnlockedData({ temp: false, co2: false, strength: false, full: false });
    setGameState('menu');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        keysRef.current.clear();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
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
      <DialogContent className="sm:max-w-[700px] bg-slate-950 border-blue-500/20 text-white p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-mono tracking-tight uppercase text-blue-400 flex items-center gap-2">
              <Crosshair className="w-5 h-5" />
              Ice Core Extraction // {glacier.name}
            </DialogTitle>
          </DialogHeader>

          {gameState === 'menu' && (
            <div className="text-center space-y-6 py-8">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold">ICE DRILL SHOOTER</h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto">
                Fight through enemy drones to extract glacier data. Defeat bosses every 3 levels to unlock critical information.
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>WASD or Arrow Keys to move</p>
                <p>SPACE to shoot</p>
              </div>
              <Button onClick={() => startLevel(1)} className="bg-blue-600 hover:bg-blue-500 px-8 py-6 text-lg">
                START MISSION
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex gap-4">
                  <span className="text-blue-400">LEVEL {level}</span>
                  <span className="text-slate-400">ENEMIES: {enemyCount}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-green-400">SCORE: {score}</span>
                  <span className="text-yellow-400">CREDITS: {credits}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${(displayHealth / playerRef.current.maxHealth) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-red-400">{displayHealth}/{playerRef.current.maxHealth}</span>
              </div>

              <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="border border-blue-500/20 rounded bg-slate-950 mx-auto block"
              />
              
              <div className="flex justify-center gap-2">
                {unlockedData.temp && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded">THERMAL DATA</span>}
                {unlockedData.co2 && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] rounded">CO2 DATA</span>}
                {unlockedData.strength && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] rounded">DENSITY DATA</span>}
              </div>
            </div>
          )}

          {gameState === 'shop' && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-green-400 mb-2">LEVEL {level} COMPLETE!</h2>
                <p className="text-yellow-400 font-mono">CREDITS: {credits}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {upgrades.map(upgrade => (
                  <button
                    key={upgrade.id}
                    onClick={() => buyUpgrade(upgrade)}
                    disabled={credits < upgrade.cost}
                    className={`p-4 rounded border text-left transition-all ${
                      credits >= upgrade.cost 
                        ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' 
                        : 'border-slate-700 bg-slate-900 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {upgrade.icon}
                      <span className="font-bold text-sm">{upgrade.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{upgrade.description}</p>
                    <p className="text-xs text-yellow-400 mt-2">{upgrade.cost} credits</p>
                  </button>
                ))}
              </div>
              
              <Button onClick={() => startLevel(level + 1)} className="w-full bg-blue-600 hover:bg-blue-500">
                NEXT LEVEL
              </Button>
            </div>
          )}

          {gameState === 'victory' && (
            <div className="text-center space-y-6 py-8">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
              <h2 className="text-2xl font-bold text-green-400">MISSION COMPLETE!</h2>
              <p className="text-slate-400">All glacier data has been extracted.</p>
              <div className="text-xl font-mono text-blue-400">FINAL SCORE: {score}</div>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">THERMAL DATA</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded">CO2 DATA</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">DENSITY DATA</span>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">FULL GLACIER UNLOCKED</span>
              </div>
              <Button onClick={() => setIsOpen(false)} className="bg-green-600 hover:bg-green-500">
                CLOSE
              </Button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="text-center space-y-6 py-8">
              <div className="text-6xl">💥</div>
              <h2 className="text-2xl font-bold text-red-400">MISSION FAILED</h2>
              <p className="text-slate-400">Your drill was destroyed.</p>
              <div className="text-lg font-mono">SCORE: {score}</div>
              <div className="flex gap-4 justify-center">
                <Button onClick={resetGame} variant="outline" className="border-slate-600">
                  TRY AGAIN
                </Button>
                <Button onClick={() => setIsOpen(false)} className="bg-slate-700">
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
