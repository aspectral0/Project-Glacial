import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Glacier } from "@shared/schema";
import { Thermometer, Zap, ChevronDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface DrillMinigameProps {
  glacier: Glacier;
  onComplete?: (revealed: { temp: boolean; co2: boolean; strength: boolean }) => void;
}

export function DrillMinigame({ glacier, onComplete }: DrillMinigameProps) {
  const [depth, setDepth] = useState(0);
  const [heat, setHeat] = useState(0);
  const [pressure, setPressure] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [isDrilling, setIsDrilling] = useState(false);
  const [isJammed, setIsJammed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [revealed, setRevealed] = useState({
    temp: false,
    co2: false,
    strength: false
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDrilling && !isJammed && !isFinished) {
      interval = setInterval(() => {
        setDepth(d => {
          const newDepth = Math.min(1000, d + 8); // Significantly faster (from 3)
          if (newDepth >= 250 && !revealed.temp) setRevealed(r => ({ ...r, temp: true }));
          if (newDepth >= 500 && !revealed.co2) setRevealed(r => ({ ...r, co2: true }));
          if (newDepth >= 750 && !revealed.strength) setRevealed(r => ({ ...r, strength: true }));
          if (newDepth >= 1000) {
            setIsFinished(true);
            setIsDrilling(false);
            onComplete?.({ temp: true, co2: true, strength: true });
          }
          return newDepth;
        });
        setHeat(h => {
          const depthMultiplier = 1 + (depth / 500); // Heat builds faster
          const newHeat = h + (2.5 * depthMultiplier);
          if (newHeat >= 100) {
            setIsJammed(true);
            setIsDrilling(false);
            setTimeout(() => setIsJammed(false), 2000); // Shorter penalty (from 3000)
            return 100;
          }
          return newHeat;
        });
        setPressure(p => Math.min(100, (depth / 1000) * 100 + Math.random() * 5));
        setEnergy(e => Math.max(0, e - 0.5));
      }, 50);
    } else {
      interval = setInterval(() => {
        setHeat(h => Math.max(0, h - 2)); // Faster cooling
        setPressure(p => Math.max(0, p - 5));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isDrilling, isJammed, isFinished, revealed, onComplete, depth]);

  return (
    <Dialog onOpenChange={(open) => {
      if (!open && !isFinished) {
        setDepth(0);
        setHeat(0);
        setEnergy(100);
        setIsDrilling(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`w-full border-blue-500/30 hover:bg-blue-500/10 ${isFinished ? 'border-green-500/50 bg-green-500/5' : ''}`}>
          {isFinished ? 'MISSION DATA SYNCED' : 'Launch Drill Mission'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-slate-950 border-blue-500/20 text-white p-0 overflow-hidden shadow-[0_0_50px_rgba(30,58,138,0.3)]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-mono tracking-tighter uppercase text-blue-400 flex items-center gap-3">
              <span className="w-2 h-8 bg-blue-500" />
              Core Analysis // {glacier.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Drill Visualizer */}
            <div className="relative h-[450px] bg-black rounded border border-white/10 flex flex-col items-center shadow-inner group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent" />
              
              <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-white/5 flex flex-col justify-between py-4 text-[8px] font-mono text-slate-600 px-1">
                {[0, 200, 400, 600, 800, 1000].map(m => <span key={m}>{m}m</span>)}
              </div>

              <div className="absolute inset-0 opacity-10 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className="h-px w-full bg-white/20" style={{ marginTop: `${i * 22.5}px` }} />
                ))}
              </div>
              
              {/* Drill Body */}
              <div 
                className="absolute top-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-75"
                style={{ height: `${(depth / 1000) * 100}%` }}
              />
              
              <div 
                className={`relative z-20 mt-2 transition-all duration-75 ease-out`}
                style={{ transform: `translateY(${(depth / 1000) * 400}px)` }}
              >
                <div className={`p-3 rounded bg-slate-900 border-2 shadow-lg transition-colors ${
                  isJammed ? 'border-red-500 shadow-red-900/40' : isDrilling ? 'border-blue-400 animate-pulse shadow-blue-500/40' : 'border-slate-700'
                }`}>
                  <Zap className={`w-10 h-10 ${isDrilling ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                {isDrilling && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-1 h-8 bg-gradient-to-t from-transparent via-blue-500/40 to-transparent animate-bounce" />
                  </div>
                )}
              </div>

              <div className="absolute bottom-6 left-12 right-6 space-y-3 font-mono">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-500 uppercase">Current Depth</span>
                  <span className="text-blue-400 font-bold">{depth.toFixed(0)} M</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
                    style={{ width: `${(depth / 1000) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Technical Readout */}
            <div className="flex flex-col h-full font-mono">
              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-2">
                      <Thermometer className="w-3 h-3" /> Drill Heat
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {heat.toFixed(0)}<span className="text-sm font-normal text-slate-600">%</span>
                    </div>
                    <Progress value={heat} className={`h-1 bg-slate-900 ${heat > 80 ? 'text-red-500' : 'text-blue-500'}`} />
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-2">
                      <ChevronDown className="w-3 h-3" /> Hydrostatic Pressure
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {pressure.toFixed(0)}<span className="text-sm font-normal text-slate-600">MPa</span>
                    </div>
                    <Progress value={pressure} className="h-1 bg-slate-900 text-cyan-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Energy Reserve
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold tabular-nums">
                      {energy.toFixed(0)}<span className="text-sm font-normal text-slate-600">%</span>
                    </div>
                    <span className="text-[8px] text-blue-500/50 mb-1">AUX POWER: ACTIVE</span>
                  </div>
                  <Progress value={energy} className="h-1 bg-slate-900" />
                </div>

                <div className="bg-black/40 p-5 rounded border border-white/5 space-y-4">
                  <div className="text-[10px] text-blue-500 uppercase tracking-widest flex items-center justify-between">
                    <span>Telemetry Log</span>
                    <span className="animate-pulse">● LIVE</span>
                  </div>
                  <div className="space-y-3">
                    <UnlockItem label="250m: Thermal Gradient" isUnlocked={revealed.temp} />
                    <UnlockItem label="500m: Gas Sequestration" isUnlocked={revealed.co2} />
                    <UnlockItem label="750m: Crystalline Density" isUnlocked={revealed.strength} />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <Button
                  className={`w-full py-10 text-2xl font-black tracking-tighter transition-all rounded shadow-2xl relative overflow-hidden group ${
                    isJammed ? 'bg-red-950 text-red-500 border border-red-500/50' : isFinished ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                  onMouseDown={() => !isJammed && !isFinished && setIsDrilling(true)}
                  onMouseUp={() => setIsDrilling(false)}
                  onMouseLeave={() => setIsDrilling(false)}
                  disabled={isFinished || energy <= 0}
                >
                  <div className="relative z-10 flex flex-col items-center">
                    <span>{isJammed ? 'SYSTEM OVERHEAT' : isFinished ? 'SYNC SUCCESSFUL' : 'ENGAGE DRILL'}</span>
                    {!isJammed && !isFinished && <span className="text-[8px] font-normal tracking-widest mt-1 opacity-60">HOLD TO INJECT ENERGY</span>}
                  </div>
                  {isDrilling && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                </Button>
                {isJammed && (
                  <div className="flex items-center gap-2 text-red-500 text-[10px] mt-2 justify-center animate-bounce font-bold">
                    <AlertTriangle className="w-3 h-3" /> COOLING SYSTEM ENGAGED - PLEASE WAIT
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UnlockItem({ label, isUnlocked }: { label: string, isUnlocked: boolean }) {
  return (
    <div className={`flex items-center justify-between p-2 rounded transition-all ${isUnlocked ? 'bg-blue-500/10' : 'opacity-40'}`}>
      <span className="text-[10px]">{label}</span>
      {isUnlocked ? (
        <span className="text-[8px] text-blue-400 font-bold px-1 border border-blue-400/30 rounded">DECRYPTED</span>
      ) : (
        <span className="text-[8px] text-slate-600 font-bold">LOCKED</span>
      )}
    </div>
  );
}
