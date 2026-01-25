import { useParams, useLocation } from "wouter";
import { useGlacier } from "@/hooks/use-glaciers";
import { useSimulation } from "@/hooks/use-simulation";
import { GlacierCanvas } from "@/components/GlacierCanvas";
import { EnvironmentalControls } from "@/components/EnvironmentalControls";
import { AIForecast } from "@/components/AIForecast";
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

  if (isLoading || !state) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-blue-400 font-mono animate-pulse tracking-widest uppercase">
          Initializing Glacial Environment...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col text-slate-200 overflow-hidden">
      <header className="h-16 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')} className="hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-blue-400" />
          </Button>
          <div>
            <h1 className="font-bold text-white text-sm uppercase tracking-tight">{glacier?.name}</h1>
            <div className="flex items-center gap-2 text-[8px] text-slate-500 font-mono">
              <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              SIMULATION UPLINK ACTIVE
            </div>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-0.5 font-mono">Year</div>
            <div className="text-2xl font-mono font-bold text-blue-400">{state.year}</div>
          </div>

          <div className="w-48">
            <div className="flex justify-between text-[9px] mb-1 uppercase tracking-wider font-mono">
              <span className="text-slate-500">System Health</span>
              <span className={state.health < 30 ? 'text-red-500' : 'text-blue-400'}>{state.health.toFixed(0)}%</span>
            </div>
            <Progress value={state.health} className="h-1 bg-slate-800" />
          </div>

          <Button 
            onClick={state.isRunning ? pauseSimulation : startSimulation} 
            size="sm" 
            className={`font-mono font-bold uppercase tracking-tighter w-24 ${state.isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {state.isRunning ? 'PAUSE' : 'EXECUTE'}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left: Visualization */}
        <div className="flex-1 relative bg-slate-950/40">
          <GlacierCanvas stats={state.glacierStats} />
          
          <AnimatePresence>
            {state.isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-mono font-bold text-white tracking-tighter">SIMULATION TERMINATED</h2>
                  <p className="text-slate-500 font-mono text-xs">CALCULATING ENVIRONMENTAL IMPACT...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Telemetry & Controls */}
        <div className="w-80 border-l border-white/5 bg-slate-900/60 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="px-4 py-6 space-y-8 pb-12">
              <section>
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-blue-500/60 mb-4 border-b border-white/5 pb-2">
                  Environmental Vectors
                </h3>
                <EnvironmentalControls 
                  factors={state.environmentalFactors} 
                  onChange={setEnvironmentFactor}
                />
              </section>

              <AIForecast 
                glacierName={glacier?.name || ""}
                stats={state.glacierStats}
                environment={state.environmentalFactors}
              />

              <section className="space-y-3">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-blue-500/60 mb-2 border-b border-white/5 pb-2">
                  Telemetry Output
                </h3>
                <StatBox label="RESEARCH TARGET" value={glacier?.name || "UNKNOWN"} unit="" />
                <StatBox label="THICKNESS" value={state.glacierStats.thickness.toFixed(0)} unit="m" />
                <StatBox label="SURFACE AREA" value={state.glacierStats.area.toFixed(0)} unit="km²" />
                <StatBox label="STABILITY" value={state.glacierStats.stability.toFixed(0)} unit="%" />
              </section>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}

function StatBox({ label, value, unit }: any) {
  return (
    <div className="p-3 bg-slate-950/50 border border-white/5 rounded">
      <div className="text-[8px] text-slate-500 font-mono mb-1 tracking-widest uppercase">{label}</div>
      <div className="text-lg font-mono font-bold text-white">
        {value}<span className="text-[10px] text-slate-500 ml-1 font-normal lowercase">{unit}</span>
      </div>
    </div>
  );
}
