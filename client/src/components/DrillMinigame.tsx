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
          const newDepth = Math.min(1000, d + 3); // Slightly slower for better control
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
          // Heat increases faster with depth
          const depthMultiplier = 1 + (depth / 1000);
          const newHeat = h + (1.8 * depthMultiplier);
          if (newHeat >= 100) {
            setIsJammed(true);
            setIsDrilling(false);
            // Longer jam penalty
            setTimeout(() => setIsJammed(false), 3000);
            return 100;
          }
          return newHeat;
        });
        setEnergy(e => Math.max(0, e - 0.2));
      }, 50);
    } else {
      interval = setInterval(() => {
        setHeat(h => Math.max(0, h - 1));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isDrilling, isJammed, isFinished, revealed, onComplete]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-blue-500/30 hover:bg-blue-500/10">
          Launch Drill Mission
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-950 border-blue-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-mono tracking-tighter uppercase text-blue-400">
            Ice Core Analysis // {glacier.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left: Drill Visualizer */}
          <div className="relative h-[400px] bg-slate-900 rounded-lg overflow-hidden border border-white/5 flex flex-col items-center">
            <div className="absolute top-0 w-full h-full opacity-10 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-px w-full bg-white mb-8" style={{ marginTop: `${i * 20}px` }} />
              ))}
            </div>
            
            <div 
              className="absolute top-0 w-4 bg-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-100"
              style={{ height: `${(depth / 1000) * 100}%` }}
            />
            
            <div 
              className={`relative z-10 mt-4 p-2 rounded-full border-2 transition-colors ${
                isJammed ? 'bg-red-500 border-red-400' : isDrilling ? 'bg-blue-600 border-blue-400' : 'bg-slate-700 border-slate-500'
              }`}
              style={{ transform: `translateY(${(depth / 1000) * 350}px)` }}
            >
              <Zap className={`w-8 h-8 ${isDrilling ? 'animate-pulse' : ''}`} />
            </div>

            <div className="absolute bottom-4 left-4 right-4 space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span>DEPTH</span>
                <span className="text-blue-400">{depth.toFixed(0)}m / 1000m</span>
              </div>
              <Progress value={(depth / 1000) * 100} className="h-1 bg-slate-800" />
            </div>
          </div>

          {/* Right: Controls & Stats */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400">
                  <Thermometer className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase">Drill Heat</span>
                </div>
                <span className={`text-xs font-mono ${heat > 80 ? 'text-red-500' : 'text-slate-400'}`}>
                  {heat.toFixed(0)}%
                </span>
              </div>
              <Progress value={heat} className={`h-2 bg-slate-800 ${heat > 80 ? 'bg-red-950' : ''}`} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase">Energy</span>
                </div>
                <span className="text-xs font-mono text-slate-400">{energy.toFixed(0)}%</span>
              </div>
              <Progress value={energy} className="h-2 bg-slate-800" />
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-white/5 space-y-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Data Unlock Log</div>
              <div className="flex items-center gap-2 text-xs">
                {revealed.temp ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                <span className={revealed.temp ? 'text-slate-300' : 'text-slate-600'}>250m: Paleoclimate Data</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {revealed.co2 ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                <span className={revealed.co2 ? 'text-slate-300' : 'text-slate-600'}>500m: Atmospheric Markers</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {revealed.strength ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <div className="w-3 h-3 rounded-full border border-slate-700" />}
                <span className={revealed.strength ? 'text-slate-300' : 'text-slate-600'}>750m: Structural Integrity</span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                className={`w-full py-8 text-xl font-bold font-mono tracking-tighter transition-all ${
                  isJammed ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500 active:scale-95'
                }`}
                onMouseDown={() => !isJammed && !isFinished && setIsDrilling(true)}
                onMouseUp={() => setIsDrilling(false)}
                onMouseLeave={() => setIsDrilling(false)}
                disabled={isFinished || energy <= 0}
              >
                {isJammed ? 'JAMMED' : isFinished ? 'ANALYSIS COMPLETE' : 'ENGAGE DRILL'}
              </Button>
              <p className="text-[10px] text-center mt-2 text-slate-500 font-mono">
                HOLD BUTTON TO DRILL // RELEASE TO COOL
              </p>
            </div>
          </div>
        </div>

        {isFinished && (
          <div className="mt-4 p-4 rounded bg-green-500/10 border border-green-500/20 flex items-center gap-3">
            <CheckCircle2 className="text-green-400 w-5 h-5" />
            <p className="text-sm text-green-200">
              Core extraction successful. Stability data calibrated. Ready for simulation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
