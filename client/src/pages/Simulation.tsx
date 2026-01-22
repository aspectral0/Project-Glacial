import { useParams, useLocation } from "wouter";
import { useGlacier } from "@/hooks/use-glaciers";
import { useSimulation } from "@/hooks/use-simulation";
import { GlacierCanvas } from "@/components/GlacierCanvas";
import { EnvironmentalControls } from "@/components/EnvironmentalControls";
import { Button } from "@/components/ui/button";
import { Play, Pause, AlertTriangle, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Simulation() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const { data: glacier, isLoading } = useGlacier(Number(id));
  
  const { 
    state, 
    startSimulation, 
    pauseSimulation, 
    setEnvironmentFactor 
  } = useSimulation(glacier);

  // Navigate to results on game over
  useEffect(() => {
    if (state?.isGameOver) {
      setTimeout(() => {
        const queryParams = new URLSearchParams({
          outcome: state.gameResult || 'lost',
          year: String(state.year),
          glacier: glacier?.name || 'Unknown',
          volume: String(state.glacierStats.volume),
          stability: String(state.glacierStats.stability),
          thickness: String(state.glacierStats.thickness)
        });
        setLocation(`/results?${queryParams.toString()}`);
      }, 2000);
    }
  }, [state?.isGameOver, state?.gameResult, state?.year, state?.glacierStats, glacier?.name, setLocation]);

  if (isLoading || !state) return <div className="min-h-screen bg-background flex items-center justify-center text-primary animate-pulse font-mono tracking-widest">INITIALIZING ENVIRONMENT...</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden text-slate-200">
      <header className="h-16 border-b border-white/10 bg-card/50 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-white tracking-tight">{glacier?.name}</h1>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              SIMULATION ACTIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Current Year</div>
            <div className="text-2xl font-mono font-bold text-primary leading-none">{state.year}</div>
          </div>

          <div className="w-40">
            <div className="flex justify-between text-[10px] mb-1 uppercase tracking-wider">
              <span>System Health</span>
              <span className={state.health < 30 ? 'text-red-500 font-bold' : ''}>{state.health.toFixed(0)}%</span>
            </div>
            <Progress value={state.health} className={`h-1.5 ${state.health < 30 ? 'bg-red-900' : ''}`} />
          </div>
        </div>

        <div className="flex gap-2">
          {!state.isRunning ? (
            <Button onClick={startSimulation} size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2 h-9 px-4">
              <Play className="w-4 h-4" /> Resume
            </Button>
          ) : (
            <Button onClick={pauseSimulation} size="sm" variant="secondary" className="gap-2 h-9 px-4">
              <Pause className="w-4 h-4" /> Pause
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        <div className="col-span-3 flex flex-col h-full overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <EnvironmentalControls 
              factors={state.environmentalFactors} 
              onChange={setEnvironmentFactor}
              disabled={state.isGameOver}
            />
            
            <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-white/5">
              <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-widest">Simulation Log</h4>
              <div className="space-y-2 font-mono text-[11px]">
                {state.health < 30 && (
                  <div className="text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> CRITICAL INSTABILITY
                  </div>
                )}
                {state.glacierStats.thickness < 500 && (
                  <div className="text-orange-400">WARNING: Ice mass critically low</div>
                )}
                {state.environmentalFactors.globalTemp > 2 && (
                  <div className="text-yellow-400">ALERT: High melt rate detected</div>
                )}
                <div className="text-slate-500">System running normal...</div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="col-span-6 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-1 relative overflow-hidden bg-slate-950/20 rounded-2xl border border-white/5">
            <AnimatePresence>
              {state.isGameOver && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl"
                >
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2">Simulation Ended</h2>
                    <p className="text-muted-foreground">Compiling results...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <GlacierCanvas stats={state.glacierStats} />
          </div>

          <div className="h-40 bg-card/50 rounded-xl border border-white/10 p-4 shrink-0">
            <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-2 tracking-widest">Mass vs Temperature History</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={state.history}>
                <defs>
                  <linearGradient id="colorThickness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" hide />
                <YAxis yAxisId="left" hide domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" hide domain={[-5, 5]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="thickness" 
                  stroke="#0EA5E9" 
                  fillOpacity={1} 
                  fill="url(#colorThickness)" 
                  name="Thickness (m)"
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#ef4444" 
                  fill="none" 
                  strokeWidth={2}
                  name="Temp (°C)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-3 flex flex-col h-full overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <StatCard 
                label="Ice Thickness" 
                value={state.glacierStats.thickness.toFixed(1)} 
                unit="m" 
                trend={state.history.length > 1 ? state.glacierStats.thickness - state.history[state.history.length-2].thickness : 0}
              />
              <StatCard 
                label="Surface Area" 
                value={state.glacierStats.area.toFixed(1)} 
                unit="km²" 
              />
              <StatCard 
                label="Volume" 
                value={(state.glacierStats.volume / 1000).toFixed(2)} 
                unit="km³" 
              />
              <StatCard 
                label="Structural Stability" 
                value={state.glacierStats.stability.toFixed(1)} 
                unit="%" 
                color={state.glacierStats.stability < 40 ? "text-red-400" : "text-green-400"}
              />
              
              <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <h3 className="font-bold text-white text-sm mb-2">Climate Insight</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Glacial ice is a physical witness to history. Rapid changes in stability indicate environmental tipping points.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, trend, color = "text-white" }: any) {
  return (
    <div className="p-4 rounded-xl bg-card/80 border border-white/5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-bold">{label}</div>
      <div className="flex items-end justify-between">
        <div className={`text-xl font-mono font-bold ${color}`}>
          {value} <span className="text-[10px] text-muted-foreground font-sans font-normal ml-0.5">{unit}</span>
        </div>
        {trend !== undefined && (
          <div className={`text-[10px] font-mono ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}/yr
          </div>
        )}
      </div>
    </div>
  );
}
